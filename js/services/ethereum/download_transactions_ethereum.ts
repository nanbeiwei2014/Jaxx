///<reference path="../../com/models.ts"/>
///<reference path="../../com/Utils2.ts"/>
///<reference path="../service-mapper.ts"/>
///<reference path="../blockchain/download_transactions_blockchain.ts"/>

module jaxx{
    export class DownloadTransactionsEthereum extends DownloadTransactionsBlockchain{

        constructor(public name:string){
            super(name);

        }

        init():void{
            this.url = 'https://api.etherscan.io/api?module=account&action=txlist&address={{address}}&tag=latest' +  this.apiKey;
        }

        parse(result:any,address:string):VOTransaction[]{
            //console.log(address + ' has ' + result.result.length );
            return ServiceMappers.mapEtherTransactions(result.result,address);
        }


    }
}