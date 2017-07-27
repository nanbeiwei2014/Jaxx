///<reference path="../../com/models.ts"/>
///<reference path="../../com/Utils2.ts"/>
///<reference path="../service-mapper.ts"/>

module jaxx{

    interface EtherOrig{
        buildEthereumTransactionList(depositAddresses:string[], coinAmountSmallType:string, gasPrice:number, gasLimit:number, ethereumTXData:any, pass_null:any);
    }


    export class  SendTransactionStartEther{

        onTransactionsConfirmed:Function;
       // results:VOBuiltTransaction[];
        deferred:JQueryDeferred<VOSendTransactionResult>
        requestDelay:number = 500;
        url = 'https://api.etherscan.io/api?module=proxy&action=eth_sendRawTransaction&hex={{hex}}';
        urlCheckTransaction:string = 'https://api.etherscan.io/api?module=transaction&action=getstatus&txhash={{urlCheck}}';

        transactionStart:VOTransactionStart;
        result:VOSendTransactionResult;
        apiKey:string = '';
        curentRequest:JQueryXHR;
        checkStatusCount = 10;
        i:number;
        txTransactions:VOTXItem[];


    constructor(){
        this.url += this.apiKey;
    }

    destroy():void{
        this.txTransactions = null;
        this.deferred = null;
       // this.results = null;
        this.curentRequest=null

    }
    reset():void{
        this.i = -1;
       // this.results = [];
    }

    private onError(code:number,error:any,src:string):void{
        var message =  error.message  || error;
        this.deferred.reject({
                            code:code,
                            message:message,
                            src:src
                        });
        setTimeout(() => this.destroy(),100);
    }

    /*sendRawTransaction(transaction:VOSendRawTransaction):JQueryDeferred<VORawTransactionResult[]>{
        this.deferred = $.Deferred();
        console.log(transaction);

        return this.deferred
    }*/


    sendTransaction(sendTransaction:VOTransactionStart):JQueryDeferred<VOSendTransactionResult>{
        this.reset();
        this.deferred = $.Deferred();
        this.transactionStart = sendTransaction;

        this.txTransactions = sendTransaction.txArray;
        this.sendTransactions(this.deferred);
      //  console.log(transaction);
        return this.deferred;
    }





    sendTransactions(deferred:JQueryDeferred<VOSendTransactionResult>):void {
        var txids:string[] =[];
        var result = new VOSendTransactionResult();
        result.timestampStart = Date.now();


        this.txTransactions.forEach((item:VOTXItem) => {
            var mockTxs =  item._mockTx;

            var bal = new VOBalanceTemp({
                id:mockTxs.from,
                index:mockTxs.addressIndex,
                balance:mockTxs.valueDelta,
                timestamp:mockTxs.timestamp,
                transaction_id:mockTxs.txid
            });



            var hex = '0x' + item.serialize().toString('hex');
            //bal.hex = hex;
           //console.log(item);
          //  result.balancesSent.push(bal);

           var url = this.url.replace('{{hex}}', hex);
            $.getJSON(url).done( (res) => {
                res.txid = res.result;
                result.results.push(res);
                if(result.results.length == result.balancesSent.length){
                    result.timestampEnd = Date.now();
                    deferred.resolve(result);
                }
                //console.log(res);
            })
        })


       /* var hex: string = builtTransaction.hex;


        console.warn('  sendNextBuiltTransaction   ' + this.i + ' of ' + this.builtTransactions.length, url);
        this.curentRequest = $.getJSON(url);
        this.curentRequest.then((res) => {
            this.curentRequest = null;
            if(res.result) {
                builtTransaction.id = res.result;
            }else{
                this.onError(5555,(res.error || res),url);
                return;
            }
            this.checkStatusCount = 20;
            setTimeout(() => this.checkCurrentTransactionStatus(),this.requestDelay);
            //setTimeout(() => this.sendNextBuiltTransaction(),this.requestDelay);
        }).fail(err=>this.onError(10001, err,url));*/

    }



    checkCurrentTransactionStatus(){
      /*  this.checkStatusCount --;
        if(this.checkStatusCount < 0) {
            this.onError(1009,JSON.stringify(this.builtTransactions),'checkCurrentTransactionStatus')

            return;
        }

        var transactionid:string = this.builtTransactions[this.i].id;
        var url:string = this.urlCheckTransaction.replace('{{urlCheck}}',transactionid);
        console.log(' this.checkStatusCount ' + this.checkStatusCount + '  url ' + url);
        this.curentRequest = $.getJSON(url);

        this.curentRequest.done((res) => {
            if(res.result && res.result.isError == '0'){
                this.builtTransactions[this.i].timestamp = Date.now();
                this.sendNextBuiltTransaction();
            }else setTimeout(() => this.checkCurrentTransactionStatus(),this.requestDelay);
        }).fail(err =>this.onError(2404,JSON.stringify(err), url));*/

    }


   /* sendTransaction(data:UserTransaction):JQueryDeferred<VORawTransactionResult[]>{
        var d:JQueryDeferred<VORawTransactionResult[]> = $.Deferred();
        this.data = data;
        var results:VORawTransactionResult[] = [];

        this.transactions = data.txArray;
        console.log(data);
        console.log(this.transactions);
        this.i = -1;
       // this.sendNextTransaction(results,d);
        return d
    }*/

  //  getUnconfirmed():VORawTransactionResult{

     /* for(var i = 0; i<this.results.length; i++){
        if(this.results[i].confirmed) continue;
        return this.results[i];
      }*/
    //  return null;
  //  }

    /*startCheck():void{
        var vo: VORawTransactionResult  =  this.getUnconfirmed();
        if(!vo){
        this.onTransactionsConfirmed(this.results);
        return;
        }
        var addr:string = vo.id;

        $.getJSON('https://api.etherscan.io/api?module=transaction&action=getstatus&txhash=' + addr).done(res => {
              console.log(res);


        }).fail(err => {

        })

    }
*/
/*
    sendNextTransaction(results:VORawTransactionResult[],d:JQueryDeferred<VORawTransactionResult[]>):void{
        this.i++;
        if( this.i >= this.transactions.length){
        console.log('all transactions done ',results);
        this.results = results;
        d.resolve(results);

        return;
        }
        var transaction:TXItem = this.transactions[this.i];

        console.log(this.transactions);
        console.log(transaction,this.i);

        var hex = '0x' + transaction.serialize().toString('hex');

        var url = 'https://api.etherscan.io/api?module=proxy&action=eth_sendRawTransaction&hex=' + hex + "&apikey=" + this.apiKey;

        console.log(hex);
        $.getJSON(url).done((res) => this.parseResult(res)).then((result) => {
                    results.push(result);
                  this.sendNextTransaction(results,d);
        }).fail(err=>this.onError(10001,url,err));

        }*/

  }


}