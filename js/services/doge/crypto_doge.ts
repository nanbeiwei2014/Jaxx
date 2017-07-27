///<reference path="transaction_list_doge.ts"/>
///<reference path="balances_doge.ts"/>
///<reference path="transaction_details_doge.ts"/>
///<reference path="utxos_doge.ts"/>

///<reference path="../blockchain/main_blockchain.ts"/>


module jaxx {


   declare var RelayManagerDoge;

   // declare var RelayManagerDoge;

    export class CryptoDoge extends MainBlockchain {
        name = "Doge";

        constructor(coinType:number, coin_HD_index:number, private service:JaxxAccountService) {
            super(coinType, coin_HD_index, service);


        }

        init():void {
            this._cryptoMethods['transactionList'] = TransactionListDoge;
            this._cryptoMethods['transactionDetails'] = TransactionDetailsDoge;
            this._cryptoMethods['utxos'] = UTXOsDoge;
            this._cryptoMethods['balances'] = BalancesDoge;
        }

        initialize():void {

            this.generator = new GeneratorBlockchain(this.name, this._coinType, this._coin_HD_index);

            this._relayManagerImplementation = new RelayManagerDoge();

            this._relayManager = new RelayManager();
            //console.warn(this._relayManagerImplementation);


            this._relayManager.initialize(this._relayManagerImplementation);
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



      /*  downloadBalances(addresses:string[]):JQueryDeferred<VOBalance[]> {

            var promise:JQueryDeferred<VOBalance[]> = $.Deferred();

            //var balanceRequestManager:BalancesBlockchain = new this._cryptoMethods['balances']();

            let req:BalancesBlockchain = new BalancesBlockchain();
            req.initialize(this.service.name,this._coinType,this._relayManager);
            req.parse = function(resp: any[]): VOBalance[] {
                // console.log(resp);
                // if (resp && resp.result) {
                var t: number = Date.now();

                if (!Array.isArray(resp)) {
                    resp = [resp];
                }

                 console.log(resp);

                return resp.map(function(item) {
                    if(item){
                        let returnVO =  new VOBalance({
                            id: item.address,
                            balance: item.balance ?item.balance*1e8 : 0,
                            timestamp: t
                        });

                        return returnVO;
                    }else console.error(' item is null ', resp);
                })
                //}
                // this.onError(' no-data ');

            }

           // balanceRequestManager.initialize(this.name, this._coinType, this._relayManager);

            var promise2:JQueryPromise<any> = req.loadBalances(addresses);

            //console.log('  downloadBalances   ', addresses);


            promise2.done(res => {

               console.log(' downloaded balances   ' , res);

                promise.resolve(res);

            }).fail(err => promise.reject(err));

            return promise;
        }
*/

    }
}