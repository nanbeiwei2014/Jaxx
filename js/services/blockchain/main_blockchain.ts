/**
 * Created by fieldtempus on 2016-11-23.
 */
    ///<reference path="transaction_list_blockchain.ts"/>
    ///<reference path="balances_blockchain.ts"/>
    ///<reference path="transaction_details_blockchain.ts"/>
    ///<reference path="utxos_blockchain.ts"/>
    ///<reference path="generator_blockchain.ts"/>

declare var RelayManager;

module jaxx {

    export class MainBlockchain implements IRequestServer {

        _relayManager:any = null;
        _relayManagerImplementation:any = null;

        _coinType = -1;
        name;

        _coin_HD_index:number = -1;
        _service:JaxxAccountService = null;

        generator:GeneratorBlockchain;

        _enableLog:boolean = false;

        _cryptoMethods:any[] = [];

        config:any;
        urlBalance:string;
        options:any;

        constructor(coinType:number, coin_HD_index:number, service:JaxxAccountService, options?:any) {

            this.options = options;
            this._coinType = coinType;
            this._coin_HD_index = coin_HD_index;
            this._service = service;
            this.generator = new GeneratorBlockchain(service.name,coinType,coin_HD_index);
            this.name = service.name;

            this.init();
        }

        init():void {
            console.error("override this method");
        }

        initialize():void {};


        restoreHistory2(receive_change:string, startIndex:number):JQueryDeferred<{index:number, addresses:string[], txdIds:string[], transactions:VOTransaction[], txsList:VORelayedTransactionList[]}>{


            let promise:JQueryDeferred<{index:number, addresses:string[], txdIds:string[], transactions:any[], txsList:VORelayedTransactionList[]}> = $.Deferred();

            let txlist:TransactionListBlockchain = new TransactionListBlockchain(this._coin_HD_index, this.generator, this.options);
            txlist.initialize(this.name, this._coinType, this._relayManager);

            txlist.startIndex = startIndex-1;

            txlist.restoreHistory(receive_change).done((result)=>{
                //let list:VORelayedTransactionList[] = result;
                //console.log(list);

                let addresses:string[] = txlist.getAddresses();
                //console.log(addresses);
                let txIds =  txlist.getTxsIds();


                let index:number = startIndex + addresses.length;

                promise.resolve({index:index, addresses:addresses, txdIds:txIds, transactions:null , txsList:result});
            });

            return promise;
        }

        checkAddressesForTranasactions(addresses:string[]):JQueryDeferred<string[]>{
            let promise:JQueryDeferred<string[]> = $.Deferred();
            let relayManager:any = this._relayManager;
            let i:number = -1;
            let trsIds:string[] = [];
            let self:any = this;
           // console.log(addresses);
            let loadNextAddress = function () {

                i++;
                if(i>=addresses.length){
                    promise.resolve(_.uniq(trsIds));

                    return;

                }
                let curAddress = addresses[i];

                let relayArguments = [curAddress, function(status, relayReturnData) {
                    let result = relayReturnData.data.reduce(function (a,b) { return a = a.concat(b.txs.map(function(item){ return item.txHash})); },[]);
                    trsIds = trsIds.concat(result);
                   // console.log(relayReturnData);
                   // console.log(result);
                    loadNextAddress();

                }];

                var callbackIndex = 1;

                var isCallbackSuccessfulFunction = function(status) {
                    if (typeof(status) === 'string' && status === 'success') {
                        // console.log("callback successful");
                        return true;
                    } else {
                        console.log("callback unsuccessful");
                        var color = HDWalletPouch.getStaticCoinPouchImplementation(self._coinType).uiComponents.coinDisplayColor;
                        console.log("%c Relay Node Failure :: MainBlockchain.ts :: " + HDWalletPouch.getStaticCoinPouchImplementation(self._coinType).uiComponents.coinFullName + " Printing Arguments", 'color:' + color);
                        console.log(arguments)
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


                relayManager.startRelayTaskWithBestRelay("getTxList", relayArguments, callbackIndex, isCallbackSuccessfulFunction, isCallbackPermanentFailureFunction, actionTakenWhenTaskIsNotExecuted);

            };

            loadNextAddress();


            return promise;
        }

        loadBalaceUnconfirmed(address:string):JQueryDeferred<VOBalance[]>{
            console.error(' use main-connector class ');

            return null;
        }

        generateKeyPairReceive(index:number):any {
            return this.generator.generateKeyPairReceive(index);
        }

        generateKeyPairChange(index:number):any {
            return this.generator.generateKeyPairChange(index);
        }


        mapInput(curInput:ReferenceRelaysUTXOInput, referenceTxDetails:ReferenceRelaysTxDetailsData):VOTransaction {
            var newVOTransaction = new VOTransaction(null);
            if(isNaN(referenceTxDetails.time_utc)){
                // console.error(' referenceTxDetails.time_utc ' + referenceTxDetails.time_utc);
                referenceTxDetails.time_utc = Math.round(Date.now()/1000);
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
        }

        mapOutput(curOutput:ReferenceRelaysUTXOOutput, referenceTxDetails:ReferenceRelaysTxDetailsData):VOTransaction {
            if(isNaN(referenceTxDetails.time_utc)){
                // console.error(' referenceTxDetails.time_utc ' + referenceTxDetails.time_utc);
                referenceTxDetails.time_utc = Math.round(Date.now()/1000);
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
        }

        getVOTransactionsForTxListWithDetails(txList:VORelayedTransactionList[]):{index:number, addresses:string[], transactions:VOTransaction[], relayedTransactionListArray:VORelayedTransactionList[]} {
            var outAddresses:string[] = [];
            var outTransactions:VOTransaction[] = [];

            mainloop:
            for (var i = 0; i < txList.length; i++) {
                var curTxList = txList[i];

                outAddresses.push(curTxList.address);

                var allReferenceRelayTxKeys = Object.keys(curTxList.txListDict);

                for (var j = 0; j < allReferenceRelayTxKeys.length; j++) {
                    var curReferenceTxDetails:ReferenceRelaysTxDetailsData = curTxList.txListDict[allReferenceRelayTxKeys[j]];

                    if(!curReferenceTxDetails || !curReferenceTxDetails.inputs){
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
        }

        getTransactionalDataFromTxList(txList):JQueryDeferred<{index:number, addresses:string[], transactions:VOTransaction[], relayedTransactionListArray:VORelayedTransactionList[]}> {
            var mainRequestDeferred:JQueryDeferred<{index:number, addresses:string[], transactions:VOTransaction[], relayedTransactionListArray:VORelayedTransactionList[]}> = $.Deferred();

            var txDetailsDataRequest:TransactionDetailsBlockchain = new this._cryptoMethods['transactionDetails']();

            txDetailsDataRequest.initialize(this.name, this._coinType, this._relayManager);

            var promise:JQueryPromise<any> = txDetailsDataRequest.loadTxDetails(txList);

            promise.done((txList:VORelayedTransactionList[]) => {
                var VOTransactionList:{index:number, addresses:string[], transactions:VOTransaction[], relayedTransactionListArray:VORelayedTransactionList[]} = this.getVOTransactionsForTxListWithDetails(txList);

                mainRequestDeferred.resolve(VOTransactionList);
            });

            return mainRequestDeferred;
        }



        getUTXODataFromTxList(txList:VORelayedTransactionList[]):JQueryDeferred<VORelayedTransactionList[]> {

            var utxoRequestDeferred:JQueryDeferred<VORelayedTransactionList[]> = $.Deferred();

            var utxoListRequest:UTXOsBitcoin = new this._cryptoMethods['utxos']();

            utxoListRequest.initialize(this.name, this._coinType, this._relayManager);

            utxoListRequest.loadUTXOsData(txList).done((txList:VORelayedTransactionList[]) => {

                utxoRequestDeferred.resolve(txList);
            });

            return utxoRequestDeferred;
        }

        restoreHistory(receive_change:string):JQueryDeferred<{index:number,addresses:string[], transactions:VOTransaction[], relayedTransactionListArray:VORelayedTransactionList[]}> {


            var mainRequestDeferred:JQueryDeferred<{index:number, addresses:string[], transactions:VOTransaction[], relayedTransactionListArray:VORelayedTransactionList[]}> = $.Deferred();


            var txListRequest:TransactionListBlockchain = new this._cryptoMethods['transactionList'](this._coin_HD_index, this.generator, this.options);



            txListRequest.initialize(this.name, this._coinType, this._relayManager);

            txListRequest.restoreHistory(receive_change).done((txList:VORelayedTransactionList[]) => {


                // console.warn(txListRequest.getAddresses());
                //vladedit previous respond contained extra addresses (+20)
                // did a hack to get addresses from TransactionListBitcoin
                //TODO remove extra addresses from next calls

                var addresses:string[] = txListRequest.getAddresses();


                var promise:JQueryPromise<any> = this.getUTXODataFromTxList(txList);


                promise.done((txListWithUTXOs:VORelayedTransactionList[]) => {

                    this.getTransactionalDataFromTxList(txListWithUTXOs).done((transactionalData:{index:number, addresses:string[], transactions:VOTransaction[], relayedTransactionListArray:VORelayedTransactionList[]}) => {

                        transactionalData.addresses = addresses;

                        mainRequestDeferred.resolve(transactionalData);


                    }).fail(err=>mainRequestDeferred.reject(err));
                }).fail(err=>mainRequestDeferred.reject(err));
            }).fail(err=>mainRequestDeferred.reject(err));


            return mainRequestDeferred;
        }


        /////////////////////////////////////////////////////


        downloadTransactionsDetails(txList):JQueryDeferred<any> {
            let promise: JQueryDeferred<any> = $.Deferred();


            this.getUTXODataFromTxList(txList).done((txListWithUTXOs: VORelayedTransactionList[]) => {

                this.getTransactionalDataFromTxList(txListWithUTXOs)
                    .done((transactionalData: {index: number, addresses: string[], transactions: VOTransaction[], relayedTransactionListArray: VORelayedTransactionList[]}) => {

                        promise.resolve(transactionalData);
                    });
            });
            ;
            return promise;
        }

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
        downloadTransactionsUnspent(addresses:string[]):JQueryDeferred<{result:any[],utxos:VOTransactionUnspent[]}> {

            var deferred:JQueryDeferred<{result:any[], utxos:VOTransactionUnspent[]}> = $.Deferred();

            if (addresses.length === 0) {
                deferred.resolve({result: [], utxos: []});
                return deferred;
            }

            let i = 0;
            let relayManager = this._relayManager;
            let address:string = addresses[i];

            let out:any[] = [];
            let utxos:VOTransactionUnspent[] = [];


            let onDataDownloaded = function(status:string, data:any) {
                for (let addr in data) {
                    let ar:any[] = data[addr];
                    utxos = utxos.concat(ServiceMappers.mapTransactionsUnspent(ar, addr));
                }

                // utxos.push(new VOAddressUnspent(str, data[str]));


                out.push(data);

                i++;
                if (i >= addresses.length) {


                    deferred.resolve({result: out, utxos: utxos})
                    return;
                }

                address = addresses[i];

                setTimeout(getHext, 100);

                // console.log(arguments);
            };


            //console.warn(' downloadTransactionsUnspent  ' + addresses.length);

            let getHext = function():void {
                relayManager.getUTXO(address, onDataDownloaded);
            };

            getHext();

            return deferred;
        }


        downloadTransactions(addresses:string[]):JQueryDeferred<VOTransaction[]> {
            var deffered:JQueryDeferred<any> = $.Deferred();

            var txListRequest:TransactionListBlockchain = new this._cryptoMethods['transactionList'](this._coin_HD_index,this.generator, this.options);

            txListRequest.initialize(this.name, this._coinType, this._relayManager);


            txListRequest.getNextAddress = function() {
                var address:string = addresses.pop()
                if (addresses.length == 0) {
                    txListRequest.setTheEnd();
                }
                return address;

            }


            txListRequest.restoreHistory('nothing').done((txList:VORelayedTransactionList[]) => {

                this.getUTXODataFromTxList(txList).done((txListWithUTXOs:VORelayedTransactionList[]) => {

                    this.getTransactionalDataFromTxList(txListWithUTXOs)
                        .done((transactionalData:{index:number, addresses:string[], transactions:VOTransaction[], relayedTransactionListArray:VORelayedTransactionList[]}) => {

                        deffered.resolve(transactionalData);
                        });
                });
            });

            return deffered;
        }



        downloadBalances(addresses:string[]):JQueryDeferred<VOBalance[]> {
            var d:JQueryDeferred<VOBalance[]> = $.Deferred();
            var balanceRequestManager:BalancesBlockchain = new this._cryptoMethods['balances'](this.options);


            balanceRequestManager.initialize(this.name, this._coinType, this._relayManager);

            var promise:JQueryPromise<any> = balanceRequestManager.loadBalances(addresses);
            promise.done(res => d.resolve(res)).fail(err => d.reject(err));

            return d;
        }


        downloadTransactionsForAddress(address:string):JQueryPromise<VOTransaction[]> {
            console.log("warning :: MainBlockchain :: downloadTransactionsForAddress :: this function is undefined");

            // var url:string = this.urlTransactions.replace('{{address}}', address);
            // return $.getJSON(url).then(res => {
            //     var result = res.result;
            //     return ServiceMappers.mapEtherTransactions(result, address);
            // });
            return null;
        }


        getMiningFees():number {
            console.error(this.name + ' override this function ');
            return -1 //20,000,000
        }
    }
}