///<reference path="../../com/models.ts"/>
///<reference path="../../com/Utils2.ts"/>
///<reference path="../service-mapper.ts"/>

module jaxx{
    export class DownloadTransactionsBlockchain implements IMobileRequest{
        requestsDelay:number = 200;
        errorDelay:number = 10000;
        errors:number;
        maxErrors:number = 20;
        progress:number;
        private _currentIndex:number;
        apiKey:string = '';
        url:string //= 'https://api.etherscan.io/api?module=account&action=txlist&address={{address}}&tag=latest';
        currentRequest: JQueryXHR;
        addresses:string[];
        transactions:VOTransaction[];
        deferred:JQueryDeferred<VOTransaction[]>;
        timeout:number;



        onHold:boolean;

        constructor(public name:string, options?:OptionsCrypto){

            this.url  = options.urlTransactions+this.apiKey;
            this.init();
        }
        init():void{

        }

        abort():IMobileRequest{
            if(this.deferred)this.deferred.reject('aborted');
            if(this.currentRequest)this.currentRequest.abort();
            clearTimeout(this.timeout);
            return this;
        }

        destroy():void{
            this.currentRequest = null;
            this.addresses = null;
            this.deferred = null;

            this.progress = 0;
        }

        reset():void{
            this._currentIndex = -1;

            this.transactions = [];
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
                this.deferred.reject({
                    error:num,
                    message:message,

                });
                setTimeout(()=>this.destroy(),100);
                return;
            }
            this._currentIndex --;
            setTimeout(()=>{ this.loadNextAddress()},10000);
        }

        downloadTransactions(addresses: string[]):JQueryDeferred<VOTransaction[]>{
            this.deferred = $.Deferred();
            var transactions:VOAddress[] = [];
            this.reset();

            this.addresses = addresses;
            this.loadNextAddress();
            return this.deferred;
        }


        loadNextAddress():void{
            if(this.onHold || !this.addresses) return;
            this._currentIndex++;
            this.progress = 1 + Math.round(100 * this._currentIndex/this.addresses.length);
            this.deferred.notify(this.progress);

            var n:number = this.addresses.length;
            if(this._currentIndex >= n ){
                this.deferred.resolve(this.transactions);

               this.timeout = setTimeout(()=>this.destroy(),100);
                this.destroy();
                return;
            }

           var address:string = this.addresses[this._currentIndex];
            var url  = this.url.replace('{{address}}',address);
          //console.log(this.name + ' '+url);


            this.currentRequest = $.getJSON(url);

            this.currentRequest.done((res)=>{

                    var transactions = this.parse(res,address);
                     this.transactions = this.transactions.concat(transactions);

                    this.timeout = setTimeout(()=>this.loadNextAddress(), this.requestsDelay);



            }).fail((err)=>this.onError(1404,url +' ' + JSON.stringify(err)));
        }
    }
}