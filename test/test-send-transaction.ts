/**
 * Created by Vlad on 11/17/2016.
 */
///<reference path="../js/app/datastore_controller.ts"/>



declare  var updateFromInputFieldEntry:any
declare var sendTransaction:any;

module test{

    export class SendOneTranasciton{

        constructor(private parent:TestSendTransaction){

            this.parent.onBalanceChange = (value, diff:VOBalance[])=>{
                console.log(value,diff);
            }

            this.parent.transactionController.emitter$.on(this.parent.transactionController.ON_ONE_TRANSACTION_SENT,(evt,data)=>{
                console.log(data);
            })
        }

        start(){

            this.parent.setInputs(0.01);
            this.parent.sendTransaction();


        }





    }

    export class SendAmounts{

        service:jaxx.JaxxAccountService
        controller:jaxx.TransactionController;
        db:jaxx.JaxxDatastoreLocal;

        amounts:number[];

        balaces:VOBalanceTemp[] =[];
        constructor(private parent:TestSendTransaction){
            this.service =  this.parent.transactionController.accountService;
            this.controller =  this.parent.transactionController;
            this.db = this.parent.ctr._db;


           this.controller.emitter$.on(this.controller.ON_ONE_TRANSACTION_SENT, (evt, data)=>{
                console.warn(this.controller.ON_ONE_TRANSACTION_SENT, data);
                this.balaces.push(data);
               setTimeout(()=>this.sendNext(),2000);

            })

            this.service.emitter$.on(this.service.ON_BALANCES_DIFFERENCE, (evt,delta,diff) =>{
                console.log(this.service.ON_BALANCES_DIFFERENCE, delta, diff);



            })

           /* this.parent.onBalanceChange = (value, diff:VOBalance[])=>{
                console.log(value,diff);
            }*/
        }


        start(nums:number[]){
            this.amounts = nums;
            this.sendNext();

        }

        sendNext(){
            console.log('%c sending next left: '+this.amounts.length,'color:green');

            if(this.amounts.length ===0){
                return;
            }
            var amoint = this.amounts.shift();

            this.parent.setInputs(amoint);
            this.parent.sendTransaction();


        }

    }





  export class   TestSendTransaction{

    //  $to:JQuery;
    //  $amount:JQuery;
      ctr:JaxxCryptoController;
      transactionController:jaxx.TransactionController;
      service:jaxx.JaxxAccountService;
      main:JaxxDatastoreController;

      ///$dataSend;

    constructor(){
        //console.error('TestSendTransaction');

       // setTimeout(()=>this.init(),5000);




       // setTimeout(()=>this.sendTransaction(),1200);



        //return;
       /* if(this.howManyBalancesSpendable()>12){
            this.sendFullAmount();

        }else{
            this.setInputs(0.01);
            setTimeout(()=>this.sendTransaction(),1000);
        }
*/


    }

    stop():void{
        clearTimeout(this.timeout);
    }

    start():void{
        this.sendTransaction();

    }

    sendOne():void{
        this.sendOnetest.start();
    }

    sendMany(){
        var amounts =[0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01];
        this.sendAmounts.start(amounts);
    }





    onBalanceChange(value, diff:VOBalance[]){

    }

      sendOnetest:SendOneTranasciton;
      sendAmounts:SendAmounts;

    init():void{


        console.warn('init test');

        this.main = jaxx.Registry.datastore_controller_test;

       // this.ctr = this.main._currentCryptoController;
        this.ctr.emitter$.on(this.ctr.ON_BALANCE_CHANGE,(evt,value,diff:VOBalance[])=>{
            console.warn(this.ctr.ON_BALANCE_CHANGE,value,diff);
            this.onBalanceChange(value,diff);

        });

        this.transactionController = this.ctr.transactionController;
        this.service = this.ctr._accountService;
        console.log(this.ctr);

        let fee = this.ctr._accountService.getMiningFees();
        var price:number = this.ctr._accountService.getMiningFees();

        var sp:number = this.ctr.getBalanceSpendableDB();

        console.log(' spendable: ' + sp/1e15);
        console.log(' spendable2: ' + (sp - (price*14610))/1e15);
        console.log('spendable accounts ' + this.howManyBalancesSpendable());



        // this.$to = $('.tabContent .address input').first();
       // this.$amount = $('.tabContent .amount input').first();
       // this.$dataSend = $('.modal.send').first();

        this.sendOnetest = new SendOneTranasciton(this);
        this.sendAmounts = new SendAmounts(this);
    }

      allwassent:boolean
      sendIterval:number

    sendOneMore():void{
        console.log('%c !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! sending next ','color:red');

    if (this.allwassent){


        console.warn(' test ends');
        return
    }

        var num = this.howManyBalancesSpendable();
        if (num<10){
            this.setInputs(0.01);
            setTimeout(()=>this.sendTransaction(),1000);

        }else {

            this.sendFullAmount();
        }
        console.log(' balances with amounts ' + num);
        console.log('balances spendable : ' + this.howManyBalancesSpendable());
    }


      sendFullAmount():void{
          var spendable:number = this.ctr.getBalanceSpendableDB();
         // var fee =
          this.allwassent = true;

          var price:number = this.ctr._accountService.getMiningFees();
          spendable =  spendable - (price*14610);

          console.log('%c sendig max  spendable balances: '+ spendable/1e15 ,'color:red');



          this.setInputs(spendable/1e18);
          setTimeout(()=>this.sendTransaction(),1000);
      }

      sendO1():void{
          this.setInputs(0.01);
      }


   sentCointoCurrentAddress(){
        ///sends amount to current address
        console.error(g_JaxxApp);


       //updateFromInputFieldEntry()

    }


    howManyAddresseHasBalances():number{
            return this.ctr.getBalancesNot0().length;
    }

    howManyBalancesSpendable():number{
      return this.ctr.getBalancesSpendableDB().length
    }

    errorcount:number = 0;
    dataReady():boolean{
        var $dataSend = $('.modal.send').first();
      var  data = $dataSend.data('transaction');
        console.log(data);
        if(!data) {
            this.errorcount ++;
            console.log(' no data');
        }
        else if(!data.readyTxArray) console.log(' no data.readyTxArray ');
        else{
            this.errorcount = 0;
            console.log(' got transactions: ' + data.readyTxArray.length);
        }

       return data && data.readyTxArray && data.readyTxArray.length
    }

    resetData():void{
        var $dataSend = $('.modal.send').first();
        $dataSend.data('transaction',null);

    }

    setInputs(amount:number):void{
        var to = this.ctr.getCurrentPublicAddresReceive();
        console.log(' sending to ' + to);
        $('.tabContent .address input').first().val(to);
        $('.tabContent .amount input').first().val(amount+'');

    }

    timeout:number
    sendTransaction():void{
        if(!this.dataReady()){
            console.log('data is no ready ')
            if (this.errorcount <50){
              this.timeout =   setTimeout(()=>this.sendTransaction(),1000);
            }

        }else{
           // console.log('send transaction');
           // this.sendIterval  = setTimeout(()=>this.sendOneMore(),10000);
            sendTransaction();
        }


    }



}
}