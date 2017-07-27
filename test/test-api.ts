/**
 * Created by Vlad on 2017-03-03.
 */
    ///<reference path="../typings/jquery/jquery.d.ts"/>
    ///<reference path="../typings/lodash/lodash.d.ts"/>

module api{
    class Transaction{
        id:string;
        timestamp:number;
        fee:number;
        confirmations:number;
        block:number;
        from:string;
        to:string;
        amount:number;
        constructor(obj:any) {
            for (let str in obj) this[str] = obj[str];
        }
    }

    export class TestTransactions{
        addresses:string[] = [];
        urlAPI:string = 'http://52.40.138.237:2052/insight-api-dash/';
        urlTransactions:string = 'transactions/{{addresses}}';

        constructor(addressesStr:string){
            this.addresses = addressesStr.split(',');
            this.urlTransactions = this.urlAPI + this.urlTransactions;
        }


        downloadTransactions(callBack:Function):void{
            let url:string = this.urlTransactions.replace('{{addresses}}',this.addresses.toString());
            $.getJSON(url).done(res=>{

                let data:any[] = res.data;
                let out:Transaction[] = data.map(function (item) {
                    return new Transaction(item);
                })
                console.log(out);

            }).fail(err=>console.error(err));
        }
    }
}

