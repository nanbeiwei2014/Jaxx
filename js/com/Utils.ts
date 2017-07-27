
/**
 * Created by Vlad on 10/7/2016.
 *
 */
    ///<reference path="models.ts"/>

module jaxx {

    export class Utils {

      /*  static bitcoinT2Satoshi(num: number): number{
           return Math.round(num * 1e8);
        }

        static satoshi2Bitcoin(num: number): number{
            num = Math.round(num / 1e12);
            return num * 1e3;

        }
*/


      static calculateSpendable(utxos:VOutxo[], miningFeePerKilobyte:number, numOuts:number = 1, bytesPerInput:number = 148, useFilter:boolean = true):number{
          let perByte:number = miningFeePerKilobyte/1024;
          let price:number = bytesPerInput * perByte;

          console.log(' price '+ price);
          let total:number = 0;
          let count:number = 0;

          utxos.forEach(function (item) {
              if(useFilter && item.amount > price){
                  total+= item.amount;
                  count++;
              }else{
                  console.log('%c  DUST ' +item.amount,'color:red');
                  total += item.amount;
                  count++;
              }
          });


          let totalBytes:number = (bytesPerInput * count) + (34 * numOuts) + 10;

          let fee = (totalBytes * perByte);
          console.log('totalBytes    ' + totalBytes);
          console.log(' total ' + total);
          console.log('   fee ' + fee);
          console.log(Math.round(total  - fee));
          return Math.round(total  - fee);
      }

      static updateBalances(balances:VOBalance[], new_bals:VOBalance[]):VOBalance[]{
          let indexed:any = _.keyBy(new_bals,'id');
          let stamp:number = Date.now();
          let out:VOBalance[] = [];

         // console.log(indexed);

          balances.forEach(function (item) {
              let new_bal:VOBalance = indexed[item.id];

              if(new_bal){
                  if(item.balance !== new_bal.balance){
                     // console.log(item.id + ' ' + item.balance + '  ' + new_bal.balance);
                      item.delta = new_bal.balance - item.balance;
                      item.balance = new_bal.balance;
                      item.timestamp = stamp;
                      out.push(item);
                  }
                  //item.delta = 0;

              }//else console.log(item.id + ' is missing ');

          });
          return out;
      }


      static  filterBalanceOnAddress(address:string, balances:VOBalance[]):number{
          for(let i= balances.length-1; i>=0;i--) if(balances[i].id === address) return balances[i].balance;
          return 0;
      }

        static updateUTXOS(old_utxo: VOutxo[], new_utxo: VOutxo[]):VOutxo[]{
            if(!Array.isArray(old_utxo) || !Array.isArray(new_utxo)){

                console.error(old_utxo, new_utxo);

            }
            let n_indexed: _.Dictionary<VOutxo> = {};


            new_utxo.forEach(function(item){
                n_indexed[item.txid + item.index] = item;
            });

            let out: VOutxo[] = [];

            old_utxo.forEach( function (item) {
               if(n_indexed[item.txid + item.index]){

                   //console.log( ' updating utxo old/new ',item, n_indexed[item.txid + item.index] );
                   out.push(n_indexed[item.txid + item.index])
               }else{
                   out.push(item)
               }
            });

            return out;
        }
        static createUTXOFromOutput(output: VOOutput): VOutxo{
            return new VOutxo({

            })
        }

        static createTempBalancesFromInputs(inputs: VOInput[], toAddress: string): VOBalanceTemp[] {
            let out: VOBalanceTemp[] = [];
            let indexed: _.Dictionary<VOBalanceTemp> = {};

            inputs.forEach(function (item) {
                if (indexed[item.address]) indexed[item.address].spent += (-item.amount);
                else indexed[item.address] = new VOBalanceTemp({
                    id: item.address,
                    spent: -item.amount,
                    from: item.address,
                    to: toAddress,
                    timestamp: Date.now()
                })

            });

            for (let str in indexed) {
                out.push(indexed[str])
            }

            return out;
        }

        static constartcInput2Keys(ar: VOInput[]): string[] {
            let out: string[] = [];
            ar.forEach(function (item) {
                out.push(item.previousTxId + '_' + item.previousIndex);
            })
            return out;
        }

        static setInQueueUTXOsBy2Keys(utxos: VOutxo[], keys2: string[]) {
            let now: number = Date.now();
            for (let i = utxos.length - 1; i >= 0; i--) {
                let key: string = utxos[i].txid + '_' + utxos[i].index;
                if (keys2.indexOf(key) !== -1) {
                    utxos[i].inqueue = true;
                    utxos[i].queueTimesatmp = now;
                }
            }
        }

        static removeUTXOsBy2Keys(utxos: VOutxo[], keys2: string[]) {
            for (let i = utxos.length - 1; i >= 0; i--) {
                let key: string = utxos[i].txid + '_' + utxos[i].index;
                if (keys2.indexOf(key) !== -1) {
                     utxos.splice(i, 1);
                }
            }
        }

        static removeUTXOsBy2KeysID(utxos: VOutxo[], keys2id: string) {
            for (let i = utxos.length - 1; i >= 0; i--) {
                let key: string = utxos[i].txid + '_' + utxos[i].index;
                if (key === keys2id) {
                    utxos.splice(i, 1);
                }
            }
        }

        static  remapTransactionsToOldCode(unspent: VOTransactionUnspent[], controller: JaxxCryptoController): any[] {

            let out: any[] = [];
            for (let i = 0, n = unspent.length; i < n; i++) {
                let trs = unspent[i];

                out.push({
                    address: trs.address,
                    addressIndex: controller.getAddressIndex(trs.address),
                    addressInternal: controller.isAddressInternal(trs.address),
                    amount: trs.amount,
                    amountBtc: trs.amountBtc + '',
                    confirmations: trs.confirmations,
                    index: trs.index,
                    spent: false,
                    standard: true,
                    timestamp: trs.timestamp,
                    txid: trs.id
                })

            }
            return out;
        }


        static getTransactionsUnspentFromVORelayedTransactionList(data: VORelayedTransactionList[]): ReferenceRelaysUTXOData[] {
            let out: ReferenceRelaysUTXOData[] = [];
            data.forEach(function (item) {
                var addr = item.address;
                let utxo: any = item.utxoListDict;
                for (let str in utxo) {
                    utxo[str].address = addr;
                    out.push(new ReferenceRelaysUTXOData(utxo[str]))
                }
                ;

            });

            return out;
        }

        static deepCopy(obj, proto?: any): any {
            var out: any = JSON.parse(JSON.stringify(obj));
            if (proto) {
                out = out.map(function (o) {
                    return new proto(o)
                })
            }
            return out;
        }

        static addresseFromBalances(balances: any[]): string[] {
            var out: string[] = []
            balances.forEach(function (balance) {
                out.push(balance.id);
            })
            return out;
        }

        static isCompleteBalances(addreses: string[], balancess: VOBalance[]): boolean {
            if (addreses.length !== balancess.length) {
                console.error(' missing balances  ');
                return false;
            }

            for (var i = 0, n = addreses.length; i < n; i++) {
                balancess[i].index = i;
                if (addreses[i] !== balancess[i].id) return false;
            }
            return true;
        }

        static reorderBalances(addreses: string[], balancess: VOBalance[]): VOBalance[] {
            var balIndexed = _.keyBy(balancess, 'id');

            var out: VOBalance[] = [];

            var i = 0;
            addreses.forEach(address => {
                var balance: VOBalance = balIndexed[address];
                if (balance) balIndexed[address].index = i++
                else console.error('cant find balance for address: ' + address)///balance = new VOBalance({id: address, balance: 0, timestamp: Date.now()});
                out.push(balance);

            })
            return out;

        }


        static balancesDifference(oldbalances: VOBalance[], newbalances: VOBalance[]): VOBalanceDiff[] {
            // return _.differenceWith(balances1,balances2,(item) => item.balance);
            //if (oldbalances.length === 0) return newbalances;
            var out: VOBalanceDiff[] = [];
            var indexed: _.Dictionary<VOBalance> = {};
            //  _.keyBy(oldbalances, 'id');
            oldbalances.forEach(function (b) {
                indexed[b.id] = b;
            });

            // var changes:VOBalanceDiff[];

            newbalances.forEach(function (b_new) {
                if(!b_new){
                    console.log(b_new);

                }else{
                    var b_old: VOBalance = indexed[b_new.id];
                    if (b_old) {
                        if (b_old.balance !== b_new.balance) {
                            out.push(new VOBalanceDiff(b_old, b_new));
                        }

                    } else {
                        console.error(' unknown balance ', b_new);
                    }
                }

            });
            return out;
        }

        static concatTransactions(transactions1: VOTransaction[], trensactions2: VOTransaction[]): VOTransaction[] {
            var out: VOTransaction[] = [];
            var indexed = {};
            transactions1.forEach(tr => indexed[tr.id] = 1);

            trensactions2.forEach(tr => {
                if (indexed[tr.id]) {
                }
                else {
                    console.log('adding temp transaction from: ' + tr.from, tr);
                    transactions1.push(tr);
                }
            });

            return transactions1;
        }

        /* static getNoncesOfAddresses(addresses:string[], transactions:VOTransaction[]):any {
         var nonces:any = {};
         addresses.forEach(function(address) {
         nonces[address] = 0;
         });

         transactions.forEach(function(transaction) {
         var from:string = transaction.from;

         if (!isNaN(nonces[from])) nonces[from]++;
         else nonces[from] = 0;

         });
         return nonces;
         }*/

        static removeTempRemote(transactions: any []): void {
            transactions.forEach(function (transaction) {
                delete transaction.tempRemote;
                delete transaction.nonce;
                delete transaction.outs;
            });

        }

        static getNoncesOfAddresses(transactions: (VOTransaction) []): any {
            var nonces: any = {};
            /* transactions.forEach(function(trs) {
             nonces[trs.from] = 0;
             });*/


            transactions.forEach(function (transaction) {
                if (transaction.from === transaction.address) {
                    var from: string = transaction.from;
                    //@note: @here: @codereview: what logic is implying this isNaN switch is correct..
                    if (isNaN(nonces[from])) nonces[from] = 1;
                    else nonces[from]++;
                }


            });
            return nonces;
        }

        static staticGetAddressesFromTransactions(trs: VOTransaction[]): string[] {
            var out: string[] = [];
            trs.forEach(function (item: VOTransaction) {
                var addr: string = item.address;
                if (out.indexOf(addr) === -1) out.push(addr);
            })
            return out;
        }

        static splitInCunks(ar: any[], length: number): any[][] {
            var out: any[][] = []
            for (var i = 0, n = ar.length; i < n; i += length) {
                out.push(ar.slice(i, i + length))
            }
            return out;
        }

        static  getObjectTotal(obj: any): number {
            var total: number = 0;
            for (var str in obj) {
                total += obj[str].valueDelta;
            }
            return total;
        }

        static filterLatest(ar: any, timestamp: number): any[] {
            var out: any[] = []
            ar.forEach(function (item) {
                if (item.timestamp > timestamp) out.push(item);
            })
            return out;
        }

        static sortByBalance(ar: VOBalance[]): void {
            ar.sort(function (a: VOBalance, b: VOBalance) {
                if (a.balance > b.balance)  return 1;
                if (a.balance < b.balance)  return -1;
                return 0;
            })
        }

        static sortByTimestamp(ar: any[]): void {
            ar.sort(function (a: VOTransaction, b: VOTransaction) {
                if (a.timestamp > b.timestamp)  return 1;
                if (a.timestamp < b.timestamp)  return -1;
                return 0;
            })
        }

        static getArrayTotal(ar) {
            var total = 0;
            ar.forEach(function (item) {
                if (!isNaN(+item.valueDelta)) total += +item.valueDelta;
            })
            return total;
        }

        static transactionsToArray = function (obj: any) {
            var out = [];
            for (var str in obj) out.push(obj[str]);
            return out;
        }


        static findAndReplaceById(arr: any[], find: any, replace: any) {
            var i, n;
            for (i = 0, n = arr.length; i < n && arr[i].id != find.id; i++) {
            }
            i < n ? arr[i] = replace : arr.push(replace);
        }

        static updateItemById(arr: any[], item: any) {
            var i, n;
            for (i = 0, n = arr.length; i < n && arr[i].id != item.id; i++) {
            }
            i < n ? arr[i] = item : arr.push(item);
        }

        static updateOldBalances(oldbals: VOBalance[], newbals: VOBalance[]): VOBalance[] {
            var indexed: any = {};

            if (oldbals.length !== newbals.length) console.error(' balances length not equal old/new ', oldbals, newbals);
            var timestamp: number = Date.now();
            newbals.forEach(bal => {
                indexed[bal.id] = bal;
            });

            var out: VOBalance[] = [];

            oldbals.forEach(bal => {
                var nb: VOBalance = new VOBalance(bal);
                nb.balance = indexed[bal.id].balance;
                nb.timestamp = indexed[bal.id].timestamp;
                out.push(nb);
            });

            return out;
        }



        static updateOldTransactions(oldtrs: VOTransaction[], newtrs: VOTransaction[]):VOTransaction[]{

            let newInd = _.keyBy(newtrs,'id');

            for(let i = oldtrs.length-1 ; i>=0; i--){
                let id:string = oldtrs[i].id;

                if(newInd[id]){
                   // if(oldtrs[i].isTemp) oldtrs.splice(i,1);
                    oldtrs[i].confirmations = newInd[id].confirmations;
                    //oldtrs[i].ti

                }
            }

            return oldtrs;
            /*oldtrs.forEach(function (trs) {
                if(newInd[trs.id]) trs = newInd[trs.id];
            });*/

        }


        static getNewTransactions(oldtrs: VOTransaction[], newtrs: VOTransaction[]):VOTransaction[]{

            let oldInd = _.keyBy(oldtrs,'id');

            let out:VOTransaction[] = [];


            newtrs.forEach(function (trs) {

                if(!oldInd[trs.id]) out.push(trs);
            });

            return out;
        }




       /* static updateTransactionsGetNew(oldtrs: VOTransaction[], newts_ar: VOTransaction[]): VOTransaction[] {

            var newtrs: any = {};
            //console.log(oldbals.length +' '+newbals.length);
            var timestamp: number = Date.now();

            if (!Array.isArray(newts_ar)) {
                console.error('not array  ', newts_ar);
                return [];
            }
            newts_ar.forEach(function (tr) {
                newtrs[tr.id] = tr;
            });


            var out: VOTransaction[] = [];

            for (var i = 0, n = oldtrs.length; i < n; i++) {
                var txid: string = oldtrs[i].id;

                if (newtrs[txid]) {
                    oldtrs[i] = newtrs[txid];
                    newtrs[txid] = null;
                }
            }

            for (var str in newtrs) {
                if (newtrs[str]) {
                    oldtrs.push(newtrs[str]);
                    out.push(newtrs[str]);
                }
            }

            //oldtrs = oldtrs.concat(out);

            return out;
        }
        */

        static parseAddressTransactions(owner: any, obj: any): VOTransaction[] {
            var ar: VOTransaction[] = [];
            for (var str in obj) ar.push(new VOTransaction({
                id: str,
                confirmed: obj[str],
                timestamp: obj.updatedTimestamp
            }));
            return ar;
        }

        /* static  parseRawData(obj:any):VOAccount[]{
         var out:VOAccount[] =[];
         var item:any;
         for (var str in obj) {
         item = obj[str];
         var transact:VOTransaction[]
         var account = new VOAccount({id:str,timestamp:item.updatedTimestamp,balance:item.accountBalance});
         //if(item.accountTXProcessed){
         //  account.transactions = Utils.parseAddressTransactions(item,item.accountTXProcessed);
         //}
         out.push(account);
         }
         return out;
         }*/

        static calculateBalanceSpendable(balances: VOBalance[], miningFee: number): number {
            var val: number = 0;
            var i: number = 0;
            balances.forEach(function (item) {
                var v = (item.balance - miningFee);
                if (v > 0) {
                    i++;
                    val += v;
                }
            });

            //console.log(' calculateBalanceSpendable  amount balances ' + i);
            return val;
        }

        static calculateBalanceSpendableTransactions(transactions: VOTransaction[], miningFee: number): number {
            var val: number = 0;
            var i: number = 0;
            transactions.forEach(function (item) {
                var v = (item.value - miningFee);
                if (v > 0) {
                    val += v;
                    i++;
                }
            });
            return val;
        }

        static calculateBalanceTransactions(transactions: VOTransaction[]): number {
            // var i = 0;
            var val = 0;
            //TODO need correction with real data
            transactions.forEach(function (item) {
                if (item.value) val += item.value;
                //i++;
            });
            return val;
        }

        static  calculateBalance(balances: VOBalance[]): number {
            //if (!Array.isArray(balances)) return 0;
            var val: number = 0;
            var i = 0;
            balances.forEach(function (item) {
                if (item.balance) val += item.balance;
            });
            return val;
        }

        static isArrayInObject(ar: string[], obj: any): boolean {
            for (var i = 0, n = ar.length; i < n; i++) {
                if (obj[ar[i]]) return true;
            }
            return false;
        }


        static getIds(data: any[]): string[] {
            var ids: string[] = [];

            data.forEach(function (item) {
                ids.push(item.id);

            });
            return ids;
        }

        static getTXIds(data: any[]): string[] {
            var ids: string[] = [];
            data.forEach(function (item) {
                ids.push(item.txid);
            });
            return ids;
        }

        static getUTXOAddresses(data: VOutxo[]): string[] {
            var ids: string[] = []
            data.forEach(function (item) {
                ids.push(item.address);
            });
            return ids;
        }


        static filterNewTransactions(orig: VOTransaction[], new_data: VOTransaction[]): VOTransaction[] {
            var kets: string[] = Utils.getIds(orig);
            var out: VOTransaction[] = [];
            new_data.forEach(function (item) {
                if (kets.indexOf(item.id) === -1) out.push(item);
            })
            return out;
        }

        static hasEnoughTimeElapsedToSleepJaxx() {
            var currentTime: any = new Date().getTime();
            if (typeof(jaxx.Registry.timeLastActive) === 'undefined' || jaxx.Registry.timeLastActive === null){
                jaxx.Registry.timeLastActive = new Date();
            }
            if (currentTime - jaxx.Registry.timeLastActive.getTime() > 300000){
                return true;
            } else {
                return false;
            }
        }

    }
}