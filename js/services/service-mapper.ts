/**
 * Created by Vlad on 10/9/2016.
 */
    ///<reference path="../com/models.ts"/>
///<reference path="../com/Utils.ts"/>

module jaxx{

  export class ServiceMappers{


      static parseTransactionsETHjaxxio(respond:any[],address:string){

          return respond.map(function(item:any){

              if(item.timeStamp) item.timestamp = item.timeStamp;

              let date:Date = new Date(+item.timestamp * 1000);

              return new VOTransaction({
                  id:item.hash,
                  address:address,
                  from:item.from,
                  to:item.to,
                  value:(address===item.from) ? -Number(item.value) : Number(item.value),
                  // tax:+item.gasUsed,
                  miningFee:+item.gasUsed,
                  nonce:+item.nonce,
                  confirmations:+item.confirmations,
                  timestamp:+item.timestamp,
                  date:date.toLocaleDateString() + ' ' + date.toLocaleTimeString(),
                  block:+item.blockNumber,
                  // address_index:address_index,
                  // receive_change:receive_change
              })
          })
      }

      static parseBalanceETHjaxxio(respond:any):VOBalance[]{
          let stamp:number = Math.round(Date.now()/1000);
         // console.log(respond);
          let out:any[] = [];
          for (let str in respond){
              out.push(new VOBalance({
                  id:str,
                  balance:+respond[str],
                  timestamp:stamp
              }))
          }
          return out;
      }

      static parseUTXOsBlocker(response:any):VOutxo[]{
          if(!Array.isArray(response.data))response.data = [response.data];
          let data:any[] = response.data;
          let out:VOutxo[] =[];
          data.forEach(function (addressutxos) {
              let address:string = addressutxos.address;
              let unspent:any[] = addressutxos.unspent;
             out = out.concat(unspent.map(function (item) {
                  return new VOutxo({
                      address:address,
                      amountBtc:item.amount,
                      amount:(+item.amount * 1e8),
                      txid:item.tx,
                      vout:item.n,
                      confirmations:item.confirmations
                  })
              }))
          });

          return out;
      }
      static parseUTXOsCoinfabrikLTC(data:any):VOutxo[]{
          let out:VOutxo[] =[];
          for(let str in data){
              let items:any[] = data[str];
              items.forEach(function (item) {
                  out.push(new VOutxo({
                      address:str,
                      amountBtc:item.amount,
                      amount:+item.litoshis,
                      txid:item.txhash,
                      vout:item.vout,
                      confirmations:(item.confirmations || -1)
                  }));
              });
          }
          return out;
      }

      static parseUTXOsCoinfabrikBTC(respond:any[]):VOutxo[]{
          let out:VOutxo[] =[];
          return respond.map(function (item) {
             return new VOutxo({
                  address:item.address,
                  amountBtc:item.amount+'',
                  amount:+item.satoshis,
                  txid:item.txid,
                  vout:item.vout,
                  confirmations:item.confirmations
              })
          });

        }

      static parseUTXOsCoinfabrikZCash(data:any):VOutxo[]{
          let out:VOutxo[] =[];
          for(let str in data){
              let items:any[] = data[str];
              items.forEach(function (item) {
                  out.push(new VOutxo({
                      address:str,
                      amountBtc:item.amount,
                      amount:+item.zatoshis,
                      txid:item.txhash,
                      vout:item.vout,
                      confirmations:(item.confirmations || -1)
                  }));
              });
          }
          return out;
      }

      static mapBalancesCoinfabric(response:any):VOBalance[]{

          let out:VOBalance[] = [];
                for(let address in response){
                    let item:any = response[address];
                    let ac:number = +item.confirmed.zatoshis;
                   // console.log(address + ' item.confirmed  ', item.confirmed);
                   // console.log(address + ' item.unconfirmed  ', item.unconfirmed);
                    let uc:number = +item.unconfirmed.zatoshis;
                    if(uc<0) uc=0;

                    out.push(new VOBalance({
                        id:address,
                        balance: ac+uc
                    }))
                }

          return out;
      }

      static mapUTXOsCoinfabrik(data:any):VOutxo[]{
          let out:VOutxo[] =[];
          for(let str in data){
              let items:any[] = data[str];
              items.forEach(function (item) {
                  out.push(new VOutxo({
                      address:str,
                      amountBtc:item.amount,
                      amount:+item.zatoshis,
                      txid:item.txhash,
                      vout:item.vout,
                      confirmations:(item.confirmations || -1)
                  }));
              });

          }
          return out;
      }



    static mapEtherTransactions(ar:any[],address:string):VOTransaction[]{

      return ar.map(function(item:any){

        if(item.timeStamp) item.timestamp = item.timeStamp;

        let date:Date = new Date(+item.timestamp * 1000);


        return new VOTransaction({
          id:item.hash,
          address:address,
          from:item.from,
          to:item.to,
          value:(address===item.from) ? -Number(item.value) : Number(item.value),
         // tax:+item.gasUsed,
            miningFee:+item.gasUsed,
            gasUsed:item.gasUsed,
            gasPrice:item.gasPrice,
          //nonce:+item.nonce,
            confirmations:+item.confirmations,
          timestamp:+item.timestamp,
          date:date.toLocaleDateString() + ' ' + date.toLocaleTimeString(),
          block:+item.blockNumber
         // address_index:address_index,
         // receive_change:receive_change
        })
      })
    }

    static mapBlockrTransactions(ar:any[],address:string):VOTransaction[]{
      return ar.map(function(item:any){
        return new VOTransaction({
          id:item.tx,
          address:address,
         // from:item.from,
         // to:item.to,
          value:+item.amount,
         // miningFee:+item.gasUsed,
         // nonce:+item.nonce,
          confirmed:+item.confirmations,
          timestamp:+item.timeStamp,
         // block:+item.blockNumber,
         // address_index:address_index,
         // receive_change:receive_change
        })
      })
    }

    static mapTransactionsUnspent(ar:any[],address:string):VOTransactionUnspent[]{


      return ar.map(function(item:any){

          let now:number = Date.now();


        return new VOTransactionUnspent({
            id:item.txid,
            txid:item.txid,
            address:address,
            amount:Math.round(Number(+item.amount) * 1e8),
            amountBtc:item.amount,
            nonce:+item.nonce,
            index:+item.index,
            outs:item.tempRemote?+item.tempRemote.vout:+item.nonce,
            confirmations:+item.confirmations,
            timestamp:item.timeStamp || now,
            height:item.tempRemote?+item.tempRemote.height:0,
            //scriptPubKey:item.tempRemote.scriptPubKey || item.tempRemote.script,
            tempRemote:item.tempRemote
          // address_index:address_index,
          // receive_change:receive_change
        })
      })
    }

    /* export class VOTransaction {
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
     constructor(obj: any) {
     for (var str in obj) this[str] = obj[str];
     }

     }*/

  }

}