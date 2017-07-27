///<reference path="../../com/models.ts"/>
///<reference path="../../com/Utils2.ts"/>
///<reference path="../service-mapper.ts"/>
var jaxx;
(function (jaxx) {
    var TransactionDetailsBlockchain = (function () {
        function TransactionDetailsBlockchain() {
            this._currentBatch = 0;
            this._coinType = -1;
            this._name = "Undefined Blockchain :: TransactionDetailsBlockchain";
            this.associativeArray = {};
            this._batchTXHashes = [];
            this._maxErrors = 20;
            //@note: @here: for relay managed classes. eventually it will be applicabe to all of the blockchains.
            this._relayManager = null;
            //@note: @here: for gathering _resolveTxList in a batch.
            this._batchSize = 20;
            this._enableLog = true;
            this.init();
        }
        TransactionDetailsBlockchain.prototype.log = function (params) {
            if (this._enableLog) {
                var args = [].slice.call(arguments);
                args[0] = "[ TransactionDetails " + this._name + " ] :: " + args[0];
                if (this._coinType !== -1 && typeof (HDWalletPouch.getStaticCoinPouchImplementation(this._coinType)) !== 'undefined' && HDWalletPouch.getStaticCoinPouchImplementation(this._coinType) !== null) {
                    var debugColor = "background: black;";
                    var coinDisplayColor = HDWalletPouch.getStaticCoinPouchImplementation(this._coinType).uiComponents['coinDisplayColor'];
                    if (typeof (coinDisplayColor) !== 'undefined' && coinDisplayColor !== null) {
                        debugColor = "color: " + coinDisplayColor + "; font-weight: 300;";
                    }
                    var curLength = args.length;
                    args[0] = "%c" + args[0];
                    args[args.length] = debugColor;
                    //        args.length++;
                }
                console.log.apply(console, args);
            }
        };
        TransactionDetailsBlockchain.prototype.initialize = function (name, coinType, relayManager) {
            this._name = name;
            this._coinType = coinType;
            this._relayManager = relayManager;
            // this.log('initialize :: error :: override this method');
        };
        TransactionDetailsBlockchain.prototype.init = function () {
            console.log(' override this method ');
        };
        TransactionDetailsBlockchain.prototype.abort = function () {
            return this;
        };
        TransactionDetailsBlockchain.prototype.wait = function () {
            this._onHold = true;
        };
        TransactionDetailsBlockchain.prototype.resume = function () {
            this._onHold = false;
            this.getNextTxDetailsBatch();
        };
        TransactionDetailsBlockchain.prototype.reset = function () {
            this._resolveTxList = [];
            this._errors = 0;
            this._currentBatch = -1;
        };
        TransactionDetailsBlockchain.prototype.destroy = function () {
            if (this._request) {
                this._request.abort();
                this._request = null;
            }
            this.deferred = null;
            this._resolveTxList = null;
            this._destroyed = true;
            if (this._onDestroyed) {
                this._onDestroyed();
            }
        };
        TransactionDetailsBlockchain.prototype.onError = function (id, message) {
            var _this = this;
            this._errors++;
            if (this._errors > this._maxErrors) {
                this.deferred.reject({
                    error: id,
                    message: message
                });
                this.destroy();
                return;
            }
            this._currentBatch--;
            this.log("error :: " + id + " :: message :: " + message);
            setTimeout(function () { return _this.getNextTxDetailsBatch(); }, 10000);
        };
        TransactionDetailsBlockchain.prototype.parseReferenceTxDetails = function (referenceTxDetailsData) {
            if (referenceTxDetailsData) {
                var newReferenceData = new ReferenceRelaysTxDetailsData(referenceTxDetailsData);
                return newReferenceData;
            }
            this.log("error :: parseReferenceTxDetails :: " + JSON.stringify(referenceTxDetailsData, null, 4));
            return null;
        };
        // parse(txDetailsData:ReferenceRelaysTxDetailsData[]):VOTransaction[] {
        //     if (txDetailsData) {
        //         var returnVOTransactions:VOTransaction[] = [];
        //
        //         for (var i = 0; i < txDetailsData.length; i++) {
        //             var newVOTransaction = new VOTransaction(txDetailsData[i]);
        //             returnVOTransactions.push(newVOTransaction);
        //         }
        //
        //         return returnVOTransactions;
        //     }
        //
        //     return null;
        // }
        TransactionDetailsBlockchain.prototype.loadTxDetails = function (txList) {
            this.reset();
            this._resolveTxList = txList;
            var allTxHashes = [];
            for (var i = 0; i < this._resolveTxList.length; i++) {
                var curTxList = this._resolveTxList[i];
                this.associativeArray[curTxList.address] = curTxList;
                var allAddressTxHashes = Object.keys(curTxList.txListDict);
                for (var j = 0; j < allAddressTxHashes.length; j++) {
                    allTxHashes.push(allAddressTxHashes[j]);
                }
            }
            this._batchTXHashes = jaxx.Utils.splitInCunks(allTxHashes, this._batchSize);
            this.deferred = $.Deferred();
            this.getNextTxDetailsBatch();
            return this.deferred;
        };
        TransactionDetailsBlockchain.prototype.getNextTxDetailsBatch = function () {
            var _this = this;
            this._currentBatch++;
            if (this._currentBatch >= this._batchTXHashes.length) {
                this.deferred.resolve(this._resolveTxList);
                setTimeout(function () {
                    _this.destroy();
                }, 100);
                return;
            }
            // var txListArray:VORelayedTransactionListAndUTXOsForAddress[] = this._batchTxListArray[this._currentBatch];
            //
            // this._resolveTxList = this._resolveTxList.concat(txListArray);
            // @note: @here: since the modification to the txList array is happening in this function, and operating on the objects themselves, a shallow clone is not necessary.
            var checkTxHashes = this._batchTXHashes[this._currentBatch];
            if (checkTxHashes.length > 0) {
                // this.log("loading txListArray :: " + JSON.stringify(txListArray, null, 4));
                var self = this;
                var delegateFunction = "getTxDetails";
                var relayArguments = [checkTxHashes, function (status, relayReturnData) {
                        if (relayReturnData && relayReturnData.length) {
                            var allTxDetailsFromRelay = [];
                            for (var i = 0; i < relayReturnData.length; i++) {
                                var curRelayReturnData = relayReturnData[i];
                                var txDetailsDataFromRelay = self.parseReferenceTxDetails(curRelayReturnData);
                                allTxDetailsFromRelay.push(txDetailsDataFromRelay);
                            }
                            if (allTxDetailsFromRelay.length > 0) {
                                for (var i = 0; i < allTxDetailsFromRelay.length; i++) {
                                    var curTxDetails = allTxDetailsFromRelay[i];
                                    for (var j = 0; j < curTxDetails.inputs.length; j++) {
                                        var curInput = curTxDetails.inputs[j];
                                        //@note: @here: @codereview: is this actually going to associate it properly to addresses that are not yet in the associative array list?!
                                        if (typeof (self.associativeArray[curInput.address]) !== 'undefined' && self.associativeArray[curInput.address] !== null) {
                                            self.associativeArray[curInput.address].txListDict[curTxDetails.txid] = curTxDetails;
                                        }
                                        else {
                                            // console.log("[inputs] no array for :: " + curTxDetails.txid + " :: address :: " + curInput.address);
                                        }
                                    }
                                    for (var j = 0; j < curTxDetails.outputs.length; j++) {
                                        var curOutput = curTxDetails.outputs[j];
                                        //@note: @here: @codereview: is this actually going to associate it properly to addresses that are not yet in the associative array list?!
                                        if (typeof (self.associativeArray[curOutput.address]) !== 'undefined' && self.associativeArray[curOutput.address] !== null) {
                                            self.associativeArray[curOutput.address].txListDict[curTxDetails.txid] = curTxDetails;
                                        }
                                        else {
                                            // console.log("[outputs] no array for :: " + curTxDetails.txid + " :: address :: " + curOutput.address);
                                        }
                                    }
                                }
                            }
                            // self.log("getNextTxDetailsBatch :: completed relay task getTxDetails :: " + JSON.stringify(relayReturnData, null, 4) + " :: # of _resolveTxList :: " + self._resolveTxList.length);
                        }
                        self.getNextTxDetailsBatch();
                    }];
                var callbackIndex = 1;
                var isCallbackSuccessfulFunction = function (status) {
                    if (typeof (status) === 'string' && status === 'success') {
                        // console.log("callback successful");
                        return true;
                    }
                    else {
                        // self.log("callback unsuccessful");
                        var color = HDWalletPouch.getStaticCoinPouchImplementation(self._coinType).uiComponents.coinDisplayColor;
                        console.log("%c Relay Node Failure :: Transaction_Details_Blockchain.ts :: " + HDWalletPouch.getStaticCoinPouchImplementation(self._coinType).uiComponents.coinFullName + " Printing Arguments", 'color:' + color);
                        console.log(arguments);
                        return false;
                    }
                };
                var isCallbackPermanentFailureFunction = function (status) {
                    //@note: @here: @todo: @next: @relays:
                    //self.onError(self._currentBatch, "failure with node...");
                    self.log('Transaction Details: Relay call failure.');
                    return false;
                    //                return false;
                };
                var actionTakenWhenTaskIsNotExecuted = function (returnArgs) {
                    self.log("Transaction Details: failure with relay system...");
                    self.onError(self._currentBatch, "Transaction Details: failure with node...");
                };
                //            this._workerManager._relayManager.startRelayTaskWithBestRelay(delegateFunction,
                //@note: @here: @todo: @next: @relays:
                this._relayManager.startRelayTaskWithBestRelay(delegateFunction, relayArguments, callbackIndex, isCallbackSuccessfulFunction, isCallbackPermanentFailureFunction, actionTakenWhenTaskIsNotExecuted);
            }
            else {
                this.log("no transactions in addresses.");
                this.getNextTxDetailsBatch();
            }
        };
        return TransactionDetailsBlockchain;
    }());
    jaxx.TransactionDetailsBlockchain = TransactionDetailsBlockchain;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=transaction_details_blockchain.js.map