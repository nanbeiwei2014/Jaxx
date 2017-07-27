///<reference path="../../com/models.ts"/>
///<reference path="../../com/Utils2.ts"/>
///<reference path="../service-mapper.ts"/>

module jaxx{
    export class CheckTransactions{
        trs:VOTransaction;
        apiKey:string = '';


        destroy():void{
            this.trs = null;
        }


        private checkAddress(address:string,trsHex:string,promise:JQueryDeferred<VOTransaction[]>):void{

            var url  = 'https://api.etherscan.io/api?module=account&action=txlist&address=' +
                '' + address + '&tag=latest' + this.apiKey;

            $.get(url).done((res) => {
                console.log('  checkAddress    ' + address,res);
                if(res.result && res.result.length) {
                    var trs = ServiceMappers.mapEtherTransactions(res.result, address);
                    var search:VOTransaction[] = trs.filter(function (item:VOTransaction) {
                        return (item.id == trsHex);
                    })

                    if(search.length){
                        promise.resolve(search);
                        this.destroy();
                        return;
                    }
                }

                setTimeout(()=>this.checkAddress(address,trsHex,promise),10000);
            }).fail((err) => {
                promise.reject(err)
                console.error(err)
            })
        }

        checkTransaction(trs:VOTransaction, apiKey): JQueryDeferred<VOTransaction[]>{
            this.apiKey = apiKey;
            this.trs = trs;
            var address:string = trs.to.toLowerCase();
            var promise:JQueryDeferred<VOTransaction[]> = $.Deferred();
            this.checkAddress(address,trs.id,promise);
            return promise;
        }

    }

}