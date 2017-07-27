///<reference path="../../com/models.ts"/>
///<reference path="../../com/Utils2.ts"/>
///<reference path="../service-mapper.ts"/>
///<reference path="./send_transaction_ethereum.ts"/>
///<reference path="balances_Ethereum.ts"/>
///<reference path="../blockchain/send_test.ts"/>
///<reference path="../blockchain/restore_history.ts"/>

module jaxx{
    export class RestoreEthereum extends RestoreHistory{

      /*  name:string;
        onDestroyed:Function;
        destroyed:boolean;
        numberOfTransactionsWithoutHistory:number;
        attempts:number = 10;
        //receive_change:string;
        apiKey:string='';
        requestDelays:number = 200;
        i:number;
        addresses:string[];
        transactions:VOTransaction[];
        url:string;
        currentRequest: JQueryXHR;
        onHold:boolean;
        deferred:JQueryDeferred<{index:number, addresses:string[], transactions:VOTransaction[]}>
        receive_change:string;
        progress:number;*/

    constructor(options:any, public generator:GeneratorBlockchain){
        super(options, generator);

       // this.init();
    }

    init():void{
        this.url = this.options.urlTransactions; //https://api.etherscan.io/api?module=account&action=txlist&address={{address}}&tag=latest';
        this.url += this.apiKey;
        this.name = this.generator.name;
    }

   /* wait(){
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
        this.i=-1;
        this.numberOfTransactionsWithoutHistory = 0;
        this.addresses = [];
        this.transactions = [];
        this.attempts = 10;
        this.requestDelays = 200;
    }*/

    parse(result:any,address:string):VOTransaction[]{
        if(result.result){
            var ar:any[] = result.result;
            return ServiceMappers.mapEtherTransactions(ar,address);
        }
        return null;
    }

   /* onError(num:number,url:string,message:string):void{

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
        this.i --;
        setTimeout(()=>{ this.loadNextAddress()},10000);
    }


    restoreHistory(receive_change:string):JQueryDeferred<{index:number,addresses:string[]}>{
        //var promise:JQueryDeferred<{index:number,addresses:string[]}>
        console.warn(this.name + ' restoreHistory ' +receive_change );
        this.deferred = $.Deferred();
        this.receive_change = receive_change;
        this.reset();
        this.loadNextAddress();
      return this.deferred;
    }

    loadNextAddress():void{
        if(this.onHold) return;
        this.i++;
        this.numberOfTransactionsWithoutHistory++;
        if(this.numberOfTransactionsWithoutHistory>20){
            var out:any = {
              index:this.i-20,
              addresses:_.dropRight(this.addresses,20),
              transactions:this.transactions
            }
            this.deferred.resolve(out);
            this.destroy();
            return;
        }

     // var receive_change:string = this.receive_change;
      //  console.log('coin_HD_index  ' + this.coin_HD_index + '' +
         // ' ' + this.i +  '  nullcount: '+ this.numberOfTransactionsWithoutHistory + '  node: ' + this.receive_change);

        var address:string  = this.generator.generateAddress(this.i,this.receive_change);
        this.addresses.push(address);

        var url  = this.url.replace('{{address}}',address);

        this.currentRequest = <JQueryXHR>$.getJSON(url);
        this.currentRequest.done((res) => {
            //console.log(res);
            var transactions = this.parse(res,address);
        if(transactions && transactions.length){
                this.numberOfTransactionsWithoutHistory = 0;
                this.transactions = this.transactions.concat(transactions);
        }
            console.log(this.name + ' i '+ this.i + ' '+ address + '   has '+ transactions.length +' ' +
                            ' transactions ' + this.receive_change);
        setTimeout(()=>{ this.loadNextAddress(); },this.requestDelays);

        }).fail((err)=>this.onError(1404,url,'http error'));

    }*/
  }

}