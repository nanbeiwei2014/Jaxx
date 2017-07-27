///<reference path="../com/models.ts"/>
///<reference path="../com/Utils.ts"/>
///<reference path="../com/Utils2.ts"/>
///<reference path="../services/ethereum/main_Ethereum.ts"/>
///<reference path="../services/bitcoin/crypto_bitcoin.ts"/>
///<reference path="../services/dash/crypto_dash.ts"/>
///<reference path="../services/litecoin/crypto_litecoin.ts"/>
///<reference path="../services/zcash/crypto_zcash.ts"/>
///<reference path="../datastore/datastore_local.ts"/>
///<reference path="../services/token_ethereum/ethereum_token.ts"/>
var jaxx;
(function (jaxx) {
    // import Utils2 = jaxx.Utils2;
    var EthereumService = (function () {
        function EthereumService(settings, db, config) {
            this.db = db;
            this.onTransaction$ = $({});
            //////////////////////////
            this.ON_ADDRESS_CHANGE_CAHANGE = 'ON_ADDRESS_CHANGE_CAHANGE';
            this.ON_ADDRESS_RECEIVE_CAHANGE = 'ON_ADDRESS_RECEIVE_CAHANGE';
            this.errors = [];
            this.ON_RESTORED_HISTORY_RECEIVE = 'ON_RESTORED_HISTORY_RECEIVE';
            this.ON_RESTORED_HISTORY_CHANGE = 'ON_RESTORED_HISTORY_CHANGE';
            this.ON_RESTORED_HISTORY_ALL = 'ON_RESTORED_HISTORY_ALL';
            this.emitter$ = $({});
            this.ON_NEW_TRANSACTIONS = 'ON_NEW_TRANSACTIONS';
            this.addressesNeedTransactions = [];
            /////////////////////////////// Balances //////////////////////////////////
            ///  CheckAddressesController
            this.addressesToCheck = [];
            this.balances$ = $({});
            this.ON_BALANCES_DIFFERENCE = 'ON_BALANCE_DIFFERENCES';
            this.ON_BALANCE_RECEIVE_CHANGE = 'ON_BALANCE_RECEIVE_CHANGE';
            this.ON_BALANCE_CHANGE_CHANGE = 'ON_BALANCE_CHANGE_CHANGE';
            this.newBalanceChange = 0;
            ///   console.log(config);
            //  this._db = db;
            this.id = settings.id;
            this.name = settings.name;
            this.coin_HD_index = settings.coin_HD_index;
            this.options = config;
            this.crypto_class = new jaxx.CryptoEthereum(config);
            // this.generator = new GeneratorBlockchain(settings.name,  settings.id,  settings.coin_HD_index);
        }
        EthereumService.prototype.stop = function () {
        };
        /* getMiningFees(): number {
         return this.request.getMiningFees();
         }*/
        EthereumService.prototype.getMiningFees = function () {
            return 0;
        };
        //////////////////////////////////////    Generator
        EthereumService.prototype.addKeyPairToBalances = function (balances) {
            var _this = this;
            var i;
            balances.forEach(function (balance) {
                // console.log(balance);
                var address = balance.id;
                i = _this.db.getAddressesReceive().indexOf(address);
                balance.keyPair = _this.getKeyPairReceive(i);
            });
        };
        EthereumService.prototype.getKeyPairReceive = function (index) {
            return this.crypto_class.generator.generateKeyPairReceive(index);
        };
        EthereumService.prototype.getKeyPairChange = function (index) {
            return this.crypto_class.generator.generateKeyPairChange(index);
        };
        EthereumService.prototype.getAddressReceive = function (index) {
            return this.crypto_class.generator.generateAddressReceive(index);
        };
        //////////////////////////////////////////////
        EthereumService.prototype.initTokenData = function () {
            var _this = this;
            //  console.warn(' initTokenData  ');
            var address = jaxx.Registry.Ethereum.getAddressReceive(0);
            //this._db.saveCurrentIndexReceive(0);
            //this._db.saveCurrentAddressReceive(address);
            this.db.setTransactions([]);
            this.db._saveBalancesReceive([new VOBalance({ id: address, balance: 0 })]);
            this.downloadBalances([address]).done(function (balances) {
                _this.db._saveBalancesReceive(balances);
            });
        };
        EthereumService.prototype.onError = function (err) {
            console.error(err);
            this.errors.push(err);
            if (this.errors.length > 1000)
                this.errors.shift();
        };
        EthereumService.prototype.restoreHistory = function (receive_change) {
            if (typeof this.crypto_class.restoreHistory === 'function') {
                return this.crypto_class.restoreHistory(receive_change);
            }
            else {
                var deferred = $.Deferred();
                deferred.reject({ error: 1, message: this.name + '  no request method  restoreHistory ' });
                return deferred;
            }
        };
        EthereumService.prototype.restoreHistory2 = function (receive_change, startIndex) {
            if (typeof this.crypto_class.restoreHistory2 === 'function') {
                return this.crypto_class.restoreHistory2(receive_change, startIndex);
            }
            else {
                var deferred = $.Deferred();
                deferred.reject({ error: 1, message: this.name + '  no request method  restoreHistory ' });
                return deferred;
            }
        };
        EthereumService.prototype.restoredHistoryReceive = function (callBack) {
            //console.warn('%c restoredHistoryReceive  ','color:#AA0')
            var _this = this;
            var start = Date.now();
            this.restoreHistory('receive').then(function (res) {
                console.log(_this.name + ' restored history receive in ' + (Date.now() - start) / 1000 + ' s', res);
                var addresses = res.addresses;
                var timestamp = Date.now();
                var i = 0;
                var balances = addresses.map(function (address) {
                    return new VOBalance({
                        id: address,
                        balance: 0,
                        timestamp: timestamp,
                        index: i++
                    });
                });
                _this.db._saveBalancesReceive(balances);
                if (addresses.length == 1) {
                    callBack();
                    return;
                }
                _this.downloadBalances(addresses).done(function (newbalances) {
                    if (addresses.length !== newbalances.length) {
                        callBack({
                            error: 108,
                            message: 'downloaded addresses receive not equal length balances receive'
                        });
                        console.error(addresses, newbalances);
                        // return;
                    }
                    jaxx.Utils.updateBalances(_this.db.getBalancesReceive(true), newbalances);
                    _this.db._saveBalancesReceive();
                    // var ind: number = addresses.length;
                    // var address = this.crypto_class.generator.generateAddressReceive(ind);
                    //this._db.saveCurrentAddressReceive(address);
                    //this._db.saveCurrentIndexReceive(ind);
                    var transactions = res.transactions;
                    if (transactions && transactions.length) {
                        jaxx.Utils.sortByTimestamp(transactions);
                        _this.db.transactionTimestampReceive = transactions[transactions.length - 1].timestamp;
                        _this.db.addTransactions(transactions);
                    }
                    console.log(_this.name + ' restored balance receive: ' + _this.db.getBalanceReceive());
                    _this.emitter$.triggerHandler(_this.ON_RESTORED_HISTORY_RECEIVE);
                    callBack();
                });
            }).fail(function (err) { return callBack(err); });
        };
        EthereumService.prototype.restoreHistoryAll = function () {
            var _this = this;
            var deferred = $.Deferred();
            if (this.is_Token) {
                this.initTokenData();
                deferred.resolve({ timeChange: 0, timeReceive: 0 });
                return deferred;
            }
            // Assertion: Coin is not token
            var start = Date.now();
            this.restoredHistoryReceive(function (err) {
                if (err) {
                    deferred.reject(err);
                    return;
                }
                _this.db.saveHistoryTimestamp(Date.now());
                _this.emitter$.triggerHandler(_this.ON_RESTORED_HISTORY_ALL);
                console.log('%c ' + _this.name + ' restored history balance total: ' + _this.db.getBalanceTotal(), 'color:brown');
                deferred.resolve({ timeChange: 0, timeReceive: (Date.now() - start) });
            });
            return deferred;
        };
        EthereumService.prototype.isContinueNewTranasctions = function (newTransactions) {
            var addressesWithNew = newTransactions.map(function (item) {
                return item.address;
            });
            this.addressesNeedTransactions = _.difference(this.addressesNeedTransactions, addressesWithNew);
            if (this.addressesNeedTransactions.length) {
                console.log('%c still need transactions for addresses ' + this.addressesNeedTransactions, 'color:brown');
                this._downloadNewTranasctions();
            }
            else
                console.log('%c all transactions renewed ', 'color:brown');
        };
        EthereumService.prototype._downloadNewTranasctions = function () {
            var _this = this;
            if (Date.now() - this.downloadNewTransactionsTimestamp > 1000 * 100) {
                console.log('%c timeout downloading transactions ' + (Date.now() - this.downloadNewTransactionsTimestamp), 'color:brown');
                this.addressesNeedTransactions = [];
                return;
            }
            // if(attempt)console.warn(this.name + 'attempt: ' + attempt);
            // console.log(addresses)
            if (this.addressesNeedTransactions.length === 0)
                return;
            this.addressesNeedTransactions = _.uniq(this.addressesNeedTransactions);
            var addresses = this.addressesNeedTransactions;
            console.log('%c ' + this.name + '  download New Transactions total addresses: ' + addresses.toString(), 'color:brown');
            this.downloadTransactions(addresses).done(function (transactions) {
                //  console.log(transactions);
                if (transactions.hasOwnProperty('transactions')) {
                    transactions = transactions['transactions'];
                }
                // console.log(this.name +' _downloadNewTRanasctions ', transactions);
                _this.onDownloadedNewTransactions(transactions);
            }).fail(function (err) {
                console.error('download new transactions error ');
                _this.onError(err);
                if (_this.addressesNeedTransactions.length)
                    setTimeout(function () { return _this._downloadNewTranasctions(); }, 20000);
            });
        };
        EthereumService.prototype.onDownloadedNewTransactions = function (transactions) {
            var _this = this;
            var newTransactions = this.db.updateTransactionsReceiveGetNew(transactions);
            if (newTransactions.length) {
                this.emitter$.triggerHandler(this.ON_NEW_TRANSACTIONS, [newTransactions]);
                this.isContinueNewTranasctions(newTransactions);
            }
            else {
                setTimeout(function () { return _this._downloadNewTranasctions(); }, 20000);
            }
            console.log('%c ' + this.name + ' new transactions  from ' + transactions.length + ' new ' + newTransactions.length, 'color:brown');
            console.log(newTransactions);
        };
        EthereumService.prototype.downloadNewTransactions1 = function (addresses) {
            var _this = this;
            addresses = _.uniq(addresses);
            console.log('%c ' + this.name + ' download new transactions ' + addresses, 'color:brown');
            this.downloadTransactions(addresses).done(function (transactions) {
                //  console.log(transactions);
                if (transactions.hasOwnProperty('transactions')) {
                    transactions = transactions['transactions'];
                }
                var newTransactions = _this.db.updateTransactionsReceiveGetNew(transactions);
                if (newTransactions.length) {
                    console.log('%c ' + _this.name + ' new transactions  ' + transactions.length, 'color:brown');
                    _this.emitter$.triggerHandler(_this.ON_NEW_TRANSACTIONS, [newTransactions]);
                }
                else {
                    console.warn(' no new transactions for addresses ' + addresses.toString());
                }
                // console.log(this.name +' _downloadNewTRanasctions ', transactions);
                // this.onDownloadedNewTransactions(transactions);
            }).fail(function (err) {
                console.error('download new transactions error ');
                _this.onError(err);
            });
        };
        EthereumService.prototype.downloadNewTransactions2 = function (addresses) {
            this.downloadNewTransactionsTimestamp = Date.now();
            console.log('%c ' + this.name + ' download new transactions for addresses: ' + addresses.toString(), 'color:brown');
            // console.log(addresses);
            if (this.addressesNeedTransactions.length == 0) {
                this.addressesNeedTransactions = addresses;
                this._downloadNewTranasctions();
            }
            else
                this.addressesNeedTransactions = this.addressesNeedTransactions.concat(addresses);
            /* console.log(' delay download new transactions  1, 20, 180 sec ' );

             setTimeout(()=>this._downloadNewTranasctions(addresses,1000), 1000);
             setTimeout(()=>this._downloadNewTranasctions(addresses,5000), 5000);
             setTimeout(()=>this._downloadNewTranasctions(addresses,10000), 10000);
             setTimeout(()=>this._downloadNewTranasctions(addresses,20000), 20000);
             setTimeout(()=>this._downloadNewTranasctions(addresses,180000), 180000);*/
        };
        EthereumService.prototype.downloadTransactionsUnspent = function (addresses) {
            return this.crypto_class.downloadTransactionsUnspent(addresses);
        };
        EthereumService.prototype.downloadTransactions = function (addresses) {
            return this.crypto_class.downloadTransactions(addresses);
        };
        EthereumService.prototype.downloadTransactionsForAddress = function (address) {
            return this.crypto_class.downloadTransactionsForAddress(address);
        };
        EthereumService.prototype.checkAddressesForTranasactions = function (addresses) {
            return this.crypto_class.checkAddressesForTranasactions(addresses).then(function (result) {
                console.log(result);
                return result;
            });
        };
        EthereumService.prototype.downloadTransactionsDetails = function (txsList) {
            return this.crypto_class.downloadTransactionsDetails(txsList);
        };
        EthereumService.prototype._checkAddressesBalances = function () {
            var _this = this;
            if ((Date.now() - this.startAddressCheckTimestamp > 1000 * 100)) {
                console.log('%c killing thread because timeout ' + (Date.now() - this.startAddressCheckTimestamp), 'color:red');
                this.addressesToCheck = [];
                return;
            }
            var addresses = this.addressesToCheck;
            if (addresses.length == 0) {
                console.log('%c ' + this.name + ' all addresses checked  ', 'color:blue');
                return;
            }
            console.log('%c ' + this.name + ' continue check addresses  ' + addresses, 'color:blue');
            this.downloadBalances(addresses).done(function (res) {
                var balanaces = res;
                var diff = jaxx.Utils.updateBalances(_this.db.getBalancesReceive(true), balanaces);
                if (diff.length)
                    _this.onBalancesDifference(diff);
                setTimeout(function () { return _this._checkAddressesBalances(); }, 2000);
            }).fail(function (err) {
                _this.onError(err);
                setTimeout(function () { return _this._checkAddressesBalances(); }, 20000);
            });
        };
        EthereumService.prototype.startCheckAddressesBalances = function (addresses) {
            console.log('%c ' + this.name + ' start check addresses ' + addresses, 'color:blue');
            this.addressesToCheck = this.addressesToCheck.concat(addresses);
            this.startAddressCheckTimestamp = Date.now();
            this._checkAddressesBalances();
        };
        EthereumService.prototype.downloadBalances = function (addresses) {
            return this.crypto_class.downloadBalances(addresses);
        };
        EthereumService.prototype.onBalancesDifference = function (diff) {
            this.db.onBalancesDifference(diff);
            var addresses = jaxx.Utils.getIds(diff);
            this.addressesToCheck = _.difference(this.addressesToCheck, addresses);
            console.log('%c   onBalancesDifference(   ' + addresses, 'color:brown');
            this.downloadNewTransactions2(addresses);
            this.downloadNewTransactions1(_.map(diff, 'id'));
            this.balances$.triggerHandler(this.ON_BALANCES_DIFFERENCE, [diff]);
        };
        EthereumService.prototype.downloadBalancesAll = function (callBack, onError) {
            var _this = this;
            if (this.is_Token) {
                callBack();
                return;
            }
            this.downloadBalancesReceive(function (diff, deltaR) {
                //console.log(' on downloadBalancesReceive ');
                // this.downloadBalancesChange((diffC, deltaC) => {
                // console.log(' on downloadBalancesChange ');
                //  let diff = diffR.concat(diffC);
                var delta = deltaR; // + deltaC;
                // console.log(diff);
                if (diff.length == 0) {
                    callBack([], delta);
                    return;
                }
                _this.onBalancesDifference(diff);
                console.log('%c balances diff ' + diff.length, 'color:brown');
                callBack(diff, delta);
                // this.balances$.triggerHandler(this.ON_BALANCE_DIFFERENCE_ADDRESSES,addresses);
            }, function (err) { return onError(err); });
            //}, err => onError(err));
        };
        EthereumService.prototype.downloadBalancesReceive = function (callBack, onError) {
            ///  console.log('   downloadBalancesReceive   ');
            var _this = this;
            var diff = [];
            var addresses = this.db.getAddressesReceive();
            if (addresses.length === 0) {
                ///this.newBalanceReceive = 0;
                callBack([]);
                return;
            }
            ;
            //    console.log('downloadBalancesReceive  length ' +addresses.length, addresses);
            this.downloadBalances(addresses).done(function (newbalances) {
                var delta = 0;
                // console.log(this._db.getBalancesTemp());
                console.log(addresses.length + '<= addresses length balances => ' + newbalances.length);
                var balanceOld = _this.db.getBalanceReceive();
                var difference = jaxx.Utils.updateBalances(_this.db.getBalancesReceive(true), newbalances);
                var balanceNew = _this.db.getBalanceReceive();
                if (difference.length) {
                    _this.db._saveBalancesReceive();
                    console.warn(' balances receive difference ', difference);
                }
                delta = balanceNew - balanceOld;
                var precision = balanceNew / 1e5;
                /// console.log(delta + ' ' + precision );
                if (Math.abs(delta) > precision) {
                    console.log('%c ' + _this.name + ' balances receive delta more then precision ' + delta + ' precision ' + precision, 'color:red');
                    if (difference.length) {
                        console.log(_this.name + ' balances receive difference ' + difference.reduce(function (a, b) {
                            return a += b.delta;
                        }, 0), diff);
                    }
                    // console.log('%c ' + this.ON_BALANCE_RECEIVE_CHANGE + ' delta: '+ delta/1e15 +' new:  ' + balance/1e15 + ' old ' + old/1e15,'color:#f00');//
                    console.log(_this.ON_BALANCE_RECEIVE_CHANGE, difference);
                    _this.balances$.triggerHandler(_this.ON_BALANCE_RECEIVE_CHANGE, [difference]);
                    //this.onNewBalancesRecaive(newbalances);
                }
                else {
                    delta = 0;
                    //console.log('%c ' + this.name + ' same balance receive ' + balanceOld / 1e8, 'color:#f99');
                }
                //console.log(' callback receive',diff);
                callBack(difference, delta);
                // return newbalances;
            }).fail(function (err) { return onError(err); });
        };
        return EthereumService;
    }());
    jaxx.EthereumService = EthereumService;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=ethereum-service.js.map