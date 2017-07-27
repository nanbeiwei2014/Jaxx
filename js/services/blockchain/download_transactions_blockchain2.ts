///<reference path="../../com/models.ts"/>
///<reference path="../../com/Utils2.ts"/>
///<reference path="../service-mapper.ts"/>

module jaxx{
    export class DownloadTransactionsBlockchain2 implements IMobileRequest{
        requestsDelay:number = 200;
        errorDelay:number = 10000;
        errors:number;
        maxErrors:number = 20;
        progress:number;
        i:number;
        apiKey:string = '';
        url:string //= 'https://api.etherscan.io/api?module=account&action=txlist&address={{address}}&tag=latest';
        currentRequest: JQueryXHR;
        voaddresses:VOAddress[];
       // addresses:string[];
      //  _resolveTxList:VOTransaction[];
       // deferred:JQueryDeferred<VOTransaction[]>;
        deferred2:JQueryDeferred<VOAddress[]>;


        onHold:boolean;

        constructor(public name:string){
            this.url += this.apiKey;
            this.init();
        }
        init():void{

        }
        abort():any{

        }

        destroy():void{
            if(this.currentRequest){
                this.currentRequest.abort();
                this.currentRequest = null;
            }
            this.voaddresses = null;

           // this.addresses = null;
           // this.deferred = null;
            this.deferred2 = null;
            this.progress = 0;
        }

        reset():void{
            this.i=-1;
            this.voaddresses = [];

           // this._resolveTxList = [];
            this.errors = 0;
            this.requestsDelay = 200;
            this.progress = 0;
        }

        wait(){
            this.onHold = true;
        }

        resume(){
            this.onHold = false;
            this.loadNextAddress();
        }

        parse(result:any,address:string):VOTransaction[]{
            console.error(' override this method');
            return ServiceMappers.mapEtherTransactions(result.result,address);
        }

        onError(num:number,message:string):void{
            console.warn(this.errors + '   error  '+message);

            this.errors++;
            if(this.errors > this.maxErrors){
                this.deferred2.reject({
                    error:num,
                    message:message,

                });
                setTimeout(()=>this.destroy(),100);
                return;
            }
            this.i --;
            setTimeout(()=>{ this.loadNextAddress()},10000);
        }


        downloadTransactions2(voaddresses: VOAddress[]):JQueryDeferred<VOAddress[]>{
            this.deferred2 = $.Deferred();
            var transactions:VOAddress[] = [];
            this.reset();
            //this.addresses = null;
            this.voaddresses = voaddresses;
            this.loadNextAddress();
            return this.deferred2;
        }

        loadNextAddress():void{
            if(this.onHold) return;
            this.i++;
            //this.progress = 1 + Math.round(100 * this.i/this.addresses.length);
            //this.deferred.notify(this.progress);

            var n:number = this.voaddresses.length;
            if(this.i >= n){

                this.deferred2.resolve(this.voaddresses);

                setTimeout(()=>this.destroy(),100);
                this.destroy();
                return;
            }

           var address:string = this.voaddresses[this.i].id;


            var url  = this.url.replace('{{address}}',address);
           // console.log(this.name + ' '+url);

            this.currentRequest = $.getJSON(url);
            this.currentRequest.done((res)=>{

                if(res.result){
                    var transactions = this.parse(res,address);
                    if(this.voaddresses) this.voaddresses[this.i].transactions = transactions;

                    setTimeout(()=>this.loadNextAddress(), this.requestsDelay);

                } else this.onError(1001,url + res.toString());

            }).fail((err)=>this.onError(1404,url +' ' + err.toString()));
        }
    }
}