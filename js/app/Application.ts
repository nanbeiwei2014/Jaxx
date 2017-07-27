/**
 * Created by Vlad on 10/11/2016.
 */
    ///<reference path="../com/models.ts"/>
  ///<reference path="../com/Utils2.ts"/>
///<reference path="./datastore_controller.ts"/>
  ///<reference path="./balance.ts"/>

module jaxx{
    export class Application{

        sendAmmountController:SendAmmountController;
        constructor(){



           // this.sendAmmountController = new SendAmmountController($('.tabContent.cssTabContent').first());
            this.init();
        }

        init():void {

        }



        setSendButtonState(state:string):void{
            switch (state){
                   case 'active':
                       $('.tabContent .amount .button').addClass('cssEnabled').addClass('enabled');
                   case 'disabled':
                       $('.tabContent .amount .button').removeClass('cssEnabled').removeClass('enabled');

            }
        }

        currentSendState:string;
        isValidInput(value:number, coinType:number):boolean{
           // console.log(value, coinType);

            switch (coinType){
                case COIN_ETHEREUM_CLASSIC:
                case COIN_ETHEREUM:
                case COIN_AUGUR_ETHEREUM:
               // case COIN_TESTNET_ROOTSTOCK:
                case COIN_ICONOMI_ETHEREUM:
                case COIN_GOLEM_ETHEREUM:
                case COIN_GNOSIS_ETHEREUM:
                case COIN_SINGULARDTV_ETHEREUM:
                case COIN_DIGIX_ETHEREUM:
                case COIN_BLOCKCHAINCAPITAL_ETHEREUM:
                case COIN_CIVIC_ETHEREUM:

                    if(value >999.99999999) {
                        Registry.application$.triggerHandler(Registry.AMOUNT_TOO_BIG_ETHEREUM);
                        return false;

                    }


            }

            return true;
        }




    }

    $(document).ready(function () {
        let app:Application = new Application();
        Registry.application = app;
    })


}


