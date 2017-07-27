///<reference path="../com/models.ts"/>
///<reference path="../com/Utils.ts"/>
///<reference path="../com/Utils2.ts"/>
///<reference path="ethereum/main_Ethereum.ts"/>
///<reference path="bitcoin/crypto_bitcoin.ts"/>
///<reference path="dash/crypto_dash.ts"/>
///<reference path="litecoin/crypto_litecoin.ts"/>
///<reference path="zcash/crypto_zcash.ts"/>
///<reference path="../datastore/datastore_local.ts"/>
///<reference path="token_ethereum/ethereum_token.ts"/>
var jaxx;
(function (jaxx) {
    // import Utils2 = jaxx.Utils2;
    var JaxxAccountService = (function () {
        function JaxxAccountService(settings, db, config) {
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
            this._db = db;
            this.id = settings.id;
            this.name = settings.name;
            this.coin_HD_index = settings.coin_HD_index;
            this.is_Token = settings.isToken;
            var options = _.extend(config, settings);
            // console.log(options);
            ///console.log(this. name + ' : ' + settings.request + ' coin_HD_index   ' + this.coin_HD_index);
            var fn = jaxx[settings.crypto_class];
            // console.warn(fn);
            if (this.is_Token) {
                this.crypto_class = new jaxx.EthereumToken(settings);
            }
            else if (typeof fn === "function") {
                // console.warn(this.name, options);
                this.crypto_class = new fn(this.id, settings.coin_HD_index, this, options);
                if (typeof (this.crypto_class.initialize) === 'function') {
                    this.crypto_class.initialize();
                }
            }
            if (!this.crypto_class) {
                console.log('%c  ' + this.name + ' please specify valid class name settings.request  for ' + JSON.stringify(settings), 'color:red');
            }
            else {
                //if (this.request.hasOwnProperty('setTransactionEventEmite'))this.request.setTransactionEventEmiter(this.onTransaction$);
            }
        }
        JaxxAccountService.prototype.stop = function () {
        };
        /* getMiningFees(): number {
         return this.request.getMiningFees();
         }*/
        /* getMiningFees(): number {
             return this.crypto_class.getMiningFees();
         }*/
        //////////////////////////////////////    Generator
        JaxxAccountService.prototype.addKeyPairToBalances = function (balances, change_receive) {
            var _this = this;
            var i;
            balances.forEach(function (balance) {
                // console.log(balance);
                var address = balance.id;
                if (change_receive == 'change') {
                    i = _this._db.getAddressesChange().indexOf(address);
                    balance.keyPair = _this.getKeyPairChange(i);
                }
                else {
                    i = _this._db.getAddressesReceive().indexOf(address);
                    balance.keyPair = _this.getKeyPairReceive(i);
                }
            });
        };
        JaxxAccountService.prototype.getKeyPairReceive = function (index) {
            return this.crypto_class.generator.generateKeyPairReceive(index);
        };
        JaxxAccountService.prototype.getKeyPairChange = function (index) {
            return this.crypto_class.generator.generateKeyPairChange(index);
        };
        JaxxAccountService.prototype.getCurrentAddressReceive = function () {
            var address = this._db.getCurrentAddressReceive();
            if (address.length === 0) {
                if (this._db.isNewWallet()) {
                    this.createNewWallet();
                    return this._db.getCurrentAddressReceive();
                }
                return this.crypto_class.generator.generateAddressReceive(0);
            }
            return address;
        };
        JaxxAccountService.prototype.getCurrentAddressChange = function () {
            return this._db.getCurrentAddressChange();
        };
        JaxxAccountService.prototype.getAddressReceive = function (index) {
            if (this.is_Token)
                return jaxx.Registry.Ethereum.getAddressReceive(0);
            if (index == -1)
                return '';
            var addresses = this._db.getAddressesReceive();
            if (index < addresses.length) {
                return addresses[index];
            }
            else {
                if (!this.crypto_class) {
                    console.warn(this.name + ' getAddressReceive  no  crypto_class  ');
                    return '';
                }
                return this.crypto_class.generator.generateAddressReceive(index);
            }
        };
        JaxxAccountService.prototype.getAddressChange = function (index) {
            if (this.is_Token || index == -1)
                return '';
            var addresses = this._db.getAddressesChange();
            if (index < addresses.length) {
                return addresses[index];
            }
            else {
                if (!this.crypto_class) {
                    console.warn(this.name + ' getAddressChange  no  crypto_class  ');
                    return '';
                }
                ;
                return this.crypto_class.generator.generateAddressChange(index);
            }
        };
        JaxxAccountService.prototype.getAddress = function (index, receive_change) {
            var address;
            if (receive_change == 'change') {
                address = this.getAddressChange(index);
            }
            else {
                address = this.getAddressReceive(index);
            }
            return address;
        };
        JaxxAccountService.prototype.createNewWallet = function () {
            this._db.setNewWallet(false);
            console.warn(this.name + '   createNewWallet  ');
            //  this._db.saveCurrentIndexReceive(0);
            // this._db._saveBalancesChange()
            // this._db.saveCurrentIndexChange(0);
            var addressReceive = this.is_Token ? jaxx.Registry.Ethereum.getAddressReceive(0) : this.getAddressReceive(0);
            //this._db.saveCurrentAddressReceive(addressReceive);
            var balanceRceive = new VOBalance({
                id: addressReceive,
                balance: 0,
                index: 0,
                timestamp: Date.now()
            });
            this._db._saveBalancesReceive([balanceRceive]);
            var addressChange = this.getAddressChange(0);
            //this._db.saveCurrentAddressChange(addressChange);
            var balanceChange = new VOBalance({
                id: addressChange,
                balance: 0,
                index: 0,
                timestamp: Date.now()
            });
            this._db._saveBalancesChange([balanceChange]);
        };
        JaxxAccountService.prototype.goToNextIndexChange = function () {
            var indexChange = this._db.getCurrentIndexChange();
            indexChange++;
            console.log('%c going new ingex change ' + indexChange, 'color:red');
            var address = this.getAddressChange(indexChange);
            // this._db.saveCurrentAddressChange(address);
            var bal = new VOBalance({ id: address, balance: 0 });
            this._db.addBalanceChange(bal);
            this.emitter$.triggerHandler(this.ON_ADDRESS_CHANGE_CAHANGE, address);
        };
        JaxxAccountService.prototype.goToNextIndexReceive = function () {
            var currentIndex = this._db.getCurrentIndexReceive();
            currentIndex++;
            console.log('%c going new ingex receive ' + currentIndex, 'color:red');
            var address = this.getAddressReceive(currentIndex);
            this._db.addBalanceReceive(new VOBalance({ id: address, balance: 0 }));
            this.emitter$.triggerHandler(this.ON_ADDRESS_RECEIVE_CAHANGE, address);
        };
        //////////////////////////////////////////////
        JaxxAccountService.prototype.initTokenData = function () {
            var _this = this;
            console.warn(' initTokenData  ');
            var address = jaxx.Registry.Ethereum.getAddressReceive(0);
            //this._db.saveCurrentIndexReceive(0);
            //this._db.saveCurrentAddressReceive(address);
            this._db.setTransactions([]);
            this._db._saveBalancesChange([]);
            this._db._saveBalancesReceive([new VOBalance({ id: address, balance: 0 })]);
            this.downloadBalances([address]).done(function (balances) {
                _this._db._saveBalancesReceive(balances);
            });
        };
        JaxxAccountService.prototype.onError = function (err) {
            console.error(err);
            this.errors.push(err);
            if (this.errors.length > 1000)
                this.errors.shift();
        };
        JaxxAccountService.prototype.restoreHistory = function (receive_change) {
            if (typeof this.crypto_class.restoreHistory === 'function') {
                return this.crypto_class.restoreHistory(receive_change);
            }
            else {
                var deferred = $.Deferred();
                deferred.reject({ error: 1, message: this.name + '  no request method  restoreHistory ' });
                return deferred;
            }
        };
        JaxxAccountService.prototype.restoreHistory2 = function (receive_change, startIndex) {
            if (typeof this.crypto_class.restoreHistory2 === 'function') {
                return this.crypto_class.restoreHistory2(receive_change, startIndex);
            }
            else {
                var deferred = $.Deferred();
                deferred.reject({ error: 1, message: this.name + '  no request method  restoreHistory ' });
                return deferred;
            }
        };
        JaxxAccountService.prototype.restoredHistoryReceive = function (callBack) {
            //console.warn('%c restoredHistoryReceive  ','color:#AA0')
            var _this = this;
            var start = Date.now();
            this.restoreHistory('receive').then(function (res) {
                console.log(_this.name + ' restored history receive in ' + (Date.now() - start) / 1000 + ' s', res);
                var addresses = res.addresses;
                var currentAddressReceive = _this.getAddressReceive(addresses.length);
                addresses.push(currentAddressReceive);
                /*if(addresses.length == 0){
                 /!*let address:string = this.getAddressReceive(0);
                 addresses = [address];*!/


                 this._db.saveCurrentIndexReceive(0);
                 callBack();
                 return;
                 }*/
                //console.log(addresses);
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
                //console.log(balances);
                _this._db._saveBalancesReceive(balances);
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
                    jaxx.Utils.updateBalances(_this._db.getBalancesReceive(true), newbalances);
                    _this._db._saveBalancesReceive();
                    // var ind: number = addresses.length;
                    // var address = this.crypto_class.generator.generateAddressReceive(ind);
                    //this._db.saveCurrentAddressReceive(address);
                    //this._db.saveCurrentIndexReceive(ind);
                    var transactions = res.transactions;
                    if (transactions && transactions.length) {
                        jaxx.Utils.sortByTimestamp(transactions);
                        _this._db.transactionTimestampReceive = transactions[transactions.length - 1].timestamp;
                        _this._db.addTransactions(transactions);
                    }
                    console.log(_this.name + ' restored balance receive: ' + _this._db.getBalanceReceive());
                    _this.emitter$.triggerHandler(_this.ON_RESTORED_HISTORY_RECEIVE);
                    callBack();
                });
            }).fail(function (err) { return callBack(err); });
        };
        JaxxAccountService.prototype.restoreHistoryChange = function (callBack) {
            var _this = this;
            var start = Date.now();
            this.restoreHistory('change').then(function (res) {
                console.log(_this.name + ' restored history change  in ' + (Date.now() - start) / 1000 + ' s', res);
                var addresses = res.addresses;
                var currentAddressChange = _this.getAddressChange(addresses.length);
                addresses.push(currentAddressChange);
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
                // console.log(balances);
                _this._db._saveBalancesChange(balances);
                if (addresses.length == 1) {
                    callBack();
                    return;
                }
                _this.downloadBalances(addresses).done(function (newbalances) {
                    var difference = jaxx.Utils.updateBalances(_this._db.getBalancesChange(true), newbalances);
                    _this._db._saveBalancesChange();
                    //  console.log(this.name + ' + balances change total:  ' + Utils.calculateBalance(balances));
                    var ind = addresses.length;
                    //this._db.saveCurrentIndexChange(ind-1);
                    // this.goToNextIndexChange();
                    var transactions = res.transactions;
                    jaxx.Utils.sortByTimestamp(transactions);
                    _this._db.addTransactions(transactions);
                    console.log(_this.name + ' restored balance change: ' + _this._db.getBalanceChange());
                    _this.emitter$.triggerHandler(_this.ON_RESTORED_HISTORY_CHANGE);
                    callBack();
                });
            }).fail(function (err) { return callBack(err); });
        };
        JaxxAccountService.prototype.restoreHistoryAll = function () {
            var _this = this;
            var deferred = $.Deferred();
            if (this.is_Token) {
                this.initTokenData();
                deferred.resolve({ timeChange: 0, timeReceive: 0 });
                return deferred;
            }
            // Assertion: Coin is not token
            var start = Date.now();
            var timeChange = 0;
            var timeReceive = 0;
            this.restoreHistoryChange(function (err) {
                if (err) {
                    deferred.reject(err);
                    return;
                }
                timeChange = Date.now() - start;
                if (timeReceive && timeChange) {
                    _this.emitter$.triggerHandler(_this.ON_RESTORED_HISTORY_ALL);
                    _this._db.saveHistoryTimestamp(Date.now());
                    deferred.resolve({ timeChange: timeChange, timeReceive: timeReceive });
                }
            });
            this.restoredHistoryReceive(function (err) {
                if (err) {
                    deferred.reject(err);
                    return;
                }
                timeReceive = Date.now() - start;
                if (timeReceive && timeChange) {
                    _this._db.saveHistoryTimestamp(Date.now());
                    _this.emitter$.triggerHandler(_this.ON_RESTORED_HISTORY_ALL);
                    console.log('%c ' + _this.name + ' restored history balance total: ' + _this._db.getBalanceTotal(), 'color:brown');
                    deferred.resolve({ timeChange: timeChange, timeReceive: timeReceive });
                }
            });
            return deferred;
        };
        JaxxAccountService.prototype.isContinueNewTranasctions = function (newTransactions) {
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
        JaxxAccountService.prototype._downloadNewTranasctions = function () {
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
        JaxxAccountService.prototype.onDownloadedNewTransactions = function (transactions) {
            var _this = this;
            if (this.is_Token)
                return;
            var newTransactions = this._db.updateTransactionsReceiveGetNew(transactions);
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
        JaxxAccountService.prototype.downloadNewTransactions1 = function (addresses) {
            var _this = this;
            if (this.is_Token)
                return;
            addresses = _.uniq(addresses);
            console.log('%c ' + this.name + ' download new transactions ' + addresses, 'color:brown');
            this.downloadTransactions(addresses).done(function (transactions) {
                //  console.log(transactions);
                if (transactions.hasOwnProperty('transactions')) {
                    transactions = transactions['transactions'];
                }
                var newTransactions = _this._db.updateTransactionsReceiveGetNew(transactions);
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
        JaxxAccountService.prototype.downloadNewTransactions2 = function (addresses) {
            if (this.is_Token)
                return;
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
        JaxxAccountService.prototype.downloadTransactionsUnspent = function (addresses) {
            return this.crypto_class.downloadTransactionsUnspent(addresses);
        };
        JaxxAccountService.prototype.downloadTransactions = function (addresses) {
            return this.crypto_class.downloadTransactions(addresses);
        };
        JaxxAccountService.prototype.downloadTransactionsForAddress = function (address) {
            return this.crypto_class.downloadTransactionsForAddress(address);
        };
        JaxxAccountService.prototype.checkAddressesForTranasactions = function (addresses) {
            return this.crypto_class.checkAddressesForTranasactions(addresses).then(function (result) {
                console.log(result);
                return result;
            });
        };
        JaxxAccountService.prototype.downloadTransactionsDetails = function (txsList) {
            return this.crypto_class.downloadTransactionsDetails(txsList);
        };
        JaxxAccountService.prototype._checkAddressesBalances = function () {
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
                var diff = jaxx.Utils.updateBalances(_this._db.getBalancesReceive(true), balanaces);
                diff = diff.concat(jaxx.Utils.updateBalances(_this._db.getBalancesChange(true), balanaces));
                if (diff.length)
                    _this.onBalancesDifference(diff);
                setTimeout(function () { return _this._checkAddressesBalances(); }, 2000);
            }).fail(function (err) {
                _this.onError(err);
                setTimeout(function () { return _this._checkAddressesBalances(); }, 20000);
            });
        };
        JaxxAccountService.prototype.startCheckAddressesBalances = function (addresses) {
            console.log('%c ' + this.name + ' start check addresses ' + addresses, 'color:blue');
            this.addressesToCheck = this.addressesToCheck.concat(addresses);
            this.startAddressCheckTimestamp = Date.now();
            this._checkAddressesBalances();
        };
        JaxxAccountService.prototype.downloadBalances = function (addresses) {
            return this.crypto_class.downloadBalances(addresses);
        };
        JaxxAccountService.prototype.onBalancesDifference = function (diff) {
            this._db.onBalancesDifference(diff);
            var addresses = jaxx.Utils.getIds(diff);
            this.addressesToCheck = _.difference(this.addressesToCheck, addresses);
            console.log('%c   onBalancesDifference(   ' + addresses, 'color:brown');
            this.downloadNewTransactions2(addresses);
            this.downloadNewTransactions1(_.map(diff, 'id'));
            this.balances$.triggerHandler(this.ON_BALANCES_DIFFERENCE, [diff]);
        };
        JaxxAccountService.prototype.downloadBalancesAll = function (callBack, onError) {
            var _this = this;
            if (this.is_Token) {
                callBack();
                return;
            }
            this.downloadBalancesReceive(function (diffR, deltaR) {
                //console.log(' on downloadBalancesReceive ');
                _this.downloadBalancesChange(function (diffC, deltaC) {
                    // console.log(' on downloadBalancesChange ');
                    var diff = diffR.concat(diffC);
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
            }, function (err) { return onError(err); });
        };
        JaxxAccountService.prototype.downloadBalancesReceive = function (callBack, onError) {
            ///  console.log('   downloadBalancesReceive   ');
            var _this = this;
            var diff = [];
            var addresses = this._db.getAddressesReceive();
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
                var balanceOld = _this._db.getBalanceReceive();
                var difference = jaxx.Utils.updateBalances(_this._db.getBalancesReceive(true), newbalances);
                var balanceNew = _this._db.getBalanceReceive();
                if (difference.length) {
                    _this._db._saveBalancesReceive();
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
        JaxxAccountService.prototype.downloadBalancesChange = function (callBack, onError) {
            // var diff:VOBalanceDiff[] = [];
            var _this = this;
            var addresses = this._db.getAddressesChange();
            if (addresses.length === 0) {
                this.newBalanceChange = 0;
                callBack([]);
                return;
            }
            //  console.log(' addresses change: ' + addresses);
            var currentAddressChange = this._db.getCurrentAddressChange();
            // console.log(this.name + ' current address change ' + currentAddressChange + ' total: ' + addresses.length);
            //   console.log(this.name + ' downloadBalancesChange ' + addresses.length);
            this.downloadBalances(addresses).done(function (newbalances) {
                var delta = 0;
                //  console.log(addresses.length + '<= addresses length balances  => ' + newbalances.length);
                var balanceOld = _this._db.getBalanceChange();
                var difference = jaxx.Utils.updateBalances(_this._db.getBalancesChange(true), newbalances);
                var balanceNew = _this._db.getBalanceChange();
                if (difference.length) {
                    _this._db._saveBalancesChange();
                    // console.warn(' balances change difference ', difference);
                }
                ;
                delta = balanceOld - balanceNew;
                var precision = balanceNew / 1e5;
                //console.log(newbalances);
                // console.log(delta + ' ' + precision );
                if (Math.abs(delta) > precision) {
                    console.log('%c ' + _this.name + ' balances change delta more then precision ' + delta + ' precision ' + precision, 'color:red');
                    var curChange = _this._db.getCurrentAddressChange();
                    var balanceOnCurrent = jaxx.Utils.filterBalanceOnAddress(curChange, difference);
                    // console.log(' on current address change ' + currentAddressChange + ' balance: ' + balanceOnCurrent);
                    if (balanceOnCurrent) {
                        console.log('%c  got balance on current change moving next address change ', 'color:red');
                        _this.goToNextIndexChange();
                    }
                    //  console.log('%c'+this.ON_BALANCE_CHANGE_CHANGE + ' new:  ' + balance/1e15 + ' old ' + old/1e15,'color:#f00')
                    console.log(_this.ON_BALANCE_CHANGE_CHANGE, difference);
                    _this.balances$.triggerHandler(_this.ON_BALANCE_CHANGE_CHANGE, [difference]);
                }
                else {
                    delta = 0;
                    // console.log('%c' + this.name + ' same balance change ' + balanceOld / 1e15, 'color:#f99');
                }
                // console.log('change',diff);
                callBack(difference, delta);
            }).fail(function (err) { return onError(err); });
        };
        return JaxxAccountService;
    }());
    jaxx.JaxxAccountService = JaxxAccountService;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=account-service.js.map