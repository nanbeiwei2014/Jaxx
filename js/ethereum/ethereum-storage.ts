///<reference path="../com/models.ts"/>
///<reference path="../services/account-service.ts"/>
///<reference path="../com/Registry.ts"/>

module jaxx {

    export class EthereumStorage {

        emitter$:JQuery = $({});
        ON_BALANCE_TEMP_LENGTH_0:string = 'ON_BALANCE_TEMP_LENGTH_0';
        ON_BALANCE_TEMP_LENGTH_NOT_0:string = 'ON_BALANCE_TEMP_LENGTH_NOT_0';

        name: string;
        id: string;
        currentAddressChange: string;
        currentAddressReceive: string;
        currentIndexChange: number;
        currentIndexReceive: number;
        maxTransactions: number = 300;
        balancesTimestamp: number = 0;


        constructor(settings: any, config:any) {
            this.name = settings.name;
            this.id = settings.id;
        }


        clearStorage():void{

            console.log(this.name + '     storage cleared ');
            if(this.getBalancesReceive(true).length) this._saveBalancesReceive([]);
            if(this.getTransactionsReceive().length){
                this.saveTransactionsReceive([]);
            }
            //if(this.getTransactionsChange().length) this.saveTransactionsChange([]);
            //this.addressesChange = [];
           // this.addressesReceive = [];

        }

        setNewWallet(isNew:boolean):void{
            localStorage.setItem(this.name + 'newwallet',isNew?'true':'false');
        }

        isNewWallet():boolean{
            return localStorage.getItem(this.name + 'newwallet') ==='true'
        }
        /////UTXO and nonces to build transactions


        UTXOs: VOutxo[];

       // relayedTransactionListArray2: VORelayedTransactionList[] = [];


       /* addRelayedTransactionListArray(ar: VORelayedTransactionList[]): void {

            this.relayedTransactionListArray2 = this.relayedTransactionListArray2.concat(ar);

            // let utxos:ReferenceRelaysUTXOData[] = Utils.getTransactionsUnspentFromVORelayedTransactionList(ar);
            // console.log(' adding utxos ' + utxos.length);

            // console.log(this.UTXOs);
        }*/



        saveUTXOs(utxos: VOutxo[]): void {
            // console.log(' save utxos ', utxos);
            this.UTXOs = utxos;
            localStorage.setItem(this.name + '-UTXOs', JSON.stringify(this.UTXOs));
            localStorage.setItem(this.name + '-UTXOs-timestamp', Date.now() + '');
        }

        getUTXOs(): VOutxo[] {
            if (!this.UTXOs) {
                let str: string = localStorage.getItem(this.name + '-UTXOs');
                this.UTXOs = str ? JSON.parse(str) : [];
            }

            return this.UTXOs;
        }

        nonces: any;

        saveNonces(nonces: any): void {
            //console.log(' save nonces ', nonces);
            this.nonces = nonces;
            localStorage.setItem(this.name + '-nonces', JSON.stringify(this.nonces));
            localStorage.setItem(this.name + '-nonces-timestamp', Date.now() + '');


        }

        getNonces(): any {
            if (!this.nonces) {
                let str: string = localStorage.getItem(this.name + '-nonces');
                this.nonces = str ? JSON.parse(str) : {};
            }
            return this.nonces;
        }

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

        onBalancesDifference(diff: VOBalance[]): void {
            let indexed: _.Dictionary<VOBalance> = {};

            console.warn(this.name ,diff);
            diff.forEach(function (b) {
                indexed[b.id] = b
            });

            let ar: VOBalanceTemp[] = this.getBalancesTemp();

            for (let i = ar.length - 1; i >= 0; i--) {
                let b = ar[i];
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

            if(ar.length === 0){
               this.resetBalancesSpent();
            }
            ar.forEach(function (item) {
                console.log('%c left balances temp ' + item.id + '  ' + item.spent / 1e15, 'color:red');
            });

        }

        private balancesTemp: VOBalanceTemp[] = [];

        /* removeNulesSpent(){
         var ar:VOBalance[] = this.getBalancesTemp();
         for(var i=ar.length-1; i>=0; i--){
         if(ar[i].balance ===0 ) ar.splice(i,1)  ;
         }
         this.balancesSpent = ar;
         }*/

        checkBalancesSpent(): void {

            let ar: VOBalanceTemp[] = this.getBalancesTemp();
            let now: number = Date.now();

            let delta: number = 120000 * 1000;

            for (let i = ar.length - 1; i >= 0; i--) {

                if ((now - ar[i].timestamp) > delta) {
                    console.warn(now + ' removing balance spent due  timestamp  id: ' + ar[i].id + ' spent: ' + ar[i].spent + ' timestamp delta : ' + (now - ar[i].timestamp));
                    ar.splice(i, 1)
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
        }


        spentInreval: number = 0;

        addBalancesSpent(ar: VOBalanceTemp[]) {
            console.log(this.name + ' adding balances spent ', ar);
            if (this.spentInreval === 0) this.spentInreval = setInterval(() => this.checkBalancesSpent(), 20000);
            if(this.balancesTemp.length === 0){
                this.balancesTemp = ar;
                this.emitter$.triggerHandler(this.ON_BALANCE_TEMP_LENGTH_NOT_0,[ar]);
                return;
            }

            let out: VOBalanceTemp[] = [];
            for (let i = 0, n = ar.length; i < n; i++) {

                if (isNaN(ar[i].spent)) continue;

                let bal: VOBalanceTemp = this.getBalanceSpentById(ar[i].id);

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
            if (out.length) this.balancesTemp = this.balancesTemp.concat(out);
        }

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

        getBalancesTemp(): VOBalanceTemp[] {
            return this.balancesTemp;
        }

        getBalanceTemp(): number {
            return this.balancesTemp.reduce(function (a, b) {
                return a+=b.spent;
            },0);
           /* let spent = 0;
            this.balancesSpent.forEach(function (item) {
                spent += item.spent
            });
            return spent;*/
        };

        resetBalancesSpent(): void {
            //console.warn(' resetBalancesSpent ');
            this.emitter$.triggerHandler(this.ON_BALANCE_TEMP_LENGTH_0);
            this.balancesTemp = [];
        }

        getBalanceSpentById(id: string): VOBalanceTemp {
            let ar: VOBalanceTemp[] = this.getBalancesTemp();
            for (let i = 0, n = ar.length; i < n; i++) if (ar[i].id === id) return ar[i];
            return null;
        }


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


        getBalancesHighestFirst(): VOBalance[] {
            let bals: VOBalance[] = this.getBalancesReceive();

            return _.sortBy(bals, item => item.balance);
        }

        /* private addTempBalance(balance: VOBalance, balances: VOBalanceTemp[]): void {
         balances.forEach(function (item) {
         if (item.id == balance.id) {
         balance.balance += item.balance;
         }
         })
         }*/



        getAddressesNot0(fee: number = 0): string[] {
            return Utils.getIds(this.getBalancesNot0(fee));
        }

        getBalancesNot0(fee: number = 0): VOBalance[] {
            return this.getBalancesNot0Receive(fee);
        }


        getAddressesNo0Receive(fee: number = 0): string[] {
            return Utils.getIds(this.getBalancesNot0Receive(fee));

        }

        getBalancesNot0Receive(fee: number = 0): VOBalance[] {
            let out: VOBalance[] = [];
            //let ar:VOBalance[] = this._balancesReceive;
            let bals:VOBalance[] = this.getBalancesReceive(true);

                bals.forEach(function (item) {
                    if (item.balance > fee) out.push(new VOBalance({id: item.id, balance: item.balance, index: item.index}));
                });


            return out;
        }

        getBalancesReceiveNot0WithSpend(): VOBalance[] {
            let out: VOBalance[] = [];
            let ar: VOBalance[] = this._balancesReceive;
            let spent: VOBalanceTemp[] = this.balancesTemp;
            let indexed = {};
            spent.forEach(function (b) {
                indexed[b.id] = b;
            });

            ar.forEach(function (bal) {
                if (bal.balance !== 0) {
                    let b = new VOBalance(bal);
                    if (indexed[b.id]) {
                        b.balance -= indexed[b.id].spent;
                        // b.nonce = indexed[b.id].nonce;

                    }
                    out.push(b)

                }
            });
            return out;
        }


        getBalancesIndexedReceiveNot0WithIndex(): VOBalance[] {

            let ballances: VOBalance[] = this.getBalancesReceive();
            if (ballances.length === 0) return [];

            let spending: VOBalanceTemp[] = this.getBalancesTemp();

            let spend = {};

            spending.forEach(function (b) {

                if (spend[b.id]) spend[b.id] += b.spent;
                else spend[b.id] = b.spent;
                // spend[b.id] = b;

            });

            let out: VOBalance[] = [];

            for (let i = 0, n = ballances.length; i < n; i++) {
                let item: VOBalance = ballances[i];

                if (item.balance) {
                    item.index = i;
                    if (spend[item.id]) item.balance -= spend[item.id];
                    out.push(item)
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
        }



        getBalancesAll(): VOBalance[] {
            return this.getBalancesReceive()
        }


        getBalanceTotal(): number {

            return this.getBalanceReceive();
        }


        balanceTotalTimestamp: number;
        balanceTotal: number = -1;


        saveBalanceTotal(num: number): void {
            this.balanceTotal = num;
            this.balanceTotalTimestamp = Date.now();
            localStorage.setItem('balance-total-timestamp-' + this.name, this.balanceTotalTimestamp + '');
            localStorage.setItem('balance-total-' + this.name, num + '');
        }




        getBalancesUnconfirmed():VOBalance[]{

            if(!this.balancesUncofirmed){
               let bals:any[] =  JSON.parse(localStorage.getItem('balances-unconfirmed-' + this.name));
               if(!bals) bals =[];
               else bals = bals.map(function (item) {
                   return new VOBalance(item);
               })

                this.balancesUncofirmed = bals

            }
            return this.balancesUncofirmed;
        }

        balancesUncofirmed:VOBalance[];

        saveBalancesUncofirmed(balances:VOBalance[]):void{
            this.balancesUncofirmed = balances;
            let stamp:number = Date.now();
            localStorage.setItem('balances-unconfirmed-timestamp-' + this.name,stamp+'');
            localStorage.setItem('balances-unconfirmed-' + this.name, JSON.stringify(this.balancesUncofirmed));
        }






        private _balancesChange: VOBalance[];
        balancesChangePrev: VOBalance[];



        private _balancesReceive: VOBalance[];
        balancesReceivePrev: VOBalance[];

        getBalanceReceive(): number {
            // console.log(this._balancesReceive)
            //console.log( this.name + ' receive '+jaxx.Utils.calculateBalance(this.getBalancesReceive(true)))

            let bals = this.getBalancesReceive(true);
            //console.log(bals)
            return jaxx.Utils.calculateBalance(bals);
        }

        getBalanceRecaiveByAddress(address: string): VOBalance {
            let ar: VOBalance[] = this.getBalancesReceive();
            for (let i = 0, n = ar.length; i < n; i++) if (ar[i].id === address) return ar[i];
            return null
        }


        /*getBalancesReceivePrev():VOBalance[] {
         return this.balancesReceivePrev.slice(0);
         }*/


        addBalanceReceive(balance: VOBalance): void {
            let addresses:string[] = this.getAddressesReceive();
            if(addresses.indexOf(balance.id) !==-1) return;
            if(isNaN(balance.index)) balance.index = this._balancesReceive.length;
            this._balancesReceive.push(balance);
            this._saveBalancesReceive();
           // this.saveCurrentIndexReceive(this._balancesReceive.length);
        }

        ///set to true risky lost sequence
        getBalancesReceive(orig?: boolean): VOBalance[] {
            // wallet.getPouchFold(COIN_BITCOIN).getDataStorageController()._db
            if (!this._balancesReceive) {
                let str: string = localStorage.getItem('balances-receive-' + this.name);
                //console.error(str);
                if (str) {
                    let data: any = JSON.parse(str);
                    if (!Array.isArray(data)) data = [data];
                    this._balancesReceive = data.map(function (item) {
                        return new VOBalance(item);
                    });
                }
                else this._balancesReceive = [];
            }
            //console.log(this.balancesReceive1[this.balancesReceive1.length-1].balance);

            if (orig)return this._balancesReceive;
            let out: VOBalance[] = [];
            this._balancesReceive.forEach(function (item) {
                out.push(new VOBalance(item));
            });

            return out;//JSON.parse(JSON.stringify(this.balancesReceive1));
        }


        //balancesRecaiveTotal:number;


        updateBalancesReceive(ar: VOBalance[]): void {
            this.balancesReceivePrev = this._balancesReceive;
            //console.log(' updateBalancesReceive ');
            //console.log(ar,this.getBalancesReceive());
            let indexed:any = _.keyBy(ar,'id');

            let bals:VOBalance[] = this.getBalancesReceive(true);

            let stamp:number = Date.now();

            bals.forEach(function (item) {
                if(indexed[item.id]) item.balance = indexed[item.id].balance;
                item.timestamp = stamp;
            });

            //this._balancesReceive = Utils.updateOldBalances(this._balancesReceive, ar);
            // console.log(jaxx.Utils.calculateBalance(this._balancesReceive)/1e15);
            this._saveBalancesReceive();

        }

        _saveBalancesReceive(ar?: VOBalance[]): void {
            if (ar) this._balancesReceive = ar;
            localStorage.setItem('balances-receive-timestamp' + this.name, Date.now() + '');
            localStorage.setItem('balances-receive-' + this.name, JSON.stringify(this._balancesReceive));
        }



        getTransactionsByAddressReceive(address: string): VOTransaction[] {
            let transactions: VOTransaction[] = this.getTransactionsReceive();
            let out: VOTransaction[] = [];
            transactions.forEach(function (item) {
                if (item.id === address) out.push(item)
            });
            return out;
        }

        getTransactionsByAddress(address: string): VOTransaction[] {

            let out: VOTransaction[] = this.getTransactionsByAddressReceive(address);
            // console.log('getTransactionsByAddressRecaive   ' + address, out);
            if (out.length) return out;
            //out = this.getTransactionsByAddressChange(address);
            //if (out.length) return out;
            return null
        }


        getTransactionByIdReceive(id: string): VOTransaction {
            let transactions: VOTransaction[] = this.getTransactionsReceive();
            return this._getTransactionById(transactions, id);
        }

        private _getTransactionById(transactions: VOTransaction[], id: string): VOTransaction {
            for (let i = 0, n = transactions.length; i < n; i++) {
                if (transactions[i].id === id) return transactions[i];
            }
            return null;
        }



        getTransactionsAll(): VOTransaction[] {
            return this.getTransactionsReceive();//.concat(this.getTransactionsChange());
        }

        private transactionsReceive: VOTransaction[];

        getTransactionReceiveLast(): VOTransaction {
            let trs: VOTransaction[] = this.getTransactionsReceive();
            let l: number = trs.length;
            return l ? trs[trs.length - 1] : null;
        }


        getTransactionsReceive(): VOTransaction[] {
            if (!this.transactionsReceive) {
                this.transactionsReceive = [];
                let str: string = localStorage.getItem('transactions-receive-' + this.name);
                let trs: VOTransaction[] = [];
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
            return this.transactionsReceive
        }


        transactionTimestampReceive: number = 0;

      /*  setTransactionsReceive(trs: VOTransaction[]): void {
            if (trs.length === 0)return;
            Utils.sortByTimestamp(trs);
            this.transactionTimestampReceive = trs[trs.length - 1].timestamp;
            this.transactionsReceive = trs;
            this.saveTransactionsReceive(trs);
        }*/

        updateTransactionsReceive(new_transactions:VOTransaction[]):void{
            let transactions: VOTransaction[] = this.getTransactionsReceive();
            Utils.updateOldTransactions(transactions, new_transactions);
            this.transactionsReceive = transactions;
            this.saveTransactionsReceive();
        }


        setTransactions(trs:VOTransaction[]):void{
            this.transactionsReceive = trs;
            this.saveTransactionsReceive();
        }

        addTempTransactions(trs:VOTransaction[]):void{
            this.transactionsReceive = this.transactionsReceive.concat(trs);
        }

        updateTransactionsReceiveGetNew(new_transactions: VOTransaction[]): VOTransaction[] {
            let transactions: VOTransaction[] = this.getTransactionsReceive();

                Utils.updateOldTransactions(transactions, new_transactions);

            let diff: VOTransaction[] =  Utils.getNewTransactions(transactions, new_transactions);

            Utils.sortByTimestamp(transactions);

            this.transactionsReceive = transactions.concat(diff);


            // let out:VOTransaction[] = Utils.filterLatest(trs,this.transactionTimestampReceive);

            if( this.transactionsReceive.length)this.transactionTimestampReceive = this.transactionsReceive[this.transactionsReceive.length - 1].timestamp;

            this.saveTransactionsReceive();

            return diff;
        }




        addTransactions(trs:VOTransaction[]):void{
            if(this.transactionsReceive)this.transactionsReceive =  this.transactionsReceive.concat(trs);
            else this.transactionsReceive = trs;
            this.saveTransactionsReceive();
        }


        saveTransactionsReceive(transactionos?:VOTransaction[]): void {
           // console.log(' saveTransactionsReceive  ', trs);

            if(transactionos)this.transactionsReceive = transactionos;
            if (this.transactionsReceive.length > this.maxTransactions) {
                this.transactionsReceive = this.transactionsReceive.slice(this.transactionsReceive.length - this.maxTransactions);
            }

            //console.warn(this.transactionsReceive.length);

            localStorage.setItem('transactions-receive-timestamp-' + this.name, this.transactionTimestampReceive + '');
            localStorage.setItem('transactions-receive-' + this.name, JSON.stringify(this.transactionsReceive));
        }

        //////////////// transactions change
       // private transactionsChange: VOTransaction[];

        /*getTransactionsChangeLast():VOTransaction{
         let trs:VOTransaction[] = this.getTransactionsChange();
         let l:number = trs.length;
         return l?trs[trs.length-1]:null;
         }*/

        transactionTimestampChange: number;



        historyTimestamp: number = -1;

        saveHistoryTimestamp(num: number): void {
            this.historyTimestamp = num;
            localStorage.setItem('history-timestamp-' + this.name, num + '');
        }

        getHistoryTimestamp(): number {
            if (this.historyTimestamp === -1) {
                let num: number = Number(localStorage.getItem('history-timestamp-' + this.name));
                if (isNaN(num)) num = 0;
                this.historyTimestamp = num;
            }
            return this.historyTimestamp;
        }

        getAddressesReceive(): string[] {
                let bals: VOBalance[] = this.getBalancesReceive(true);
                return  Utils.getIds(bals);

        }


        getCurrentAddressReceive(): string {
            if(!this.currentAddressReceive)this.currentAddressReceive =  localStorage.getItem(this.name + 'current-address');
            return this.currentAddressReceive;
        }


        saveAddressReceive(address:string):void{
            localStorage.setItem(this.name + 'current-address', address);
        }


        getCurrentIndexReceive(): number {

            return this.getBalancesReceive(true).length?0:-1;

        }

        getAddressReceive(i: number):string {
            return (i < this.getBalancesReceive(true).length)?this._balancesReceive[i].id:null;
        }
        /////////////////// addresses Change////////////////



    }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
