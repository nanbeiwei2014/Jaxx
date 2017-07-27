/**
 * Created by Vlad on 11/10/2016.
 */


module jaxx {

    export class TransactionsToken {
        accountService: JaxxAccountService;
        db: JaxxDatastoreLocal;
        name: string;
        toSaveNonces: boolean;
       // toSaveUTXO: boolean;
        toSaveBalances: boolean;
        toSaveTempUTXOs: boolean;
        nonces: _.Dictionary<number> = {};

        balancesTemp: VOBalanceTemp[] = [];

        CACHE_EXPIRE: number =  1000 * 60 * 60 * 24;
        intervalSaveScanner: number = 2500;

        emitter$ = $({});

        ON_ALL_TRANSACTIONS_SENT: string = 'ON_TRANSACTIONS_SENT';
        ON_ONE_TRANSACTION_SENT: string = 'ON_ONE_TRANSACTION_SENT';
        ON_TRANSACTIONS_CONFIRMED: string = 'ON_TRANSACTIONS_CONFIRMED';

        ON_UTXOS_READY: string = 'ON_UTXOS_READY';
        ON_NONCES_READY:string = 'ON_NONCES_READY';

        service: JaxxAccountService;
        downloadingData: JQueryPromise<any>;

        lastSendTimestamp: number;
        isActive: boolean;


        logNonces() {
            console.log('%c nonces', 'color:red');
            for (let str in this.nonces) console.log(str + ' ' + this.nonces[str]);
        }

        private saveInterval: number;
        private refreshInterval:number;
        private isToken:boolean;

        constructor(private controller: any) {

            this.isToken = controller.isToken;
            this.accountService = controller._accountService;
            this.name = controller.name;
            this.db = controller._db;
            this.service = controller._accountService;

            this.service.balances$.on(this.service.ON_NEW_TRANSACTIONS, () => {
                this.prepareTransactions();
            });

            this.service.balances$.on(this.service.ON_BALANCES_DIFFERENCE, (evt, diff:string[]) => {
                //console.log(diff);
                this.refreshData();
            });

            this.controller.emitter$.on(this.controller.ON_CURRENT_ADDRESS_RECEIVE_GOT_BALANCE, (evt, balance: VOBalance) => {
                //console.log(' new balance     ', balance);

                this.refreshData();
                if(this.isToken){

                }
            });

            controller.emitter$.on(controller.ON_RESTORE_HISTORY_DONE, () => {
                this.refreshData();
                //this.prepareTransactions();
            });

            this.controller.emitter$.on(this.controller.ON_TRANSACTION_CONFIRMED,(evt, transactions:VOTransaction[])=>{
               this.refreshData();
            })

        }

        ///////////////////////////////////////////////////////////////////////////////

        onSendTransactionStart(data: any): void {
            data.name = this.name;
            console.log(this.name + ' transaction start ',data);
        }

        ////////////////////////////////////////////////////////////////////////////////////

        timeoutSentTransactions: number;

        registerSentTransaction(data: {sent: any, result: any, name: string, fee: number}): void {
           // console.error(data);



            this.lastSendTimestamp = Date.now();
            //this.isActive = true;
            // this.checkStatus();

            console.log(this.name + ' Transaction sent', data);

            let txid:string  = data.sent._kkMockTx.txid;

            console.log('%c '+ txid, 'color:violet');

            if (data.result.error) {
                console.error(data.result, this.nonces, this.utxos);
                return;
            }



            if (this.name.indexOf('Ethereum') !== -1) {
                console.warn(this.name + ' sending ' + data.sent.valueDelta)

                txid= data.result.result;

                if(this.isToken)data.sent.gasPrice = 0;

                var bal: VOBalanceTemp = this.createBalanceTempEther(data.sent, txid);


                if(this.isToken){
                    let amount:number = jaxx.Registry.tempStorage[this.name]['amount'];
                    bal.spent = amount;
                  //  console.warn(bal);
                   Registry.Ethereum.transactionController.addTempNonce(bal);
                   // return;
                }else {

                    this.addTempNonce(bal);
                }

                this.db.addBalancesSpent([bal]);

                console.log(this.name + ' adding balance temp');
                clearTimeout(this.timeoutSentTransactions);
                this.timeoutSentTransactions = setTimeout(() => {
                    this.emitter$.triggerHandler(this.ON_ALL_TRANSACTIONS_SENT);
                }, 500);

            } else {




                let sentObj: VOTransactionSentObj = new VOTransactionSentObj(data.sent);

             //   console.log(sentObj)

                let vosent:VOTransactionSent = sentObj.sent;


                let sent:any = data.sent;
                let kkMockTx = sent._kkMockTx;

                let from:string = vosent.inputs[0].address;
                let to:string =vosent.outputs[0].address;
                let amount:number = vosent.outputs[0].amount;
                let timestamp:number = Math.round(vosent.timestamp/1000);
                let fee:number = sentObj.fee;


                if(sentObj.sent.inputs[0].address === 'notmyaddress'){
                    console.log(' it is not my transaction  ');
                    return;
                }

                this.sendTransactionController(sentObj);

              //  this.emitter$.triggerHandler(this.ON_TRANSACTIONS_SENT,tr);
                this.timeoutSentTransactions = setTimeout(() => {
                    this.emitter$.triggerHandler(this.ON_ALL_TRANSACTIONS_SENT);
                }, 500);
            }



            this.lastSendTimestamp = Date.now();

            this.emitter$.triggerHandler(this.ON_ONE_TRANSACTION_SENT);

        }


        createBalanceTempBitcoin(input: VOInput): VOBalanceTemp {

            return new VOBalanceTemp({
                id: input.address,
                timestamp: Date.now(),
                txid: input.txid,
                count: 0,
                value: input.amount,
                spent: -input.amount
            });

        }


        getBalancesTempFromTransaction(sent: VOTransactionSent): VOBalanceTemp[] {

            let ar: VOInput[] = sent.inputs;
            let indexed = {};

            for (let i = 0, n = ar.length; i < n; i++) {
                let input: VOInput = ar[i];

                if (indexed[input.address]) {
                    indexed[input.address].value -= input.amount
                } else {
                    indexed[input.address] = this.createBalanceTempBitcoin(input);
                }
            }

            let balancesTemp: VOBalanceTemp[] = [];

            for (let str in indexed) {
                balancesTemp.push(indexed[str]);
            }

            return balancesTemp;
        }


        tempUTXOS: VOutxo[] = [];


        sendTransactionController(sent: VOTransactionSentObj): void {

            //console.log(sent);

            let toSpent: VOOutput[] = sent.toSpent;

            let transaction: VOTransactionSent = sent.sent;

            let txid: string = transaction.txid;

            let outputs: VOOutput[] = transaction.outputs;

           // console.log(outputs);

            let toAddress: string = outputs[0].address;


            let myReceive: string[] = this.controller.getAddressesReceive();

            let addressChange:string = this.controller.getCurrentAddressChange();

            let change: VOOutput;

            /// TODO what to do with outputs;
            /// what am


            outputs.forEach(function (item) {
                if(item.address === addressChange){
                    change = item;
                }


                if (item.addressInternal) {
                    change = item;
                }
                else {

                    let ind: number = myReceive.indexOf(item.address);

                    if (ind !== -1) {

                        let utxo: VOutxo = new VOutxo(item);
                        utxo.amountBtc = HDWalletHelper.convertSatoshisToBitcoins(item.amount);
                        utxo.addressIndex = ind;
                        //  utxo.index = 0;
                        utxo.standard = true;

                        console.log(' going to my address ', item);
                    }

                }

            });


            let inputs: VOInput[] = transaction.inputs;

            console.log('inputs,outputs',inputs,outputs);

            let tempBalance: VOBalanceTemp[] = Utils.createTempBalancesFromInputs(inputs, toAddress);


            if(change){
                console.log(' adding change   ' + change.amount);

                let balanceChange:VOBalanceTemp = new VOBalanceTemp({
                    id:change.address,
                    spent:-change.amount,
                    txid:txid,
                    timestamp:Date.now()
                });
                tempBalance.push(balanceChange);
            }

            this.db.addBalancesSpent(tempBalance);
            console.log(tempBalance);

            this.utxosSpentIds = inputs.map(function (item) { return item.address+'-'+item.previousTxId; });

        }

        utxosSpentIds:string[] = [];

        updateUTXOS(utxos: VOutxo[]): void {
            this.utxos = Utils.updateUTXOS(this.utxos, utxos);
            this.toSaveTempUTXOs = true;
        }

        loadUnconfirmedTransactions(): void {
            let uncofirmed: VOutxo[] = this.getUTXOs().filter(function (item) {
                return item.inqueue;
            })
        }


        intervalCheckUTXO: number = 0;
        delayCheckUTXOInterval: number = 10000;


        sartCheckUTXOS(): void {
            if (this.intervalCheckUTXO === 0) {
                this.intervalCheckUTXO = setInterval(() => this.loadUnconfirmedTransactions(), this.delayCheckUTXOInterval)
            }
        }


        addUTXO(utxo: VOutxo): void {
            this.utxos.push(utxo);

        }


        remapUTXOs(utxos: VOutxo[]): VOutxo[] {
            let ctr:JaxxCryptoController = this.controller;
            utxos.forEach(function (item) {

                item.addressIndex = ctr.getAddressIndex(item.address);
                item.addressInternal = ctr.isAddressInternal(item.address);
                    item.spent = false;
                    item.standard = true;
                    item.index = item.vout;
            });
            return utxos;

        }


        remapTransactionsToOldCode(unspent: VOTransactionUnspent[]): VOutxo[] {

            let out: any[] = [];
            let indexed:any = {};

            for (let i = 0, n = unspent.length; i < n; i++) {
                let trs = unspent[i];
                if(indexed[trs.id + trs.address]){

                    console.warn(' duplicate UTXO ' + trs.id + ' address: ' +  trs.address);
                    continue;
                }
                indexed[trs.id + trs.address] = trs;

                out.push(new VOutxo({
                    address: trs.address,
                    addressIndex: this.controller.getAddressIndex(trs.address),
                    addressInternal: this.db.isAddressInternal(trs.address),
                    amount: trs.amount,
                    amountBtc: trs.amountBtc + '',
                    confirmations: trs.confirmations,
                    index: trs.index,
                    spent: false,
                    standard: true,
                    timestamp: trs.timestamp,
                    txid: trs.id
                }));

            }
            return out;
        }

        downloadUTXOs(callBack:Function,): void {
          //  console.log(' downloadUTXOs  '+  this.downloadingData);
            if(this.downloadingData) return;
            let start: number = Date.now();
            let addresses = this.db.getAddressesNot0();


            if (addresses.length === 0) {
                return;
            }

            this.downloadingData = this.service.downloadTransactionsUnspent(addresses).done(res => {
              //  console.log(addresses.length);
                console.log('%c '+this.name + ' download UTXOs in ' + (Date.now() - start) + ' ms','color:green');


                let utxos:VOutxo[];
                if(!res.utxos)utxos = this.remapUTXOs(res.result);
                else utxos = this.remapTransactionsToOldCode(res.utxos);
                let utxosSpentIds:string[] = this.utxosSpentIds;
               // console.log(utxosSpentIds);
                let outUtxos:VOutxo[] = [];
               // console.log(utxos);
                this.utxos = utxos.filter(function (item) { return utxosSpentIds.indexOf(item.address+'-'+item.txid) ===-1 });
                //this.utxos =
                this.db.saveUTXOs(this.utxos);
                 console.log(this.utxos);

               // this.toSaveUTXO = true;
                this.lastSendTimestamp = 0;
                this.unspentObj = res.result;

                this.emitter$.triggerHandler(this.ON_UTXOS_READY,[this.getUTXOs()]);
                callBack();
            }).fail(err=>callBack(err))
                .always(()=>this.downloadingData = null);
        }



        getUTXOsInQueue(): VOutxo[] {

            return this.getUTXOs().filter(function (item) {
                return item.inqueue
            });
        }

        getUTXOsNotInQueue(): VOutxo[] {

            return this.getUTXOs().filter(function (item) {
                return !item.inqueue
            });
        }

        getUTXOs(): VOutxo[] {

            return Utils.deepCopy(this.utxos) || [];

        }

        ////////////////////////////// en of Bitcoin ///////////////////////////////////////////

        onNewTransactions(transactions: VOTransaction[]): void {
            //console.warn('new transactions',transactions);

        }

        //////////////////////////////////////// integration //////////////////////////////


        deactivate(): void {
            this.isActive = false;
            clearInterval(this.saveInterval);
            clearInterval(this.refreshInterval);
            this.downloadingData = null;
        }

        ON_PREPAROING_TRANSACTIONS: string = 'ON_PREPAROING_TRANSACTIONS';

        activate(): void {
            if(this.isActive) return;
            this.isActive = true;

            console.log('%c ' + this.name + ' activating transaction-controller ' + this.lastSendTimestamp,'color:green');



            clearInterval(this.saveInterval);
            clearInterval(this.refreshInterval);
            if(this.isToken){
                jaxx.Registry.Ethereum.transactionController.refreshData();
                return;
            }
            this.prepareTransactions();

            this.refreshInterval = setInterval(()=>{
                if(this.name.indexOf('Ethereum') === -1) this.refreshData();
            },20000);


            //this.saveInterval = setInterval(() => this.saveScanner(), this.intervalSaveScanner);

        }

        refreshData():JQueryDeferred<any>{
            let promise:JQueryDeferred<any> = $.Deferred();

            if (this.name.indexOf('Ethereum') !== -1){


                console.log('%c '+ this.name + ' calling download nonce  is busy ' + this.downloadingData,'color:orange');
                this.downloadNonce((err)=>{
                    if(err) promise.reject(err);
                    else promise.resolve(this.nonces);
                });
            }
            else  this.downloadUTXOs((err)=>{

                if(err) promise.reject(err);
                else promise.resolve(this.getUTXOs())
            });
            return promise;
        }



        prepareTransactions():void{
            if (this.name.indexOf('Ethereum') !== -1){
                this.nonces = this.db.getNonces();
                this.refreshData();
            } else {
                this.utxos = this.db.getUTXOs();
               // this.utxos = _.uniqBy(this.utxos, 'txid');
                this.refreshData();
            }
        }


        reset(): void {
            this.db.saveNonces({});
            this.db.saveUTXOs([]);
            this.db.resetBalancesSpent();
           // this.transactionsReceive = null;
            this.utxos = null;
            this.nonces = null;
            this.lastSendTimestamp = 0;
        }

        private utxos: VOutxo[] = [];
        private unspentObj: any = {};
        downloadingTransactions$: JQueryPromise<any>;


////////////////////////////////////// Ethereum //////////////////////////////////////////////////////


        createBalanceTempEther(tr: any, txid: string): VOBalanceTemp {

            var sent: number = -tr.valueDelta;
            var fee: number = tr.gasPrice * tr.gasUsed;
            var to: string = tr.to;
            // var txid:string = result.result.result;


            var balanceT: VOBalanceTemp = new VOBalanceTemp({
                id: tr.from,
                fee: tr.gasPrice * tr.gasUsed,
                // balance:- (sent + fee),
                nonce: tr.nonce,
                spent: (sent + fee),
                timestamp: Date.now(),
                txid: txid,
                count: 0,
                value: tr.valueDelta
            });

            return balanceT;

        }

        //downloadNonceForAddress(address:string)

        downloadNonceForFirstAddress():void{
            if(Object.keys(this.nonces).length){
                console.log(' have nonces -> breaking ' , this.nonces);
                return;
            }
            console.log(' download nonce of first address ');
            let address:string =  this.controller.getAddressReceive(0);

           // his.downloadingData =
                this.service.downloadTransactions([address]).done((trs: any) => {


              //  this.downloadingData = null;
                let nonces = jaxx.Utils.getNoncesOfAddresses(trs);

                if(!this.nonces) this.nonces = {};
                this.nonces[address] = nonces[address];
                this.toSaveNonces = true;
                console.log(this.name,this.nonces);
                //this.emitter$.triggerHandler(this.ON_PREPARING_READY);
                this.lastSendTimestamp = 0;
                //console.log('%c transactions receive  in: '+(Date.now() - start)+'ms','color:#bb0');

            })
        }

        //transactionsReceive: VOTransaction[];


        downloadNonce(callBack:Function): void {

            if(this.downloadingData) return;

            this.emitter$.triggerHandler(this.ON_PREPAROING_TRANSACTIONS);

            let start: number = Date.now();

            var addesses: string[] = Utils.addresseFromBalances(this.db.getBalancesNot0Receive());

             console.log('%c '+ this.name + ' have not 0 balances ' + addesses.length,'color:orange');

             if (addesses.length == 0) {

                this.nonces = {};
                this.db.saveNonces(this.nonces);
                return;
            }

            this.downloadingData = this.service.downloadTransactions(addesses).done((trs: any) => {

                // console.log(trs);
                //this.transactionsReceive = trs;
                this.downloadingData = null;

                this.nonces = jaxx.Utils.getNoncesOfAddresses(trs);

                this.db.saveNonces(this.nonces);

                //this.toSaveNonces = true;
                console.log(this.name + ' download nonce in ' + (Date.now() - start) + ' ms',this.nonces);

                this.emitter$.triggerHandler(this.ON_NONCES_READY,this.getNonces());

                this.lastSendTimestamp = 0;
                //console.log('%c transactions receive  in: '+(Date.now() - start)+'ms','color:#bb0');


            }).fail(err=>callBack(err))
            //.progress(res=>console.log(res+'%c ready transactions receive ','color:#bb0'))
                .always(res => this.downloadingData = null);

        }


        getNonces(orig?:boolean):any{
            return orig?this.nonces:_.clone(this.nonces);
        }

        addTempNonce(balance: VOBalanceTemp) {
            console.log('%c  ' + this.name + ' add nonce  to address '+ balance.id,'color:orange' );
            if (this.nonces) {

                if (this.nonces[balance.id]) {

                    this.nonces[balance.id]++;
                    console.log('%c '+ this.name + ' nonce added to ' + balance.id + '   ' + this.nonces[balance.id], 'color:orange');
                } else {
                    this.nonces[balance.id] = 1;
                    console.log('%c nonce setting  to 1 ' + balance.id, 'color:orange');
                }

                this.toSaveNonces = true;

            } else console.error(' nonces are not ready ');
        }


        getNonceForAddress(address: string): number {
            return this.nonces[address] || 0;
        }


        //sortedHighestAccountArray:{index:number, balance:number, address:string}[] = [];

        getHighestAccountBalanceAndIndex(): {index: number, balance: number, address: string}[] {
            // if(this.highestAccountBalanceAndIndex) return this.highestAccountBalanceAndIndex;
            var balancesReceive: VOBalance[] = this.db.getBalancesIndexedReceiveNot0WithIndex();
            var balancesChange: VOBalance[] = this.db.getBalancesIndexedChangeNot0WithIndex();
            /// console.log(balancesReceive);
            var balances: VOBalance[] = balancesReceive.concat(balancesChange);


            var ar: VOBalance[] = _.sortBy(balances, ['balance']).reverse();

            var out: {index: number, balance: number, address: string}[] = [];
            _.each(ar, function (item) {
                out.push({index: item.index, balance: item.balance, address: item.id});
            });

            if (out.length === 0) {
                this.controller._sortedHighestAccountArray = [];
                return null;
            }

            return out;
            // return this.controller._sortedHighestAccountArray[0];
        }


        prepareAddresses(addresses: string[]): JQueryDeferred<any> {

            var deferred: JQueryDeferred<_.Dictionary<number>> = $.Deferred();
            deferred.resolve(this.nonces);


            return deferred;
        }



    }


}