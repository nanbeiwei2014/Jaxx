///<reference path="../com/models.ts"/>
///<reference path="../services/account-service.ts"/>
///<reference path="../com/Registry.ts"/>
var jaxx;
(function (jaxx) {
    var EthereumStorage = (function () {
        function EthereumStorage(settings, config) {
            this.emitter$ = $({});
            this.ON_BALANCE_TEMP_LENGTH_0 = 'ON_BALANCE_TEMP_LENGTH_0';
            this.ON_BALANCE_TEMP_LENGTH_NOT_0 = 'ON_BALANCE_TEMP_LENGTH_NOT_0';
            this.maxTransactions = 300;
            this.balancesTimestamp = 0;
            this.balancesTemp = [];
            this.spentInreval = 0;
            this.balanceTotal = -1;
            this.transactionTimestampReceive = 0;
            this.historyTimestamp = -1;
            this.name = settings.name;
            this.id = settings.id;
        }
        EthereumStorage.prototype.clearStorage = function () {
            console.log(this.name + '     storage cleared ');
            if (this.getBalancesReceive(true).length)
                this._saveBalancesReceive([]);
            if (this.getTransactionsReceive().length) {
                this.saveTransactionsReceive([]);
            }
            //if(this.getTransactionsChange().length) this.saveTransactionsChange([]);
            //this.addressesChange = [];
            // this.addressesReceive = [];
        };
        EthereumStorage.prototype.setNewWallet = function (isNew) {
            localStorage.setItem(this.name + 'newwallet', isNew ? 'true' : 'false');
        };
        EthereumStorage.prototype.isNewWallet = function () {
            return localStorage.getItem(this.name + 'newwallet') === 'true';
        };
        // relayedTransactionListArray2: VORelayedTransactionList[] = [];
        /* addRelayedTransactionListArray(ar: VORelayedTransactionList[]): void {
 
             this.relayedTransactionListArray2 = this.relayedTransactionListArray2.concat(ar);
 
             // let utxos:ReferenceRelaysUTXOData[] = Utils.getTransactionsUnspentFromVORelayedTransactionList(ar);
             // console.log(' adding utxos ' + utxos.length);
 
             // console.log(this.UTXOs);
         }*/
        EthereumStorage.prototype.saveUTXOs = function (utxos) {
            // console.log(' save utxos ', utxos);
            this.UTXOs = utxos;
            localStorage.setItem(this.name + '-UTXOs', JSON.stringify(this.UTXOs));
            localStorage.setItem(this.name + '-UTXOs-timestamp', Date.now() + '');
        };
        EthereumStorage.prototype.getUTXOs = function () {
            if (!this.UTXOs) {
                var str = localStorage.getItem(this.name + '-UTXOs');
                this.UTXOs = str ? JSON.parse(str) : [];
            }
            return this.UTXOs;
        };
        EthereumStorage.prototype.saveNonces = function (nonces) {
            //console.log(' save nonces ', nonces);
            this.nonces = nonces;
            localStorage.setItem(this.name + '-nonces', JSON.stringify(this.nonces));
            localStorage.setItem(this.name + '-nonces-timestamp', Date.now() + '');
        };
        EthereumStorage.prototype.getNonces = function () {
            if (!this.nonces) {
                var str = localStorage.getItem(this.name + '-nonces');
                this.nonces = str ? JSON.parse(str) : {};
            }
            return this.nonces;
        };
        //////////////////////////////////////
        //////////////////////////BalancesTemp ////////////////////////////
        /*  addSpending(num: number): number {
              this.balanceSpent += num;
              if (this.balanceSpent < 0) this.balanceSpent = 0;
              return this.balanceSpent;
          }
  
          removeSpending(num?: number): void {
              if (num) this.balanceSpent -= num;
              if (this.balanceSpent < 0) this.balanceSpent = 0;
          }*/
        // balanceSpent: number = 0;
        //////////////////////////////
        /////////////////////               Balances Spent                  ////////
        /*
                reduceBalaceSpent(address: string, amount: number): void {
        
                    let ar: VOBalanceTemp[] = this.getBalancesTemp();
        
                    for (let i = ar.length - 1; i >= 0; i--) {
                        let b: VOBalanceTemp = ar[i];
                        if (b.id === address) {
                            let precision = ar[i].spent / 100;
                            b.spent -= amount;
                            if (b.spent < precision) {
                                console.log('%c removing balance spent ' + b.id + ' spent ' + b.spent, 'color:green');
                                ar.splice(i, 1);
                            } else {
                                console.log('%c balance left ' + b.id + ' spent ' + b.spent, 'color:red');
                            }
                        }
                    }
                }*/
        EthereumStorage.prototype.onBalancesDifference = function (diff) {
            var indexed = {};
            console.warn(this.name, diff);
            diff.forEach(function (b) {
                indexed[b.id] = b;
            });
            var ar = this.getBalancesTemp();
            for (var i = ar.length - 1; i >= 0; i--) {
                var b = ar[i];
                if (indexed[b.id]) {
                    ///// try just remove balance temp
                    ar.splice(i, 1);
                    console.log('%c removing balance temp ' + b.id + ' spent ' + b.spent, 'color:red');
                    /*
                    
                                        if (indexed[b.id].old_new < 0) {
                                            console.error(' balance spent < 0', indexed[b.id]);
                                        }
                                        let precision = ar[i].spent / 100;
                                        //console.log('%c updating balance ' + b.id + '  ' + b.spent / 1e15 + ' - ' + indexed[b.id].spent/1e15,'color:red');
                                        b.spent -= indexed[b.id].old_new;
                    
                                        if (b.spent < precision) {
                                            console.log('%c removing balance spent ' + b.id + ' spent ' + b.spent, 'color:red');
                                            ar.splice(i, 1);
                                        } else {
                                            // console.error('%c balance left '+ b.id +' spent '+b.spent,'color:red');
                                        }
                    */
                }
            }
            if (ar.length === 0) {
                this.resetBalancesSpent();
            }
            ar.forEach(function (item) {
                console.log('%c left balances temp ' + item.id + '  ' + item.spent / 1e15, 'color:red');
            });
        };
        /* removeNulesSpent(){
         var ar:VOBalance[] = this.getBalancesTemp();
         for(var i=ar.length-1; i>=0; i--){
         if(ar[i].balance ===0 ) ar.splice(i,1)  ;
         }
         this.balancesSpent = ar;
         }*/
        EthereumStorage.prototype.checkBalancesSpent = function () {
            var ar = this.getBalancesTemp();
            var now = Date.now();
            var delta = 120000 * 1000;
            for (var i = ar.length - 1; i >= 0; i--) {
                if ((now - ar[i].timestamp) > delta) {
                    console.warn(now + ' removing balance spent due  timestamp  id: ' + ar[i].id + ' spent: ' + ar[i].spent + ' timestamp delta : ' + (now - ar[i].timestamp));
                    ar.splice(i, 1);
                }
            }
            this.balancesTemp = ar;
            if (ar.length === 0) {
                clearInterval(this.spentInreval);
                this.spentInreval = 0;
            }
            if (this.balancesTemp) {
                // console.log(Utils.addresseFromBalances(this.balancesSpent));
                // console.log('balances spent: ' + this.getBalanceSpent() / 1e15, this.balancesSpent.forEach(function(item){ console.log(item.id+' spent: '+item.spent/1e15)}));
            }
        };
        EthereumStorage.prototype.addBalancesSpent = function (ar) {
            var _this = this;
            console.log(this.name + ' adding balances spent ', ar);
            if (this.spentInreval === 0)
                this.spentInreval = setInterval(function () { return _this.checkBalancesSpent(); }, 20000);
            if (this.balancesTemp.length === 0) {
                this.balancesTemp = ar;
                this.emitter$.triggerHandler(this.ON_BALANCE_TEMP_LENGTH_NOT_0, [ar]);
                return;
            }
            var out = [];
            for (var i = 0, n = ar.length; i < n; i++) {
                if (isNaN(ar[i].spent))
                    continue;
                var bal = this.getBalanceSpentById(ar[i].id);
                if (bal) {
                    // console.log(' adding balance to existing was  ' + bal.spent/1e15 + ' + '+ ar[i].spent/1e15  )
                    bal.spent += ar[i].spent;
                    // bal.txids = bal.txids.concat(ar[i].txids);
                    //console.log(' now ' + bal.spent/1e15);
                    bal.count++;
                }
                else {
                    out.push(ar[i]);
                    /// console.log(' adding new balance ',ar[i]);
                }
            }
            if (out.length)
                this.balancesTemp = this.balancesTemp.concat(out);
        };
        /*
                removeTempBalancesByTxIds(txids: string[]): void {
                    let ar: VOBalanceTemp[] = this.balancesSpent;
                    for (let i = ar.length - 1; i >= 0; i--) {
        
                        if (txids.indexOf(ar[i].txid)) {
                            // console.log('removing by txdid '+ ar[i].id +"   "+ ar[i].spent/1e10);
                            ar.splice(i, 1);
                        }
                    }
                }*/
        EthereumStorage.prototype.getBalancesTemp = function () {
            return this.balancesTemp;
        };
        EthereumStorage.prototype.getBalanceTemp = function () {
            return this.balancesTemp.reduce(function (a, b) {
                return a += b.spent;
            }, 0);
            /* let spent = 0;
             this.balancesSpent.forEach(function (item) {
                 spent += item.spent
             });
             return spent;*/
        };
        ;
        EthereumStorage.prototype.resetBalancesSpent = function () {
            //console.warn(' resetBalancesSpent ');
            this.emitter$.triggerHandler(this.ON_BALANCE_TEMP_LENGTH_0);
            this.balancesTemp = [];
        };
        EthereumStorage.prototype.getBalanceSpentById = function (id) {
            var ar = this.getBalancesTemp();
            for (var i = 0, n = ar.length; i < n; i++)
                if (ar[i].id === id)
                    return ar[i];
            return null;
        };
        //////////////////////////////////////////  end balances Spent///////////////////////////////////////////////////
        /*
         getBalanceTemp(): number {
         let balances: VOBalanceTemp[] = this.getBalancesTemp();
         return balances.length ? jaxx.Utils.calculateBalance(balances) : 0;
         }*/
        /* balancesTemp1: VOBalanceTemp[];

         addBalanceTemp(balance: VOBalanceTemp) {
         // console.log('added balance temp ',balance);
         let bals: VOBalanceTemp[] = this.getBalancesTemp();
         bals.push(balance);
         this.saveBalancesTemp(bals);
         }*/
        /* removeBalanceTemp(balance: VOBalanceTemp) {

         console.log('removing balance temp',balance);
         let bals: VOBalanceTemp[] = this.getBalancesTemp();

         for(let i= bals.length; i>=0 ;i++){
         if(bals[i].id === balance.id && bals[i].balance === balance.balance ) {
         bals.splice(i,1);
         console.log('found balance ', balance);
         }
         }
         this.saveBalancesTemp(bals);
         }*/
        /* addBalancesTemp(balances: VOBalanceTemp[]) {
         let bals: VOBalanceTemp[] = this.getBalancesTemp();


         bals = bals.concat(balances);
         this.saveBalancesTemp(bals);
         }
         */
        /* getBalancesTemp(): VOBalanceTemp[] {
         if (!this.balancesTemp1) {
         let str: string = localStorage.getItem('balances-temp-' + this.name);
         if (str) this.balancesTemp1 = _.map(JSON.parse(str), o => new VOBalanceTemp(o));
         else this.balancesTemp1 = [];
         }
         return this.balancesTemp1;
         }
         */
        /*saveBalancesTemp(balances: VOBalanceTemp[]): void {
         ///console.warn('saveBalancesTemp   ',balances);
         this.balancesTemp1 = balances;
         localStorage.setItem('balances-temp-' + this.name, JSON.stringify(balances));
         this.refreshBalanceTotal();

         }*/
        ////////////////////////////////////////////////////////////////// end Balance temp
        EthereumStorage.prototype.getBalancesHighestFirst = function () {
            var bals = this.getBalancesReceive();
            return _.sortBy(bals, function (item) { return item.balance; });
        };
        /* private addTempBalance(balance: VOBalance, balances: VOBalanceTemp[]): void {
         balances.forEach(function (item) {
         if (item.id == balance.id) {
         balance.balance += item.balance;
         }
         })
         }*/
        EthereumStorage.prototype.getAddressesNot0 = function (fee) {
            if (fee === void 0) { fee = 0; }
            return jaxx.Utils.getIds(this.getBalancesNot0(fee));
        };
        EthereumStorage.prototype.getBalancesNot0 = function (fee) {
            if (fee === void 0) { fee = 0; }
            return this.getBalancesNot0Receive(fee);
        };
        EthereumStorage.prototype.getAddressesNo0Receive = function (fee) {
            if (fee === void 0) { fee = 0; }
            return jaxx.Utils.getIds(this.getBalancesNot0Receive(fee));
        };
        EthereumStorage.prototype.getBalancesNot0Receive = function (fee) {
            if (fee === void 0) { fee = 0; }
            var out = [];
            //let ar:VOBalance[] = this._balancesReceive;
            var bals = this.getBalancesReceive(true);
            bals.forEach(function (item) {
                if (item.balance > fee)
                    out.push(new VOBalance({ id: item.id, balance: item.balance, index: item.index }));
            });
            return out;
        };
        EthereumStorage.prototype.getBalancesReceiveNot0WithSpend = function () {
            var out = [];
            var ar = this._balancesReceive;
            var spent = this.balancesTemp;
            var indexed = {};
            spent.forEach(function (b) {
                indexed[b.id] = b;
            });
            ar.forEach(function (bal) {
                if (bal.balance !== 0) {
                    var b = new VOBalance(bal);
                    if (indexed[b.id]) {
                        b.balance -= indexed[b.id].spent;
                        // b.nonce = indexed[b.id].nonce;
                    }
                    out.push(b);
                }
            });
            return out;
        };
        EthereumStorage.prototype.getBalancesIndexedReceiveNot0WithIndex = function () {
            var ballances = this.getBalancesReceive();
            if (ballances.length === 0)
                return [];
            var spending = this.getBalancesTemp();
            var spend = {};
            spending.forEach(function (b) {
                if (spend[b.id])
                    spend[b.id] += b.spent;
                else
                    spend[b.id] = b.spent;
                // spend[b.id] = b;
            });
            var out = [];
            for (var i = 0, n = ballances.length; i < n; i++) {
                var item = ballances[i];
                if (item.balance) {
                    item.index = i;
                    if (spend[item.id])
                        item.balance -= spend[item.id];
                    out.push(item);
                }
            }
            //console.log(out);
            /*
             let addresses: string[] = this.getAddressesReceive();
             ballances.forEach((item) => {
             if (item.balance) {
             let bal: VOBalance = new VOBalance(item);
             bal.index = addresses.indexOf(item.id);
             if (balancesTemp.length) this.addTempBalance(bal, balancesTemp);
             out.push(bal);
             }

             })*/
            return out;
        };
        EthereumStorage.prototype.getBalancesAll = function () {
            return this.getBalancesReceive();
        };
        EthereumStorage.prototype.getBalanceTotal = function () {
            return this.getBalanceReceive();
        };
        EthereumStorage.prototype.saveBalanceTotal = function (num) {
            this.balanceTotal = num;
            this.balanceTotalTimestamp = Date.now();
            localStorage.setItem('balance-total-timestamp-' + this.name, this.balanceTotalTimestamp + '');
            localStorage.setItem('balance-total-' + this.name, num + '');
        };
        EthereumStorage.prototype.getBalancesUnconfirmed = function () {
            if (!this.balancesUncofirmed) {
                var bals = JSON.parse(localStorage.getItem('balances-unconfirmed-' + this.name));
                if (!bals)
                    bals = [];
                else
                    bals = bals.map(function (item) {
                        return new VOBalance(item);
                    });
                this.balancesUncofirmed = bals;
            }
            return this.balancesUncofirmed;
        };
        EthereumStorage.prototype.saveBalancesUncofirmed = function (balances) {
            this.balancesUncofirmed = balances;
            var stamp = Date.now();
            localStorage.setItem('balances-unconfirmed-timestamp-' + this.name, stamp + '');
            localStorage.setItem('balances-unconfirmed-' + this.name, JSON.stringify(this.balancesUncofirmed));
        };
        EthereumStorage.prototype.getBalanceReceive = function () {
            // console.log(this._balancesReceive)
            //console.log( this.name + ' receive '+jaxx.Utils.calculateBalance(this.getBalancesReceive(true)))
            var bals = this.getBalancesReceive(true);
            //console.log(bals)
            return jaxx.Utils.calculateBalance(bals);
        };
        EthereumStorage.prototype.getBalanceRecaiveByAddress = function (address) {
            var ar = this.getBalancesReceive();
            for (var i = 0, n = ar.length; i < n; i++)
                if (ar[i].id === address)
                    return ar[i];
            return null;
        };
        /*getBalancesReceivePrev():VOBalance[] {
         return this.balancesReceivePrev.slice(0);
         }*/
        EthereumStorage.prototype.addBalanceReceive = function (balance) {
            var addresses = this.getAddressesReceive();
            if (addresses.indexOf(balance.id) !== -1)
                return;
            if (isNaN(balance.index))
                balance.index = this._balancesReceive.length;
            this._balancesReceive.push(balance);
            this._saveBalancesReceive();
            // this.saveCurrentIndexReceive(this._balancesReceive.length);
        };
        ///set to true risky lost sequence
        EthereumStorage.prototype.getBalancesReceive = function (orig) {
            // wallet.getPouchFold(COIN_BITCOIN).getDataStorageController()._db
            if (!this._balancesReceive) {
                var str = localStorage.getItem('balances-receive-' + this.name);
                //console.error(str);
                if (str) {
                    var data = JSON.parse(str);
                    if (!Array.isArray(data))
                        data = [data];
                    this._balancesReceive = data.map(function (item) {
                        return new VOBalance(item);
                    });
                }
                else
                    this._balancesReceive = [];
            }
            //console.log(this.balancesReceive1[this.balancesReceive1.length-1].balance);
            if (orig)
                return this._balancesReceive;
            var out = [];
            this._balancesReceive.forEach(function (item) {
                out.push(new VOBalance(item));
            });
            return out; //JSON.parse(JSON.stringify(this.balancesReceive1));
        };
        //balancesRecaiveTotal:number;
        EthereumStorage.prototype.updateBalancesReceive = function (ar) {
            this.balancesReceivePrev = this._balancesReceive;
            //console.log(' updateBalancesReceive ');
            //console.log(ar,this.getBalancesReceive());
            var indexed = _.keyBy(ar, 'id');
            var bals = this.getBalancesReceive(true);
            var stamp = Date.now();
            bals.forEach(function (item) {
                if (indexed[item.id])
                    item.balance = indexed[item.id].balance;
                item.timestamp = stamp;
            });
            //this._balancesReceive = Utils.updateOldBalances(this._balancesReceive, ar);
            // console.log(jaxx.Utils.calculateBalance(this._balancesReceive)/1e15);
            this._saveBalancesReceive();
        };
        EthereumStorage.prototype._saveBalancesReceive = function (ar) {
            if (ar)
                this._balancesReceive = ar;
            localStorage.setItem('balances-receive-timestamp' + this.name, Date.now() + '');
            localStorage.setItem('balances-receive-' + this.name, JSON.stringify(this._balancesReceive));
        };
        EthereumStorage.prototype.getTransactionsByAddressReceive = function (address) {
            var transactions = this.getTransactionsReceive();
            var out = [];
            transactions.forEach(function (item) {
                if (item.id === address)
                    out.push(item);
            });
            return out;
        };
        EthereumStorage.prototype.getTransactionsByAddress = function (address) {
            var out = this.getTransactionsByAddressReceive(address);
            // console.log('getTransactionsByAddressRecaive   ' + address, out);
            if (out.length)
                return out;
            //out = this.getTransactionsByAddressChange(address);
            //if (out.length) return out;
            return null;
        };
        EthereumStorage.prototype.getTransactionByIdReceive = function (id) {
            var transactions = this.getTransactionsReceive();
            return this._getTransactionById(transactions, id);
        };
        EthereumStorage.prototype._getTransactionById = function (transactions, id) {
            for (var i = 0, n = transactions.length; i < n; i++) {
                if (transactions[i].id === id)
                    return transactions[i];
            }
            return null;
        };
        EthereumStorage.prototype.getTransactionsAll = function () {
            return this.getTransactionsReceive(); //.concat(this.getTransactionsChange());
        };
        EthereumStorage.prototype.getTransactionReceiveLast = function () {
            var trs = this.getTransactionsReceive();
            var l = trs.length;
            return l ? trs[trs.length - 1] : null;
        };
        EthereumStorage.prototype.getTransactionsReceive = function () {
            if (!this.transactionsReceive) {
                this.transactionsReceive = [];
                var str = localStorage.getItem('transactions-receive-' + this.name);
                var trs = [];
                if (str) {
                    trs = JSON.parse(str).map(function (item) {
                        return new VOTransaction(item);
                    });
                }
                if (trs.length) {
                    this.transactionTimestampReceive = trs[trs.length - 1].timestamp;
                }
                this.transactionsReceive = trs;
            }
            // console.warn(this.name + '  '+ this.transactionsReceive.length);
            return this.transactionsReceive;
        };
        /*  setTransactionsReceive(trs: VOTransaction[]): void {
              if (trs.length === 0)return;
              Utils.sortByTimestamp(trs);
              this.transactionTimestampReceive = trs[trs.length - 1].timestamp;
              this.transactionsReceive = trs;
              this.saveTransactionsReceive(trs);
          }*/
        EthereumStorage.prototype.updateTransactionsReceive = function (new_transactions) {
            var transactions = this.getTransactionsReceive();
            jaxx.Utils.updateOldTransactions(transactions, new_transactions);
            this.transactionsReceive = transactions;
            this.saveTransactionsReceive();
        };
        EthereumStorage.prototype.setTransactions = function (trs) {
            this.transactionsReceive = trs;
            this.saveTransactionsReceive();
        };
        EthereumStorage.prototype.addTempTransactions = function (trs) {
            this.transactionsReceive = this.transactionsReceive.concat(trs);
        };
        EthereumStorage.prototype.updateTransactionsReceiveGetNew = function (new_transactions) {
            var transactions = this.getTransactionsReceive();
            jaxx.Utils.updateOldTransactions(transactions, new_transactions);
            var diff = jaxx.Utils.getNewTransactions(transactions, new_transactions);
            jaxx.Utils.sortByTimestamp(transactions);
            this.transactionsReceive = transactions.concat(diff);
            // let out:VOTransaction[] = Utils.filterLatest(trs,this.transactionTimestampReceive);
            if (this.transactionsReceive.length)
                this.transactionTimestampReceive = this.transactionsReceive[this.transactionsReceive.length - 1].timestamp;
            this.saveTransactionsReceive();
            return diff;
        };
        EthereumStorage.prototype.addTransactions = function (trs) {
            if (this.transactionsReceive)
                this.transactionsReceive = this.transactionsReceive.concat(trs);
            else
                this.transactionsReceive = trs;
            this.saveTransactionsReceive();
        };
        EthereumStorage.prototype.saveTransactionsReceive = function (transactionos) {
            // console.log(' saveTransactionsReceive  ', trs);
            if (transactionos)
                this.transactionsReceive = transactionos;
            if (this.transactionsReceive.length > this.maxTransactions) {
                this.transactionsReceive = this.transactionsReceive.slice(this.transactionsReceive.length - this.maxTransactions);
            }
            //console.warn(this.transactionsReceive.length);
            localStorage.setItem('transactions-receive-timestamp-' + this.name, this.transactionTimestampReceive + '');
            localStorage.setItem('transactions-receive-' + this.name, JSON.stringify(this.transactionsReceive));
        };
        EthereumStorage.prototype.saveHistoryTimestamp = function (num) {
            this.historyTimestamp = num;
            localStorage.setItem('history-timestamp-' + this.name, num + '');
        };
        EthereumStorage.prototype.getHistoryTimestamp = function () {
            if (this.historyTimestamp === -1) {
                var num = Number(localStorage.getItem('history-timestamp-' + this.name));
                if (isNaN(num))
                    num = 0;
                this.historyTimestamp = num;
            }
            return this.historyTimestamp;
        };
        EthereumStorage.prototype.getAddressesReceive = function () {
            var bals = this.getBalancesReceive(true);
            return jaxx.Utils.getIds(bals);
        };
        EthereumStorage.prototype.getCurrentAddressReceive = function () {
            if (!this.currentAddressReceive)
                this.currentAddressReceive = localStorage.getItem(this.name + 'current-address');
            return this.currentAddressReceive;
        };
        EthereumStorage.prototype.saveAddressReceive = function (address) {
            localStorage.setItem(this.name + 'current-address', address);
        };
        EthereumStorage.prototype.getCurrentIndexReceive = function () {
            return this.getBalancesReceive(true).length ? 0 : -1;
        };
        EthereumStorage.prototype.getAddressReceive = function (i) {
            return (i < this.getBalancesReceive(true).length) ? this._balancesReceive[i].id : null;
        };
        return EthereumStorage;
    }());
    jaxx.EthereumStorage = EthereumStorage;
})(jaxx || (jaxx = {}));
///////////////////////////////////////////////////////////////////////////////////////////////////////////
//# sourceMappingURL=ethereum-storage.js.map