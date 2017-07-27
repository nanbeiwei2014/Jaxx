///<reference path="../../com/models.ts"/>
///<reference path="../../com/Utils2.ts"/>
///<reference path="../service-mapper.ts"/>
var jaxx;
(function (jaxx) {
    var TransactionListBlockchain = (function () {
        /* log(params):void {
             if (this._enableLog) {
                 var args = [].slice.call(arguments);
 
                 args[0] = "[ TransactionsList " + this._name + " ] :: " + args[0];
 
                 if (this._coinType !== -1 && typeof(HDWalletPouch.getStaticCoinPouchImplementation(this._coinType)) !== 'undefined' && HDWalletPouch.getStaticCoinPouchImplementation(this._coinType) !== null) {
                     var debugColor = "background: black;"
 
                     var coinDisplayColor = HDWalletPouch.getStaticCoinPouchImplementation(this._coinType).uiComponents['coinDisplayColor'];
 
                     if (typeof(coinDisplayColor) !== 'undefined' && coinDisplayColor !== null) {
                         debugColor = "color: " + coinDisplayColor + "; font-weight: 300;";
                     }
 
                     var curLength = args.length;
 
                     args[0] = "%c" + args[0];
                     args[args.length] = debugColor;
                     //        args.length++;
                 }
 
                 console.log.apply(console, args);
             }*/
        // }
        function TransactionListBlockchain(coin_HD_index, generator, options) {
            var _this = this;
            this._currentIndex = 0;
            this._coinType = -1;
            this.startIndex = -1;
            this._coin_HD_index = -1;
            this.numberOfTransactionsWithoutHistory = 10;
            this._resolveTxList = [];
            this._attempts = 10;
            //@note: @here: for relay managed classes. eventually it will be applicabe to all of the blockchains.
            this._relayManager = null;
            //@note: @here: for gathering _resolveTxList in a batch.
            this._batchSize = 20;
            this._enableLog = true;
            this.options = {
                delayRequest: 2
            };
            if (options)
                for (var str in options)
                    this.options[str] = options[str];
            this._coin_HD_index = coin_HD_index;
            this.generator = generator;
            this.name = generator.name;
            jaxx.Registry.application$.on(jaxx.Registry.KILL_HISTORY, function (evt, name) {
                //  console.warn(' history killed ');
                _this.deferred.reject({ error: 100, message: 'history killed' });
                setTimeout(function () { return _this.destroy(); }, 20);
            });
            this.init();
        }
        TransactionListBlockchain.prototype.initialize = function (name, coinType, relayManager) {
            this.name = name;
            this._coinType = coinType;
            this._relayManager = relayManager;
            // this.log('initialize :: error :: override this method');
        };
        TransactionListBlockchain.prototype.getAddresses = function () {
            return this._addresses;
        };
        TransactionListBlockchain.prototype.getTxsIds = function () {
            return this.txsIds;
        };
        TransactionListBlockchain.prototype.abort = function () {
            return this;
        };
        TransactionListBlockchain.prototype.init = function () {
        };
        TransactionListBlockchain.prototype.wait = function () {
            this._onHold = true;
        };
        TransactionListBlockchain.prototype.resume = function () {
            this._onHold = false;
            this.loadNextAddress();
        };
        TransactionListBlockchain.prototype.destroy = function () {
            // if(this._currentRequest){
            //     this._currentRequest.abort();
            //     this._currentRequest = null;
            // }
            this._addresses = null;
            this._resolveTxList = null;
            this._destroyed = true;
            if (this._onDestroyed) {
                this._onDestroyed();
            }
        };
        TransactionListBlockchain.prototype.reset = function () {
            this._currentIndex = this.startIndex;
            this._numberOfTransactionsWithoutHistory = 0;
            this._addresses = [];
            this._resolveTxList = [];
            this.txsIds = [];
            this._attempts = 10;
            // this._requestDelays = 20;
        };
        TransactionListBlockchain.prototype.getNextAddress = function () {
            var address = this.generator.generateAddress(this._currentIndex, this._receive_change);
            this._addresses[this._currentIndex] = address;
            return address;
        };
        TransactionListBlockchain.prototype.setTheEnd = function () {
            this._numberOfTransactionsWithoutHistory = 100; //to stop next step;
        };
        TransactionListBlockchain.prototype.parse = function (txList) {
            if (txList && txList.data && txList.data.length) {
                var parsedRelayTxLists = [];
                for (var i = 0; i < txList.data.length; i++) {
                    var newRelayedTxList = new VORelayedTransactionList(null);
                    newRelayedTxList.address = txList.data[i].address;
                    for (var j = 0; j < txList.data[i].txs.length; j++) {
                        var curTxHash = txList.data[i].txs[j].txHash;
                        newRelayedTxList.txListDict[curTxHash] = null;
                    }
                    // @note: @here: @codereview:
                    // newRelayedTxList.txList.length = Object.keys(newRelayedTxList.txList).length;
                    parsedRelayTxLists.push(newRelayedTxList);
                }
                return parsedRelayTxLists;
            }
            else {
                return null;
            }
        };
        TransactionListBlockchain.prototype.onError = function (num, url, message) {
            var _this = this;
            console.log("error :: attempts :: " + this._attempts + " :: message :: " + message);
            this._attempts--;
            if (this._attempts < 0) {
                this.deferred.reject({
                    error: num,
                    attempts: this._attempts,
                    message: message,
                    url: url
                });
                this.destroy();
                return;
            }
            this._currentIndex--;
            setTimeout(function () {
                _this.loadNextAddress();
            }, 10000);
            jaxx.Registry.application$.triggerHandler(jaxx.Registry.ON_RESTORE_HISTORY_ERROR);
        };
        TransactionListBlockchain.prototype.restoreHistory = function (receive_change) {
            var _this = this;
            //var promise:JQueryDeferred<{index:number,addresses:string[]}>
            /// console.warn(this._name + ' restoreHistory ' + receive_change);
            this.deferred = $.Deferred();
            this._receive_change = receive_change;
            this.reset();
            setTimeout(function () { return _this.loadNextAddress(); }, 50);
            return this.deferred;
        };
        TransactionListBlockchain.prototype.loadNextAddress = function () {
            var _this = this;
            if (this._onHold || this._destroyed) {
                return;
            }
            this._currentIndex++;
            this._numberOfTransactionsWithoutHistory++;
            if (this._numberOfTransactionsWithoutHistory > this.numberOfTransactionsWithoutHistory) {
                this._addresses = this._addresses.slice(0, this._addresses.length - this.numberOfTransactionsWithoutHistory);
                var passthroughTxList = this._resolveTxList.slice(0, this._resolveTxList.length - this.numberOfTransactionsWithoutHistory);
                this.deferred.resolve(this._resolveTxList);
                setTimeout(function () {
                    _this.destroy();
                }, 100);
                return;
            }
            var self = this;
            var delayRequest = this.options.delayRequest;
            var curAddress = this.getNextAddress();
            var currentIndex = this._currentIndex;
            var addressType = this._receive_change;
            if (!curAddress) {
                this.onError(8888888, curAddress, 'current address is null');
                return;
            }
            //this._addresses.push(curAddress);
            //@note: @here: @relays: expects data in a single string, CSV type format.
            var delegateFunction = "getTxList";
            var relayArguments = [curAddress, function (status, relayReturnData) {
                    // console.log(curAddress + '  '+ status, relayReturnData);
                    if (status === "success") {
                        var resultTxs = relayReturnData.data.reduce(function (a, b) { return a = a.concat(b.txs.map(function (item) { return item.txHash; })); }, []);
                        // console.log(resultTxs);
                        if (resultTxs)
                            self.txsIds = self.txsIds.concat(resultTxs);
                        var txListDataFromRelay = new ReferenceRelaysTxListData(relayReturnData);
                        //  console.log(txListDataFromRelay);
                        var foundExistingTransactions = false;
                        //@note: @here: this should return just a single VORelayedTransactionList item since there's only one address posted into the relay arguments above, "curAddress".
                        var curTxListArray = self.parse(txListDataFromRelay);
                        if (curTxListArray && curTxListArray.length === 1) {
                            for (var i = 0; i < curTxListArray.length; i++) {
                                var curTxListItem = curTxListArray[i];
                                if (!Array.isArray(self._resolveTxList))
                                    return;
                                self._resolveTxList.push(curTxListItem);
                                var numTx = Object.keys(curTxListItem.txListDict).length;
                                if (numTx > 0) {
                                    foundExistingTransactions = true;
                                }
                                else {
                                }
                            }
                            if (foundExistingTransactions === true) {
                                self._numberOfTransactionsWithoutHistory = 0;
                            }
                            console.log(self.name + " " + currentIndex + ' ' + curTxListArray[0].address + ' ' + addressType + " has " + Object.keys(curTxListArray[0].txListDict).length + " transactions");
                        }
                    }
                    else {
                        console.log("getTxList :: failure :: " + status + " :: numberOfTransactionsWithoutHistory :: " + self._numberOfTransactionsWithoutHistory);
                    }
                    //  console.log(delayRequest);
                    self.loadNextAddress();
                    // setTimeout(self.loadNextAddress(), delayRequest);
                }];
            var callbackIndex = 1;
            var isCallbackSuccessfulFunction = function (status) {
                if (typeof (status) === 'string' && status === 'success') {
                    // console.log("callback successful");
                    return true;
                }
                else {
                    console.log("callback unsuccessful");
                    var color = HDWalletPouch.getStaticCoinPouchImplementation(self._coinType).uiComponents.coinDisplayColor;
                    console.log("%c Relay Node Failure :: Transaction_List_Blockchain.ts :: " + HDWalletPouch.getStaticCoinPouchImplementation(self._coinType).uiComponents.coinFullName + " Printing Arguments", 'color:' + color);
                    console.log(arguments);
                    return false;
                }
            };
            var isCallbackPermanentFailureFunction = function (status) {
                // self.log("Transaction Lists: Relay call failure..."); // log function not defined yet
                //@note: @here: @todo: @next: @relays:
                return false;
                //                return false;
            };
            var actionTakenWhenTaskIsNotExecuted = function (returnArgs) {
                console.log("Transaction Lists: failure with relay system...");
                self.onError(self._currentIndex, "relay manager: no url", "Transaction Lists: failure with node...");
            };
            //@note: @here: @todo: @next: @relays:
            this._relayManager.startRelayTaskWithBestRelay(delegateFunction, relayArguments, callbackIndex, isCallbackSuccessfulFunction, isCallbackPermanentFailureFunction, actionTakenWhenTaskIsNotExecuted);
        };
        return TransactionListBlockchain;
    }());
    jaxx.TransactionListBlockchain = TransactionListBlockchain;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=transaction_list_blockchain.js.map