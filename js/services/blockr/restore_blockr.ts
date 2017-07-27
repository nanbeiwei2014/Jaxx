///<reference path="../../com/models.ts"/>
///<reference path="../../com/Utils2.ts"/>
///<reference path="../service-mapper.ts"/>
///<reference path="../blockchain/transaction_details_blockchain.ts"/>


module jaxx{

    export class RestoreBlockr extends RestoreHistory{

        constructor(public coin_HD_index:number, public generator:any){
            super(coin_HD_index, generator);
        }

        parse(result:any,address:string):VOTransaction[]{
            if(result &&  result.data && result.data.txs){
                var ar:any[] = result.data.txs;
                return ServiceMappers.mapBlockrTransactions(ar,address);
            }
            return null;
        }

        init():void{

            this.url =  'http://btc.blockr.io/api/v1/address/txs/{{address}}';
            this.name = this.generator.name;
        }


    }

}