///<reference path="transaction_list_bitcoin.ts"/>
///<reference path="balances_bitcoin.ts"/>
///<reference path="transaction_details_bitcoin.ts"/>
///<reference path="utxos_bitcoin.ts"/>

///<reference path="../blockchain/main_blockchain.ts"/>

declare var RelayManagerBitcoin;

module jaxx {
    export class CryptoBitcoin extends MainBlockchain {
        name = "Bitcoin";
        miningFee:number = 100000;
        currentHookIndex:number = 0;

        relay:string[] = ['coinfabrik','blockr'];

        options:any = {
            APIs:{
                'coinfabrik':{
                    unspent:{
                        url:'http://api.jaxx.io:2082/insight-api/addrs/{{addresses}}/utxo',
                        parser:'parseUTXOsCoinfabrikBTC'
                    }
                },
                'blockr':{
                    unspent:{
                        url:'http://btc.blockr.io/api/v1/address/unspent/{{addresses}}?unconfirmed=1',
                        parser:'parseUTXOsBlocker'
                    }
                }
            }

        };


        constructor(coinType:number, coin_HD_index:number, service:JaxxAccountService) {
            super(coinType, coin_HD_index, service);

        }


        init():void {
            this._cryptoMethods['transactionList'] = TransactionListBitcoin;
            this._cryptoMethods['transactionDetails'] = TransactionDetailsBitcoin;
            this._cryptoMethods['utxos'] = UTXOsBitcoin;
            this._cryptoMethods['balances'] = BalancesBitcoin;
            this.generator = new GeneratorBlockchain(this._service.name, this._coinType, this._coin_HD_index);
            this._relayManagerImplementation = new RelayManagerBitcoin();

            this._relayManager = new RelayManager();

            this._relayManager.initialize(this._relayManagerImplementation);

            Registry.application$.on(Registry.BITCOIN_MINING_FEE,(evt, fee)=>this.miningFee = fee);
        }




        utxosAttempts:number;

/*

        _downloadTransactionsUnspent(addresses:string[], onSuccess:Function, onError:Function):void{
            this.utxosAttempts++;
            if(this.utxosAttempts > 5){
                onError({error:200, message:'no connection to any services'});
            }

            if(this.currentHookIndex >= this.relay.length) this.currentHookIndex = 0;
            let hookName:string = this.relay[this.currentHookIndex];
            let API = this.options.APIs[hookName];
            let APIunspent:{url:string, parser:string} = API.unspent ;
          //  console.log(unspentHook);
            let url = APIunspent.url; //"https://api.jaxx.io/api/zec/transactionParams/{{addresses}}";
            let parserName:string = APIunspent.parser;// 'mapUTXOsCoinfabrik';
            let parserFn:Function = ServiceMappers[parserName];

            if(typeof parserFn !== 'function') {
                console.error(parserName + ' is not a function');
                onError({error:1003, message:parserName + ' is not a function'});
                return
            }

            let reg:any = '{{addresses}}';
            url= url.replace(reg, addresses.toString());
           // console.log(url);

            $.getJSON(url).done((res)=>{
              //   console.log(res);
                let utxos:VOutxo[] = parserFn(res);
              //  console.log(utxos);
                onSuccess(utxos);
            }).fail(err=>{
                this.currentHookIndex++;
                this._downloadTransactionsUnspent(addresses,onSuccess,onError);
            });
        }
*/

       /* downloadTransactionsUnspent(addresses:string[]):JQueryDeferred<{result:any[],utxos:VOTransactionUnspent[]}> {

            var deferred:JQueryDeferred<{result:any[], utxos:VOTransactionUnspent[]}> = $.Deferred();

           // console.log(addresses);

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


        getMiningFees():number{

            //return this.miningFee;
            return CryptoBitcoin.getMiningFeesStatic();
        }

        static getMiningFeesStatic():number{
            return wallet.getPouchFold(COIN_BITCOIN).getCurrentMiningFee()
        }

    }
}