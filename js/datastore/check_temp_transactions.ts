/**
 * Created by Vlad on 10/31/2016.
 */
///<reference path="../com/models.ts"/>
module jaxx{
    import Dictionary = _.Dictionary;
    export class CheckTempTransactions{
        createdTimestamp:number;
        onBalanceProcessed:Function;
        onComplete:Function;
        interval:number;
        delay:number = 15000;

        tempbalances:Dictionary<VOBalanceTemp>
        destroy():void{
            clearInterval(this.interval);
            this.onComplete = null;
            this.onBalanceProcessed = null;
            this.balances = null;
            this.service = null;
        }

        removeBalanceById(id:string):void{
            var ar = this.balances;
            for(var i=ar.length;i>=0;i--){
                if(ar[i].id == id) ar.splice(i,1);
            }
            this.balances = ar;
        }

        removeBalanceByTransactionId(id:string):void{
            var ar = this.balances;
            for(var i=ar.length;i>=0;i--){
                //if(ar[i].transaction_id == id) ar.splice(i,1);
            }
            this.balances = ar;
        }

        onTransactionProcessed(balance:VOBalanceTemp):void{
            console.error(' transaction processed  from address: ' + balance.id);
            this.removeBalanceById(balance.id);
            if(this.onBalanceProcessed) this.onBalanceProcessed(balance);
        }

        constructor(private balances:VOBalanceTemp[], private service:JaxxAccountService){
            this.start();
        }

        start():void{
            this.interval = setInterval(() => this.checkAddresses(), this.delay);
            this.checkAddresses();
        }

        checkAddresses():void{
            var balances = this.balances;
            var addresses:string[]= [];
                 _.each(balances,(o) => addresses.push(o.id));

           // var tempbalances = _.keyBy(this.balances,'transaction_id');

            console.warn(' checkAddresses length: ', this.balances);
            this.service.downloadTransactions(addresses).done(transactions=>{
                console.log(transactions);
                //console.log(tempbalances);
                _.each(transactions,(transaction) => {
                   // if(tempbalances[transaction.id]) this.onTransactionProcessed(tempbalances[transaction.id])
                })

                if(this.balances.length == 0){
                    if(this.onComplete) this.onComplete()
                    this.destroy();
                }

            })
        }


       /* compare(addresse1:VOAddress[],addresses2:VOAddress):VOAddress[]{
            var out:VOAddress[] = [];
        }*/

        checkTransactions():void{
           /* var voaddresses:VOAddress[] = this.copyInitAddresses();
            this.service.downloadTransactions2(voaddresses).done(res=>{

            });*/

        }

        setTransactions(transactions:VOTransaction[]):void{

        }

        /*copyInitAddresses():VOAddress[]{
          //  return _.map(this.initAddresses,(o)=>new VOAddress(o));
        }*/

        startTransaction(voaddresses:VOAddress[]):void{

        /*this.service.downloadTransactions2(voaddresses).done(res=>{
                console.warn(res);
            this.initAddresses = res;

            });
            */

        }

    }
}