///<reference path="../com/models.ts"/>
///<reference path="../services/account-service.ts"/>
///<reference path="../com/Registry.ts"/>
///<reference path="../datastore/datastore_local.ts"/>
///<reference path="../datastore/outgoing_transaction_controller.ts"/>
///<reference path="../datastore/transactions_temp_control.ts"/>
///<reference path="../datastore/build_transaction_controller.ts"/>
///<reference path="../datastore/transactions_updater.ts"/>
///<reference path="../com/Utils.ts"/>

//import TransactionController = jaxx.OutgoingTransactionController;
///import CheckTransactionBlockr = jaxx.CheckTransactionBlockr;

//import OutgoingTransactionController = jaxx.OutgoingTransactionController;
//import CheckTempTransactionsController = jaxx.CheckTempTransactionsController;
//import Dictionary = _.Dictionary;
//import Utils = jaxx.Utils;
//import CheckTransaction = jaxx.CheckTransaction;

//import TransactionsUpdater = jaxx.TransactionsUpdater;


module jaxx {

    export class EthereumController implements EthereumDB {

        _accountService: EthereumService;
        private transactionsUpdater: jaxx.TransactionsUpdater;
        private rawAppData: any;

        _coinType: number;
        id: number;
        name: string;
        coin_HD_index: number;

        hasData: boolean;
        fee: number;
        isToken: boolean;
        // intervalAllBalancesCheckDefault:number ;
        intervalAllBalancesCheckCurrent: number = 30000;
        intervalCurrentBalanceCheck: number = 10000;

        public isBusy: boolean;
        isRestoringHistory: boolean;
        isEnabled: boolean;





        ON_RESTORE_HISTORY_START: string = 'ON_RESTORE_HISTORY_START';
        ON_RESTORE_HISTORY_DONE: string = 'ON_RESTORE_HISTORY_DONE';

        ON_TRANSACTION_CONFIRMED: string = 'ON_TRANSACTION_CONFIRMED';


        emitter$ = $({});

        //checkTempTransactionsController:jaxx.CheckTempTransactionsController;

        transactionController: jaxx.TransactionsEthereum;

        historyError: any;


        //coinType:number;


        controllerSettings: any = {};
        /// outgoingTransactions:TransactionController[] = [];
        //    id:string;
        //    name:string;
        //    coin_HD_index:number;
        //accounts:VOAccount[] = [];

        balance: number;
        _db:EthereumStorage;

      //  config: any;

        isBalancesOutOfSync: boolean;


        // newWallet:boolean;
        constructor(private pouch: HDWalletPouch, private  config: any) {
           // console.warn(this);

            let name: string = pouch._coinFullName;



           // console.warn(config);
            config._coinType = pouch._coinType;


            //  console.log(pouch);

            if (name === 'RSK Testnet') name = 'RootstockEthereum';

            this.pouch = pouch;
            this._coinType = pouch._coinType;
            this.id = pouch._coinType;
            this.name = name;

            this.coin_HD_index = pouch._hdCoinType;

            pouch.setDataStorageController(this);


           // setTimeout(()=>this.init(),5000);
            this.init();
           setTimeout(()=>this.afterAppInit(),100);


        }


        init(): void {




            /*g_JaxxApp.cryptoDispatcher$.on('CRYPTO_SELECTED',(evt,data) =>{
             console.warn(data);

             });*/
            ///console.log(pouch);
            //var coinHDType = HDWalletPouch.getStaticCoinPouchImplementation(this._pouch._coinType).pouchParameters['coinHDType'];
            //var coinIsTokenSubtype = HDWalletPouch.getStaticCoinPouchImplementation(this._pouch._coinType).pouchParameters['coinIsTokenSubtype'];
            // var coinAbbreviatedName = HDWalletPouch.getStaticCoinPouchImplementation(this._pouch._coinType).pouchParameters['coinAbbreviatedName'];
            // var coinFullName = HDWalletPouch.getStaticCoinPouchImplementation(this._pouch._coinType).uiComponents['coinFullName'];


            this.controllerSettings = {
                id: this.id,
                name: this.name,
                coin_HD_index: this.coin_HD_index,
                crypto_class: "Crypto" + this.name,
                isToken: this.pouch.isToken(),
                contractAddress: this.pouch.contractAddress
            };


            this._db = new EthereumStorage(this.controllerSettings, this.config);



            this._accountService = new EthereumService(this.controllerSettings, this._db, this.config);
            this.transactionController = new jaxx.TransactionsEthereum(this);




            this._db.emitter$.on(this._db.ON_BALANCE_TEMP_LENGTH_NOT_0, (evt) => {
                if (!this.isToken) {
                    // console.log('%c '+ this.name + '  ' + jaxx.Registry.ON_BALANCE_DEEMED, 'color:pink');
                    // jaxx.Registry.application$.triggerHandler(jaxx.Registry.ON_BALANCE_DEEMED, [this._coinType,this.name]);
                }

            });

            this._db.emitter$.on(this._db.ON_BALANCE_TEMP_LENGTH_0, (evt) => {

                //  console.log('%c '+ this.name + '  ' + jaxx.Registry.ON_BALANCE_ACCURATE, 'color:green');
                // jaxx.Registry.application$.triggerHandler(jaxx.Registry.ON_BALANCE_ACCURATE, [this._coinType,this.name]);
            });






            this.transactionController.emitter$.on(this.transactionController.ON_ALL_TRANSACTIONS_SENT, () => {

                let balancesTemp: VOBalanceTemp[] = this._db.getBalancesTemp();
                let addresses: string[] = jaxx.Utils.getIds(balancesTemp);
                this._accountService.startCheckAddressesBalances(addresses);
                //console.log(' on transactions sent downloading for addresses ' + addresses);
                // this._accountService.downloadNewTransactions(addresses);
            });


            this.transactionController.emitter$.on(this.transactionController.ON_UTXOS_READY, (evt, utxos) => {

                jaxx.Registry.application$.triggerHandler(jaxx.Registry.ON_UTXOS_READY, [this._coinType, utxos]);


            });

            this.transactionController.emitter$.on(this.transactionController.ON_NONCES_READY, (evt, nonces) => {

                jaxx.Registry.application$.triggerHandler(jaxx.Registry.ON_NONCES_READY, [this._coinType, nonces]);


            });


            this._accountService.emitter$.on(this._accountService.ON_NEW_TRANSACTIONS, (evt, diff) => {

                this.dispatchNewTransactions();

                // console.log(' calling UI to refresh ');
                //this._pouch._notify('new transactions receive');
            });


            /*this._accountService.emitter$.on(this._accountService.ON_BALANCE_RECEIVE_CHANGE, (evt, delta:number) => {

             this.onReceiveChange(delta);

             });*/

            this._accountService.emitter$.on(this._accountService.ON_ADDRESS_RECEIVE_CAHANGE, (evt, address) => {

                this.emitter$.triggerHandler(this.ON_ADDRESS_RECEIVE_CHANGE, address);
                this.pouch.setCurrentReceiveAddress(address);
                ///this._pouch._notify('new transactions receive');
            });
            this._accountService.emitter$.on(this._accountService.ON_ADDRESS_CHANGE_CAHANGE, (evt, address) => {

                this.emitter$.triggerHandler(this.ON_ADDRESS_CHANGE_CHANGE, address);
                ///this._pouch._notify('new transactions receive');
            });

            this._accountService.emitter$.on(this._accountService.ON_BALANCES_DIFFERENCE, (evt, diff) => {
                console.log('ON_BALANCES_DIFFERENCE ');

                this.dispatchChages('ON_BALANCES_DIFFERENCE');
            })

            console.log(this.name + ' controller indexes R' + this._db.getCurrentIndexReceive() );
            // console.log(Date.now() - starttime);

            let updateOptions = {updateTimeout: 10000, confirmations: 12};
            if (this.name.indexOf('Ethereum') === -1) updateOptions.confirmations = 6;


            this.transactionsUpdater = new jaxx.TransactionsUpdater(this, updateOptions);
            this.transactionsUpdater.emitter$.on(this.transactionsUpdater.ON_TRANSACTION_CONFIRMED, (evt, justConfirmed) => {
                //console.log(justConfirmed);
                this.emitter$.triggerHandler(this.ON_TRANSACTION_CONFIRMED, [justConfirmed]);
            });

            /*
             jaxx.Registry.application$.on(jaxx.Registry.ON_NEW_WALLET_CREATED, ()=>{
             console.log(this.name + 'set as new wallet');
             this._db.clearStorage();
             this._db.setNewWallet(true);
             this._db.saveCurrentIndexReceive(0);
             this._db.saveCurrentIndexChange(0);

             })*/


            //   console.log(jaxx.Registry.appState);

            if (jaxx.Registry.appState && jaxx.Registry.appState.create) {

                console.log(this.name + ' create new wallet');

                this._db.clearStorage();
                this._db.setNewWallet(true);
            }


            jaxx.Registry.application$.on(jaxx.Registry.RESET_STORAGE, (evt, coinType) => {
                if (coinType) {
                    if (this._coinType == coinType) this.resetStorage();
                } else this.resetStorage();
                if (this.isActive) this.restoreHistoryAll(null);
            });



        }

        afterAppInit():void{


        }

        resetStorage(): void {

            this._db.clearStorage();
            this.transactionController.reset();
            // this._db.saveCurrentIndexReceive(-1);
            // this._db._saveBalancesReceive([]);
            // this._db._saveBalancesChange([]);
        }


        ON_BALANCE_CHANGE: string = 'ON_BALANCE_CHANGE';
        ON_NEW_TRANSACTIONS: string = 'ON_NEW_TRANSACTIONS';


        ON_ADDRESS_RECEIVE_CHANGE: string = 'ON_ADDRESS_RECEIVE_CHANGE';
        ON_ADDRESS_CHANGE_CHANGE: string = 'ON_ADDRESS_CHANGE_CHANGE';


        getBalancesSpent(): VOBalanceTemp[] {
            return this._db.getBalancesTemp();
        }

        getBalanceTemp(): number {
            return this._db.getBalanceTemp();
        }

        getBalances(): VOBalance[] {
            return this._db.getBalancesAll();
        }



        getBalancesReceive(): VOBalance[] {
            return this._db.getBalancesReceive(true);
        }

        getBalanceByAddress(address: string): number {
            let balances = this.getBalances();
            let returnBalance = null;
            for (let i = 0; i < balances.length; i++) {
                if (balances[i].id === address) {
                    returnBalance = balances[i].balance;
                }
            }
            return returnBalance;
        }

        resetBalancesSpent(): void {
            this._db.resetBalancesSpent();
        }


        setEnabled(enabled: boolean): void {
            this.isEnabled = enabled;
            // console.log(this.name + (enabled?' enabling ':' disabling'))
        }

        onBalanceChange(delta: number): void {
            console.log(jaxx.Registry.ON_BALANCE_RECEIVE_CHANGE + '   ' + delta);

            if (!this.isToken) this.transactionController.refreshData();

            jaxx.Registry.application$.triggerHandler(jaxx.Registry.ON_BALANCE_RECEIVE_CHANGE, {
                delta: delta,
                coinType: this._coinType,
                coinName: this.name
            });

        }

        dispatchNewTransactions(): void {

            let coinType: number = this._coinType;

            console.log(this.name + ' calling UI to refresh new transactions ' + coinType);

            g_JaxxApp.getUI().updateTransactionListWithCoin(coinType);

            //let trs:any[] = this.getTransactionsFromDB(this._coinType);

            // this.emitter$.triggerHandler(this.ON_NEW_TRANSACTIONS,[ this._coinType,trs]);
        }


        getHistoryTimestamp(): number {
            return this._db.getHistoryTimestamp();
        }

        deactivate(): any{
            console.log('%c deactivating ' + this.name + ' was busy ' + this.isBusy, 'color:green');
            if (this.isBusy) {

                jaxx.Registry.application$.triggerHandler(jaxx.Registry.KILL_HISTORY, this.name);

                this.isBusy = false;
                this.isRestoringHistory = false;
            }
            this.isActive = false;
            this.transactionController.deactivate();
            this.transactionsUpdater.deactivate();
            return this;
        }


/////////////////////////////////////////// ACTIVATE ////////////////////////////

        isWasActive: boolean;

        goSleep(): void {
            this.isWasActive = this.isActive;
            if (this.isWasActive) console.log('%c  ' + this.name + ' go sleep  ', 'color:red');
            this.deactivate();
        }

        wakeUp(): void {
            if (this.isWasActive) {
                console.log('%c  ' + this.name + ' waking up   ', 'color:red');
                this.activate();
            }
        }

        hasIndexes(): boolean {

            let has: boolean = (this._db.getCurrentIndexReceive() !== -1);

            return has
        }

        isActive: boolean;

        createNewWallet():void{

            //console.error(this.name + '   createNewWallet ');

            let addressReceive = this.getAddressReceive(0);

            //this._db.saveCurrentAddressReceive(addressReceive);

            let balanceRceive: VOBalance = new VOBalance({
                id: addressReceive,
                balance: 0,
                index:0,
                timestamp: Date.now()
            })

            this._db._saveBalancesReceive([balanceRceive]);
            this._db.setNewWallet(false);

        }

        activate():any {
            console.log(this.name + ' activate ');
            if (this.isActive) return;
            this.isActive = true;
            this.isRestoringHistory = false;
            this.downloadingBalancesCounter = 0;


            if (this._db.isNewWallet()) this.createNewWallet();

            // console.log(Date.now() - starttime);

            console.log('%c activating ' + this.name + ' hasIndexes: ' + this.hasIndexes() + ' recieve ' + this._db.getCurrentIndexReceive(), 'color:green');
            this.transactionController.activate();
            this.transactionsUpdater.activate();

            let balance: number = this._db.getBalanceTotal();

            if (balance) this.hasData = true;

            if (!this.hasIndexes()) {
                //
                this.restoreHistoryAll((res) => {

                    this.startBalancesCheck();

                });
                return this;
            }else  this.startBalancesCheck();


            //this.checkIsSync(() => this.onReady(), err => this.onError(err));
            return this;
        }


        onReady(): void {

            let currentReceiveAddress: string = this._db.getCurrentAddressReceive();
            // console.warn('  current address receive ' + currentReceiveAddress);
            this.pouch.setCurrentReceiveAddress(currentReceiveAddress);
            this.transactionController.activate();
            this.startBalancesCheck();
            //this.dispatchInit();
        }



        BALANCE_OUT_OF_SYNC: string = 'BALANCE_OUT_OFF_SYNC';
        BALANCE_IN_SYNC: string = 'BALANCE_IN_SYNC';

        /* dispatchInit(): void {
         if (this.hasIndexes()) {

         this.dispatchChages('init');
         }
         }*/

        dispatchChages(reason: string): void {
            console.log(' dispatchChages ' + this.isActive + '  ' + this.isEnabled);
            // if(this.isActive && this.isEnabled){
            if (this.isActive) {
                console.log('caling UI for update ' + reason);
                this.pouch._notify(reason);
            }
        }


        downloadNonceForFirstAddress(): void {
            this.transactionController.downloadNonceForFirstAddress();
        }

        ///////////////////////////////// Transaction Controller integration ////////////

        public _sortedHighestAccountArray: { index: number, balance: number, address: string }[] = [];


        ON_TRANSACTION_SEND_START: string = 'ON_TRANSACTION_SEND_START';
        ON_TRANSACTION_SENT: string = 'ON_TRANSACTION_SENT';
        ON_TRANSACTION_SEND_PROGRESS: string = 'ON_TRANSACTION_SEND_PROGRESS';


        onSendTransactionStart(data): void {
            this.transactionController.onSendTransactionStart(data);
        }

        registerSentTransaction(result: { sent: any, result: any, name: string, fee: number }): void {
            this.transactionController.registerSentTransaction(result);
        }


        getHighestAccountBalanceAndIndex(): { index: number, balance: number, address: string } {

            this._sortedHighestAccountArray = this.transactionController.getHighestAccountBalanceAndIndex();

            return this._sortedHighestAccountArray ? this._sortedHighestAccountArray[0] : null;
        }


        getMiningFees(): number {
            return this._accountService.getMiningFees();
        }

        readyTransactionsLength: number = 0;


        prepareAddresses(addresses: string[]): JQueryDeferred<any> {
            return this.transactionController.prepareAddresses(addresses);
        }

        getNonces(): any {
            return this.transactionController.nonces;
        }


        getNonceForFirstAddress(): number {
            return this.transactionController.getNonceForAddress(this.getAddressReceive(0))
        }

        getNonceForAddress(address: string): number {
            return this.transactionController.getNonceForAddress(address);
        }

        getUTXOs(): VOutxo[] {

            return this.transactionController.getUTXOsNotInQueue();//getTransactionsUnspent();
        }

        getTransactionController(): jaxx.TransactionsEthereum {
            return this.transactionController;
        }

        getSpendableBalanceDB(minimumValue: number): number {
            let fee: number = this._accountService.getMiningFees();

            console.log(this.name + ' getSpendableBalanceDB  fee ' + fee);


            let receive: number = jaxx.Utils.calculateBalanceSpendable(this._db.getBalancesReceive(true), fee);


            let spent = this._db.getBalanceTemp();

            let total = receive - spent;
            return total;
        }

        getBalanceSpendableDB(fee?: number): number {
            if (isNaN(fee)) fee = this._accountService.getMiningFees();
            if (this.isToken) fee = 0;
            let total: number = 0;




            let balancesReceive: VOBalance[] = this._db.getBalancesReceive();
            total += jaxx.Utils.calculateBalanceSpendable(balancesReceive, fee);

            console.log(this.name + ' getBalanceSpendableDB   ' + total + '   ' + this._db.getBalanceTotal() + ' fee: ' + fee);
            if (total < 0) {
                console.warn(this.name + ' getBalanceSpendableDB  total ' + total + ' fee ' + fee);
                total = 0;
            }
            return total;
        }


        getBalanceTotalDB(): number {
            // () => 1860000000 // Test case 1
            // This function returns the total balance for all of the accounts with _coinType in this wallet
            if (this.isBusy) {
                return -1;
            }

            let receive: number = this._db.getBalanceReceive();
            let spent = this._db.getBalanceTemp();
            // console.log(this.name + ' getBalanceTotal change: '+ change +' receive: '+ receive +'  spent: ' + spent);
            let total = receive - spent;
            if (total < 0) {
                //  console.warn(this.name + ' getBalanceTotalDB   balance ' + total);
                total = 0;
            }

            //console.log(total);
            return total;

        }

        getBalancesForAmount(amount: number): VOBalance[] {
            let out: VOBalance[] = [];
            let num = 0;
            let balances: VOBalance[] = this._db.getBalancesReceive();
            for (let i = 0, n = balances.length; i < n; i++) {
                out.push(balances[i]);
                num += balances[i].balance;
                if (num >= amount) return out;
            }
            return null;
        }


        getBalancesHighestFirst(): VOBalance[] {


            return this._db.getBalancesHighestFirst();
        }

        getBalancesNot0(): VOBalance[] {
            return this._db.getBalancesNot0();
        }

        getBalancesSpendableDB(): VOBalance[] {

            let fee: number = this._accountService.getMiningFees();
            ;// * this._accountService.getMiningPrice();
            let out: VOBalance[] = [];
            this._db.getBalancesNot0().forEach(balance => {
                if (balance.balance > fee) out.push(balance);
            });
            console.warn(out);
            return out;
        }

        getBalancesNot0Amounts(): number[] {
            let out: number[] = []
            this._db.getBalancesNot0().forEach(balance => out.push(balance.balance));
            return out;
        }


        ////////////////////// Addresses////////////////////

        getPrivateKeyDB(isChange: boolean, index: number): any {
            if (isChange) {
                return this._accountService.getKeyPairChange(index);
            }

            return this._accountService.getKeyPairReceive(index);
        }

        getKeyPairReceive(address: string): any {
            var i: number = this._db.getAddressesReceive().indexOf(address);
            if (i === -1) {
                console.error(' ho index for address ' + address);
                return '';
            }

            return this._accountService.getKeyPairReceive(i);
        }



        getKeyPair(address: string): any {
            return this.getKeyPairReceive(address);;
        }

        // Just a default.... Might be undefined.
        getPrivateKeyByAddress(address: string): any {
            // Returns '' if a private key cannot be retrieved.
            var keyPairEC: any = this.getKeyPair(address);
            return keyPairEC.toWIF();
        }

        isMyAddressDB(address: string): boolean {
            return this.isMyAddressReveive(address);
        }

        isMyAddressReveive(address: string): boolean {
            return this.getAddressIndexReceive(address) !== -1;
        }

        getAddressIndex(address: string): number {
            return this.getAddressIndexReceive(address);
        }

        getAddressIndexReceive(address: string): number {
            return this._db.getAddressesReceive().indexOf(address);
        }


        getAddressReceive(i: number): string {

            return this._db.getAddressReceive(i) || this._accountService.getAddressReceive(i);
        }

        getCurrentPublicAddresReceive(): string {

            if(!this._db.getCurrentAddressReceive()) this._db.saveAddressReceive(this.getAddressReceive(0));

            return this._db.getCurrentAddressReceive()
        }



        getCurrentIndexReceive(): number {
            return this._db.getCurrentIndexReceive();
        }



        getAddressesReceive(): string[] {
            return this._db.getAddressesReceive();
        }


        getAddressesAll(): string[] {
            return this._db.getAddressesReceive();
        }

        getQRCode(): string {
            //thirdparty.qrImage.imageSync(uri, {type: "png", ec_level: "H", size: 7, margin: 1}).toString('base64');
            return '';
        }

        ////////////////////////////////////////// Transactions///////////////////////


        private rawTransaction: any;

        onTransactionUserConfirmed(data: any): void {
            this.rawTransaction = data;

        }

        setCuurentAddresses(): void {
            let lastIndexReceive = this._db.getCurrentAddressReceive();
        }


        //////////////////////////// Check alll balances /////////////////////
        intervalBalancesCheck: any = 0;
        intervalBalanceReceive: number;
        delayBalancesCheck: number;

        startBalancesCheck(): void {

            // this function start intervals for balances check bt

            // test.getCryptoController(COIN_BITCOIN).startBalancesCheck()
            // description of the function
            // () => ()
            var self = this;
            console.log(' startBalancesCheck ' + this.intervalBalancesCheck);

            if (this.intervalBalancesCheck === 0) {
                this.stopBalancesCheck();
                //this.intervalBalancesCheck = setInterval(err=>this.onError(err), this.intervalAllBalancesCheckCurrent);
                this.intervalBalancesCheck = setInterval(() => this.checkAllBalances(res => {

                }, err => this.onError(err)), this.intervalAllBalancesCheckCurrent);


                /*this.intervalBalanceReceive = setInterval(() => this.checkBalanceCurrentReceive(), this.intervalCurrentBalanceCheck);

                 },err=>this.onError(err))}, this.intervalAllBalancesCheckCurrent
                 );*/


                this.intervalBalanceReceive = setInterval(function () {
                    self.checkBalanceCurrentReceive();
                    if (jaxx.Utils.hasEnoughTimeElapsedToSleepJaxx()) {
                        jaxx.Registry.application$.triggerHandler(jaxx.Registry.GO_SLEEP);
                    }
                }, this.intervalCurrentBalanceCheck);

                this.checkAllBalances(
                    () => {
                    },
                    err => this.onError(err)
                );
            }

        }

        stopBalancesCheck(): void {
            // console.warn(this.name + '   stopBalancesCheck   ');
            clearInterval(this.intervalBalancesCheck);
            clearInterval(this.intervalBalanceReceive);
            this.intervalBalancesCheck = 0;
        }

        ON_CURRENT_ADDRESS_RECEIVE_GOT_BALANCE: string = 'ON_CURRENT_ADDRESS_RECEIVE_GOT_BALANCE';
        /*

         onNewTransactions():void{


         }*/


        onCurrentReceiveAddressGotBalance(balance: VOBalance): void {

            let oldAddress: string = this._db.getCurrentAddressReceive();


            if (balance.id !== oldAddress) {

                console.warn(' it is not current addresss ', balance);
                return;
            }


            //this._accountService.goToNextIndexReceive();

            this.downloadAllBalances(() => {

                // this._accountService.downloadNewTransactions([balance.id]);

            }, err => {

            });



        }

        checkBalanceCurrentReceive(): void {


            let address: string = this.getCurrentPublicAddresReceive();
            if (!this.isActive) {
                this.stopBalancesCheck();
                return;
            }

            if (typeof(address) === 'undefined' || address === null || this.isBusy || this.isRestoringHistory) {
                return;
            }

            console.log(this.name + ' checkBalanceCurrentReceive  ' + address + '  ' + this.isActive + ' ' + new Date().toTimeString());

            this._accountService.downloadBalances([address]).done((balances: VOBalance[]) => {
                let balance: VOBalance = balances[0];
                //   console.log(balances);
                // console.log(' current receive balance ',balance);
               // if (balance.balance > 0) {
                    if (this.isToken) {
                        let oldBalance: number = this._db.getBalanceReceive();
                        let newBalance: number = balance.balance;
                        if (oldBalance !== newBalance) {
                            let delta: number = newBalance - oldBalance;


                            this._db._saveBalancesReceive(balances);


                            this._db.resetBalancesSpent();
                            //this.dispatchChages('new balance');

                            this.onBalanceChange(delta);
                        }
                        console.log('%c ' + this.name + ' old Balance  ' + oldBalance + ' new Balance ' + newBalance, 'color:green');

                    } else this.onCurrentReceiveAddressGotBalance(balance);

               // } else console.log(this.name + ' balance ' + balance.balance + ' on ' + balance.id);
            })

        }

        checkAllBalances(cb: Function, onError: Function): Function {

            // console.warn('checkAllBalances')
            if (!this.isActive) {
                this.stopBalancesCheck();
                return;
            }
            /// console.log(' checkAllBalances  ');
            this.downloadAllBalances(cb, onError);
            return cb;
        }


        getBalancesTimestamp(): number {
            return this._db.balancesTimestamp;
        }


        downloadingBalancesCounter: number;

        downloadAllBalances(onSuccess: Function, onError: Function): void {


            if (this.isToken) {
                if (onSuccess) onSuccess();
                return;
            }
            ;

            if (this.isRestoringHistory) {
                if (onSuccess) onSuccess('restoring history');
                return;
            }
            ;

            if (this.isBusy) {
                if (onSuccess) onSuccess('busy');
                return
            }
            ;

            let start: number = Date.now();
            console.log('%c' + this.name + ' downloadAllBalances active: ' + this.isActive + ' enabled: ' + this.isEnabled + ' busy: ' + this.isBusy, 'color:#f99');

            if (this.downloadingBalancesCounter) {
                this.downloadingBalancesCounter++;
                if (this.downloadingBalancesCounter > 5) {
                    //console.warn(' downloading balances failed resetting to 0 ');
                    this.downloadingBalancesCounter = 0;
                }
                //console.warn(' still downloading balances ');
                return;
            }

            this.downloadingBalancesCounter = 1;

            this._accountService.downloadBalancesAll((diffs, delta) => {

                if (!this.isActive) this.stopBalancesCheck();


                let now: number = Date.now();
                let balaceReceive: number = this._db.getBalanceReceive();
                let balanceTemp: number = this._db.getBalanceTemp();
                let balanceTotal: number = balaceReceive - balanceTemp;
                let downloadTime: number = now - start;

                let color: string = delta ? 'color:red' : 'color:#f99';
                console.log('%c' + this.name + ' balance in ' + downloadTime / 1000 + ' sec receive: ' + balaceReceive / 1e8 +
                   ' spent: ' + balanceTemp / 1e8 + ' total ' + balanceTotal / 1e8 + ' delta ' + delta, color);


                this._db.balancesTimestamp = now;

                if (downloadTime * 3 > this.intervalAllBalancesCheckCurrent) this.downloadingBalancesCounter = 5;

                else this.downloadingBalancesCounter = 0;

                if (delta) {

                    this.onBalanceChange(delta);
                    //this._accountService.downloadNewTransactions1(<string[]>_.map(diffs,'id'));
                }


                jaxx.Registry.application$.triggerHandler(jaxx.Registry.ON_BALANCES_DOWNLOADED, this._coinType);


                if (onSuccess) onSuccess(diffs, delta);


            }, err => {
                this.downloadingBalancesCounter = 0;
                this.onError(err);
                onError(err);
            });

        }

        generateBalancesFor0Indexes(): void {

            let addressReceive: string = this.getAddressReceive(0);
            this._db._saveBalancesReceive([new VOBalance({
                id: addressReceive,
                balance: 0
            })]);
        }

        timestampBusy: number;


        private onRestoreHistorySuccess(result): void {

        }

        restoreHistoryAll(callBack?: Function): void {


            if (this._db.getCurrentIndexReceive() !== -1) { // This was implemented in order to work with 'All User Keys'

                let balances: VOBalance[] = this._db.getBalancesReceive(true);

                if (balances.length === 0) this.generateBalancesFor0Indexes();
                if (callBack) {
                    callBack();
                }
                return;
            }
            var self = this;
            let now: number = Date.now();
            if (this.isRestoringHistory) return;
            this.isRestoringHistory = true;
            if (this.isBusy) return;

            this.timestampBusy = Date.now();

            console.log('%c restoring history please wait ', 'color:red');
            this.emitter$.triggerHandler(this.ON_RESTORE_HISTORY_START);

            if (this.isActive) jaxx.Registry.application$.triggerHandler(jaxx.Registry.ON_RESTORE_HISTORY_START);

            this._db.saveHistoryTimestamp(Date.now());

            this.isBusy = true;

            this.transactionController.deactivate();


            this._accountService.restoreHistoryAll().then(res => {

                this.isRestoringHistory = false;
                this.isBusy = false;

                this.emitter$.triggerHandler(this.ON_RESTORE_HISTORY_DONE);

                this.transactionController.activate();
                this.dispatchNewTransactions();

                jaxx.Registry.application$.triggerHandler(jaxx.Registry.ON_RESTORE_HISTORY_DONE);

                console.log('%c history succesfully restored => ' +
                     ' Receive: index: ' + this._db.getCurrentIndexReceive() + ' in ' + res.timeReceive / 1000 + ' s', 'color:green');

                this.dispatchChages('history_restored');

                if (callBack) callBack();


            }).fail(err => {
                this.isBusy = false;
                this.isRestoringHistory = false;
                jaxx.Registry.application$.triggerHandler(jaxx.Registry.ON_RESTORE_HISTORY_ERROR);
                this.onError(err);
                if (callBack) callBack(err);
            }).always(() => this._db.saveHistoryTimestamp(Date.now()));
        }

        errors: any[] = [];

        onError(err): void {

            console.error(this.name, err);
            err = err || {};
            this.errors.push(err);
            err.coinType = this._coinType;

            jaxx.Registry.application$.triggerHandler(jaxx.Registry.ON_APPLICATION_ERROR, err);

            if (this.errors.length > 1000) this.errors.shift();
        }


        convertEtherNumber(num: number): number {

            // console.log(this._coinType, num, COIN_UNITLARGE);
            return HDWalletHelper.convertCoinToUnitType(this._coinType, num, COIN_UNITLARGE);// = function(coinType, coinAmount, coinUnitType) ;;
        }


        getTransactionsAll(): VOTransaction[] {
            return this._db.getTransactionsReceive();
        }


        getTransactionsFromDB(coinType: number): VOTransactionView[] {

            let price = this._accountService.getMiningFees();
            let trs: VOTransaction[] = [];

            // console.log('getTransactionsFromDB  ' + coinType + '  '+trs.length,trs);
            switch (coinType) {
                case COIN_ETHEREUM_CLASSIC:
                case COIN_ETHEREUM:
                case COIN_TESTNET_ROOTSTOCK:
                    return Utils.deepCopy(this._db.getTransactionsReceive()).reverse();
                    // console.log(trs);
                  /*  return trs.map(item => {

                        let cost = this.convertEtherNumber(item.miningFee * price);

                        return new VOTransactionView({
                            toAddress: item.to,
                            to: item.to,
                            addressIndex: this.getAddressIndexReceive(item.address),
                            confirmations: item.confirmations,
                            blockNumber: item.block,
                            gasCost: item.gasPrice,
                            gasUsed: item.miningFee,
                            timestamp: item.timestamp,
                            txid: item.id,
                            valueDelta: item.value

                        })
                    }).reverse();
*/
                default:
                    return [];
            }

        }


    }
}