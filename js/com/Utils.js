/**
 * Created by Vlad on 10/7/2016.
 *
 */
///<reference path="models.ts"/>
var jaxx;
(function (jaxx) {
    var Utils = (function () {
        function Utils() {
        }
        /*  static bitcoinT2Satoshi(num: number): number{
             return Math.round(num * 1e8);
          }
  
          static satoshi2Bitcoin(num: number): number{
              num = Math.round(num / 1e12);
              return num * 1e3;
  
          }
  */
        Utils.calculateSpendable = function (utxos, miningFeePerKilobyte, numOuts, bytesPerInput, useFilter) {
            if (numOuts === void 0) { numOuts = 1; }
            if (bytesPerInput === void 0) { bytesPerInput = 148; }
            if (useFilter === void 0) { useFilter = true; }
            var perByte = miningFeePerKilobyte / 1024;
            var price = bytesPerInput * perByte;
            console.log(' price ' + price);
            var total = 0;
            var count = 0;
            utxos.forEach(function (item) {
                if (useFilter && item.amount > price) {
                    total += item.amount;
                    count++;
                }
                else {
                    console.log('%c  DUST ' + item.amount, 'color:red');
                    total += item.amount;
                    count++;
                }
            });
            var totalBytes = (bytesPerInput * count) + (34 * numOuts) + 10;
            var fee = (totalBytes * perByte);
            console.log('totalBytes    ' + totalBytes);
            console.log(' total ' + total);
            console.log('   fee ' + fee);
            console.log(Math.round(total - fee));
            return Math.round(total - fee);
        };
        Utils.updateBalances = function (balances, new_bals) {
            var indexed = _.keyBy(new_bals, 'id');
            var stamp = Date.now();
            var out = [];
            // console.log(indexed);
            balances.forEach(function (item) {
                var new_bal = indexed[item.id];
                if (new_bal) {
                    if (item.balance !== new_bal.balance) {
                        // console.log(item.id + ' ' + item.balance + '  ' + new_bal.balance);
                        item.delta = new_bal.balance - item.balance;
                        item.balance = new_bal.balance;
                        item.timestamp = stamp;
                        out.push(item);
                    }
                    //item.delta = 0;
                } //else console.log(item.id + ' is missing ');
            });
            return out;
        };
        Utils.filterBalanceOnAddress = function (address, balances) {
            for (var i = balances.length - 1; i >= 0; i--)
                if (balances[i].id === address)
                    return balances[i].balance;
            return 0;
        };
        Utils.updateUTXOS = function (old_utxo, new_utxo) {
            if (!Array.isArray(old_utxo) || !Array.isArray(new_utxo)) {
                console.error(old_utxo, new_utxo);
            }
            var n_indexed = {};
            new_utxo.forEach(function (item) {
                n_indexed[item.txid + item.index] = item;
            });
            var out = [];
            old_utxo.forEach(function (item) {
                if (n_indexed[item.txid + item.index]) {
                    //console.log( ' updating utxo old/new ',item, n_indexed[item.txid + item.index] );
                    out.push(n_indexed[item.txid + item.index]);
                }
                else {
                    out.push(item);
                }
            });
            return out;
        };
        Utils.createUTXOFromOutput = function (output) {
            return new VOutxo({});
        };
        Utils.createTempBalancesFromInputs = function (inputs, toAddress) {
            var out = [];
            var indexed = {};
            inputs.forEach(function (item) {
                if (indexed[item.address])
                    indexed[item.address].spent += (-item.amount);
                else
                    indexed[item.address] = new VOBalanceTemp({
                        id: item.address,
                        spent: -item.amount,
                        from: item.address,
                        to: toAddress,
                        timestamp: Date.now()
                    });
            });
            for (var str in indexed) {
                out.push(indexed[str]);
            }
            return out;
        };
        Utils.constartcInput2Keys = function (ar) {
            var out = [];
            ar.forEach(function (item) {
                out.push(item.previousTxId + '_' + item.previousIndex);
            });
            return out;
        };
        Utils.setInQueueUTXOsBy2Keys = function (utxos, keys2) {
            var now = Date.now();
            for (var i = utxos.length - 1; i >= 0; i--) {
                var key = utxos[i].txid + '_' + utxos[i].index;
                if (keys2.indexOf(key) !== -1) {
                    utxos[i].inqueue = true;
                    utxos[i].queueTimesatmp = now;
                }
            }
        };
        Utils.removeUTXOsBy2Keys = function (utxos, keys2) {
            for (var i = utxos.length - 1; i >= 0; i--) {
                var key = utxos[i].txid + '_' + utxos[i].index;
                if (keys2.indexOf(key) !== -1) {
                    utxos.splice(i, 1);
                }
            }
        };
        Utils.removeUTXOsBy2KeysID = function (utxos, keys2id) {
            for (var i = utxos.length - 1; i >= 0; i--) {
                var key = utxos[i].txid + '_' + utxos[i].index;
                if (key === keys2id) {
                    utxos.splice(i, 1);
                }
            }
        };
        Utils.remapTransactionsToOldCode = function (unspent, controller) {
            var out = [];
            for (var i = 0, n = unspent.length; i < n; i++) {
                var trs = unspent[i];
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
                });
            }
            return out;
        };
        Utils.getTransactionsUnspentFromVORelayedTransactionList = function (data) {
            var out = [];
            data.forEach(function (item) {
                var addr = item.address;
                var utxo = item.utxoListDict;
                for (var str in utxo) {
                    utxo[str].address = addr;
                    out.push(new ReferenceRelaysUTXOData(utxo[str]));
                }
                ;
            });
            return out;
        };
        Utils.deepCopy = function (obj, proto) {
            var out = JSON.parse(JSON.stringify(obj));
            if (proto) {
                out = out.map(function (o) {
                    return new proto(o);
                });
            }
            return out;
        };
        Utils.addresseFromBalances = function (balances) {
            var out = [];
            balances.forEach(function (balance) {
                out.push(balance.id);
            });
            return out;
        };
        Utils.isCompleteBalances = function (addreses, balancess) {
            if (addreses.length !== balancess.length) {
                console.error(' missing balances  ');
                return false;
            }
            for (var i = 0, n = addreses.length; i < n; i++) {
                balancess[i].index = i;
                if (addreses[i] !== balancess[i].id)
                    return false;
            }
            return true;
        };
        Utils.reorderBalances = function (addreses, balancess) {
            var balIndexed = _.keyBy(balancess, 'id');
            var out = [];
            var i = 0;
            addreses.forEach(function (address) {
                var balance = balIndexed[address];
                if (balance)
                    balIndexed[address].index = i++;
                else
                    console.error('cant find balance for address: ' + address); ///balance = new VOBalance({id: address, balance: 0, timestamp: Date.now()});
                out.push(balance);
            });
            return out;
        };
        Utils.balancesDifference = function (oldbalances, newbalances) {
            // return _.differenceWith(balances1,balances2,(item) => item.balance);
            //if (oldbalances.length === 0) return newbalances;
            var out = [];
            var indexed = {};
            //  _.keyBy(oldbalances, 'id');
            oldbalances.forEach(function (b) {
                indexed[b.id] = b;
            });
            // var changes:VOBalanceDiff[];
            newbalances.forEach(function (b_new) {
                if (!b_new) {
                    console.log(b_new);
                }
                else {
                    var b_old = indexed[b_new.id];
                    if (b_old) {
                        if (b_old.balance !== b_new.balance) {
                            out.push(new VOBalanceDiff(b_old, b_new));
                        }
                    }
                    else {
                        console.error(' unknown balance ', b_new);
                    }
                }
            });
            return out;
        };
        Utils.concatTransactions = function (transactions1, trensactions2) {
            var out = [];
            var indexed = {};
            transactions1.forEach(function (tr) { return indexed[tr.id] = 1; });
            trensactions2.forEach(function (tr) {
                if (indexed[tr.id]) {
                }
                else {
                    console.log('adding temp transaction from: ' + tr.from, tr);
                    transactions1.push(tr);
                }
            });
            return transactions1;
        };
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
        Utils.removeTempRemote = function (transactions) {
            transactions.forEach(function (transaction) {
                delete transaction.tempRemote;
                delete transaction.nonce;
                delete transaction.outs;
            });
        };
        Utils.getNoncesOfAddresses = function (transactions) {
            var nonces = {};
            /* transactions.forEach(function(trs) {
             nonces[trs.from] = 0;
             });*/
            transactions.forEach(function (transaction) {
                if (transaction.from === transaction.address) {
                    var from = transaction.from;
                    //@note: @here: @codereview: what logic is implying this isNaN switch is correct..
                    if (isNaN(nonces[from]))
                        nonces[from] = 1;
                    else
                        nonces[from]++;
                }
            });
            return nonces;
        };
        Utils.staticGetAddressesFromTransactions = function (trs) {
            var out = [];
            trs.forEach(function (item) {
                var addr = item.address;
                if (out.indexOf(addr) === -1)
                    out.push(addr);
            });
            return out;
        };
        Utils.splitInCunks = function (ar, length) {
            var out = [];
            for (var i = 0, n = ar.length; i < n; i += length) {
                out.push(ar.slice(i, i + length));
            }
            return out;
        };
        Utils.getObjectTotal = function (obj) {
            var total = 0;
            for (var str in obj) {
                total += obj[str].valueDelta;
            }
            return total;
        };
        Utils.filterLatest = function (ar, timestamp) {
            var out = [];
            ar.forEach(function (item) {
                if (item.timestamp > timestamp)
                    out.push(item);
            });
            return out;
        };
        Utils.sortByBalance = function (ar) {
            ar.sort(function (a, b) {
                if (a.balance > b.balance)
                    return 1;
                if (a.balance < b.balance)
                    return -1;
                return 0;
            });
        };
        Utils.sortByTimestamp = function (ar) {
            ar.sort(function (a, b) {
                if (a.timestamp > b.timestamp)
                    return 1;
                if (a.timestamp < b.timestamp)
                    return -1;
                return 0;
            });
        };
        Utils.getArrayTotal = function (ar) {
            var total = 0;
            ar.forEach(function (item) {
                if (!isNaN(+item.valueDelta))
                    total += +item.valueDelta;
            });
            return total;
        };
        Utils.findAndReplaceById = function (arr, find, replace) {
            var i, n;
            for (i = 0, n = arr.length; i < n && arr[i].id != find.id; i++) {
            }
            i < n ? arr[i] = replace : arr.push(replace);
        };
        Utils.updateItemById = function (arr, item) {
            var i, n;
            for (i = 0, n = arr.length; i < n && arr[i].id != item.id; i++) {
            }
            i < n ? arr[i] = item : arr.push(item);
        };
        Utils.updateOldBalances = function (oldbals, newbals) {
            var indexed = {};
            if (oldbals.length !== newbals.length)
                console.error(' balances length not equal old/new ', oldbals, newbals);
            var timestamp = Date.now();
            newbals.forEach(function (bal) {
                indexed[bal.id] = bal;
            });
            var out = [];
            oldbals.forEach(function (bal) {
                var nb = new VOBalance(bal);
                nb.balance = indexed[bal.id].balance;
                nb.timestamp = indexed[bal.id].timestamp;
                out.push(nb);
            });
            return out;
        };
        Utils.updateOldTransactions = function (oldtrs, newtrs) {
            var newInd = _.keyBy(newtrs, 'id');
            for (var i = oldtrs.length - 1; i >= 0; i--) {
                var id = oldtrs[i].id;
                if (newInd[id]) {
                    // if(oldtrs[i].isTemp) oldtrs.splice(i,1);
                    oldtrs[i].confirmations = newInd[id].confirmations;
                    //oldtrs[i].ti
                }
            }
            return oldtrs;
            /*oldtrs.forEach(function (trs) {
                if(newInd[trs.id]) trs = newInd[trs.id];
            });*/
        };
        Utils.getNewTransactions = function (oldtrs, newtrs) {
            var oldInd = _.keyBy(oldtrs, 'id');
            var out = [];
            newtrs.forEach(function (trs) {
                if (!oldInd[trs.id])
                    out.push(trs);
            });
            return out;
        };
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
        Utils.parseAddressTransactions = function (owner, obj) {
            var ar = [];
            for (var str in obj)
                ar.push(new VOTransaction({
                    id: str,
                    confirmed: obj[str],
                    timestamp: obj.updatedTimestamp
                }));
            return ar;
        };
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
        Utils.calculateBalanceSpendable = function (balances, miningFee) {
            var val = 0;
            var i = 0;
            balances.forEach(function (item) {
                var v = (item.balance - miningFee);
                if (v > 0) {
                    i++;
                    val += v;
                }
            });
            //console.log(' calculateBalanceSpendable  amount balances ' + i);
            return val;
        };
        Utils.calculateBalanceSpendableTransactions = function (transactions, miningFee) {
            var val = 0;
            var i = 0;
            transactions.forEach(function (item) {
                var v = (item.value - miningFee);
                if (v > 0) {
                    val += v;
                    i++;
                }
            });
            return val;
        };
        Utils.calculateBalanceTransactions = function (transactions) {
            // var i = 0;
            var val = 0;
            //TODO need correction with real data
            transactions.forEach(function (item) {
                if (item.value)
                    val += item.value;
                //i++;
            });
            return val;
        };
        Utils.calculateBalance = function (balances) {
            //if (!Array.isArray(balances)) return 0;
            var val = 0;
            var i = 0;
            balances.forEach(function (item) {
                if (item.balance)
                    val += item.balance;
            });
            return val;
        };
        Utils.isArrayInObject = function (ar, obj) {
            for (var i = 0, n = ar.length; i < n; i++) {
                if (obj[ar[i]])
                    return true;
            }
            return false;
        };
        Utils.getIds = function (data) {
            var ids = [];
            data.forEach(function (item) {
                ids.push(item.id);
            });
            return ids;
        };
        Utils.getTXIds = function (data) {
            var ids = [];
            data.forEach(function (item) {
                ids.push(item.txid);
            });
            return ids;
        };
        Utils.getUTXOAddresses = function (data) {
            var ids = [];
            data.forEach(function (item) {
                ids.push(item.address);
            });
            return ids;
        };
        Utils.filterNewTransactions = function (orig, new_data) {
            var kets = Utils.getIds(orig);
            var out = [];
            new_data.forEach(function (item) {
                if (kets.indexOf(item.id) === -1)
                    out.push(item);
            });
            return out;
        };
        Utils.hasEnoughTimeElapsedToSleepJaxx = function () {
            var currentTime = new Date().getTime();
            if (typeof (jaxx.Registry.timeLastActive) === 'undefined' || jaxx.Registry.timeLastActive === null) {
                jaxx.Registry.timeLastActive = new Date();
            }
            if (currentTime - jaxx.Registry.timeLastActive.getTime() > 300000) {
                return true;
            }
            else {
                return false;
            }
        };
        return Utils;
    }());
    Utils.transactionsToArray = function (obj) {
        var out = [];
        for (var str in obj)
            out.push(obj[str]);
        return out;
    };
    jaxx.Utils = Utils;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=Utils.js.map