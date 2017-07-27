///<reference path="transaction_list_litecoin.ts"/>
///<reference path="balances_litecoin.ts"/>
///<reference path="transaction_details_litecoin.ts"/>
///<reference path="utxos_litecoin.ts"/>

///<reference path="../blockchain/main_blockchain.ts"/>


module jaxx {

    declare var RelayManagerLitecoin;

    export class CryptoLitecoin extends MainBlockchain {
        _name = "Litecoin";
        _generator:any;

        currentHookIndex:number = 0;
        relay:string[] = ['coinfabrik','blockr'];
        options:any;


        constructor(coinType:number, coin_HD_index:number, service:JaxxAccountService, options:any) {

            super(coinType, coin_HD_index, service, options);
            if(options){
                for(let str in options) this.options[str] = options[str];
            }

           // this.options = options;
        }

        init():void {

            this._cryptoMethods['transactionList'] = TransactionListLitecoin;
            this._cryptoMethods['transactionDetails'] = TransactionDetailsLitecoin;
            this._cryptoMethods['utxos'] = UTXOsLitecoin;
            this._cryptoMethods['balances'] = BalancesLitecoin;
            this.options.delayRequest = 500;

        }

        initialize():void {

            this._generator = new GeneratorBlockchain(this._name, this._coinType, this._coin_HD_index);
            this._relayManagerImplementation = new RelayManagerLitecoin();
            this._relayManager = new RelayManager();
            this._relayManager.initialize(this._relayManagerImplementation);
        }



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

        //    console.log(addresses.toString());

            let onDataDownloaded = function(status:string, data:any) {
                for (let addr in data) {
                    let ar:any[] = data[addr];
                    utxos = utxos.concat(ServiceMappers.mapTransactionsUnspent(ar, addr));
                }

                // utxos.push(new VOAddressUnspent(str, data[str]));


               // console.log(data);
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


        utxosAttempts:number;

      /*  _downloadTransactionsUnspent(addresses:string[], onSuccess:Function, onError:Function):void{

            this.utxosAttempts++;
            if(this.utxosAttempts > 5){
                onError({error:200, message:'no connection to any services'});
            }

            if(this.currentHookIndex >= this.relay.length) this.currentHookIndex = 0;
            let hookName:string = this.relay[this.currentHookIndex];
            let hook = this.options.hooks[hookName];
            let unspentHook:{url:string, parser:string} = hook.unspent ;
            let url = unspentHook.url; //"https://api.jaxx.io/api/zec/transactionParams/{{addresses}}";
            let parserName:string = unspentHook.parser;// 'mapUTXOsCoinfabrik';
            let parserFn:Function = ServiceMappers[parserName];
            if(typeof parserFn !== 'function') {
                console.error(parserName + ' is not a function');
                onError({error:1003, message:parserName + ' is not a function'});
                return
            }

            let reg:any = '{{addresses}}';

            url= url.replace(reg, addresses.toString());
            //console.log(url);

            $.getJSON(url).done((res)=>{
               // console.log(res);
                let utxos:VOutxo[] = parserFn(res);
               // console.log(utxos);
                onSuccess(utxos);
            }).fail(err=>{
                this.currentHookIndex++;
                this._downloadTransactionsUnspent(addresses,onSuccess,onError);
            });

        }

        downloadTransactionsUnspent(addresses:string[]):JQueryDeferred<{result:any[],utxos:VOTransactionUnspent[]}> {


            var deferred:JQueryDeferred<{result:any[], utxos:VOTransactionUnspent[]}> = $.Deferred();
            this.utxosAttempts = 0;
            this.currentHookIndex = 0;

            if (addresses.length === 0) {
                deferred.resolve({result: [], utxos: []});
                return deferred;
            }

            this._downloadTransactionsUnspent(addresses, utxos=>deferred.resolve({result:utxos, utxos:null}), err=>deferred.reject(err));


            return deferred;
        }

*/




        downloadBalances(addresses:string[]):JQueryDeferred<VOBalance[]> {
            var d:JQueryDeferred<VOBalance[]> = $.Deferred();
            var balanceRequestManager:BalancesBlockchain = new this._cryptoMethods['balances'](this.options);
            balanceRequestManager.options.delayRequest = this.options.delayRequest;

            balanceRequestManager.initialize(this.name, this._coinType, this._relayManager);

            var promise:JQueryPromise<any> = balanceRequestManager.loadBalances(addresses);
            promise.done(res => d.resolve(res)).fail(err => d.reject(err));

            return d;
        }



        restoreHistory(receive_change:string):JQueryDeferred<{index:number,addresses:string[], transactions:VOTransaction[], relayedTransactionListArray:VORelayedTransactionList[]}> {



            var mainRequestDeferred:JQueryDeferred<{index:number, addresses:string[], transactions:VOTransaction[], relayedTransactionListArray:VORelayedTransactionList[]}> = $.Deferred();


            var txListRequest:TransactionListBlockchain = new this._cryptoMethods['transactionList'](this._coin_HD_index, this.generator, this.options);



            txListRequest.initialize(this.name, this._coinType, this._relayManager);
            txListRequest.options.delayRequest = this.options.delayRequest;

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


        downloadTransactions(addresses:string[]):JQueryDeferred<VOTransaction[]> {
            var deffered:JQueryDeferred<any> = $.Deferred();

            var txListRequest:TransactionListBlockchain = new  TransactionListBlockchain(this._coin_HD_index,this.generator, this.options);//this._cryptoMethods['transactionList'](this._coin_HD_index,this.generator);

            txListRequest.initialize(this.name, this._coinType, this._relayManager);

            txListRequest.getNextAddress = function() {
                var address:string = addresses.pop()
                if (addresses.length == 0) {
                    txListRequest.setTheEnd();
                }
                return address;

            }



            txListRequest.restoreHistory('nothing').done((txList:VORelayedTransactionList[]) => {

               // console.log(txList);

                this.getUTXODataFromTxList(txList).done((txListWithUTXOs:VORelayedTransactionList[]) => {

                    this.getTransactionalDataFromTxList(txListWithUTXOs)

                        .done((transactionalData:{index:number, addresses:string[], transactions:VOTransaction[], relayedTransactionListArray:VORelayedTransactionList[]}) => {
                            deffered.resolve(transactionalData);
                        });
                });
            });

            return deffered;
        }






        /* downloadBalances(addresses:string[]):JQueryDeferred<VOBalance[]> {


             var d:JQueryDeferred<VOBalance[]> = $.Deferred();
             var balanceRequestManager:BalancesBlockchain = new this._cryptoMethods['balances']();

             balanceRequestManager.initialize(this.name, this._coinType, this._relayManager);

             var promise:JQueryPromise<any> = balanceRequestManager.loadBalances(addresses);
             promise.done(res => d.resolve(res)).fail(err => d.reject(err));

             return d;
         }
 */



        getMiningFees():number {
            return 55000; //20,000,000
        }
    }
}