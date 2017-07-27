///<reference path="../../com/models.ts"/>
///<reference path="../../com/Utils2.ts"/>
///<reference path="../service-mapper.ts"/>


module jaxx{


  export class EthereumSendTransaction {
    apiKey: string = '';
    static original: any;
    private emitter$: JQuery;

    setTransactionEventEmiter(emitter$: JQuery): void {
      this.emitter$ = emitter$;
    }

    constructor() {
      this.addListeners();

      Registry.sendTransaction$.on('ON_TRANSACTION_USER_CONFIRMED_1', (evt: JQueryEventObject, data: any)=> {
        console.log('ON_TRANSACTION_USER_CONFIRMED_1', data);
        this.onUserTransactionConfirmed(data);
      });
      /*

       Registry.sendTransaction$.on('TRANS_SEND_BEFORE_1', (evt: JQueryEventObject, data: any)=> {
       console.log('EthereumSendTransaction', data);
       });



       jaxx.Registry.sendTransaction$.on('ON_SEND_PREPARE_1', (evt, data)=> {
       // console.log('ON_SEND_DATA_1',data);
       this.estimatedData = data;
       });
       */


      /*  {
       depositAddresses:depositAddresses,
       coinAmountSmallType:coinAmountSmallType,
       gasPrice:gasPrice,
       gasLimit:gasLimit,
       ethereumTXData:ethereumTXData
       })*/

    }

    /*
     buildTransactionsList() {
     var data: EstimatedData = this.estimatedData;
     var dist: TransactionDist = this.original.buildEthereumTransactionList(data.depositAddresses, data.coinAmountSmallType, data.gasPrice, data.gasLimit, data.ethereumTXData, null);


     }*/

    private estimatedData: any;

    private transactions: any[];

    addListeners():void{

      jaxx.Registry.sendTransaction$.on('SEND_TRANSACTION_FALED_1',(evt,transaction,result)=>{

        this.emitter$.trigger(jaxx.Registry.TRANSACTION_FAILED,this.sentTransactions);
        console.log('SEND_TRANSACTION_FALED_1',transaction,result);
      });

      jaxx.Registry.sendTransaction$.on('SEND_TRANSACTION_SUCCESS_1',(evt,transaction,result) => {

        console.log('SEND_TRANSACTION_SUCCESS_1',transaction,result);

        var m:VOMockTx = transaction._mockTx;
        var tr:VOTransaction = new VOTransaction({
          id:m.hash,
          address_index:m.addressIndex,
          tax:m.gasUsed,
          nonce:m.nonce,
          from:m.to,
          to:m.to,
          value:m.valueDelta,
          timestamp:m.timestamp

        })

        //this.emitter$.triggerHandler(jaxx.Registry.TRANSACTION_ASSEPTED,tr);

        console.log('TRANSACTION_ASSEPTED',tr,result);


      });
    }

    removeListeners():void{
      jaxx.Registry.sendTransaction$.off('SEND_TRANSACTION_FALED_1');

      jaxx.Registry.sendTransaction$.off('SEND_TRANSACTION_SUCCESS_1');
    }

    private sentTransactions:VOTransaction[];
    private onUserTransactionConfirmed(data: any): void {
      console.log('onUserTransactionConfirmed   ',data);

      var ar  = data.txArray
      var out:any[] = [];

      var transactions:VOTransaction[] = ar.map(function(item){
        var m:VOMockTx = item._mockTx;
        var tr:VOTransaction = new VOTransaction({
          id:m.hash,
          address_index:m.addressIndex,
          tax:m.gasUsed,
          nonce:m.nonce,
          from:m.to,
          to:m.to,
          value:m.valueDelta,
          timestamp:m.timestamp,
          receive_change:'receive'
        })
       return tr;
      })

      this.sentTransactions = transactions;


      // var request:RequestSendTransactionEther = new RequestSendTransactionEther();
      ///  request.sendTransaction(data).done((res)=>{ console.log(res)}).fail((err)=>{ console.error(err)});
/*
        id: string;
      address:string;
      from: string;
      to:string;
      value:number
      miningFee: string;
      nonce: number;
      confirmed:boolean;
      timestamp:number;
      block:number;
      address_index:number;*/
      //receive_change:string;

    }
  }
}