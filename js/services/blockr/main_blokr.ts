/**
 * Created by Vlad on 10/18/2016.
 */
    ///<reference path="../../com/models.ts"/>
  ///<reference path="../../com/Utils2.ts"/>
  ///<reference path="../service-mapper.ts"/>
  ///<reference path="bitcoin-send-trans.ts"/>
    ///<reference path="restore_blockr.ts"/>
  ///<reference path="balances-blockr.ts"/>
    ///<reference path="check-trans-blockr.ts"/>
    ///<reference path="download_transactions_blokr.ts"/>



module jaxx{
    export class RequestBlockr  {

        i:number=0;
        static RECEIVE:string= 'receive';
        static CHANGE:string= 'change';
        attempts:number = 10;
        speed:number = 200;
        public apiKey='';
        nullCount=0;
        receive_change:string;
        addressesReceive:string[];
        addressesChange:string[];
        name:string;

        urlBalance:string;
        urlTransactions:string ;

        generator:any;


        constructor(public coin_HD_index:number,  public service:JaxxAccountService){
            this.init();
        }

        initialize():void {

        }

        init():void{
            this.name = this.service.name;
            this.generator =  new GeneratorBlockchain(this.name, this.service.id, this.coin_HD_index);
            this.urlBalance = 'http://btc.blockr.io/api/v1/address/balance/{{address}}';
            this.urlTransactions = 'http://btc.blockr.io/api/v1/address/txs/{{address}}';

        }

        //////////////////////////////////////////
          //TODO implement Blockr
        setTransactionEventEmiter(emitter$:JQuery):void{
          var sendTransaction:EthereumSendTransaction = new EthereumSendTransaction();
          sendTransaction.setTransactionEventEmiter(emitter$);
        }
     /*   getTransactionStatus(transaction_id):JQueryPromise<VOTransactionStatus>{
            console.error('need implement ')

            return null;
        }*/

        downloadBalances(addresses:string[]):JQueryDeferred<VOBalance[]>{

            let promise:JQueryDeferred <any[]> = $.Deferred();

            promise.resolve([]);
            return promise
        }

        checkTransactionByAddress(transasction_id:string,address:string):JQueryPromise<VOTransaction[]>{
            console.error('need implement ');

            return null;
        }

        //////////////////////////////////////////////

        sendTransaction2(transaction:any):any{
            return null;
        }


        downloadTransactionsUnspent(addresses:string[]):JQueryPromise<{result:any[], utxos:VOTransactionUnspent[]}>{
            let promise:JQueryDeferred<{result:any[],utxos:VOTransactionUnspent[]}> = $.Deferred();
            promise.resolve({result:[], utxos:[]});
            return promise
        }
        sendTransactinsStart(trans:VOTransactionStart):JQueryDeferred<VOSendTransactionResult>{

           var relays:any =  g_JaxxApp.getBitcoinRelays();
            return null;
        }
        restoreHistory(receive_change:string):JQueryDeferred<{index:number,addresses:string[], transactions:VOTransaction[]}>{

            var req:RestoreBlockr = new RestoreBlockr(this.coin_HD_index, this.generator);
            return req.restoreHistory(receive_change).done((res)=>{
                console.log(this.name + ' ' + receive_change + ' done ',res);
                return res
            });
        }
       /* getMiningFee():number{
            return 0.00000002 //20,000,000
        }*/
        generateKeyPairReceive(i:number):any{
          return this.generator.generateKeyPairReceive(i);
        }

        generateKeyPairChange(i:number):any{
          return this.generator.generateKeyPairChange(i);
        }

        checkTransaction(trs:VOTransaction):JQueryDeferred<VOTransaction[]>{
          var req:CheckTransactionBlockr = new CheckTransactionBlockr();
          return req.checkTransaction(trs,this.apiKey);
        }

        downloadTransactions(addresses:string[]):JQueryDeferred<VOTransaction[]>{
              var req:DownloadTransactoionsBlockr = new DownloadTransactoionsBlockr(this.name);
              return req.downloadTransactions(addresses);
        }

       /* downloadTransactions2(voaddresses:VOAddress[]):JQueryDeferred<VOAddress[]>{
            var req:DownloadTransactoionsBlockr = new DownloadTransactoionsBlockr(this.name);
            return req.downloadTransactions2(voaddresses);
        }*/

        getBalances(addr:string[]):JQueryDeferred<VOBalance[]>{
              var d:JQueryDeferred<VOBalance[]> = $.Deferred();
              var req:BalancesBlockr = new BalancesBlockr();
              req.loadBalances(addr).done(res=>d.resolve(res)).fail(err=>d.reject(err));
              return d;
        }


        downloadTransactionsForAddress(address:string):JQueryPromise<VOTransaction[]>{
            var url:string = this.urlTransactions.replace('{{address}}',address);
            return $.getJSON(url).then(res => {
                var result = res.result;
                return ServiceMappers.mapEtherTransactions(result,address);
            });
        }

        checkBalanceForAddress(address:string):JQueryPromise<VOBalance>{
            var url:string = this.urlBalance.replace('{{address}}',address);
            return $.getJSON(url).then((res) => {
                //console.warn(res);
                return new VOBalance({
                    id:address,
                    balance:+res.result,
                    timestamp:Date.now()
                });
            });
        }

        getTransactionStatus(transactionId:string):JQueryDeferred<VOTransactionStatus>{

            var deffered:JQueryDeferred<VOTransactionStatus> = $.Deferred();
            // thirdparty.web3.eth.getTransaction(transactionId,[(res)=>{
            //     console.log(transactionId);
            //     console.warn(res);
            // }])

            return deffered;
        }

        getMiningFees():number{
            return 0.00002;
        }

       /* getMiningFeeLimit():number{
            return 0.0001;
        }*/
    }
}