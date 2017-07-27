///<reference path="../../com/models.ts"/>
///<reference path="../../com/Utils2.ts"/>
///<reference path="../service-mapper.ts"/>

///
module jaxx{
    export class BalancesBlockr extends BalancesBlockchain{



    constructor(){
        super();

    }
    init():void{
        this.url  =  'http://btc.blockr.io/api/v1/address/balance/{{addresses}}';
    }
     parse(resp:any):VOBalance[]{
        if(resp && resp.data){
            var ar:any[] = _.isArray(resp.data)?resp.data:[resp.data];
            var t:number = Date.now();
            return _.map(ar,function(item){
                return new VOBalance({id:item.address,balance:+item.balance,timestamp:t})
                })

        }
        // this.onError(' no-data ');
        return null;
    }


  }
}