/**
 * Created by Vlad on 10/19/2016.
 */
    ///<reference path="../../com/models.ts"/>
///<reference path="../../com/Utils2.ts"/>
///<reference path="../service-mapper.ts"/>


module jaxx{
  export class BitcoinSendTransaction{

    constructor(){
      Registry.sendTransaction$.on('TRANS_SEND_BEFORE_0',(evt,data)=>{

        console.log('BitcoinSendTransaction  ',data);
      });

    }

    private emitter$:JQuery;
    setTransactionEventEmiter(emitter$:JQuery):void{
      this.emitter$ = emitter$;
    }


  }
}