///<reference path="transaction_list_zcash.ts"/>
///<reference path="balances_zcash.ts"/>
///<reference path="transaction_details_zcash.ts"/>
///<reference path="utxos_zcash.ts"/>

///<reference path="../blockchain/main_blockchain.ts"/>

declare var RelayManagerZCash;

module jaxx {
    export class CryptoZCash extends MainBlockchain {
        _name = "ZCash";
        _generator:any;

        constructor(coinType:number, coin_HD_index:number, service:JaxxAccountService) {
            super(coinType, coin_HD_index, service);
        }

        init():void {

            this._cryptoMethods['transactionList'] = TransactionListZCash;
            this._cryptoMethods['transactionDetails'] = TransactionDetailsZCash;
            this._cryptoMethods['utxos'] = UTXOsZCash;
            this._cryptoMethods['balances'] = BalancesZCash;
        }

        initialize():void {

            this._generator = new GeneratorBlockchain(this._name, this._coinType, this._coin_HD_index);

            this._relayManagerImplementation = new RelayManagerZCash();

            this._relayManager = new RelayManager();

            this._relayManager.initialize(this._relayManagerImplementation);
        }

/*

        mapInput(curInput:ReferenceRelaysUTXOInput, referenceTxDetails:ReferenceRelaysTxDetailsData):VOTransaction {
            if(isNaN(referenceTxDetails.time_utc)){
               // console.error(' referenceTxDetails.time_utc ' + referenceTxDetails.time_utc);
                referenceTxDetails.time_utc = Math.round(Date.now()/1000);
            }
            var newVOTransaction = new VOTransaction(null);
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

            if(isNaN(referenceTxDetails.time_utc)) {
                referenceTxDetails.time_utc = Math.round(Date.now()/1000);
               // console.warn(' referenceTxDetails.time_utc ' + referenceTxDetails.time_utc);
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

            for (var i = 0; i < txList.length; i++) {
                var curTxList = txList[i];

                outAddresses.push(curTxList.address);

                var allReferenceRelayTxKeys = Object.keys(curTxList.txListDict);


                for (var j = 0; j < allReferenceRelayTxKeys.length; j++) {


                    var curReferenceTxDetails:ReferenceRelaysTxDetailsData = curTxList.txListDict[allReferenceRelayTxKeys[j]];


                    if(!curReferenceTxDetails.inputs){
                        console.error(' no curReferenceTxDetails.inputs   ', allReferenceRelayTxKeys);
                        continue;
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
*/


/*
     getTransactionalDataFromTxList(txList):JQueryDeferred<{index:number, addresses:string[], transactions:VOTransaction[], relayedTransactionListArray:VORelayedTransactionList[]}> {
     var mainRequestDeferred:JQueryDeferred<{index:number, addresses:string[], transactions:VOTransaction[], relayedTransactionListArray:VORelayedTransactionList[]}> = $.Deferred();

     var txDetailsDataRequest:TransactionDetailsBlockchain = new TransactionDetailsBlockchain();//this._cryptoMethods['transactionDetails']();

     txDetailsDataRequest.initialize(this.name, this._coinType, this._relayManager);

     var promise:JQueryPromise<any> = txDetailsDataRequest.loadTxDetails(txList);

     promise.done((txList:VORelayedTransactionList[]) => {

     var VOTransactionList:{index:number, addresses:string[], transactions:VOTransaction[], relayedTransactionListArray:VORelayedTransactionList[]} = this.getVOTransactionsForTxListWithDetails(txList);

     mainRequestDeferred.resolve(VOTransactionList);
     });

     return mainRequestDeferred;
     }


     downloadTransactions(addresses:string[]):JQueryDeferred<VOTransaction[]> {
     var deffered:JQueryDeferred<any> = $.Deferred();

     var txListRequest:TransactionListBlockchain = new this._cryptoMethods['transactionList'](this._coin_HD_index,this.generator);

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

     //  console.warn(transactionalData.transactions);

     deffered.resolve(transactionalData);
     });
     });
     });

     return deffered;
     }*/

/*



        downloadBalances(addresses:string[]):JQueryDeferred<VOBalance[]> {
            let d:JQueryDeferred<VOBalance[]> = $.Deferred();

            let batch:string[][] = Utils.splitInCunks(addresses, 50);

            let parserName:string = 'mapBalancesCoinfabric';
            let url:string = 'https://api.jaxx.io/api/zec/balance/{{addresses}}';

            let parserFun:Function = ServiceMappers[parserName];
            if(typeof parserFun !=='function'){
                console.error('downloadBalances heed function ' + parserName);
                d.reject({error:1003,message:'downloadBalances heed function ' + parserName});
                return d;
            }

            let reg:any ='{{addresses}}';


            let i:number = -1;

            let result:VOBalance[] = [];

            let goNext = function(){

                i++
                if(i >= batch.length){
                  //  console.warn('total balances '+ result.length)
                    d.resolve(result);
                    return
                }

                url = url.replace(reg, addresses.toString());
                console.log(url);
                $.getJSON(url).done(res=>{

                    let r:VOBalance[] = parserFun(res);
                    result = result.concat(r);

                    setTimeout(goNext(), 30);

                }).fail(err=>d.reject(err));




            }

            goNext();

            return d;
        }
*/

/*

        downloadTransactionsUnspent(addresses:string[]):JQueryDeferred<{result:any[],utxos:VOTransactionUnspent[]}> {

            console.log(addresses);
            var deferred:JQueryDeferred<{result:any[], utxos:VOTransactionUnspent[]}> = $.Deferred();

            if (addresses.length === 0) {
                deferred.resolve({result: [], utxos: []});
                return deferred;
            }

            let url = "https://api.jaxx.io/api/zec/transactionParams/{{addresses}}";
            let parserName:string = 'mapUTXOsCoinfabrik';

            let parserFn:Function = ServiceMappers[parserName];


            if(typeof parserFn !== 'function') {
                console.error(parserName + ' is not a function');
                deferred.reject({error:1003,message:parserName + ' is not a function'});
                return
            }

            let reg:any = '{{addresses}}';
            url= url.replace(reg, addresses.toString());
           console.log(url);

            $.getJSON(url).done((res)=>{
               console.log(res);
                let utxos:VOutxo[] = parserFn(res);
                console.log(utxos);

                deferred.resolve({result:utxos,utxos:null});
            }).fail(err=>deferred.reject(err));

            return deferred;
        }
*/



/*
        getTransactionsOfAddresses(addresses:string[]):JQueryDeferred<VOTransaction[]>{
            let promise:JQueryDeferred<VOTransaction[]> = $.Deferred();

            return promise;
        }*/


        restoreHistory(receive_change:string):JQueryDeferred<HistoryResult2>{

            let deferred:JQueryDeferred<HistoryResult2> = $.Deferred();

            var txListRequest:TransactionListBlockchain = new TransactionListBlockchain(this._coin_HD_index, this.generator);//this._cryptoMethods['transactionList'](this._coin_HD_index, this.generator);


            txListRequest.initialize(this.name, this._coinType, this._relayManager);

            txListRequest.restoreHistory(receive_change).done((txList:VORelayedTransactionList[]) => {

                //console.warn(receive_change,txList);


                // console.warn(txListRequest.getAddresses());
                //vladedit previous respond contained extra addresses (+20)
                // did a hack to get addresses from TransactionListBitcoin
                //TODO remove extra addresses from next calls

                var addresses:string[] = txListRequest.getAddresses();


                var promise:JQueryPromise<any> = this.getUTXODataFromTxList(txList);


                promise.done((txListWithUTXOs:VORelayedTransactionList[]) => {

                    this.getTransactionalDataFromTxList(txListWithUTXOs).done((transactionalData:{index:number, addresses:string[], transactions:VOTransaction[], relayedTransactionListArray:VORelayedTransactionList[]}) => {

                        transactionalData.addresses = addresses;

                        deferred.resolve(transactionalData);


                    }).fail(err=>deferred.reject(err));
                }).fail(err=>deferred.reject(err));
            }).fail(err=>deferred.reject(err));


            return deferred;
        }


        getMiningFees():number {
            return 55000; //20,000,000
        }



    }
}