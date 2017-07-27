///<reference path="../../com/models.ts"/>
///<reference path="../../com/Utils2.ts"/>
///<reference path="../service-mapper.ts"/>
///<reference path="./send_transaction_ethereum.ts"/>
///<reference path="balances_Ethereum.ts"/>
///<reference path="../blockchain/send_test.ts"/>
///<reference path="restore_Ethereum.ts"/>

///<reference path="download_transactions_ethereum.ts"/>
///<reference path="send_transaction.ts"/>


module jaxx{
    declare var thirdparty:any;

    export class CryptoEthereum implements IRequestServer{

        _coinType:number = -1;

        i:number=0;
       // static RECEIVE:string= 'receive';
       // static CHANGE:string= 'change';
        gasPrice:number = 2e10;
        gasLimit:number = 21000; ///56000 for contracts;

        attempts:number = 10;
        speed:number = 200;
        public apiKey='';
        nullCount=0;
        receive_change:string;
        addressesReceive:string[];
        addressesChange:string[];
        options:OptionsCrypto;
        generator:GeneratorBlockchain = null;
        name:string;
        coin_HD_index;

        constructor(private config:any){

            this._coinType = config._coinType;
            this.coin_HD_index = config.hd_index;
            this.name = config.name;
            this.options = config;

            




          // console.log(options);
           /* let options:OptionsCrypto  = {
                urlBalance :'http://api.jaxx.io/api/eth/balance?addresses={{addresses}}',
                urlTransactions:'http://api.jaxx.io/api/eth/mergedTransactions?addresses={{address}}',
                apiKey:'',
                hd_index:coin_HD_index,
                name:service.name
            };
*/
           // this.options = options;


            this.init();
        }

        initialize():void{

        }

        init():void{

            let options:OptionsCrypto  = {
             urlBalance :'https://api.etherscan.io/api?module=account&action=balancemulti&address={{addresses}}&tag=latest',
             urlTransactions:'http://api.etherscan.io/api?module=account&action=txlist&address={{address}}',
             urlTransactionStatus:'https://api.etherscan.io/api?module=transaction&action=getstatus&txhash={{transaction_id}}',
             urlTransactionInternal:'https://api.etherscan.io/api?module=account&action=txlistinternal&txhash={{transaction_id}}',
             balanceParser:null,
             apiKey:'',
             hd_index:this.coin_HD_index,
             name:this.name
             };

         /*  let options:OptionsCrypto  = {
                urlBalance :'https://rinkeby.etherscan.io/api?module=account&action=balancemulti&address={{addresses}}&tag=latest',
                urlTransactions:'http://rinkeby.etherscan.io/api?module=account&action=txlist&address={{address}}',
                urlTransactionStatus:'https://rinkeby.etherscan.io/api?module=transaction&action=getstatus&txhash={{transaction_id}}',
                urlTransactionInternal:'https://rinkeby.etherscan.io/api?module=account&action=txlistinternal&txhash={{transaction_id}}',
                balanceParser:null,
                apiKey:'',

                hd_index:this.coin_HD_index,
                name:this.service.name
            };*/

            this.options.urlBalance = options.urlBalance;
            this.options.urlTransactions = options.urlTransactions;


           // console.log(this.name, this._coinType, this.coin_HD_index);
            

            this.generator = new GeneratorBlockchain(this.name, this._coinType, this.coin_HD_index);
          //  this.options.urlTransactions = this.options.API.transactions.url;

            // this.urlBalance = this.options.urlBalance + this.options.apiKey;
           // this.urlBalance += this.apiKey;
            this.name = this.name;
            this.options.apiKey ='';

        }

        downloadTransactionsDetails(txsIds:string[]):JQueryDeferred<{result:any[], transactions:VOTransaction[]}>{
            let deferred:JQueryDeferred<{result:any[], transactions:VOTransaction[]}> = $.Deferred();

            return deferred
        }

        restoreHistory2(receive_change:string, startIndex:number):JQueryDeferred<{index:number, addresses:string[], txdIds:string[], transactions:VOTransaction[]}>{
            let promise:JQueryDeferred<{index:number, addresses:string[], txdIds:string[], transactions:VOTransaction[]}> = $.Deferred();

            var req:RestoreEthereum = new RestoreEthereum(this.options, this.generator);

            req.parse = function (result: any, address) {

                // console.log(result);
                let ar:any[] = result.result || [];
                if(!Array.isArray(result.result)){
                    console.error(' not expected server response ', result)
                }

                return ServiceMappers.mapEtherTransactions(ar,address);

            }

            req.restoreHistory(receive_change, startIndex).done((res)=>{
                // console.log(receive_change + ' done ',res);
                let result:any ={
                    index:res.index,
                    addresses:res.addresses,
                    transactions:res.transactions,
                    txdIds:null
                };

                promise.resolve(result);
            });


            return promise;
        }

        checkAddressesForTranasactions(addresses:string[]):JQueryDeferred<any[]>{
           // let promise:JQueryDeferred<string[]> = $.Deferred();
           // let relayManager:any = this._relayManager;

            return this.downloadTransactions(addresses);


           // return promise;
        }

        sendTransaction2(transaction:any):any{
            var ctr:SendTransaction = new SendTransaction(this.name,this.gasPrice,this.gasLimit);
            return ctr.sendTransaction(transaction);
        }

       // web3.eth.getTransaction(transactionHash [, callback])

        checkTransactionByAddress(txid:string,address:string):JQueryPromise<VOTransaction[]>{
            let urlTransactions:string = this.options.urlTransactions;

            var url:string = urlTransactions.replace('{{address}}',address);

            return $.getJSON(url).then(res=>{
               // console.warn(address, txid, res);
                var trransactions:VOTransaction[] = ServiceMappers.mapEtherTransactions(res.result,address);
              //  console.log(trransactions);
             return trransactions.filter(o=>o.id === txid);
            });
        }

        getTransactionStatus(transactionId:string):JQueryPromise<VOTransactionStatus>{
            let urlTransactionStatus:string = this.options.urlTransactionStatus;
                var url = urlTransactionStatus.replace('{{transaction_id}}',transactionId);
            return $.getJSON(url).
                    then((res) =>{
                        /*
                        from this.urlTransactionStatus1
                        * {
                             status: "1",
                             message: "OK",
                             result: {
                             isError: "0",
                             errDescription: ""
                             }
                         }

                        *
                        * */
                        var out = new VOTransactionStatus({
                            txid:transactionId,
                            status:Number(res.status),
                        })

                        if(Number(res.result.isError)){
                            out.error = res.result.errDescription;
                        }else out.success = true;
                        return out;
                    });
        }

   /* checkTransaction(trs:VOTransaction):JQueryDeferred<VOTransaction[]>{
        var req:CheckTransactionEthereum = new CheckTransactionEthereum();
        return req.checkTransaction(trs,this.apiKey);
    }*/

    //  addressesChange:string[];
    // addressesReceive:string[];

        killHistory():void{

        }

        restoreHistory(receive_change:string):JQueryDeferred<{index:number,addresses:string[], transactions:VOTransaction[]}>{

           // console.log(this.options);
            let promise:JQueryDeferred<{index:number, addresses:string[], transactions:VOTransaction[]}> = $.Deferred();

            var req:RestoreEthereum = new RestoreEthereum(this.options, this.generator);

            req.parse = function (result: any, address) {
               // console.log(result);
                let ar:any[] = result.result;

                return ServiceMappers.mapEtherTransactions(ar,address);

            }

            req.restoreHistory(receive_change).done((res)=>{
                // console.log(receive_change + ' done ',res);
                let addresses = req.addresses;
               // console.log(addresses);

                let withTransactions:string[] = _.dropRight(req.addresses, req.numberOfTransactionsWithoutHistory);
                let withoutTransactions:string[] = _.takeRight(req.addresses, req.numberOfTransactionsWithoutHistory);

                let req2:BalancesEthereum = new BalancesEthereum(this.options);

                req2.loadBalances(withoutTransactions).done(balances=>{

                    if(Utils.calculateBalance(balances)){
                        console.log(' have balance ');

                        for(let i= balances.length -1; i>= 0; i--){
                            if(balances[i].balance === 0) balances.pop();
                            else break;
                        }

                        res.addresses = res.addresses.concat(Utils.getIds(balances));

                    }else console.log(' dont have balance');

                   // console.log(balances)

                    promise.resolve(res);
                })


                return res
            });

            return promise;
        }


        sendTransactinsStart(transaction:VOTransactionStart):JQueryDeferred<VOSendTransactionResult>{
             var  ctr:SendTransactionStartEther  = new SendTransactionStartEther();
            return ctr.sendTransaction(transaction);
        }


      /*  sendBuiltTransactions(builtTransactions:VOBuiltTransaction[]):JQueryDeferred<VOBuiltTransaction[]>{
            var req:RequestSendTransactionEther = new RequestSendTransactionEther(this.service);
            return req.sendBuiltTransactions(builtTransactions);
        }
        */


////////////////////////////// Transactions //////


        downloadTransactionsUnspent(addresses:string[]):JQueryDeferred<{result:any[], utxos:VOTransactionUnspent[]}>{



            let deferred:JQueryDeferred<{result:any[],utxos:VOTransactionUnspent[]}> = $.Deferred();
            let req:DownloadTransactionsEthereum = new DownloadTransactionsEthereum(this.name);

            //console.log(addresses);

            req.downloadTransactions(addresses).done(res =>{
                console.log(res)
                let out = res.map(function(item){
                    return new VOTransactionUnspent(item);
                })
                deferred.resolve({result:[], utxos:out});
            }).fail(err => deferred.fail(err));


            return deferred


        }


        downloadingTransaction:IMobileRequest;

        downloadTransactions(addresses:string[]):JQueryDeferred<VOTransaction[]>{

            let req: DownloadTransactionsBlockchain = new  DownloadTransactionsBlockchain(this.name, this.options);

          // req.parse = ServiceMappers[mapFunction];
            req.parse = function (result: any, address:string) {
               // console.log(result);

                let ar:any[] = result.result || result.transactions;
                return ServiceMappers.mapEtherTransactions(ar,address);
            }
/*
            req.parse = function (result: any, address:string) {
                console.log(result);

                let ar:any[] = result.transactions;
                return ServiceMappers.mapEtherTransactions(ar,address);
            }*/

 /*
            req.parse = function (result: any, address: string) {
                return ServiceMappers.mapEtherTransactions(result.result,address);
            }*/
           /// if(this.downloadingTransaction) this.downloadingTransaction.abort().destroy();

             this.downloadingTransaction = req;
            return req.downloadTransactions(addresses);
        }

       downloadTransactions2(voaddresses:VOAddress[]):JQueryDeferred<VOAddress[]>{
           /* var req:DownloadTransactionsEthereum2 = new DownloadTransactionsEthereum2(this.name);
            return req.downloadTransactions2(voaddresses);*/
           //TODO implement if need
           return null;
        }

        downloadTransactionsForAddress(address:string):JQueryPromise<VOTransaction[]>{

            let urlTransactions:string = this.options.urlTransactions;
            var url:string = urlTransactions.replace('{{address}}',address);
            return $.getJSON(url).then(res => {
                var result = res.result;
                return ServiceMappers.mapEtherTransactions(result,address);
            });
        }

   /* sendTransaction(transaction:VOSendRawTransaction):JQueryDeferred<VORawTransactionResult[]>{
        var sendTransaction:RequestSendTransactionEther = new RequestSendTransactionEther(this.service)
        return sendTransaction.sendRawTransaction(transaction);
    }*/
    /*
    checkTransactions(trs:VOTransaction[]):JQueryDeferred<VOTransaction[]>{
      var d:JQueryDeferred<VOTransaction[]> = $.Deferred();
      var checkTrans:CheckTransactionsEther = new CheckTransactionsEther();

      checkTrans.checkTransactions(trs).done(res=>d.resolve(res)).fail(err => d.reject(err));
      return d;
    }
    getTransactionsFromAddresses(addresses:string[]):JQueryDeferred<VOTransaction[]>{

      var d:JQueryDeferred<VOTransaction[]> = $.Deferred();
      return d;
    }
    */
/*

        setTransactionEventEmiter(emitter$:JQuery):void{
            var sendTransaction:EthereumSendTransaction = new EthereumSendTransaction();
            sendTransaction.setTransactionEventEmiter(emitter$);
        }
*/


        //////////////////////////////////////// Balances /////////////////////

        downloadBalances(addresses:string[]):JQueryDeferred<VOBalance[]>{
         // var d:JQueryDeferred<VOBalance[]> = $.Deferred();
          //  this.options.urlBalance = this.options.API.balances.url;

           // this.options.balanceParser =  ServiceMappers[this.options.API.balances.parser];

           // console.log(this.options);
            var req:BalancesEthereum = new BalancesEthereum(this.options);


          //  req._batchSize = 25;//this.options.API.balances.batchSize;
           // console.warn(req._batchSize);


            return req.loadBalances(addresses);//.done(res=>d.resolve(res)).fail(err=>d.reject(err));
         // return d;
        }
/*

        checkBalanceForAddress(address:string):JQueryPromise<VOBalance>{
            let urlBalance:string = this.options.urlBalance;
            var url:string = urlBalance.replace('{{address}}',address);
            return $.getJSON(url).then((res) => {
                //console.warn(res);
                return new VOBalance({
                    id:address,
                    balance:+res.result,
                    timestamp:Date.now()
                });
            });
        }
*/

        getMiningPrice():number{
            return this.gasPrice;
        }
        getMiningFees():number{
            //gasPrice:number = 2e10; //in Wei
           // var gasLimit:number = 53000;

            return  this.gasPrice * this.gasLimit;
        }
        getMiningFeeLimit():number{
            return 0.0001;
        }



    //////////////////////////////////////////////////////////////////////////////

/*

    setType(receive_change:string):void{
      this.receive_change = receive_change;
    }
*/

   /* addAddress(type:string,i,address:string):void{
      if(type === RequestEthereum.RECEIVE && this.addressesChange.length === i) this.addressesChange.push(address);
      if(type === RequestEthereum.CHANGE && this.addressesReceive.length === i) this.addressesReceive.push(address);
    }
*/
   /* getAddress(i:number):string{
      var node;

      if(this.receive_change == RequestEthereum.RECEIVE)  node =  Utils2.getReceiveNode(this.coin_HD_index,i,null);
      else node =  Utils2.getChangeNode(this.coin_HD_index,i,null);
      var addr:string = Utils2.getEtherAddress(node);
      return addr
    }
*/
  }


}