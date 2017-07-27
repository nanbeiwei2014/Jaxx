/**
 * Created by fieldtempus on 2016-11-10.
 */
    ///<reference path="../../com/models.ts"/>
    ///<reference path="../../com/Utils2.ts"/>
    ///<reference path="../service-mapper.ts"/>


module jaxx{
    export class RestoreHistory implements IMobileRequest{
        name:string;
        onDestroyed:Function;
        destroyed:boolean;
        _numberOfTransactionsWithoutHistory:number;
        attempts:number = 10;
        //receive_change:string;
        apiKey:string='';
        requestDelays:number = 200;
        _currentIndex:number = 0;
        addresses:string[];
        transactions:VOTransaction[];
        url:string;
        currentRequest: JQueryXHR;
        onHold:boolean;
        deferred:JQueryDeferred<{index:number, addresses:string[], transactions:VOTransaction[]}>
        receive_change:string;
        progress:number;
        stratIndex:number = 0;
        numberOfTransactionsWithoutHistory:number = 20;


        //@note: @here: for relay managed classes. eventually it will be applicabe to all of the blockchains.
        _relayManager:any = null;

        //@note: @here: for gathering _resolveTxList in a batch.
        _batchSize:number = 20;

        _enableLog:boolean = true;




        constructor(public options:any, public generator:GeneratorBlockchain){
            this.name = options.name;
            this.init();


            Registry.application$.on(Registry.KILL_HISTORY,(evt,name:string)=>{

                console.log(this.name + ' killing history ')
                this.deferred.reject({error:100,message:'process killed'});
                setTimeout(()=>this.destroy(),100);
            })
        }

        initialize(name:string, relayManager:any):void {

        }


        abort():IMobileRequest{
            return this;
        }

        init():void{
           //this.url = 'https://api.etherscan.io/api?module=account&action=txlist&address={{address}}&tag=latest';
            // this.url += this.apiKey;
            // this._name = this.generator.name;
        }

        wait(){
            this.onHold = true;
        }

        resume(){
            this.onHold = false;
            this.loadNextAddress();
        }

        destroy():void{
            if(this.currentRequest){
                this.currentRequest.abort();
                this.currentRequest = null;
            }
            this.addresses = null;
            this.transactions = null;
            this.destroyed = true;
            if(this.onDestroyed)this.onDestroyed();

        }

        reset():void{
            this._currentIndex = this.stratIndex -1;
            this._numberOfTransactionsWithoutHistory = 0;
            this.addresses = [];
            this.transactions = [];
            this.attempts = 10;
            this.requestDelays = 20;
        }

        parse(result:any,address:string):VOTransaction[]{
            if(result.result){
                var ar:any[] = result.result;
                return ServiceMappers.mapEtherTransactions(ar,address);
            }
            return null;

        }

        private timeout:number;
        onError(num:number,url:string,message:string):void{

            console.warn(this.attempts+ '   error '+message);

            this.attempts--;
            if(this.attempts < 0){
                this.deferred.reject({
                    error:num,
                    attempts:this.attempts,
                    message:message,
                    url:url
                });
                this.destroy();
                return;
            }
            this._currentIndex --;
           setTimeout(()=>{ this.loadNextAddress()},10000);
        }


        //@note: @here: @codereview: wondering why this doesn't use the same interface as IRequestServer (which is what restore_ethereum.ts is being called from main_Ethereum.)
        restoreHistory(receive_change:string, startIndex:number = 0):JQueryDeferred<{index:number, addresses:string[], transactions:VOTransaction[]}>{
            //var promise:JQueryDeferred<{index:number,addresses:string[]}>
            console.log('%c '+this.name + ' restoreHistory ' + receive_change,'color:brown');
            this.deferred = $.Deferred();
            this.receive_change = receive_change;
            this.stratIndex = startIndex;
            this.reset();
            setTimeout(() =>this.loadNextAddress(),50);
            return this.deferred;
        }
        //
        loadNextAddress():void{
            if(this.onHold || this.destroyed) return;
            this._currentIndex++;
            this._numberOfTransactionsWithoutHistory++;

            if(this._numberOfTransactionsWithoutHistory > this.numberOfTransactionsWithoutHistory){

                var out:any = {
                    index:this._currentIndex - this.numberOfTransactionsWithoutHistory,
                    addresses:this.addresses.slice(0, this.addresses.length - this.numberOfTransactionsWithoutHistory),
                    transactions:this.transactions
                }
                this.deferred.resolve(out);
                this.destroy();
                return;
            }
            // var receive_change:string = this.receive_change;
            //  console.log('coin_HD_index  ' + this.coin_HD_index + '' +
            // ' ' + this.i +  '  nullcount: '+ this.numberOfTransactionsWithoutHistory + '  node: ' + this.receive_change);

            var address:string  = this.generator.generateAddress(this._currentIndex,this.receive_change);
            //this.addresses.push(address);
            this.addresses[this._currentIndex] = address;


            let url  = this.url.replace('{{address}}',address);

           /// console.log(url);


            this.currentRequest = <JQueryXHR>$.getJSON(url);
            this.currentRequest.done((res) => {
                //console.log(res);
                var transactions = this.parse(res,address);
                if(transactions && transactions.length){
                    this._numberOfTransactionsWithoutHistory = 0;
                    this.transactions = this.transactions.concat(transactions);
                }
                console.log(this.name + ' i '+ this._currentIndex + ' '+ address + '   has '+ transactions.length +' ' +
                    ' transactions ' + this.receive_change);
                setTimeout(()=>{ this.loadNextAddress(); },this.requestDelays);

            }).fail((err)=>this.onError(1404,url,'http error'));

        }
    }

}