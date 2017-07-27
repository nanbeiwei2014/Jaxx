///<reference path="../com/models.ts"/>
///<reference path="../services/account-service.ts"/>
///<reference path="../com/Registry.ts"/>
///<reference path="datastore_local.ts"/>
///<reference path="outgoing_transaction_controller.ts"/>
///<reference path="transactions_temp_control.ts"/>
///<reference path="build_transaction_controller.ts"/>
///<reference path="transactions_updater.ts"/>
///<reference path="../com/Utils.ts"/>

//import TransactionController = jaxx.OutgoingTransactionController;
///import CheckTransactionBlockr = jaxx.CheckTransactionBlockr;

//import OutgoingTransactionController = jaxx.OutgoingTransactionController;
//import CheckTempTransactionsController = jaxx.CheckTempTransactionsController;
//import Dictionary = _.Dictionary;
//import Utils = jaxx.Utils;
//import CheckTransaction = jaxx.CheckTransaction;

//import TransactionsUpdater = jaxx.TransactionsUpdater;

interface _{
    nth(ar:any[],num:number)
}



declare class CoinImplementation {

    buildEthereumTransactionList: (toAddressArray: string[],
                                   amount_smallUnit: number,
                                   gasPrice: number,
                                   gasLimit: number,
                                   ethData: any,
                                   doNotSign: boolean) =>any;

    getSpendableBalance(minimumValue?: number): number;
}

declare class HDWalletPouch {
    static getStaticCoinPouchImplementation: Function;
    _coinFullName: string;
    _coinType: number;
    _hdCoinType: number;
    _coinPouchImpl: CoinImplementation;
    token: any[];


    _notify(reason: string): void;

    setCurrentChangeAddress(address: string): void;

    getCurrentChangeAddress(): string;

    setCurrentReceiveAddress(address: string): void;

    getCurrentReceiveAddress(): string;

    setDataStorageController(datastorage: any);

    isToken(): boolean;
    contractAddress:string;


    static getCoinAddress(coinType:number, node:any);
}


declare class CoinToken extends HDWalletPouch {

}


class JaxxCryptoController implements IControllerDB, EthereumDB {

    _accountService: jaxx.JaxxAccountService;
    private transactionsUpdater:jaxx.TransactionsUpdater;
    private rawAppData: any;
    _pouch: HDWalletPouch;
    _coinType: number;
    id: number;
    name: string;
    coin_HD_index: number;
    tokens: any[];
    hasData: boolean;
    fee: number;
    isToken:boolean;
   // intervalAllBalancesCheckDefault:number ;
    intervalAllBalancesCheckCurrent:number =  30000;
    intervalCurrentBalanceCheck:number = 10000;

    public isBusy: boolean;
    isRestoringHistory:boolean;
    isEnabled: boolean;


    options: {
        checkCurrentBalanceReceive: number,
        checkBalances: number
    }


    ON_RESTORE_HISTORY_START: string = 'ON_RESTORE_HISTORY_START';
    ON_RESTORE_HISTORY_DONE: string = 'ON_RESTORE_HISTORY_DONE';

    ON_TRANSACTION_CONFIRMED:string = 'ON_TRANSACTION_CONFIRMED';


    emitter$ = $({});

    //checkTempTransactionsController:jaxx.CheckTempTransactionsController;

    transactionController: jaxx.TransactionController;

    historyError: any;




    //coinType:number;



    controllerSettings: any = {};
    /// outgoingTransactions:TransactionController[] = [];
    //    id:string;
    //    name:string;
    //    coin_HD_index:number;
    //accounts:VOAccount[] = [];

    balance: number;
    _db: jaxx.JaxxDatastoreLocal;

    //config:any;

    isBalancesOutOfSync:boolean;


   // newWallet:boolean;
    constructor( private pouch: HDWalletPouch, private config:any) {



       // console.log(this.options);

        //console.log(Date.now() - starttime);
        let name:string = pouch._coinFullName;

        //  console.log(pouch);
        if(name === 'Ethereum') jaxx.Registry.Ethereum = <EthereumDB>this;


        if(name ==='RSK Testnet') name = 'RootstockEthereum';

        this._pouch = pouch;
        this._coinType = pouch._coinType;

        this.id = pouch._coinType;



        this.name = name;
        this.coin_HD_index = pouch._hdCoinType;
        this.tokens = pouch.token;


       // this.processConfig(config);

        this.isToken = pouch.isToken();
        console.log(this.isToken);

        //jaxx.Registry.crypto_controllers[this.name] = this;
        //jaxx.Registry.crypto_controllers[this.id] = this;
        pouch.setDataStorageController(this);


       //setTimeout(()=>this.init(),5000);
        this.init();


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
            isToken: this._pouch.isToken(),
            contractAddress:this._pouch.contractAddress
        };

        this._db = new jaxx.JaxxDatastoreLocal(this.controllerSettings);

        this._db.emitter$.on(this._db.ON_BALANCE_TEMP_LENGTH_NOT_0,(evt) => {
            if(!this.isToken){
               // console.log('%c '+ this.name + '  ' + jaxx.Registry.ON_BALANCE_DEEMED, 'color:pink');
               // jaxx.Registry.application$.triggerHandler(jaxx.Registry.ON_BALANCE_DEEMED, [this._coinType,this.name]);
            }

        });

        this._db.emitter$.on(this._db.ON_BALANCE_TEMP_LENGTH_0,(evt) => {

          //  console.log('%c '+ this.name + '  ' + jaxx.Registry.ON_BALANCE_ACCURATE, 'color:green');
           // jaxx.Registry.application$.triggerHandler(jaxx.Registry.ON_BALANCE_ACCURATE, [this._coinType,this.name]);
        });




        this._accountService = new jaxx.JaxxAccountService(this.controllerSettings, this._db, this.options);


        this.transactionController = new jaxx.TransactionController(this);

       this.transactionController.emitter$.on(this.transactionController.ON_ALL_TRANSACTIONS_SENT, () => {

           let balancesTemp:VOBalanceTemp[] = this._db.getBalancesTemp();
           let addresses:string[] = jaxx.Utils.getIds(balancesTemp);
           this._accountService.startCheckAddressesBalances(addresses);
          //console.log(' on transactions sent downloading for addresses ' + addresses);
          // this._accountService.downloadNewTransactions(addresses);
        });



       this.transactionController.emitter$.on(this.transactionController.ON_UTXOS_READY, (evt,utxos) => {

               jaxx.Registry.application$.triggerHandler(jaxx.Registry.ON_UTXOS_READY,[this._coinType, utxos]);


        });

        this.transactionController.emitter$.on(this.transactionController.ON_NONCES_READY, (evt,nonces) => {

                jaxx.Registry.application$.triggerHandler(jaxx.Registry.ON_NONCES_READY,[this._coinType,nonces]);



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
            this._pouch.setCurrentReceiveAddress(address);
            ///this._pouch._notify('new transactions receive');
        });
        this._accountService.emitter$.on(this._accountService.ON_ADDRESS_CHANGE_CAHANGE, (evt, address) => {

            this.emitter$.triggerHandler(this.ON_ADDRESS_CHANGE_CHANGE, address);
            ///this._pouch._notify('new transactions receive');
        });

        this._accountService.emitter$.on(this._accountService.ON_BALANCES_DIFFERENCE,(evt,diff)=>{
            console.log('ON_BALANCES_DIFFERENCE ');

            this.dispatchChages('ON_BALANCES_DIFFERENCE');
        })

        console.log(this.name + ' controller indexes R C ' + this._db.getCurrentIndexReceive() + ' ' + this._db.getCurrentIndexChange());
       // console.log(Date.now() - starttime);

        let updateOptions = {updateTimeout:10000, confirmations:12};
        if(this.name.indexOf('Ethereum') ===-1) updateOptions.confirmations = 6;



        this.transactionsUpdater = new jaxx.TransactionsUpdater(this,updateOptions);
        this.transactionsUpdater.emitter$.on(this.transactionsUpdater.ON_TRANSACTION_CONFIRMED,(evt,justConfirmed)=>{
            //console.log(justConfirmed);
            this.emitter$.triggerHandler(this.ON_TRANSACTION_CONFIRMED,[justConfirmed]);
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

        if(jaxx.Registry.appState && jaxx.Registry.appState.create){
            console.log(this.name + ' create new wallet');
            this._db.clearStorage();
            this._db.setNewWallet(true);
        }


        jaxx.Registry.application$.on(jaxx.Registry.RESET_STORAGE, (evt, coinType)=>{
            if(coinType){
                if(this._coinType == coinType)this.resetStorage();
            }else this.resetStorage();
            if(this.isActive)this.restoreHistoryAll(null);
        });

    }

    resetStorage():void{

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

    getBalanceTemp():number {
        return this._db.getBalanceTemp();
    }
    getBalances(): VOBalance[] {
        return this._db.getBalancesAll();
    }

    getBalancesChange(): VOBalance[] {
        return this._db.getBalancesChange(true);
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

    onBalanceChange(delta:number):void{
        console.log(jaxx.Registry.ON_BALANCE_RECEIVE_CHANGE + '   '+ delta);

        if(!this.isToken)this.transactionController.refreshData();

        jaxx.Registry.application$.triggerHandler(jaxx.Registry.ON_BALANCE_RECEIVE_CHANGE,{delta:delta,coinType:this._coinType,coinName:this.name});

    }

    dispatchNewTransactions(): void {

        let coinType:number = this._coinType;

        console.log(this.name + ' calling UI to refresh new transactions ' + coinType);

        g_JaxxApp.getUI().updateTransactionListWithCoin(coinType);

        //let trs:any[] = this.getTransactionsFromDB(this._coinType);

       // this.emitter$.triggerHandler(this.ON_NEW_TRANSACTIONS,[ this._coinType,trs]);
    }


    getHistoryTimestamp(): number {
        return this._db.getHistoryTimestamp();
    }

    deactivate(): void {
        console.log('%c deactivating ' + this.name +' was busy '+ this.isBusy,'color:green');
        if(this.isBusy){

            jaxx.Registry.application$.triggerHandler(jaxx.Registry.KILL_HISTORY,this.name);

            this.isBusy = false;
            this.isRestoringHistory = false;
        }
        this.isActive = false;
        this.transactionController.deactivate();
        this.transactionsUpdater.deactivate();
    }


/////////////////////////////////////////// ACTIVATE ////////////////////////////

    isWasActive:boolean;

    goSleep():void{
        this.isWasActive = this.isActive;
        if(this.isWasActive) console.log('%c  ' + this.name + ' go sleep  ' ,'color:red');
        this.deactivate();
    }

    wakeUp():void{

        if(this.isWasActive){
            console.log('%c  ' + this.name + ' waking up   ' ,'color:red');
            this.activate();
        }
    }

    hasIndexes(): boolean {

        let has: boolean = (this._db.getCurrentIndexReceive() !== -1);

        return has
    }

    isActive: boolean;

    activate(): JaxxCryptoController {
        if (this.isActive) return;
        this.isActive = true;
        this.isRestoringHistory = false;
        this.downloadingBalancesCounter = 0;

        if(this._db.isNewWallet()) this._accountService.createNewWallet();


        if(this.isToken){

            jaxx.Registry.datastore_controller_test.getCryptoControllerByName('Ethereum').downloadNonceForFirstAddress();

        }


       // console.log(Date.now() - starttime);

        console.log('%c activating ' + this.name + ' hasIndexes: ' + this.hasIndexes() + ' recieve ' + this._db.getCurrentIndexReceive() + ' change: ' + this._db.getCurrentIndexChange(), 'color:green');
        this.transactionController.activate();
        this.transactionsUpdater.activate();

        let balance: number = this._db.getBalanceTotal();

        if (balance) this.hasData = true;

        if (!this.hasIndexes()){
            //
            this.restoreHistoryAll((res) => {

                this.startBalancesCheck();

            });
            return this;
        }


       this.checkIsSync(() => this.onReady(),err=>this.onError(err));
        return this;
    }


    onReady():void{

        let currentReceiveAddress: string = this._db.getCurrentAddressReceive();
       // console.warn('  current address receive ' + currentReceiveAddress);
        this._pouch.setCurrentReceiveAddress(currentReceiveAddress);
        this.transactionController.activate();
        this.startBalancesCheck();
        //this.dispatchInit();
    }

    isSyncTested:boolean;

    checkIsSync(callBack:Function, onError:Function):void{
        if(this.isToken){
            callBack();
            return;
        }

        if(this.isSyncTested){
            callBack();
            return;
        }

        if(this.isRestoringHistory){
            onError({error:102,message:'Check Sync called while restoring history'});
            return
        }

       // let currentAddressChange:string = this._db.getCurrentAddressChange();
        let adddresesChange:string[] = this.getAddressesChange();

       let currentAddressChange:string = adddresesChange[adddresesChange.length-1];

      //  let currentAddressReceive:string = this.getCurrentPublicAddresReceive();
        let addressesReceive:string[] = this.getAddressesReceive();

        let currentAddressReceive:string =  addressesReceive[addressesReceive.length - 1];

        let addresses:string[]  = [currentAddressReceive, currentAddressChange];

        console.log(this.name + ' checking addresses for transactions ' + addresses.toString());

        jaxx.Registry.application$.triggerHandler(jaxx.Registry.SYNC_CHECK_START, this._coinType);

        this._accountService.checkAddressesForTranasactions(addresses).done(result=>{

            console.log(this.name + ' Sync result ' +  result.length);

            jaxx.Registry.application$.triggerHandler(jaxx.Registry.SYNC_CHECK_END, this._coinType);

            if(result.length){
                console.log('%c OUT OF SYNC ','color:red');
                this.isBalancesOutOfSync = true;
                this.emitter$.triggerHandler(this.BALANCE_OUT_OF_SYNC);

                jaxx.Registry.application$.triggerHandler(jaxx.Registry.BALANCE_OUT_OFF_SYNC, this._coinType);

                let currentIndexChange:number = this._db.getCurrentIndexChange();
                let currentIndexRecaive:number = this._db.getCurrentIndexReceive();

                let ch:boolean = false;
                let re:boolean = false;

                // let newTxIds:string[] = [];
                let txList:any[] = [];
                let transactions:VOTransaction[] = [];

                console.warn(' out of sync change: '+ currentIndexChange + '  receive: ' + currentIndexRecaive );

                if(this.name.indexOf('Ethereum') ===-1){


                    this._accountService.restoreHistory2('change',  currentIndexChange).done((result1) => {

                        console.log('%c ' + this.name + ' index change was ' + currentIndexChange + ' now is '+ result1.index + ' new addresses '+ result1.addresses.toString(),'color:green');
                        console.log(result1);
                        ch = true;
                        let addresses:string[] = result1.addresses;
                        // newTxIds = newTxIds.concat(result1.txdIds);

                        txList = txList.concat(result1.txsList);
                        transactions = transactions.concat(result1.transactions);

                        //TODO follow indexes

                        let db= this._db;



                        addresses.forEach(function (item) {
                            if(item) db.addBalanceChange(new VOBalance({id:item,balance:0}));
                        });

                        this._accountService.goToNextIndexChange();

                        if(ch && re) this.updateAfterSync({txList:txList, transactions:transactions}, callBack,onError);

                    });


                } else  ch = true;



                this._accountService.restoreHistory2('receive',currentIndexRecaive).done((result2) => {
                    re = true;
                    let addresses:string[] = result2.addresses;
                    // newTxIds = newTxIds.concat(result2.txdIds);
                    txList = txList.concat(result2.txsList);
                    transactions = transactions.concat(result2.transactions);

                    let db = this._db;

                    for(let i=0, n= addresses.length; i<n; i++){
                        let newAddress = addresses[i];
                        console.log(i + ' ' +newAddress)
                    }


                    addresses.forEach(function (item) {
                        if(item) db.addBalanceReceive(new VOBalance({id:item,balance:0}));
                    });

                    this._accountService.goToNextIndexReceive();

                    if(ch && re) this.updateAfterSync({txList:txList, transactions:transactions}, callBack, onError);
                    console.log('%c ' + this.name + ' index  receive was ' + currentIndexRecaive + ' now is '+ result2.index + ' new addresses '+ result2.addresses.toString(),'color:green');

                    console.log(result2);

                });

            }else callBack();

            this.isSyncTested = true;
        });

    }

    updateAfterSync(data:{txList:any[],transactions:VOTransaction[]}, onSuccess:Function, onError:Function){
        this.isSyncTested = true;
        console.log('  updateAfterSync   ', data);
        this.downloadAllBalances(()=>{

            this.emitter$.triggerHandler(this.BALANCE_IN_SYNC);
            console.log('%c ' + jaxx.Registry.BALANCE_IN_SYNC,'color:pink');

            jaxx.Registry.application$.triggerHandler(jaxx.Registry.BALANCE_IN_SYNC, this._coinType);
            this.isBalancesOutOfSync = false;
            setTimeout(() => this.startBalancesCheck(),20000);

            if(data.txList){
                this._accountService.downloadTransactionsDetails(data.txList).done(res => {
                    console.log(res);
                    onSuccess();
                }).fail(err=>onError(err));
            }else {

                if(data.transactions) this._accountService.onDownloadedNewTransactions(data.transactions);

                onSuccess();
            }

        },err=>{



        })
       /* this.startBalancesCheck(()=>{
         console.warn(' BALANCES UP TO DATE');

         if(data.txList){
         this._accountService.downloadTransactionsDetails(data.txList).done(res=>{
         console.log(res);
         cb();
         }).fail(err=>cb(err));
         }else {
         this._accountService.onDownloadedNewTransactions(data.transactions);
         cb();
         }




         },err=>this.onError(err));*/
        return
    }


    BALANCE_OUT_OF_SYNC:string = 'BALANCE_OUT_OFF_SYNC';
    BALANCE_IN_SYNC:string = 'BALANCE_IN_SYNC';

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
            this._pouch._notify(reason);
        }
    }


    downloadNonceForFirstAddress():void{
        this.transactionController.downloadNonceForFirstAddress();
    }
    ///////////////////////////////// Transaction Controller integration ////////////

    public _sortedHighestAccountArray: {index: number, balance: number, address: string}[] = [];


    ON_TRANSACTION_SEND_START: string = 'ON_TRANSACTION_SEND_START';
    ON_TRANSACTION_SENT: string = 'ON_TRANSACTION_SENT';
    ON_TRANSACTION_SEND_PROGRESS: string = 'ON_TRANSACTION_SEND_PROGRESS';


    onSendTransactionStart(data): void {
        this.transactionController.onSendTransactionStart(data);
    }

    registerSentTransaction(result: {sent: any,result: any, name: string , fee: number}): void {
        this.transactionController.registerSentTransaction(result);
    }


    getHighestAccountBalanceAndIndex(): {index: number,balance: number, address: string} {

        this._sortedHighestAccountArray = this.transactionController.getHighestAccountBalanceAndIndex();

        return this._sortedHighestAccountArray ? this._sortedHighestAccountArray[0] : null;
    }




    getMiningFees():number{
        return  0//this._accountService.getMiningFees();
    }

    readyTransactionsLength: number = 0;



    prepareAddresses(addresses: string[]): JQueryDeferred<any> {
        return this.transactionController.prepareAddresses(addresses);
    }

    getNonces(): any {
        return this.transactionController.nonces;
    }



    getNonceForFirstAddress():number{
        return this.transactionController.getNonceForAddress(this.getAddressReceive(0))
    }

    getNonceForAddress(address: string): number {
        return this.transactionController.getNonceForAddress(address);
    }

    getUTXOs(): VOutxo[] {

        return this.transactionController.getUTXOsNotInQueue();//getTransactionsUnspent();
    }

    getTransactionController(): jaxx.TransactionController {
        return this.transactionController;
    }

    getSpendableBalanceDB(minimumValue:number): number {
        let fee: number = 0;//this._accountService.getMiningFees();

        console.log(this.name + ' getSpendableBalanceDB  fee '+ fee);

        let change: number = jaxx.Utils.calculateBalanceSpendable(this._db.getBalancesChange(true), fee);
        let receive: number = jaxx.Utils.calculateBalanceSpendable(this._db.getBalancesReceive(true), fee);


        let spent = this._db.getBalanceTemp();

        let total = change + receive - spent;
        return total;
    }

    getBalanceSpendableDB(fee?: number): number {
        if (isNaN(fee)) fee = 0;//this._accountService.getMiningFees();
        if(this.isToken) fee = 0;
        let total:number = 0;


        let balancesChange: VOBalance[] = this._db.getBalancesChange();
        let num: number = jaxx.Utils.calculateBalanceSpendable(balancesChange, fee);
        let balancesReceive: VOBalance[] = this._db.getBalancesReceive();
        total += jaxx.Utils.calculateBalanceSpendable(balancesReceive, fee);

        console.log(this.name + ' getBalanceSpendableDB   ' + total + '   '+ this._db.getBalanceTotal() + ' fee: ' + fee);
        if(total<0){
            console.warn(this.name + ' getBalanceSpendableDB  total ' + total + ' fee ' + fee);
            total = 0;
        }
        return total;
    }


    getBalanceTotalDB(): number {
        // () => 1860000000 // Test case 1
        // This function returns the total balance for all of the accounts with _coinType in this wallet
        if(this.isBusy) {
            return -1;
        }

        let change: number = this._db.getBalanceChange();
        let receive: number = this._db.getBalanceReceive();
        let spent = this._db.getBalanceTemp();
        // console.log(this.name + ' getBalanceTotal change: '+ change +' receive: '+ receive +'  spent: ' + spent);
        let total = change + receive - spent;
        if(total<0){
          //  console.warn(this.name + ' getBalanceTotalDB   balance ' + total);
            total = 0;
        }

        //total = '---------';

      //  console.error(this.name + ' getBalanceTotalDB ' + total);
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

        let fee: number = 0;// this._accountService.getMiningFees();
        // * this._accountService.getMiningPrice();
        let out: VOBalance[] = [];
        this._db.getBalancesNot0().forEach(balance => {

            if (balance.balance > fee) out.push(balance);
        });

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

    getKeyPairChange(address: string): any {
        var i: number = this._db.getAddressesChange().indexOf(address);
        if (i === -1) {
            //console.error(' ho index for address ' + address);
            return null;
        }

        return this._accountService.getKeyPairChange(i);
    }

    getKeyPair(address: string): any {
        var keyPairEC: any = this.getKeyPairChange(address);
        if (!keyPairEC)  keyPairEC = this.getKeyPairReceive(address);
        return keyPairEC;
    }

    // Just a default.... Might be undefined.
    getPrivateKeyByAddress(address: string): any {
        // Returns '' if a private key cannot be retrieved.
        var keyPairEC: any = this.getKeyPair(address);
        return keyPairEC.toWIF();
    }

    isMyAddressDB(address: string): boolean {
        return this.isMyAddressChange(address) || this.isMyAddressReveive(address);
    }

    isMyAddressReveive(address: string): boolean {
        return this.getAddressIndexReceive(address) !== -1;
    }

    isMyAddressChange(address: string): boolean {
        return this.getAddressIndexChange(address) !== -1;
    }

    isAddressInternal(address: string): number {
        return this._db.isAddressInternal(address);
    }

    getAddressIndex(address: string): number {
        let ind: number = this.getAddressIndexReceive(address);
        if (ind === -1) {
            return this.getAddressIndexChange(address);
        }
        return ind;
    }

    getAddressIndexReceive(address: string): number {
        return this._db.getAddressesReceive().indexOf(address);
    }

    getAddressIndexChange(address: string): number {
        return this._db.getAddressesChange().indexOf(address);
    }

    getAddressChange(i: number): string {
        return this._accountService.getAddressChange(i)
    }


    getAddressReceive(i: number): string {

        return this._accountService.getAddressReceive(i)
    }

    getCurrentPublicAddresReceive(): string {


        return this._accountService.getCurrentAddressReceive();
    }

    getCurrentAddressChange(): string {
        return  this._accountService.getCurrentAddressChange();
    }

    getCurrentIndexReceive(): number {
        return this._db.getCurrentIndexReceive();
    }

    getCurrentIndexChange(): number {
        return this._db.getCurrentIndexChange();
    }

    getAddressesReceive(): string[] {
        return this._db.getAddressesReceive();
    }

    getAddressesChange(): string[] {
        return this._db.getAddressesChange();
    }

    getAddressesAll(): string[] {
        return this._db.getAddressesChange().concat(this._db.getAddressesReceive());
    }

    getQRCode():string{
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
    intervalBalanceChange: number;
    delayBalancesCheck: number;

    startBalancesCheck():void{

        // this function start intervals for balances check bt

        // test.getCryptoController(COIN_BITCOIN).startBalancesCheck()
        // description of the function
        // () => ()
        var self = this;
        console.log(' startBalancesCheck ' + this.intervalBalancesCheck);
            
        if (this.intervalBalancesCheck === 0) {
            this.stopBalancesCheck();
            //this.intervalBalancesCheck = setInterval(err=>this.onError(err), this.intervalAllBalancesCheckCurrent);
            this.intervalBalancesCheck = setInterval(() => this.checkAllBalances(res=>{

            },err=>this.onError(err)), this.intervalAllBalancesCheckCurrent);


            /*this.intervalBalanceReceive = setInterval(() => this.checkBalanceCurrentReceive(), this.intervalCurrentBalanceCheck);

                },err=>this.onError(err))}, this.intervalAllBalancesCheckCurrent
            );*/

            this.intervalBalanceReceive = setInterval(function(){
                self.checkBalanceCurrentReceive();
                if (jaxx.Utils.hasEnoughTimeElapsedToSleepJaxx()) {
                    jaxx.Registry.application$.triggerHandler(jaxx.Registry.GO_SLEEP);
                }
            }, this.intervalCurrentBalanceCheck);

            this.checkAllBalances(
                ()=>{},
                err =>this.onError(err)
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


    onCurrentReceiveAddressGotBalance(balance:VOBalance): void {

        let oldAddress: string = this._db.getCurrentAddressReceive();


            if(balance.id !== oldAddress){
                console.warn(' it is not current addresss ', balance);
                return;
            }


        this._accountService.goToNextIndexReceive();

        this.downloadAllBalances(()=>{

           // this._accountService.downloadNewTransactions([balance.id]);

        },err=>{

        });



           // balance.timestamp = Date.now();
           // balance.delta = balance.balance;

            //this._db.addBalanceReceive(balance);

         //  let newaddress = this._db.getCurrentAddressReceive();

           // console.log('%c new address receive ' + newaddress +' old was: ' + oldAddress,'color:green');


            //this._pouch._notify(this.name + 'new address Recaive and new balance');

            //this.onReceiveBalanceChange(balance.balance);



            //this.emitter$.triggerHandler(this.ON_CURRENT_ADDRESS_RECEIVE_GOT_BALANCE,[balance]);



        /////adding 0  for case you sent it fro youself and old balances not updated it will be inxluded in next update


    }

    checkBalanceCurrentReceive(): void {


        let address: string = this._db.getCurrentAddressReceive();
        if(!this.isActive){
            this.stopBalancesCheck();
            return;
        }

        if (typeof(address) === 'undefined' || address === null || this.isBusy || this.isRestoringHistory) {
            return;
        }

        console.log(this.name + ' checkBalanceCurrentReceive  ' + address +'  '+this.isActive +' '  + new Date().toTimeString());

        this._accountService.downloadBalances([address]).done((balances: VOBalance[]) => {
            let balance: VOBalance = balances[0];
         //   console.log(balances);
          // console.log(' current receive balance ',balance);
            if (balance.balance > 0) {
                if(this.isToken){
                    let oldBalance:number = this._db.getBalanceReceive();
                    let newBalance:number = balance.balance;
                    if(oldBalance !== newBalance){
                        let delta:number = newBalance - oldBalance;



                        this._db._saveBalancesReceive(balances);


                        this._db.resetBalancesSpent();
                        //this.dispatchChages('new balance');

                        this.onBalanceChange(delta);
                    }
                    console.log('%c ' + this.name + ' old Balance  ' + oldBalance + ' new Balance ' + newBalance,'color:green');

                } else this.onCurrentReceiveAddressGotBalance(balance);

            }else console.log(this.name + ' balance '+ balance.balance + ' on ' + balance.id);
        })

    }

    checkAllBalances(cb:Function, onError:Function): Function {

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


   downloadingBalancesCounter:number;

    downloadAllBalances(onSuccess: Function, onError:Function): void {


        if(this.isToken){
            if(onSuccess)onSuccess();
            return;
        };

        if(this.isRestoringHistory){
            if(onSuccess) onSuccess('restoring history');
            return;
        };

        if (this.isBusy){
           if(onSuccess) onSuccess('busy');
            return
        };

        let start: number = Date.now();
        console.log('%c' + this.name + ' downloadAllBalances active: ' + this.isActive + ' enabled: ' + this.isEnabled + ' busy: '+this.isBusy, 'color:#f99');

       if(this.downloadingBalancesCounter){
           this.downloadingBalancesCounter ++;
           if(this.downloadingBalancesCounter > 5) {
               //console.warn(' downloading balances failed resetting to 0 ');
               this.downloadingBalancesCounter = 0;
           }
           //console.warn(' still downloading balances ');
           return;
       }

        this.downloadingBalancesCounter = 1;

        this._accountService.downloadBalancesAll((diffs, delta)=> {

            if(!this.isActive) this.stopBalancesCheck();


            let now: number = Date.now();
            let balaceReceive:number = this._db.getBalanceReceive();
            let balanceChange:number = this._db.getBalanceChange();
            let balanceTemp:number = this._db.getBalanceTemp();
            let balanceSum:number  = balanceChange + balaceReceive;
            let balanceTotal:number = balanceSum - balanceTemp;
            let downloadTime:number = now-start;

            let color:string = delta?'color:red':'color:#f99';
            console.log('%c' + this.name + ' balance in ' + downloadTime/1000 +' sec sum: ' + balanceSum/1e8 +' receive: ' + balaceReceive/1e8 +
                ' change: ' + balanceChange/1e8 + ' spent: '+ balanceTemp/1e8 +' total ' + balanceTotal/1e8  + ' delta ' + delta, color);


            this._db.balancesTimestamp = now;

            if(downloadTime * 3 > this.intervalAllBalancesCheckCurrent) this.downloadingBalancesCounter = 5;

            else this.downloadingBalancesCounter = 0;

            if(delta){

                this.onBalanceChange(delta);
                //this._accountService.downloadNewTransactions1(<string[]>_.map(diffs,'id'));
            }


            jaxx.Registry.application$.triggerHandler(jaxx.Registry.ON_BALANCES_DOWNLOADED,this._coinType);


            if (onSuccess) onSuccess(diffs, delta);


        }, err=>{
           this.downloadingBalancesCounter = 0;
            this.onError(err);
            onError(err);
        });

    }
    generateBalancesFor0Indexes():void{

       let addressReceive:string = this.getAddressReceive(0);
       this._db._saveBalancesReceive([new VOBalance({
           id:addressReceive,
           balance:0
       })]);

        let indexChange:number = this._db.getCurrentIndexChange();
        if(indexChange == 0){
            let addressChange:string = this.getAddressChange(0);
            this._db._saveBalancesChange([new VOBalance({
                id:addressChange,
                balance:0
            })]);
        }

    }

    timestampBusy:number;




    private onRestoreHistorySuccess(result):void{

    }

    restoreHistoryAll(callBack?: Function): void {

       /* if(this.newWallet){
            this.newWallet = false;
            //let addressRecaive:string = this.getAddressRecieve(0);
           // let addressChange:string = this.getAddressChange(0);
           // this._db.saveCurrentIndexChange(0);
           // this._db.saveCurrentIndexReceive(0);


            console.warn(this.getCurrentPublicAddresReceive() + '   ' +this.getCurrentPublicAddresChange());


            callBack();
            return
        }*/

        if (this._db.getCurrentIndexReceive() !== -1){ // This was implemented in order to work with 'All User Keys'

            let balances:VOBalance[] = this._db.getBalancesReceive(true);

            if(balances.length ===0) this.generateBalancesFor0Indexes();
            if (callBack){
                callBack();
            }
            return;
        }
        var self = this;
        let now:number = Date.now();
        if(this.isRestoringHistory) return;
        this.isRestoringHistory = true;
        if(this.isBusy) return;

        this.timestampBusy = Date.now();

        console.log('%c restoring history please wait ','color:red');
        this.emitter$.triggerHandler(this.ON_RESTORE_HISTORY_START);

        if(this.isActive)jaxx.Registry.application$.triggerHandler(jaxx.Registry.ON_RESTORE_HISTORY_START);

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
                'Change: index: ' + this._db.getCurrentIndexChange() + ' in ' + res.timeChange / 1000 + ' s' +
                ' Receive: index: ' + this._db.getCurrentIndexReceive() + ' in ' + res.timeReceive / 1000 + ' s','color:green');

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
    getTransactionsAll():VOTransaction[]{
        return this._db.getTransactionsReceive();
    }


    getTransactionsFromDB(coinType: number): VOTransactionView[] {

       // let price = this._accountService.getMiningFees();
        let trs: VOTransaction[] =[];

       // console.log('getTransactionsFromDB  ' + coinType + '  '+trs.length,trs);
        switch (coinType) {
            case COIN_ETHEREUM_CLASSIC:
            case COIN_ETHEREUM:
            case COIN_TESTNET_ROOTSTOCK:
                return jaxx.Utils.deepCopy(this._db.getTransactionsReceive()).reverse();

            case COIN_BITCOIN:
            case COIN_DASH:
            case COIN_LITECOIN:
            case COIN_LISK:
            case COIN_ZCASH:
            case COIN_DOGE:

                let storedTransactionsReceive: VOTransaction[] = this._db.getTransactionsReceive();
                //let storedTransactionsChange: VOTransaction[] = this._db.getTransactionsChange();


                trs = storedTransactionsReceive;//.concat(storedTransactionsChange);

             ////  console.log(this.name + '    GET transactions View ', trs);

               jaxx.Utils.sortByTimestamp(trs);

              ///  console.log(this.name + '  storedTransactions ',trs);




                //@note: @here: @todo: @refactor:
                //this is taking way longer than it needs to, as it's disassociating this same object at the incoming tx level (crypto_bitcoin.ts), and
                //reassociating it here, with the issue of duplicated inputs/outputs/transactions (since tx are gathered per address, so if the same
                //tx occurs with two of the users addresses, it will appear for both of those addresses).

                let txs: _.Dictionary<ReferenceRelaysTxDetailsData> = {};//{txid:string, txDetails:ReferenceRelaysTxDetailsData}[] = [];

                for (let i = 0; i < trs.length; i++) {
                    let curVOTransaction: VOTransaction = trs[i];

                    if (typeof(txs[curVOTransaction.id]) === 'undefined' || txs[curVOTransaction.id] === null) {
                        txs[curVOTransaction.id] = new ReferenceRelaysTxDetailsData(null);
                        txs[curVOTransaction.id].txid = curVOTransaction.id;
                        txs[curVOTransaction.id].block = curVOTransaction.block;
                        txs[curVOTransaction.id].confirmations = curVOTransaction.confirmations;
                        txs[curVOTransaction.id].time_utc = curVOTransaction.timestamp;


                        // console.log("outputtingfromVO :: txid :: " + curVOTransaction.id);
                    }

                    let curTx = txs[curVOTransaction.id];

                    if (curVOTransaction.input === true) {

                        let isUnique = true;

                        for (let j = 0; j < curTx.inputs.length; j++) {
                            let curInput = curTx.inputs[j];

                            if (curInput.index === curVOTransaction.index) {
                                isUnique = false;
                                break;
                            }
                        }

                        if (isUnique === true) {
                            txs[curVOTransaction.id].inputs.push(new ReferenceRelaysUTXOInput({
                                address: curVOTransaction.address,
                                amount: HDWalletHelper.convertBitcoinsToSatoshis(curVOTransaction.amount),
                                index: curVOTransaction.index,
                                previousTxId: curVOTransaction.previousTxId,
                                previousIndex: curVOTransaction.previousIndex,
                                standard: curVOTransaction.standard
                            }));
                        }
                    } else {
                        let isUnique = true;

                        for (let j = 0; j < curTx.outputs.length; j++) {
                            let curOutput = curTx.outputs[j];

                            if (curOutput.index === curVOTransaction.index) {
                                isUnique = false;
                                break;
                            }
                        }

                        if (isUnique === true) {
                            txs[curVOTransaction.id].outputs.push(new ReferenceRelaysUTXOOutput({
                                address: curVOTransaction.address,
                                amount: HDWalletHelper.convertBitcoinsToSatoshis(curVOTransaction.amount),
                                index: curVOTransaction.index,
                                spent: curVOTransaction.spent,
                                standard: curVOTransaction.standard
                            }));
                        }
                    }
                }

                let txsArray = [];

                let allTxKeys = Object.keys(txs);

                for (let i = 0; i < allTxKeys.length; i++) {
                    txsArray.push(txs[allTxKeys[i]]);
                }

              // console.log('  txsArray  ', txsArray);

              let out = txsArray;//  _.sortBy(txsArray,'time_utc');

              //  txsArray
               //jaxx.Utils.sortByTimestamp(txsArray);
               // console.log(out);
                return out.reverse();
            default:
                return [];


        }

    }



}