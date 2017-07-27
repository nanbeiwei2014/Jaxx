/**
 * Created by Vlad on 2017-02-01.
 */
module jaxx{

    export class MainConnector{
        urlBalanceUnconfirmed:string;
        constructor(private config:any){

        }


        _downloadBalaceUnconfirmed(address:string):JQueryPromise<VOBalance[]>{

            let url:string = this.urlBalanceUnconfirmed.replace('{{address}}',address);
            return $.getJSON(url).then(function(result){
                console.log(result);
                return result
            })

        }

        downloadBalaceUnconfirmed(address:string):JQueryDeferred<VOBalance[]>{
            let d:JQueryDeferred<VOBalance[]> = $.Deferred();

            this._downloadBalaceUnconfirmed(address).done(res=>d.resolve(res)).fail(err=>d.reject(err));
            return d;
        }

    }
}
