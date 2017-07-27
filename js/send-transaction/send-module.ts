/**
 * Created by Vlad on 2017-05-31.
 */
    ///<reference path="../com/models.ts"/>
    ///<reference path="../com/Registry.ts"/>
module jaxx{


    export class SendAmmountController{

        $sendStartBtn:JQuery;
        $sendBtn:JQuery;
        $addressInput:JQuery;
        $amountInput:JQuery;
        $myAddress:JQuery;
        $maxBtn:JQuery;
        isActive:boolean;
        // coinType:string;
        optionsController:SendOptionsController;
        sendConfirmation:SendConfirmationController;
        // miningFee:number;
        // amount:number;
        // from:string;
        // to:string;
        rawTransaction:any;
        total:number;
        spendable:number;

        constructor(public $sendView:JQuery){


            this.$amountInput = $('#amountSendInput').on('input',()=>{
                var val = this.$amountInput.val();
                //console.log(val);
                this.rawTransaction.amount = val;
               // this.checkIsvalid();
            })

           // console.error( " SendAmmountController ");
            this.optionsController = new SendOptionsController();
            this.sendConfirmation = new SendConfirmationController();
            // this.rawTransaction = new VOSendRawTransaction();
           /* this.sendConfirmation.onConfirmed = ()=>{
                console.warn('   send confirmation confirmed   ');

                Registry.application$.triggerHandler(Registry.ON_USER_TRANSACTION_COFIRMED,this.rawTransaction);
            }*/
            //this.init();
        }

        onInvalid(reason:string):void{
            console.error(reason);
        }

        checkIsvalid():void{
            if(this.total<(this.rawTransaction.amount+this.rawTransaction.miningFee)) this.onInvalid('amount to send more then total');
        }

        setCoinType(str:string):void{
            this.rawTransaction.coinType = str;
            this.rawTransaction.miningFee = 21000;
        }

        setTotal(num:number):void{
            this.total = num;
            this.checkIsvalid();

        }

        setTax(num:number):void{
            this.rawTransaction.miningFee = num;
            this.checkIsvalid();
        }

        getAmount():number{
            return this.rawTransaction.amount;
        }

        getTax():number{
            return this.rawTransaction.miningFee;
        }

        onCoinTypeChanged(coinType:string):void{
            this.rawTransaction.coinType = coinType;
            if(this.rawTransaction.coinType === 'Ether'){
                this.optionsController.showButton();
            }else this.optionsController.hideButton();
        }

        initButtons():void{
            this.$sendStartBtn = $('.tabSend.scriptAction.tab.send').first().click((evt)=>{
                console.log(evt.currentTarget);
                if(this.isActive)this.isActive = false;
                else this.isActive = true;
                //this.changeActive();
            })

            this.$sendBtn  = $('#Send_Recieve_Btn').click(()=>{
                console.log('send clicked');
                this.rawTransaction.amount = this.$amountInput.val();
                this.rawTransaction.to = this.$addressInput.val();
                this.rawTransaction.from = this.$myAddress.text();
                this.sendConfirmation.setTransaction(this.rawTransaction);
                this.sendConfirmation.show();
            })

            //console.log(this.$sendStartBtn);



            this.$myAddress =$('.populateAddress.cssAddress').first();



            this.$addressInput = $('#receiver_address').on('input',()=>{
                var val =  this.$addressInput.val();
                this.rawTransaction.to = val;
                this.checkIsvalid();
                // console.log(val);

            })
            //console.log(this.$addressInput);



            //console.log(this.$amountInput);

        }

        onSendClick():void{
            var addresTo:string  = this.$addressInput.val();
            var addressFrom:string =  this.$myAddress.text();
            var value:number = this.$amountInput.val();
            var tax:number =this.getTax();

        }

       /* changeActive():void{
            if(this.isActive){
                this.$sendStartBtn.addClass('cssSelected selected');
                this.$view.addClass('cssSelected selected');
                this.$view.show('fast');
            }else{
                this.$sendStartBtn.removeClass('cssSelected selected');
                this.$view.removeClass('cssSelected selected');
                this.$view.hide('fast');
            }

        }*/
    }

    export class TransferAmmountController{
        $view:JQuery;
        $shaleShiftInput:JQuery;
        $amountInput:JQuery;
        constructor(){

        }
    }





    export class SendTransactionModule{
        static sendController;

        constructor(){
            SendTransactionModule.sendController = new SendAmmountController();
        }
    }

}