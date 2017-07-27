///<reference path="../../com/models.ts"/>
///<reference path="../../com/Utils2.ts"/>
///<reference path="../service-mapper.ts"/>
///<reference path="../blockchain/download_transactions_blockchain.ts"/>

module jaxx{
    export class DownloadTransactoionsBlockr extends DownloadTransactionsBlockchain{

        constructor(public name:string){
            super(name);

        }
        init():void{
            this.url =  'http://btc.blockr.io/api/v1/address/txs/{{address}}';
        }

        parse(result:any,address:string):VOTransaction[]{
            if(result &&  result.data && result.data.txs){
                var ar:any[] = result.data.txs;
                return ServiceMappers.mapBlockrTransactions(ar,address);
            }
            return null;
        }


    }
}