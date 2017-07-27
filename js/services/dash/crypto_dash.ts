///<reference path="transaction_list_dash.ts"/>
///<reference path="balances_dash.ts"/>
///<reference path="transaction_details_dash.ts"/>
///<reference path="utxos_dash.ts"/>

///<reference path="../blockchain/main_blockchain.ts"/>

declare var RelayManagerDash;

module jaxx {
    export class CryptoDash extends MainBlockchain {
        name = "Dash";

        constructor(coinType:number, coin_HD_index:number, service:JaxxAccountService) {
            super(coinType, coin_HD_index, service);
        }

        init():void {
            this._cryptoMethods['transactionList'] = TransactionListDash;
            this._cryptoMethods['transactionDetails'] = TransactionDetailsDash;
            this._cryptoMethods['utxos'] = UTXOsDash;
            this._cryptoMethods['balances'] = BalancesDash;
        }

        initialize():void {
            this.generator = new GeneratorBlockchain(this.name, this._coinType, this._coin_HD_index);

            this._relayManagerImplementation = new RelayManagerDash();

            this._relayManager = new RelayManager();

            this._relayManager.initialize(this._relayManagerImplementation);

            this._relayManager.initialize(this._relayManagerImplementation);

            g_JaxxApp.setRelays(COIN_DASH, this._relayManager);
        }


       /* downloadTransactions(addresses:string[]):JQueryDeferred<VOTransaction[]> {
            var deffered: JQueryDeferred<any> = $.Deferred();
            console.log(addresses);

            var txListRequest: TransactionListBlockchain = new this._cryptoMethods['transactionList'](this._coin_HD_index, this.generator, this.options);

            txListRequest.initialize(this.name, this._coinType, this._relayManager);


            txListRequest.getNextAddress = function () {
                var address: string = addresses.pop()
                if (addresses.length == 0) {
                    txListRequest.setTheEnd();
                }
                return address;

            }

            txListRequest.restoreHistory('nothing').done((txList:VORelayedTransactionList[]) => {

                this.getUTXODataFromTxList(txList).done((txListWithUTXOs:VORelayedTransactionList[]) => {
                    this.getTransactionalDataFromTxList(txListWithUTXOs)
                        .done((transactionalData:{index:number, addresses:string[], transactions:VOTransaction[], relayedTransactionListArray:VORelayedTransactionList[]}) => {
                            console.log(transactionalData);
                            deffered.resolve(transactionalData);
                        });
                });
            });

            return deffered;
        }*/


            getMiningFees():number {
            return 55000; //20,000,000
        }
    }
}