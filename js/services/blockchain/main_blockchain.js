/**
 * Created by fieldtempus on 2016-11-23.
 */
///<reference path="transaction_list_blockchain.ts"/>
///<reference path="balances_blockchain.ts"/>
///<reference path="transaction_details_blockchain.ts"/>
///<reference path="utxos_blockchain.ts"/>
///<reference path="generator_blockchain.ts"/>
var jaxx;
(function (jaxx) {
    var MainBlockchain = (function () {
        function MainBlockchain(coinType, coin_HD_index, service, options) {
            this._relayManager = null;
            this._relayManagerImplementation = null;
            this._coinType = -1;
            this._coin_HD_index = -1;
            this._service = null;
            this._enableLog = false;
            this._cryptoMethods = [];
            this.options = options;
            this._coinType = coinType;
            this._coin_HD_index = coin_HD_index;
            this._service = service;
            this.generator = new jaxx.GeneratorBlockchain(service.name, coinType, coin_HD_index);
            this.name = service.name;
            this.init();
        }
        MainBlockchain.prototype.init = function () {
            console.error("override this method");
        };
        MainBlockchain.prototype.initialize = function () { };
        ;
        MainBlockchain.prototype.restoreHistory2 = function (receive_change, startIndex) {
            var promise = $.Deferred();
            var txlist = new jaxx.TransactionListBlockchain(this._coin_HD_index, this.generator, this.options);
            txlist.initialize(this.name, this._coinType, this._relayManager);
            txlist.startIndex = startIndex - 1;
            txlist.restoreHistory(receive_change).done(function (result) {
                //let list:VORelayedTransactionList[] = result;
                //console.log(list);
                var addresses = txlist.getAddresses();
                //console.log(addresses);
                var txIds = txlist.getTxsIds();
                var index = startIndex + addresses.length;
                promise.resolve({ index: index, addresses: addresses, txdIds: txIds, transactions: null, txsList: result });
            });
            return promise;
        };
        MainBlockchain.prototype.checkAddressesForTranasactions = function (addresses) {
            var promise = $.Deferred();
            var relayManager = this._relayManager;
            var i = -1;
            var trsIds = [];
            var self = this;
            // console.log(addresses);
            var loadNextAddress = function () {
                i++;
                if (i >= addresses.length) {
                    promise.resolve(_.uniq(trsIds));
                    return;
                }
                var curAddress = addresses[i];
                var relayArguments = [curAddress, function (status, relayReturnData) {
                        var result = relayReturnData.data.reduce(function (a, b) { return a = a.concat(b.txs.map(function (item) { return item.txHash; })); }, []);
                        trsIds = trsIds.concat(result);
                        // console.log(relayReturnData);
                        // console.log(result);
                        loadNextAddress();
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
                        console.log("%c Relay Node Failure :: MainBlockchain.ts :: " + HDWalletPouch.getStaticCoinPouchImplementation(self._coinType).uiComponents.coinFullName + " Printing Arguments", 'color:' + color);
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
                    promise.reject(returnArgs);
                    //self.onError(self._currentIndex, "relay manager: no url", "Transaction Lists: failure with node...");
                };
                relayManager.startRelayTaskWithBestRelay("getTxList", relayArguments, callbackIndex, isCallbackSuccessfulFunction, isCallbackPermanentFailureFunction, actionTakenWhenTaskIsNotExecuted);
            };
            loadNextAddress();
            return promise;
        };
        MainBlockchain.prototype.loadBalaceUnconfirmed = function (address) {
            console.error(' use main-connector class ');
            return null;
        };
        MainBlockchain.prototype.generateKeyPairReceive = function (index) {
            return this.generator.generateKeyPairReceive(index);
        };
        MainBlockchain.prototype.generateKeyPairChange = function (index) {
            return this.generator.generateKeyPairChange(index);
        };
        MainBlockchain.prototype.mapInput = function (curInput, referenceTxDetails) {
            var newVOTransaction = new VOTransaction(null);
            if (isNaN(referenceTxDetails.time_utc)) {
                // console.error(' referenceTxDetails.time_utc ' + referenceTxDetails.time_utc);
                referenceTxDetails.time_utc = Math.round(Date.now() / 1000);
            }
            newVOTransaction.input = true;
            newVOTransaction.address = curInput.address;
            newVOTransaction.amount = curInput.amount;
            newVOTransaction.index = curInput.index;
            newVOTransaction.standard = curInput.standard;
            newVOTransaction.previousIndex = curInput.previousIndex;
            newVOTransaction.previousTxId = curInput.previousTxId;
            newVOTransaction.id = referenceTxDetails.txid;
            newVOTransaction.block = referenceTxDetails.block;
            newVOTransaction.confirmations = referenceTxDetails.confirmations;
            newVOTransaction.timestamp = referenceTxDetails.time_utc;
            return newVOTransaction;
        };
        MainBlockchain.prototype.mapOutput = function (curOutput, referenceTxDetails) {
            if (isNaN(referenceTxDetails.time_utc)) {
                // console.error(' referenceTxDetails.time_utc ' + referenceTxDetails.time_utc);
                referenceTxDetails.time_utc = Math.round(Date.now() / 1000);
            }
            var newVOTransaction = new VOTransaction(null);
            newVOTransaction.input = false;
            newVOTransaction.address = curOutput.address;
            newVOTransaction.amount = curOutput.amount;
            newVOTransaction.index = curOutput.index;
            newVOTransaction.standard = curOutput.standard;
            newVOTransaction.spent = curOutput.spent;
            newVOTransaction.id = referenceTxDetails.txid;
            newVOTransaction.block = referenceTxDetails.block;
            newVOTransaction.confirmations = referenceTxDetails.confirmations;
            newVOTransaction.timestamp = referenceTxDetails.time_utc;
            return newVOTransaction;
        };
        MainBlockchain.prototype.getVOTransactionsForTxListWithDetails = function (txList) {
            var outAddresses = [];
            var outTransactions = [];
            mainloop: for (var i = 0; i < txList.length; i++) {
                var curTxList = txList[i];
                outAddresses.push(curTxList.address);
                var allReferenceRelayTxKeys = Object.keys(curTxList.txListDict);
                for (var j = 0; j < allReferenceRelayTxKeys.length; j++) {
                    var curReferenceTxDetails = curTxList.txListDict[allReferenceRelayTxKeys[j]];
                    if (!curReferenceTxDetails || !curReferenceTxDetails.inputs) {
                        console.error(curTxList.txListDict);
                        continue mainloop;
                    }
                    for (var k = 0; k < curReferenceTxDetails.inputs.length; k++) {
                        var newVOTransaction = this.mapInput(curReferenceTxDetails.inputs[k], curReferenceTxDetails);
                        var isUnique = true;
                        for (var el = 0; el < outTransactions.length; el++) {
                            var curCompareVOTransaction = outTransactions[el];
                            //@note: @here: skip compare if it's an output for another transaction.
                            if (curCompareVOTransaction.input === false) {
                                continue;
                            }
                            if (newVOTransaction.id === curCompareVOTransaction.id &&
                                newVOTransaction.index === curCompareVOTransaction.index) {
                                isUnique = false;
                                break;
                            }
                        }
                        if (isUnique === true) {
                            outTransactions.push(newVOTransaction);
                        }
                    }
                    for (var k = 0; k < curReferenceTxDetails.outputs.length; k++) {
                        var newVOTransaction = this.mapOutput(curReferenceTxDetails.outputs[k], curReferenceTxDetails);
                        var isUnique = true;
                        for (var el = 0; el < outTransactions.length; el++) {
                            var curCompareVOTransaction = outTransactions[el];
                            //@note: @here: skip compare if it's an input for another transaction.
                            if (curCompareVOTransaction.input === true) {
                                continue;
                            }
                            if (newVOTransaction.id === curCompareVOTransaction.id &&
                                newVOTransaction.index === curCompareVOTransaction.index) {
                                isUnique = false;
                                break;
                            }
                        }
                        if (isUnique === true) {
                            outTransactions.push(newVOTransaction);
                        }
                    }
                }
            }
            return {
                index: 0,
                addresses: outAddresses,
                transactions: outTransactions,
                relayedTransactionListArray: txList
            };
        };
        MainBlockchain.prototype.getTransactionalDataFromTxList = function (txList) {
            var _this = this;
            var mainRequestDeferred = $.Deferred();
            var txDetailsDataRequest = new this._cryptoMethods['transactionDetails']();
            txDetailsDataRequest.initialize(this.name, this._coinType, this._relayManager);
            var promise = txDetailsDataRequest.loadTxDetails(txList);
            promise.done(function (txList) {
                var VOTransactionList = _this.getVOTransactionsForTxListWithDetails(txList);
                mainRequestDeferred.resolve(VOTransactionList);
            });
            return mainRequestDeferred;
        };
        MainBlockchain.prototype.getUTXODataFromTxList = function (txList) {
            var utxoRequestDeferred = $.Deferred();
            var utxoListRequest = new this._cryptoMethods['utxos']();
            utxoListRequest.initialize(this.name, this._coinType, this._relayManager);
            utxoListRequest.loadUTXOsData(txList).done(function (txList) {
                utxoRequestDeferred.resolve(txList);
            });
            return utxoRequestDeferred;
        };
        MainBlockchain.prototype.restoreHistory = function (receive_change) {
            var _this = this;
            var mainRequestDeferred = $.Deferred();
            var txListRequest = new this._cryptoMethods['transactionList'](this._coin_HD_index, this.generator, this.options);
            txListRequest.initialize(this.name, this._coinType, this._relayManager);
            txListRequest.restoreHistory(receive_change).done(function (txList) {
                // console.warn(txListRequest.getAddresses());
                //vladedit previous respond contained extra addresses (+20)
                // did a hack to get addresses from TransactionListBitcoin
                //TODO remove extra addresses from next calls
                var addresses = txListRequest.getAddresses();
                var promise = _this.getUTXODataFromTxList(txList);
                promise.done(function (txListWithUTXOs) {
                    _this.getTransactionalDataFromTxList(txListWithUTXOs).done(function (transactionalData) {
                        transactionalData.addresses = addresses;
                        mainRequestDeferred.resolve(transactionalData);
                    }).fail(function (err) { return mainRequestDeferred.reject(err); });
                }).fail(function (err) { return mainRequestDeferred.reject(err); });
            }).fail(function (err) { return mainRequestDeferred.reject(err); });
            return mainRequestDeferred;
        };
        /////////////////////////////////////////////////////
        MainBlockchain.prototype.downloadTransactionsDetails = function (txList) {
            var _this = this;
            var promise = $.Deferred();
            this.getUTXODataFromTxList(txList).done(function (txListWithUTXOs) {
                _this.getTransactionalDataFromTxList(txListWithUTXOs)
                    .done(function (transactionalData) {
                    promise.resolve(transactionalData);
                });
            });
            ;
            return promise;
        };
        /*  downloadTransactionsDetails(txsIds:string[]):JQueryDeferred<{result:any[], transactions:VOTransaction[]}>{


            let self = this;
            let i= -1;

            let chunks:string[][] =_.chunk(txsIds,10);
            let transactions:any[] = [];


            console.log(chunks);
            let parser = function (respond) {
                console.log(respond);
                return [];// respond.data.reduce(function (a,b) { return a = a.concat(b.txs.map(function(item){ return item.txHash})); },[]);
            }

            let loadNext = function () {

                i++;
                if(i>=chunks.length){
                    promise.resolve({result:null, transactions:transactions});

                    return;

                }

                let curChunk:string[] = chunks[i];

                let relayArguments = [curChunk, function(status, relayReturnData) {

                    console.log(relayReturnData);

                    transactions = transactions.concat(parser(relayReturnData));
                    // console.log(relayReturnData);
                    // console.log(result);
                    loadNext();

                }];



                let isCallbackSuccessfulFunction = function(status) {
                    if (typeof(status) === 'string' && status === 'success') {
                        // console.log("callback successful");
                        return true;
                    } else {
                        console.log("callback unsuccessful");
                        return false;
                    }
                }

                var isCallbackPermanentFailureFunction = function(status) {
                    // self.log("Transaction Lists: Relay call failure..."); // log function not defined yet
                    //@note: @here: @todo: @next: @relays:
                    return false;
                    //                return false;
                }

                var actionTakenWhenTaskIsNotExecuted = function(returnArgs) {
                    console.log("Transaction Lists: failure with relay system...");
                    promise.reject(returnArgs);
                    //self.onError(self._currentIndex, "relay manager: no url", "Transaction Lists: failure with node...");
                };


                self._relayManager.startRelayTaskWithBestRelay("getTxDetails", relayArguments, 1, isCallbackSuccessfulFunction, isCallbackPermanentFailureFunction, actionTakenWhenTaskIsNotExecuted);

            };

            loadNext();



            return promise
        }
         */
        MainBlockchain.prototype.downloadTransactionsUnspent = function (addresses) {
            var deferred = $.Deferred();
            if (addresses.length === 0) {
                deferred.resolve({ result: [], utxos: [] });
                return deferred;
            }
            var i = 0;
            var relayManager = this._relayManager;
            var address = addresses[i];
            var out = [];
            var utxos = [];
            var onDataDownloaded = function (status, data) {
                for (var addr in data) {
                    var ar = data[addr];
                    utxos = utxos.concat(jaxx.ServiceMappers.mapTransactionsUnspent(ar, addr));
                }
                // utxos.push(new VOAddressUnspent(str, data[str]));
                out.push(data);
                i++;
                if (i >= addresses.length) {
                    deferred.resolve({ result: out, utxos: utxos });
                    return;
                }
                address = addresses[i];
                setTimeout(getHext, 100);
                // console.log(arguments);
            };
            //console.warn(' downloadTransactionsUnspent  ' + addresses.length);
            var getHext = function () {
                relayManager.getUTXO(address, onDataDownloaded);
            };
            getHext();
            return deferred;
        };
        MainBlockchain.prototype.downloadTransactions = function (addresses) {
            var _this = this;
            var deffered = $.Deferred();
            var txListRequest = new this._cryptoMethods['transactionList'](this._coin_HD_index, this.generator, this.options);
            txListRequest.initialize(this.name, this._coinType, this._relayManager);
            txListRequest.getNextAddress = function () {
                var address = addresses.pop();
                if (addresses.length == 0) {
                    txListRequest.setTheEnd();
                }
                return address;
            };
            txListRequest.restoreHistory('nothing').done(function (txList) {
                _this.getUTXODataFromTxList(txList).done(function (txListWithUTXOs) {
                    _this.getTransactionalDataFromTxList(txListWithUTXOs)
                        .done(function (transactionalData) {
                        deffered.resolve(transactionalData);
                    });
                });
            });
            return deffered;
        };
        MainBlockchain.prototype.downloadBalances = function (addresses) {
            var d = $.Deferred();
            var balanceRequestManager = new this._cryptoMethods['balances'](this.options);
            balanceRequestManager.initialize(this.name, this._coinType, this._relayManager);
            var promise = balanceRequestManager.loadBalances(addresses);
            promise.done(function (res) { return d.resolve(res); }).fail(function (err) { return d.reject(err); });
            return d;
        };
        MainBlockchain.prototype.downloadTransactionsForAddress = function (address) {
            console.log("warning :: MainBlockchain :: downloadTransactionsForAddress :: this function is undefined");
            // var url:string = this.urlTransactions.replace('{{address}}', address);
            // return $.getJSON(url).then(res => {
            //     var result = res.result;
            //     return ServiceMappers.mapEtherTransactions(result, address);
            // });
            return null;
        };
        MainBlockchain.prototype.getMiningFees = function () {
            console.error(this.name + ' override this function ');
            return -1; //20,000,000
        };
        return MainBlockchain;
    }());
    jaxx.MainBlockchain = MainBlockchain;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=main_blockchain.js.map