///<reference path="../../com/models.ts"/>
///<reference path="../../com/Utils2.ts"/>
///<reference path="../service-mapper.ts"/>
///<reference path="./send_transaction_ethereum.ts"/>
///<reference path="balances_Ethereum.ts"/>
///<reference path="../blockchain/send_test.ts"/>
///<reference path="restore_Ethereum.ts"/>
///<reference path="download_transactions_ethereum.ts"/>

module jaxx{

    declare var Buffer;
    declare class HDWalletHelper{
        static hexify(num:number):string;
    }
    declare var thirdparty:any;
    export class SendTransaction{

        initTransaction:VOSendTransaction;
        deferred:JQueryDeferred<any>;
        addressChange:string;

        toAddress:string;
        txlistUrl:string;
        txSendUrl:string;
        apiKey:string='';
        currentIndex:number;
        fee:number;
       // gasPrice:number = 2e10; //in Wei
        amount:number;
        amountSent:number = 0;
        amountSpent:number = 0;
        timestampStart:number;

        balances:VOBalance[];
        balancesSmall:VOBalance[];
        balancesSent:VOBalance[] = [];

        transactions:VOTransaction[] =[]

        sendingChange:boolean;
        balanceChange:VOBalance;

        destroy():void{
            this.deferred = null;
            //TODO destroy
        }
        /*
         error:
               code:-32010
               data:null
               message:"Transaction with the same hash was already imported."


        * error{
        * code:-32010
        * message:"Transaction nonce is too low. Try incrementing the nonce."
        *
        * }
        *
        * error{
        * code:-32010
        * message:"Transaction gas is too low. There is not enough gas to cover minimal cost of the transaction (minimal: 53000, got: 21000). Try increasing supplied gas."
        *
        * }
        *
        * Object {
        * id: 1
        * jsonrpc: "2.0"
        * result: "0x90ac1d65cc8c2d65931595bf0a3a3de9db4e57a5955c21e5c039f843508c68da"
        * }
        *
         error
         code:  -32010
         data:null
         message: "Transaction gas is too low. There is not enough gas to cover minimal cost of the transaction (minimal: 21000, got: 5000). Try increasing supplied gas."

        * */

        // Insufficient funds. Account you try to send transaction from does not have enough funds. Required 1441000000000000 and got: 0

        //gasLimit:number = 	53000;// this good for contracts
        //gasLimit:number = 	21000;



        constructor(private name:string, private gasPrice:number, private gasLimit:number){

            this.init();
        }

        init():void{
            this.txlistUrl = 'https://api.etherscan.io/api?module=account&action=txlist&address={{address}}&tag=latest' +  this.apiKey;
            this.txSendUrl ='https://api.etherscan.io/api?module=proxy&action=eth_sendRawTransaction&hex={{hex}}';
        }

        parse(result:any,address:string):VOTransaction[]{
            //console.log(address + ' has ' + result.result.length );
            return ServiceMappers.mapEtherTransactions(result.result,address);
        }


        buildTransaction( toAddress:string, amount:number, nonce:number):any{

            var rawTx = {
                nonce: thirdparty.web3.toHex(nonce),
                gasPrice: thirdparty.web3.toHex(this.gasPrice),
                gasLimit: thirdparty.web3.toHex(this.gasLimit),
                to: toAddress,
                value: thirdparty.web3.toHex(amount),
                //data: '',
            };
            //console.log(rawTx);
            return  new thirdparty.ethereum.tx(rawTx);

        }

        onSuccess():void{
            var res:VOSendTransactionResult = this.formResult();
            res.success = true;
            this.deferred.resolve(res);
           // console.warn(' balances ready', res);
            setTimeout(() =>this.destroy(),100);
        }
        formResult():VOSendTransactionResult{
            var result:VOSendTransactionResult = new VOSendTransactionResult();
            result.id = this.initTransaction.id;
            result.timestampStart = this.timestampStart;
            result.timestampEnd = Date.now();
            result.amount = this.amount;
            result.amountSent = this.amountSent;
            result.balancesSent = this.balancesSent;
            result.balancesSmall = this.balancesSmall;
            result.transactions = this.transactions;
            return result;
        }
        onError(err:any):void{
            var res:VOSendTransactionResult = this.formResult();
            res.error = err;
            this.deferred.reject(res);
        }

        isAllSent:boolean;


        calculateToSend(balance:number):number{
            var gasLimit:number = this.gasLimit;
            var gasPrice:number = this.gasPrice;
            var fee:number = gasLimit * gasPrice;
           // console.log(' fee: '+fee/1e15);
            var canSend = balance - fee;

            var need:number = this.amount - this.amountSent;

            var toSend:number;
            if(need < canSend){
                toSend =  need;
            } else {
                toSend = canSend
            }

            var remain:number = balance - (toSend + fee);
            if(remain < fee) toSend+= remain;
            return toSend;
        }



        sendTransactionOnServer(hex, balance:VOBalance, toSend:number, nonce:number):JQueryPromise<any>{

            var url:string = this.txSendUrl.replace('{{hex}}',hex);
            var p = $.getJSON(url);
            p.then(res=>{
                console.log(res);
                if(res.error){
                    this.sendNext();
                    return
                   /* console.warn(res.error.message);
                    var errorMessage1:string = 'Try incrementing the nonce';
                    var errorMessage2:string = 'Transaction with the same hash was already imported';
                    if(res.error.message.indexOf(errorMessage1) !== -1){
                        if(nonce>100){
                            this.onError(' nonce more then 100 and message: ' + res.error.message);

                        }else{

                            nonce++;
                            console.warn( ' icreasing nonce on server demend ' + nonce );

                                setTimeout(() =>{
                                    this.sendTransactionWithNonce(balance, this.toAddress, toSend, nonce);
                                },3000);


                            // this.testTransaction(balance,nonce);
                          //  return;
                        }

                    }else this.onError(res);*/

                }else{
                    var transaction:VOTransaction= new VOTransaction({
                        id:res.result,
                        from:balance.id,
                        to:this.toAddress,
                        timestamp:Date.now(),
                        value:toSend,
                    })
                    this.transactions.push(transaction);

                    var fee:number = this.gasLimit * this.gasPrice;
                    this.amountSent+=toSend;
                    this.amountSent+=toSend + fee;

                    if(this.sendingChange){

                       // balance.spent2 = toSend + balance.feeforempty;

                       // balance.delta2 = balance.balance - balance.spent2;
                        //balance.fee = balance.feeforempty;
                        //balance.deltatotal = balance.balance - balance.spent - balance.spent2;

                       // this.balanceChange.change = toSend;
                        this.balancesSent.push(new VOBalance(this.balanceChange));
                        this.onSuccess();
                    }else{
                        balance.delta = balance.balance - (toSend + fee);
                       // balance.spent = toSend + fee;
                        // balance.miningFee = fee;
                        var out:VOBalance = new VOBalance(balance);
                       // out.keyPair = null;
                        this.balancesSent.push(out);
                        setTimeout(()=> this.sendNext(),1500);

                    }

                }

                //console.log(res);
            }).fail(err=>this.onError(err));

            return p

        }

        sendTransactionWithNonce(balance:VOBalance, toAddress:string,toSend:number, nonce:number ):void{
            console.log(' amount Sent ' +  this.amountSent/1e15 +' need: '+this.amount/1e15);
            console.log(' sending ' +  toSend/1e15 +' nonce: '+nonce );
            console.log(' to ' +  this.toAddress  +' from: '+balance.id );

            var transaction:any  = this.buildTransaction(toAddress, toSend, nonce);

           // transaction.sign(new Buffer(balance.keyPair.d.toBuffer(32),'hex'));
            var txid = ('0x' + transaction.hash().toString('hex'));
            var hex = '0x' + transaction.serialize().toString('hex');

            this.sendTransactionOnServer(hex, balance, toSend, nonce);//.done(res)
        }


        prepareTransaction(balance, toSend?:number):any{

            balance.miningFee  = this.gasLimit * this.gasPrice;

            if(!toSend) toSend = this.calculateToSend(balance.balance);


            this.getNonceForAddress(balance.id).done(nonce =>{
                this.sendTransactionWithNonce(balance, this.toAddress,toSend,nonce);
            })

        }


        getNonceForAddress(address:string):JQueryPromise<number>{

            var url:string = this.txlistUrl.replace('{{address}}',address);

            return $.getJSON(url).then((res) => {
                var transactions: VOTransaction[] = this.parse(res, address);
                console.log(transactions);
              //  var nonces: number[] = _.map(transactions, o=>o.nonce);

                var nonce: number = transactions.filter(tr=>tr.from == address).length;

                return nonce
            });

        }


        sendTosmall():void {

        }

        sendChange(balance:VOBalance):void{
            var gasLimit:number = this.gasLimit;
            var gasPrice:number = this.gasPrice;
            var fee:number = gasLimit * gasPrice;
            var canSend:number;;// = balance.balance - balance.spent;

            console.log('%c sending !!!!!! change  can send: '+canSend/1e15,'color:red');


            if(canSend > (fee*5)){

                this.sendingChange = true;
                //fee = (fee/2);
              //  balance.feeforempty = fee ;

               // var toSend:number = canSend - balance.feeforempty;
               // var toSend:number = canSend - fee;

                var toSend:number = 5*fee; ///just to recover account

                console.log('%c sending change '+ toSend/1e15 +' fee '+fee/1e15 + ' from '+balance.id + ' to: '+this.toAddress,'color:red');

                this.prepareTransaction(balance,toSend);
            }else {
                console.log(' balance not sufficient founds '+ canSend/1e15 +' fee '+fee/1e15 + '  '+  balance.id);
                this.onSuccess();
            }

        }

        sendNext():void{
            if(this.amountSent >= this.amount){
                if(this.balancesSmall.length){
                        this.balanceChange = new VOBalance(this.balancesSmall[0]);
                        this.toAddress = this.balanceChange.id;

                   // this.balanceChange = this.balances[this.currentIndex];
                    var from:VOBalance = this.balances[this.currentIndex];
                    this.sendChange(from);

                } else this.onSuccess();


                return;
            }

            this.currentIndex++
            if(this.currentIndex>=this.balances.length){
                var result:VOSendTransactionResult = new VOSendTransactionResult()
                result.balancesSent = this.balancesSent;
                this.deferred.reject(result);
                return;
            }

            var balance:VOBalance = this.balances[this.currentIndex];
            this.prepareTransaction(balance);

        }

        filterBalances():void{
            var fee:number = this.gasLimit * this.gasPrice;
            var out:VOBalance[] = [];
            var balancesSmall:VOBalance[] = [];

            this.balances.forEach(function(balance){
                if(balance.balance > fee) out.push(balance);
                else balancesSmall.push(balance);
            })
            this.balances = out;
            this.balancesSmall = balancesSmall;
        }

        sendTransaction(transaction:VOSendTransaction):JQueryDeferred<any>{
            this.initTransaction = transaction;
            this.balances = _.sortBy(transaction.balancesReceive,'balance');
            this.toAddress = transaction.toAddress;
            this.amount = transaction.amount;
            this.amountSent = 0;
            this.timestampStart = Date.now();
            this.addressChange = transaction.changeAddress;
            this.filterBalances();
           //this.gasLimit = transaction.gasLimit;
           // this.gasPrice =
            this.deferred = $.Deferred();
            this.currentIndex =-1;
            console.warn(transaction);
            this.sendNext();
           // this.downloadHextBalanceHistory();
            return this.deferred;
        }


    }
}