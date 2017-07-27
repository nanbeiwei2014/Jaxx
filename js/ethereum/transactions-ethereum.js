/**
 * Created by Vlad on 11/10/2016.
 */
var jaxx;
(function (jaxx) {
    var TransactionsEthereum = (function () {
        function TransactionsEthereum(controller) {
            var _this = this;
            this.controller = controller;
            this.nonces = {};
            this.balancesTemp = [];
            this.CACHE_EXPIRE = 1000 * 60 * 60 * 24;
            this.intervalSaveScanner = 2500;
            this.emitter$ = $({});
            this.ON_ALL_TRANSACTIONS_SENT = 'ON_TRANSACTIONS_SENT';
            this.ON_ONE_TRANSACTION_SENT = 'ON_ONE_TRANSACTION_SENT';
            this.ON_TRANSACTIONS_CONFIRMED = 'ON_TRANSACTIONS_CONFIRMED';
            this.ON_UTXOS_READY = 'ON_UTXOS_READY';
            this.ON_NONCES_READY = 'ON_NONCES_READY';
            this.tempUTXOS = [];
            this.utxosSpentIds = [];
            this.intervalCheckUTXO = 0;
            this.delayCheckUTXOInterval = 10000;
            this.ON_PREPAROING_TRANSACTIONS = 'ON_PREPAROING_TRANSACTIONS';
            this.utxos = [];
            this.unspentObj = {};
            this.isToken = controller.isToken;
            this.accountService = controller._accountService;
            this.name = controller.name;
            this.db = controller._db;
            this.service = controller._accountService;
            this.service.balances$.on(this.service.ON_NEW_TRANSACTIONS, function () {
                _this.prepareTransactions();
            });
            this.service.balances$.on(this.service.ON_BALANCES_DIFFERENCE, function (evt, diff) {
                //console.log(diff);
                _this.refreshData();
            });
            this.controller.emitter$.on(this.controller.ON_CURRENT_ADDRESS_RECEIVE_GOT_BALANCE, function (evt, balance) {
                //console.log(' new balance     ', balance);
                _this.refreshData();
                if (_this.isToken) {
                }
            });
            controller.emitter$.on(controller.ON_RESTORE_HISTORY_DONE, function () {
                _this.refreshData();
                //this.prepareTransactions();
            });
            this.controller.emitter$.on(this.controller.ON_TRANSACTION_CONFIRMED, function (evt, transactions) {
                _this.refreshData();
            });
        }
        TransactionsEthereum.prototype.logNonces = function () {
            console.log('%c nonces', 'color:red');
            for (var str in this.nonces)
                console.log(str + ' ' + this.nonces[str]);
        };
        ///////////////////////////////////////////////////////////////////////////////
        TransactionsEthereum.prototype.onSendTransactionStart = function (data) {
            data.name = this.name;
            console.log(this.name + ' transaction start ', data);
        };
        TransactionsEthereum.prototype.registerSentTransaction = function (data) {
            // console.error(data);
            var _this = this;
            this.lastSendTimestamp = Date.now();
            //this.isActive = true;
            // this.checkStatus();
            console.log(this.name + ' Transaction sent', data);
            var txid = data.sent.txid;
            console.log('%c ' + txid, 'color:violet');
            if (data.result.error) {
                console.error(data.result, this.nonces, this.utxos);
                return;
            }
            if (this.name.indexOf('Ethereum') !== -1) {
                console.warn(this.name + ' sending ' + data.sent.valueDelta);
                txid = data.result.result;
                if (this.isToken)
                    data.sent.gasPrice = 0;
                var bal = this.createBalanceTempEther(data.sent, txid);
                if (this.isToken) {
                    var amount = jaxx.Registry.tempStorage[this.name]['amount'];
                    bal.spent = amount;
                    //  console.warn(bal);
                    jaxx.Registry.Ethereum.transactionController.addTempNonce(bal);
                    // return;
                }
                else {
                    this.addTempNonce(bal);
                }
                this.db.addBalancesSpent([bal]);
                console.log(this.name + ' adding balance temp');
                clearTimeout(this.timeoutSentTransactions);
                this.timeoutSentTransactions = setTimeout(function () {
                    _this.emitter$.triggerHandler(_this.ON_ALL_TRANSACTIONS_SENT);
                }, 500);
            }
            else {
                var sentObj = new VOTransactionSentObj(data.sent);
                //   console.log(sentObj)
                var vosent = sentObj.sent;
                var sent = data.sent;
                var kkMockTx = sent._kkMockTx;
                var from = vosent.inputs[0].address;
                var to = vosent.outputs[0].address;
                var amount = vosent.outputs[0].amount;
                var timestamp = Math.round(vosent.timestamp / 1000);
                var fee = sentObj.fee;
                if (sentObj.sent.inputs[0].address === 'notmyaddress') {
                    console.log(' it is not my transaction  ');
                    return;
                }
                this.sendTransactionController(sentObj);
                //  this.emitter$.triggerHandler(this.ON_TRANSACTIONS_SENT,tr);
                this.timeoutSentTransactions = setTimeout(function () {
                    _this.emitter$.triggerHandler(_this.ON_ALL_TRANSACTIONS_SENT);
                }, 500);
            }
            this.lastSendTimestamp = Date.now();
            this.emitter$.triggerHandler(this.ON_ONE_TRANSACTION_SENT);
        };
        TransactionsEthereum.prototype.createBalanceTempBitcoin = function (input) {
            return new VOBalanceTemp({
                id: input.address,
                timestamp: Date.now(),
                txid: input.txid,
                count: 0,
                value: input.amount,
                spent: -input.amount
            });
        };
        TransactionsEthereum.prototype.getBalancesTempFromTransaction = function (sent) {
            var ar = sent.inputs;
            var indexed = {};
            for (var i = 0, n = ar.length; i < n; i++) {
                var input = ar[i];
                if (indexed[input.address]) {
                    indexed[input.address].value -= input.amount;
                }
                else {
                    indexed[input.address] = this.createBalanceTempBitcoin(input);
                }
            }
            var balancesTemp = [];
            for (var str in indexed) {
                balancesTemp.push(indexed[str]);
            }
            return balancesTemp;
        };
        TransactionsEthereum.prototype.sendTransactionController = function (sent) {
            //console.log(sent);
            var toSpent = sent.toSpent;
            var transaction = sent.sent;
            var txid = transaction.txid;
            var outputs = transaction.outputs;
            // console.log(outputs);
            var toAddress = outputs[0].address;
            var myReceive = this.controller.getAddressesReceive();
            var addressChange = this.controller.getCurrentAddressChange();
            var change;
            /// TODO what to do with outputs;
            /// what am
            outputs.forEach(function (item) {
                if (item.address === addressChange) {
                    change = item;
                }
                if (item.addressInternal) {
                    change = item;
                }
                else {
                    var ind = myReceive.indexOf(item.address);
                    if (ind !== -1) {
                        var utxo = new VOutxo(item);
                        utxo.amountBtc = HDWalletHelper.convertSatoshisToBitcoins(item.amount);
                        utxo.addressIndex = ind;
                        //  utxo.index = 0;
                        utxo.standard = true;
                        console.log(' going to my address ', item);
                    }
                }
            });
            var inputs = transaction.inputs;
            console.log('inputs,outputs', inputs, outputs);
            var tempBalance = jaxx.Utils.createTempBalancesFromInputs(inputs, toAddress);
            if (change) {
                console.log(' adding change   ' + change.amount);
                var balanceChange = new VOBalanceTemp({
                    id: change.address,
                    spent: -change.amount,
                    txid: txid,
                    timestamp: Date.now()
                });
                tempBalance.push(balanceChange);
            }
            this.db.addBalancesSpent(tempBalance);
            console.log(tempBalance);
            this.utxosSpentIds = inputs.map(function (item) { return item.address + '-' + item.previousTxId; });
        };
        TransactionsEthereum.prototype.updateUTXOS = function (utxos) {
            this.utxos = jaxx.Utils.updateUTXOS(this.utxos, utxos);
            this.toSaveTempUTXOs = true;
        };
        TransactionsEthereum.prototype.loadUnconfirmedTransactions = function () {
            var uncofirmed = this.getUTXOs().filter(function (item) {
                return item.inqueue;
            });
        };
        TransactionsEthereum.prototype.sartCheckUTXOS = function () {
            var _this = this;
            if (this.intervalCheckUTXO === 0) {
                this.intervalCheckUTXO = setInterval(function () { return _this.loadUnconfirmedTransactions(); }, this.delayCheckUTXOInterval);
            }
        };
        TransactionsEthereum.prototype.addUTXO = function (utxo) {
            this.utxos.push(utxo);
        };
        TransactionsEthereum.prototype.remapUTXOs = function (utxos) {
            var ctr = this.controller;
            utxos.forEach(function (item) {
                item.addressIndex = ctr.getAddressIndex(item.address);
                item.addressInternal = ctr.isAddressInternal(item.address);
                item.spent = false;
                item.standard = true;
                item.index = item.vout;
            });
            return utxos;
        };
        TransactionsEthereum.prototype.remapTransactionsToOldCode = function (unspent) {
            var out = [];
            var indexed = {};
            for (var i = 0, n = unspent.length; i < n; i++) {
                var trs = unspent[i];
                if (indexed[trs.id + trs.address]) {
                    console.warn(' duplicate UTXO ' + trs.id + ' address: ' + trs.address);
                    continue;
                }
                indexed[trs.id + trs.address] = trs;
                out.push(new VOutxo({
                    address: trs.address,
                    addressIndex: this.controller.getAddressIndex(trs.address),
                    addressInternal: this.db.isAddressInternal(trs.address),
                    amount: trs.amount,
                    amountBtc: trs.amountBtc + '',
                    confirmations: trs.confirmations,
                    index: trs.index,
                    spent: false,
                    standard: true,
                    timestamp: trs.timestamp,
                    txid: trs.id
                }));
            }
            return out;
        };
        TransactionsEthereum.prototype.downloadUTXOs = function (callBack) {
            var _this = this;
            //  console.log(' downloadUTXOs  '+  this.downloadingData);
            if (this.downloadingData)
                return;
            var start = Date.now();
            var addresses = this.db.getAddressesNot0();
            if (addresses.length === 0) {
                return;
            }
            this.downloadingData = this.service.downloadTransactionsUnspent(addresses).done(function (res) {
                //  console.log(addresses.length);
                console.log('%c ' + _this.name + ' download UTXOs in ' + (Date.now() - start) + ' ms', 'color:green');
                var utxos;
                if (!res.utxos)
                    utxos = _this.remapUTXOs(res.result);
                else
                    utxos = _this.remapTransactionsToOldCode(res.utxos);
                var utxosSpentIds = _this.utxosSpentIds;
                // console.log(utxosSpentIds);
                var outUtxos = [];
                // console.log(utxos);
                _this.utxos = utxos.filter(function (item) { return utxosSpentIds.indexOf(item.address + '-' + item.txid) === -1; });
                //this.utxos =
                _this.db.saveUTXOs(_this.utxos);
                console.log(_this.utxos);
                // this.toSaveUTXO = true;
                _this.lastSendTimestamp = 0;
                _this.unspentObj = res.result;
                _this.emitter$.triggerHandler(_this.ON_UTXOS_READY, [_this.getUTXOs()]);
                callBack();
            }).fail(function (err) { return callBack(err); })
                .always(function () { return _this.downloadingData = null; });
        };
        TransactionsEthereum.prototype.getUTXOsInQueue = function () {
            return this.getUTXOs().filter(function (item) {
                return item.inqueue;
            });
        };
        TransactionsEthereum.prototype.getUTXOsNotInQueue = function () {
            return this.getUTXOs().filter(function (item) {
                return !item.inqueue;
            });
        };
        TransactionsEthereum.prototype.getUTXOs = function () {
            return jaxx.Utils.deepCopy(this.utxos) || [];
        };
        ////////////////////////////// en of Bitcoin ///////////////////////////////////////////
        TransactionsEthereum.prototype.onNewTransactions = function (transactions) {
            //console.warn('new transactions',transactions);
        };
        //////////////////////////////////////// integration //////////////////////////////
        TransactionsEthereum.prototype.deactivate = function () {
            this.isActive = false;
            clearInterval(this.saveInterval);
            clearInterval(this.refreshInterval);
            this.downloadingData = null;
        };
        TransactionsEthereum.prototype.activate = function () {
            var _this = this;
            if (this.isActive)
                return;
            this.isActive = true;
            console.log('%c ' + this.name + ' activating transaction-controller ' + this.lastSendTimestamp, 'color:green');
            clearInterval(this.saveInterval);
            clearInterval(this.refreshInterval);
            if (this.isToken) {
                jaxx.Registry.Ethereum.transactionController.refreshData();
                return;
            }
            this.prepareTransactions();
            this.refreshInterval = setInterval(function () {
                if (_this.name.indexOf('Ethereum') === -1)
                    _this.refreshData();
            }, 20000);
            //this.saveInterval = setInterval(() => this.saveScanner(), this.intervalSaveScanner);
        };
        TransactionsEthereum.prototype.refreshData = function () {
            var _this = this;
            var promise = $.Deferred();
            if (this.name.indexOf('Ethereum') !== -1) {
                console.log('%c ' + this.name + ' calling download nonce  is busy ' + this.downloadingData, 'color:orange');
                this.downloadNonce(function (err) {
                    if (err)
                        promise.reject(err);
                    else
                        promise.resolve(_this.nonces);
                });
            }
            else
                this.downloadUTXOs(function (err) {
                    if (err)
                        promise.reject(err);
                    else
                        promise.resolve(_this.getUTXOs());
                });
            return promise;
        };
        TransactionsEthereum.prototype.prepareTransactions = function () {
            if (this.name.indexOf('Ethereum') !== -1) {
                this.nonces = this.db.getNonces();
                this.refreshData();
            }
            else {
                this.utxos = this.db.getUTXOs();
                // this.utxos = _.uniqBy(this.utxos, 'txid');
                this.refreshData();
            }
        };
        TransactionsEthereum.prototype.reset = function () {
            this.db.saveNonces({});
            this.db.saveUTXOs([]);
            this.db.resetBalancesSpent();
            // this.transactionsReceive = null;
            this.utxos = null;
            this.nonces = null;
            this.lastSendTimestamp = 0;
        };
        ////////////////////////////////////// Ethereum //////////////////////////////////////////////////////
        TransactionsEthereum.prototype.createBalanceTempEther = function (tr, txid) {
            var sent = -tr.valueDelta;
            var fee = tr.gasPrice * tr.gasUsed;
            var to = tr.to;
            // var txid:string = result.result.result;
            var balanceT = new VOBalanceTemp({
                id: tr.from,
                fee: tr.gasPrice * tr.gasUsed,
                // balance:- (sent + fee),
                nonce: tr.nonce,
                spent: (sent + fee),
                timestamp: Date.now(),
                txid: txid,
                count: 0,
                value: tr.valueDelta
            });
            return balanceT;
        };
        //downloadNonceForAddress(address:string)
        TransactionsEthereum.prototype.downloadNonceForFirstAddress = function () {
            var _this = this;
            if (Object.keys(this.nonces).length) {
                console.log(' have nonces -> breaking ', this.nonces);
                return;
            }
            console.log(' download nonce of first address ');
            var address = this.controller.getAddressReceive(0);
            // his.downloadingData =
            this.service.downloadTransactions([address]).done(function (trs) {
                //  this.downloadingData = null;
                var nonces = jaxx.Utils.getNoncesOfAddresses(trs);
                if (!_this.nonces)
                    _this.nonces = {};
                _this.nonces[address] = nonces[address];
                _this.toSaveNonces = true;
                console.log(_this.name, _this.nonces);
                //this.emitter$.triggerHandler(this.ON_PREPARING_READY);
                _this.lastSendTimestamp = 0;
                //console.log('%c transactions receive  in: '+(Date.now() - start)+'ms','color:#bb0');
            });
        };
        //transactionsReceive: VOTransaction[];
        TransactionsEthereum.prototype.downloadNonce = function (callBack) {
            var _this = this;
            if (this.downloadingData)
                return;
            this.emitter$.triggerHandler(this.ON_PREPAROING_TRANSACTIONS);
            var start = Date.now();
            var addesses = jaxx.Utils.addresseFromBalances(this.db.getBalancesNot0Receive());
            console.log('%c ' + this.name + ' have not 0 balances ' + addesses.length, 'color:orange');
            if (addesses.length == 0) {
                this.nonces = {};
                this.db.saveNonces(this.nonces);
                return;
            }
            this.downloadingData = this.service.downloadTransactions(addesses).done(function (trs) {
                // console.log(trs);
                //this.transactionsReceive = trs;
                _this.downloadingData = null;
                _this.nonces = jaxx.Utils.getNoncesOfAddresses(trs);
                _this.db.saveNonces(_this.nonces);
                //this.toSaveNonces = true;
                console.log(_this.name + ' download nonce in ' + (Date.now() - start) + ' ms', _this.nonces);
                _this.emitter$.triggerHandler(_this.ON_NONCES_READY, _this.getNonces());
                _this.lastSendTimestamp = 0;
                //console.log('%c transactions receive  in: '+(Date.now() - start)+'ms','color:#bb0');
            }).fail(function (err) { return callBack(err); })
                .always(function (res) { return _this.downloadingData = null; });
        };
        TransactionsEthereum.prototype.getNonces = function (orig) {
            return orig ? this.nonces : _.clone(this.nonces);
        };
        TransactionsEthereum.prototype.addTempNonce = function (balance) {
            console.log('%c  ' + this.name + ' add nonce  to address ' + balance.id, 'color:orange');
            if (this.nonces) {
                if (this.nonces[balance.id]) {
                    this.nonces[balance.id]++;
                    console.log('%c ' + this.name + ' nonce added to ' + balance.id + '   ' + this.nonces[balance.id], 'color:orange');
                }
                else {
                    this.nonces[balance.id] = 1;
                    console.log('%c nonce setting  to 1 ' + balance.id, 'color:orange');
                }
                this.toSaveNonces = true;
            }
            else
                console.error(' nonces are not ready ');
        };
        TransactionsEthereum.prototype.getNonceForAddress = function (address) {
            return this.nonces[address] || 0;
        };
        //sortedHighestAccountArray:{index:number, balance:number, address:string}[] = [];
        TransactionsEthereum.prototype.getHighestAccountBalanceAndIndex = function () {
            // if(this.highestAccountBalanceAndIndex) return this.highestAccountBalanceAndIndex;
            var balances = this.db.getBalancesIndexedReceiveNot0WithIndex();
            var ar = _.sortBy(balances, ['balance']).reverse();
            var out = [];
            _.each(ar, function (item) {
                out.push({ index: item.index, balance: item.balance, address: item.id });
            });
            if (out.length === 0) {
                this.controller._sortedHighestAccountArray = [];
                return null;
            }
            return out;
            // return this.controller._sortedHighestAccountArray[0];
        };
        TransactionsEthereum.prototype.prepareAddresses = function (addresses) {
            var deferred = $.Deferred();
            deferred.resolve(this.nonces);
            return deferred;
        };
        return TransactionsEthereum;
    }());
    jaxx.TransactionsEthereum = TransactionsEthereum;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=transactions-ethereum.js.map