///<reference path="../../com/models.ts"/>
///<reference path="../../com/Utils2.ts"/>
///<reference path="../service-mapper.ts"/>

module jaxx{
  export class CheckTransactionBlockr{
    trs:VOTransaction;
    apiKey:string;
    destroy():void{
      this.trs = null;
    }

    checkAddress(address:string,account_index:number,trsHex:string,d:JQueryDeferred<VOTransaction[]>):void{
      var url  = 'https://api.etherscan.io/api?module=account&action=txlist&address=' + address + '&tag=latest' + this.apiKey;

      $.get(url).done((res) => {
        console.log('  checkAddress    ' + address,res);
        if(res.result && res.result.length) {
          var trs = []// ServiceMappers.mapEtherTransactions(res.result, address, account_index, 'receive');
          var search:VOTransaction[] = trs.filter(function (item:VOTransaction) {
            return (item.id == trsHex);
          })

          if(search.length){
            d.resolve(search);
            this.destroy();
            return;
          }
        }

        setTimeout(()=>this.checkAddress(address,account_index,trsHex,d),10000);
      }).fail((err) => {
        d.reject(err)
        console.error(err)
      })
    }

    checkTransaction(trs:VOTransaction,apiKey): JQueryDeferred<VOTransaction[]>{
      var d:JQueryDeferred<VOTransaction[]> = $.Deferred();
      this.apiKey = apiKey;
      this.trs = trs;
      console.error(' not implemented yet  ');
      d.reject(null)
      return d;
     // var address:string = trs.to.toLowerCase();

     // this.checkAddress(address,trs.address_index,trs.id,d);
     // return d;
    }
  }
}