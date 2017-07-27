/**
 * Created by Vlad on 10/11/2016.
 */
    ///<reference path="../com/models.ts"/>
    ///<reference path="../com/Registry.ts"/>
module jaxx{
  export class BalanceController{
        $refreshBtn:JQuery;
        $coinType:JQuery;
        $balance:JQuery;
        $currency:JQuery;
        $controls:JQuery;
      $overlay:JQuery

    constructor(private main:JaxxDatastoreController){
        this.$overlay = $('<div>')
            .addClass('overlay')
            .css( {
                position: 'absolute',
                top: '0',
                left: '0',
                width:'100%',
                height:'100%',
                backgroundColor:'rgba(0,0,0,0.5)'
                })
        this.init();

    }
    init():void{
        this.$refreshBtn = $('.scriptAction.refresh').first();
        //console.error(this.$refreshBtn.length);

        if(this.$refreshBtn.length == 0){
            setTimeout(()=>this.init(),2000);
            return;
       }

       /*
        this.$controls = $('#CryptoControls');
        this.$controls.get(0).addEventListener('click',(evt)=>{
            var v = $(evt.currentTarget);

          //  console.log(v.hasClass('off'));
            if(v.hasClass('off')){
                evt.stopPropagation();
            }else{

            }
        },true);*/

        var controls = this.$controls;
      //  console.warn( this.$refreshBtn);
        this.$refreshBtn.click(function () {
            console.error('click');
        })
     /*   this.$refreshBtn.click(()=>{

            ///console.log('  refresh ');
            //this.$refreshBtn.show();
            console.error('click');
            if(this.$controls.hasClass('off'))return;
            //this.$controls.addClass('off');
            //this.$controls.fadeTo('fast',0.5);
          this.main._currentCryptoController.checkBalanceCurrentReceive();
          jaxx.Registry.application$.triggerHandler(jaxx.Registry.ON_RESTORE_BALANCE_START);
          this.main._currentCryptoController.downloadAllBalances((err)=>{
            jaxx.Registry.application$.triggerHandler(jaxx.Registry.ON_RESTORE_BALANCE_END);
          })
            // 22nd Jan 2017 Anthony only wants to refresh balance and not transaction history
            //this.main._currentCryptoController.restoreHistoryAll((err)=>{

                //this.$refreshBtn.hide();
               // controls.removeClass('off');
               // controls.fadeTo('fast',1.0);
            //})
        })
*/
    }
  }

  export class CurrentAddressController{

    $currentAdderss:JQuery;
    $qrCode:JQuery;
  }



  export class SendOptionsController{
    $view:JQuery
    $optionsBtn:JQuery;
    $gasLimit:JQuery;
    $customData:JQuery;
    isVisible:boolean;
    isOptions:boolean;
    constructor(){
      this.init();
    }
    init():void{
      this.$view = $('.advancedTabContentEthereum.cssGapSmall.cssAdvancedTabContentEthereum').first();
      this.$customData =  $('.advancedTabButton.cssAdvancedTabButton').first().click((evt)=>{
        if(this.isVisible) this.isVisible = false;
        else this.isVisible = true;
        this.toggleView();
      })

    }

    showButton():void{
      if(this.isOptions){

      }else {
        this.isOptions = true;
        this.$optionsBtn.show();
      }
    }
    hideButton():void{
      if(this.isOptions) this.$optionsBtn.hide();
    }
   toggleView(){
     if(this.isVisible){
       this.$view.show('fast');

     }else{
       this.$view.hide('fast');
     }
    }

  }

  export class SendConfirmationController{
    $view:JQuery;
    $btnConfirm:JQuery;
    $btnClose:JQuery;
    $message:JQuery;
    $tax:JQuery;
    $taxMessage:JQuery;
    onConfirmed:Function
  ;
    onClose:Function;
    tr:any;
    constructor(){
      this.init();
    }
    init():void{
      this.$view = $('.modal.send').first();
      this.$btnClose = this.$view.find('.cssClose').first().click(()=>{console.log('on close click')});
      this.$btnConfirm = $('#Send-Confirm-Button').click((evt)=>this.onConfirmed());
    }

    show():void{
      this.$view.show();
    }
    hide():void{
      this.$view.hide();
    }
    setTransaction(tr:any):void{
      this.tr = tr
    }
    setAmount(num:number):void{

    }
    setMessage(str:string):void{

    }
  }


}