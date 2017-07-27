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
var jaxx;
(function (jaxx) {
    var TokenController = (function () {
        // newWallet:boolean;
        function TokenController(pouch, config) {
            // console.log(this.options);
            // intervalAllBalancesCheckDefault:number ;
            this.intervalAllBalancesCheckCurrent = 30000;
            this.intervalCurrentBalanceCheck = 10000;
            this.ON_RESTORE_HISTORY_START = 'ON_RESTORE_HISTORY_START';
            this.ON_RESTORE_HISTORY_DONE = 'ON_RESTORE_HISTORY_DONE';
            this.ON_TRANSACTION_CONFIRMED = 'ON_TRANSACTION_CONFIRMED';
            this.emitter$ = $({});
            //coinType:number;
            this.controllerSettings = {};
            this.ON_BALANCE_CHANGE = 'ON_BALANCE_CHANGE';
            this.ON_NEW_TRANSACTIONS = 'ON_NEW_TRANSACTIONS';
            this.ON_ADDRESS_RECEIVE_CHANGE = 'ON_ADDRESS_RECEIVE_CHANGE';
            this.ON_ADDRESS_CHANGE_CHANGE = 'ON_ADDRESS_CHANGE_CHANGE';
            this.BALANCE_OUT_OF_SYNC = 'BALANCE_OUT_OFF_SYNC';
            this.BALANCE_IN_SYNC = 'BALANCE_IN_SYNC';
            ///////////////////////////////// Transaction Controller integration ////////////
            this._sortedHighestAccountArray = [];
            this.ON_TRANSACTION_SEND_START = 'ON_TRANSACTION_SEND_START';
            this.ON_TRANSACTION_SENT = 'ON_TRANSACTION_SENT';
            this.ON_TRANSACTION_SEND_PROGRESS = 'ON_TRANSACTION_SEND_PROGRESS';
            this.readyTransactionsLength = 0;
            //////////////////////////// Check alll balances /////////////////////
            this.intervalBalancesCheck = 0;
            this.ON_CURRENT_ADDRESS_RECEIVE_GOT_BALANCE = 'ON_CURRENT_ADDRESS_RECEIVE_GOT_BALANCE';
            this.errors = [];
            //console.log(Date.now() - starttime);
            var name = pouch._coinFullName;
            // if (name === 'Ethereum') jaxx.Registry.Ethereum = this;
            //  console.log(pouch);
            if (name === 'RSK Testnet')
                name = 'RootstockEthereum';
            this._pouch = pouch;
            this._coinType = pouch._coinType;
            this.id = pouch._coinType;
            this.name = name;
            this.coin_HD_index = pouch._hdCoinType;
            this.tokens = pouch.token;
            this.isToken = pouch.isToken();
            console.log(this.isToken);
            //jaxx.Registry.crypto_controllers[this.name] = this;
            //jaxx.Registry.crypto_controllers[this.id] = this;
            pouch.setDataStorageController(this);
            //setTimeout(()=>this.init(),5000);
            this.init();
        }
        TokenController.prototype.init = function () {
            /*g_JaxxApp.cryptoDispatcher$.on('CRYPTO_SELECTED',(evt,data) =>{
             console.warn(data);

             });*/
            ///console.log(pouch);
            //var coinHDType = HDWalletPouch.getStaticCoinPouchImplementation(this._pouch._coinType).pouchParameters['coinHDType'];
            //var coinIsTokenSubtype = HDWalletPouch.getStaticCoinPouchImplementation(this._pouch._coinType).pouchParameters['coinIsTokenSubtype'];
            // var coinAbbreviatedName = HDWalletPouch.getStaticCoinPouchImplementation(this._pouch._coinType).pouchParameters['coinAbbreviatedName'];
            // var coinFullName = HDWalletPouch.getStaticCoinPouchImplementation(this._pouch._coinType).uiComponents['coinFullName'];
            var _this = this;
            this.controllerSettings = {
                id: this.id,
                name: this.name,
                coin_HD_index: this.coin_HD_index,
                crypto_class: "Crypto" + this.name,
                isToken: this._pouch.isToken(),
                contractAddress: this._pouch.contractAddress
            };
            this._db = new jaxx.JaxxDatastoreLocal(this.controllerSettings);
            this._db.emitter$.on(this._db.ON_BALANCE_TEMP_LENGTH_NOT_0, function (evt) {
                if (!_this.isToken) {
                    // console.log('%c '+ this.name + '  ' + jaxx.Registry.ON_BALANCE_DEEMED, 'color:pink');
                    // jaxx.Registry.application$.triggerHandler(jaxx.Registry.ON_BALANCE_DEEMED, [this._coinType,this.name]);
                }
            });
            this._db.emitter$.on(this._db.ON_BALANCE_TEMP_LENGTH_0, function (evt) {
                //  console.log('%c '+ this.name + '  ' + jaxx.Registry.ON_BALANCE_ACCURATE, 'color:green');
                // jaxx.Registry.application$.triggerHandler(jaxx.Registry.ON_BALANCE_ACCURATE, [this._coinType,this.name]);
            });
            this._accountService = new jaxx.JaxxAccountService(this.controllerSettings, this._db, this.options);
            this.transactionController = new jaxx.TransactionController(this);
            this.transactionController.emitter$.on(this.transactionController.ON_ALL_TRANSACTIONS_SENT, function () {
                var balancesTemp = _this._db.getBalancesTemp();
                var addresses = jaxx.Utils.getIds(balancesTemp);
                _this._accountService.startCheckAddressesBalances(addresses);
                //console.log(' on transactions sent downloading for addresses ' + addresses);
                // this._accountService.downloadNewTransactions(addresses);
            });
            this.transactionController.emitter$.on(this.transactionController.ON_UTXOS_READY, function (evt, utxos) {
                jaxx.Registry.application$.triggerHandler(jaxx.Registry.ON_UTXOS_READY, [_this._coinType, utxos]);
            });
            this.transactionController.emitter$.on(this.transactionController.ON_NONCES_READY, function (evt, nonces) {
                jaxx.Registry.application$.triggerHandler(jaxx.Registry.ON_NONCES_READY, [_this._coinType, nonces]);
            });
            this._accountService.emitter$.on(this._accountService.ON_NEW_TRANSACTIONS, function (evt, diff) {
                _this.dispatchNewTransactions();
                // console.log(' calling UI to refresh ');
                //this._pouch._notify('new transactions receive');
            });
            /*this._accountService.emitter$.on(this._accountService.ON_BALANCE_RECEIVE_CHANGE, (evt, delta:number) => {

             this.onReceiveChange(delta);

             });*/
            this._accountService.emitter$.on(this._accountService.ON_ADDRESS_RECEIVE_CAHANGE, function (evt, address) {
                _this.emitter$.triggerHandler(_this.ON_ADDRESS_RECEIVE_CHANGE, address);
                _this._pouch.setCurrentReceiveAddress(address);
                ///this._pouch._notify('new transactions receive');
            });
            this._accountService.emitter$.on(this._accountService.ON_ADDRESS_CHANGE_CAHANGE, function (evt, address) {
                _this.emitter$.triggerHandler(_this.ON_ADDRESS_CHANGE_CHANGE, address);
                ///this._pouch._notify('new transactions receive');
            });
            this._accountService.emitter$.on(this._accountService.ON_BALANCES_DIFFERENCE, function (evt, diff) {
                console.log('ON_BALANCES_DIFFERENCE ');
                _this.dispatchChages('ON_BALANCES_DIFFERENCE');
            });
            console.log(this.name + ' controller indexes R C ' + this._db.getCurrentIndexReceive() + ' ' + this._db.getCurrentIndexChange());
            // console.log(Date.now() - starttime);
            var updateOptions = { updateTimeout: 10000, confirmations: 12 };
            if (this.name.indexOf('Ethereum') === -1)
                updateOptions.confirmations = 6;
            this.transactionsUpdater = new jaxx.TransactionsUpdater(this, updateOptions);
            this.transactionsUpdater.emitter$.on(this.transactionsUpdater.ON_TRANSACTION_CONFIRMED, function (evt, justConfirmed) {
                //console.log(justConfirmed);
                _this.emitter$.triggerHandler(_this.ON_TRANSACTION_CONFIRMED, [justConfirmed]);
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
            jaxx.Registry.application$.on(jaxx.Registry.RESET_STORAGE, function (evt, coinType) {
                if (coinType) {
                    if (_this._coinType == coinType)
                        _this.resetStorage();
                }
                else
                    _this.resetStorage();
                if (_this.isActive)
                    _this.restoreHistoryAll(null);
            });
        };
        TokenController.prototype.resetStorage = function () {
            this._db.clearStorage();
            this.transactionController.reset();
            // this._db.saveCurrentIndexReceive(-1);
            // this._db._saveBalancesReceive([]);
            // this._db._saveBalancesChange([]);
        };
        TokenController.prototype.getBalancesSpent = function () {
            return this._db.getBalancesTemp();
        };
        TokenController.prototype.getBalanceTemp = function () {
            return this._db.getBalanceTemp();
        };
        TokenController.prototype.getBalances = function () {
            return this._db.getBalancesAll();
        };
        TokenController.prototype.getBalancesChange = function () {
            return this._db.getBalancesChange(true);
        };
        TokenController.prototype.getBalancesReceive = function () {
            return this._db.getBalancesReceive(true);
        };
        TokenController.prototype.getBalanceByAddress = function (address) {
            var balances = this.getBalances();
            var returnBalance = null;
            for (var i = 0; i < balances.length; i++) {
                if (balances[i].id === address) {
                    returnBalance = balances[i].balance;
                }
            }
            return returnBalance;
        };
        TokenController.prototype.resetBalancesSpent = function () {
            this._db.resetBalancesSpent();
        };
        TokenController.prototype.setEnabled = function (enabled) {
            this.isEnabled = enabled;
            // console.log(this.name + (enabled?' enabling ':' disabling'))
        };
        TokenController.prototype.onBalanceChange = function (delta) {
            console.log(jaxx.Registry.ON_BALANCE_RECEIVE_CHANGE + '   ' + delta);
            if (!this.isToken)
                this.transactionController.refreshData();
            jaxx.Registry.application$.triggerHandler(jaxx.Registry.ON_BALANCE_RECEIVE_CHANGE, {
                delta: delta,
                coinType: this._coinType,
                coinName: this.name
            });
        };
        TokenController.prototype.dispatchNewTransactions = function () {
            var coinType = this._coinType;
            console.log(this.name + ' calling UI to refresh new transactions ' + coinType);
            g_JaxxApp.getUI().updateTransactionListWithCoin(coinType);
            //let trs:any[] = this.getTransactionsFromDB(this._coinType);
            // this.emitter$.triggerHandler(this.ON_NEW_TRANSACTIONS,[ this._coinType,trs]);
        };
        TokenController.prototype.getHistoryTimestamp = function () {
            return this._db.getHistoryTimestamp();
        };
        TokenController.prototype.deactivate = function () {
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
        };
        TokenController.prototype.goSleep = function () {
            this.isWasActive = this.isActive;
            if (this.isWasActive)
                console.log('%c  ' + this.name + ' go sleep  ', 'color:red');
            this.deactivate();
        };
        TokenController.prototype.wakeUp = function () {
            if (this.isWasActive) {
                console.log('%c  ' + this.name + ' waking up   ', 'color:red');
                this.activate();
            }
        };
        TokenController.prototype.hasIndexes = function () {
            var has = (this._db.getCurrentIndexReceive() !== -1);
            return has;
        };
        TokenController.prototype.activate = function () {
            var _this = this;
            if (this.isActive)
                return;
            this.isActive = true;
            this.isRestoringHistory = false;
            this.downloadingBalancesCounter = 0;
            if (this._db.isNewWallet())
                this._accountService.createNewWallet();
            if (this.isToken) {
                jaxx.Registry.datastore_controller_test.getCryptoControllerByName('Ethereum').downloadNonceForFirstAddress();
            }
            // console.log(Date.now() - starttime);
            console.log('%c activating ' + this.name + ' hasIndexes: ' + this.hasIndexes() + ' recieve ' + this._db.getCurrentIndexReceive() + ' change: ' + this._db.getCurrentIndexChange(), 'color:green');
            this.transactionController.activate();
            this.transactionsUpdater.activate();
            var balance = this._db.getBalanceTotal();
            if (balance)
                this.hasData = true;
            if (!this.hasIndexes()) {
                //
                this.restoreHistoryAll(function (res) {
                    _this.startBalancesCheck();
                });
                return this;
            }
            this.checkIsSync(function () { return _this.onReady(); }, function (err) { return _this.onError(err); });
            return this;
        };
        TokenController.prototype.onReady = function () {
            var currentReceiveAddress = this._db.getCurrentAddressReceive();
            // console.warn('  current address receive ' + currentReceiveAddress);
            this._pouch.setCurrentReceiveAddress(currentReceiveAddress);
            this.transactionController.activate();
            this.startBalancesCheck();
            //this.dispatchInit();
        };
        TokenController.prototype.checkIsSync = function (callBack, onError) {
            var _this = this;
            if (this.isToken) {
                callBack();
                return;
            }
            if (this.isSyncTested) {
                callBack();
                return;
            }
            if (this.isRestoringHistory) {
                onError({ error: 102, message: 'Check Sync called while restoring history' });
                return;
            }
            // let currentAddressChange:string = this._db.getCurrentAddressChange();
            var adddresesChange = this.getAddressesChange();
            var currentAddressChange = adddresesChange[adddresesChange.length - 1];
            //  let currentAddressReceive:string = this.getCurrentPublicAddresReceive();
            var addressesReceive = this.getAddressesReceive();
            var currentAddressReceive = addressesReceive[addressesReceive.length - 1];
            var addresses = [currentAddressReceive, currentAddressChange];
            console.log(this.name + ' checking addresses for transactions ' + addresses.toString());
            jaxx.Registry.application$.triggerHandler(jaxx.Registry.SYNC_CHECK_START, this._coinType);
            this._accountService.checkAddressesForTranasactions(addresses).done(function (result) {
                console.log(_this.name + ' Sync result ' + result.length);
                jaxx.Registry.application$.triggerHandler(jaxx.Registry.SYNC_CHECK_END, _this._coinType);
                if (result.length) {
                    console.log('%c OUT OF SYNC ', 'color:red');
                    _this.isBalancesOutOfSync = true;
                    _this.emitter$.triggerHandler(_this.BALANCE_OUT_OF_SYNC);
                    jaxx.Registry.application$.triggerHandler(jaxx.Registry.BALANCE_OUT_OFF_SYNC, _this._coinType);
                    var currentIndexChange_1 = _this._db.getCurrentIndexChange();
                    var currentIndexRecaive_1 = _this._db.getCurrentIndexReceive();
                    var ch_1 = false;
                    var re_1 = false;
                    // let newTxIds:string[] = [];
                    var txList_1 = [];
                    var transactions_1 = [];
                    console.warn(' out of sync change: ' + currentIndexChange_1 + '  receive: ' + currentIndexRecaive_1);
                    if (_this.name.indexOf('Ethereum') === -1) {
                        _this._accountService.restoreHistory2('change', currentIndexChange_1).done(function (result1) {
                            console.log('%c ' + _this.name + ' index change was ' + currentIndexChange_1 + ' now is ' + result1.index + ' new addresses ' + result1.addresses.toString(), 'color:green');
                            console.log(result1);
                            ch_1 = true;
                            var addresses = result1.addresses;
                            // newTxIds = newTxIds.concat(result1.txdIds);
                            txList_1 = txList_1.concat(result1.txsList);
                            transactions_1 = transactions_1.concat(result1.transactions);
                            //TODO follow indexes
                            var db = _this._db;
                            addresses.forEach(function (item) {
                                if (item)
                                    db.addBalanceChange(new VOBalance({ id: item, balance: 0 }));
                            });
                            _this._accountService.goToNextIndexChange();
                            if (ch_1 && re_1)
                                _this.updateAfterSync({
                                    txList: txList_1,
                                    transactions: transactions_1
                                }, callBack, onError);
                        });
                    }
                    else
                        ch_1 = true;
                    _this._accountService.restoreHistory2('receive', currentIndexRecaive_1).done(function (result2) {
                        re_1 = true;
                        var addresses = result2.addresses;
                        // newTxIds = newTxIds.concat(result2.txdIds);
                        txList_1 = txList_1.concat(result2.txsList);
                        transactions_1 = transactions_1.concat(result2.transactions);
                        var db = _this._db;
                        for (var i = 0, n = addresses.length; i < n; i++) {
                            var newAddress = addresses[i];
                            console.log(i + ' ' + newAddress);
                        }
                        addresses.forEach(function (item) {
                            if (item)
                                db.addBalanceReceive(new VOBalance({ id: item, balance: 0 }));
                        });
                        _this._accountService.goToNextIndexReceive();
                        if (ch_1 && re_1)
                            _this.updateAfterSync({
                                txList: txList_1,
                                transactions: transactions_1
                            }, callBack, onError);
                        console.log('%c ' + _this.name + ' index  receive was ' + currentIndexRecaive_1 + ' now is ' + result2.index + ' new addresses ' + result2.addresses.toString(), 'color:green');
                        console.log(result2);
                    });
                }
                else
                    callBack();
                _this.isSyncTested = true;
            });
        };
        TokenController.prototype.updateAfterSync = function (data, onSuccess, onError) {
            var _this = this;
            this.isSyncTested = true;
            console.log('  updateAfterSync   ', data);
            this.downloadAllBalances(function () {
                _this.emitter$.triggerHandler(_this.BALANCE_IN_SYNC);
                console.log('%c ' + jaxx.Registry.BALANCE_IN_SYNC, 'color:pink');
                jaxx.Registry.application$.triggerHandler(jaxx.Registry.BALANCE_IN_SYNC, _this._coinType);
                _this.isBalancesOutOfSync = false;
                setTimeout(function () { return _this.startBalancesCheck(); }, 20000);
                if (data.txList) {
                    _this._accountService.downloadTransactionsDetails(data.txList).done(function (res) {
                        console.log(res);
                        onSuccess();
                    }).fail(function (err) { return onError(err); });
                }
                else {
                    if (data.transactions)
                        _this._accountService.onDownloadedNewTransactions(data.transactions);
                    onSuccess();
                }
            }, function (err) {
            });
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
            return;
        };
        /* dispatchInit(): void {
         if (this.hasIndexes()) {

         this.dispatchChages('init');
         }
         }*/
        TokenController.prototype.dispatchChages = function (reason) {
            console.log(' dispatchChages ' + this.isActive + '  ' + this.isEnabled);
            // if(this.isActive && this.isEnabled){
            if (this.isActive) {
                console.log('caling UI for update ' + reason);
                this._pouch._notify(reason);
            }
        };
        TokenController.prototype.downloadNonceForFirstAddress = function () {
            this.transactionController.downloadNonceForFirstAddress();
        };
        TokenController.prototype.onSendTransactionStart = function (data) {
            this.transactionController.onSendTransactionStart(data);
        };
        TokenController.prototype.registerSentTransaction = function (result) {
            this.transactionController.registerSentTransaction(result);
        };
        TokenController.prototype.getHighestAccountBalanceAndIndex = function () {
            this._sortedHighestAccountArray = this.transactionController.getHighestAccountBalanceAndIndex();
            return this._sortedHighestAccountArray ? this._sortedHighestAccountArray[0] : null;
        };
        TokenController.prototype.getMiningFees = function () {
            return 0;
        };
        TokenController.prototype.prepareAddresses = function (addresses) {
            return this.transactionController.prepareAddresses(addresses);
        };
        TokenController.prototype.getNonces = function () {
            return this.transactionController.nonces;
        };
        TokenController.prototype.getNonceForFirstAddress = function () {
            return this.transactionController.getNonceForAddress(this.getAddressReceive(0));
        };
        TokenController.prototype.getNonceForAddress = function (address) {
            return this.transactionController.getNonceForAddress(address);
        };
        TokenController.prototype.getUTXOs = function () {
            return this.transactionController.getUTXOsNotInQueue(); //getTransactionsUnspent();
        };
        TokenController.prototype.getTransactionController = function () {
            return this.transactionController;
        };
        TokenController.prototype.getSpendableBalanceDB = function (minimumValue) {
            var fee = 0;
            console.log(this.name + ' getSpendableBalanceDB  fee ' + fee);
            var change = jaxx.Utils.calculateBalanceSpendable(this._db.getBalancesChange(true), fee);
            var receive = jaxx.Utils.calculateBalanceSpendable(this._db.getBalancesReceive(true), fee);
            var spent = this._db.getBalanceTemp();
            var total = change + receive - spent;
            return total;
        };
        TokenController.prototype.getBalanceSpendableDB = function (fee) {
            if (isNaN(fee))
                fee = 0;
            if (this.isToken)
                fee = 0;
            var total = 0;
            var balancesChange = this._db.getBalancesChange();
            var num = jaxx.Utils.calculateBalanceSpendable(balancesChange, fee);
            var balancesReceive = this._db.getBalancesReceive();
            total += jaxx.Utils.calculateBalanceSpendable(balancesReceive, fee);
            console.log(this.name + ' getBalanceSpendableDB   ' + total + '   ' + this._db.getBalanceTotal() + ' fee: ' + fee);
            if (total < 0) {
                console.warn(this.name + ' getBalanceSpendableDB  total ' + total + ' fee ' + fee);
                total = 0;
            }
            return total;
        };
        TokenController.prototype.getBalanceTotalDB = function () {
            // () => 1860000000 // Test case 1
            // This function returns the total balance for all of the accounts with _coinType in this wallet
            if (this.isBusy) {
                return -1;
            }
            var change = this._db.getBalanceChange();
            var receive = this._db.getBalanceReceive();
            var spent = this._db.getBalanceTemp();
            // console.log(this.name + ' getBalanceTotal change: '+ change +' receive: '+ receive +'  spent: ' + spent);
            var total = change + receive - spent;
            if (total < 0) {
                //  console.warn(this.name + ' getBalanceTotalDB   balance ' + total);
                total = 0;
            }
            //total = '---------';
            //  console.error(this.name + ' getBalanceTotalDB ' + total);
            return total;
        };
        TokenController.prototype.getBalancesForAmount = function (amount) {
            var out = [];
            var num = 0;
            var balances = this._db.getBalancesReceive();
            for (var i = 0, n = balances.length; i < n; i++) {
                out.push(balances[i]);
                num += balances[i].balance;
                if (num >= amount)
                    return out;
            }
            return null;
        };
        TokenController.prototype.getBalancesHighestFirst = function () {
            return this._db.getBalancesHighestFirst();
        };
        TokenController.prototype.getBalancesNot0 = function () {
            return this._db.getBalancesNot0();
        };
        TokenController.prototype.getBalancesSpendableDB = function () {
            var fee = 0;
            ; // * this._accountService.getMiningPrice();
            var out = [];
            this._db.getBalancesNot0().forEach(function (balance) {
                if (balance.balance > fee)
                    out.push(balance);
            });
            return out;
        };
        TokenController.prototype.getBalancesNot0Amounts = function () {
            var out = [];
            this._db.getBalancesNot0().forEach(function (balance) { return out.push(balance.balance); });
            return out;
        };
        ////////////////////// Addresses////////////////////
        TokenController.prototype.getPrivateKeyDB = function (isChange, index) {
            if (isChange) {
                return this._accountService.getKeyPairChange(index);
            }
            return this._accountService.getKeyPairReceive(index);
        };
        TokenController.prototype.getKeyPairReceive = function (address) {
            var i = this._db.getAddressesReceive().indexOf(address);
            if (i === -1) {
                console.error(' ho index for address ' + address);
                return '';
            }
            return this._accountService.getKeyPairReceive(i);
        };
        TokenController.prototype.getKeyPairChange = function (address) {
            var i = this._db.getAddressesChange().indexOf(address);
            if (i === -1) {
                //console.error(' ho index for address ' + address);
                return null;
            }
            return this._accountService.getKeyPairChange(i);
        };
        TokenController.prototype.getKeyPair = function (address) {
            var keyPairEC = this.getKeyPairChange(address);
            if (!keyPairEC)
                keyPairEC = this.getKeyPairReceive(address);
            return keyPairEC;
        };
        // Just a default.... Might be undefined.
        TokenController.prototype.getPrivateKeyByAddress = function (address) {
            // Returns '' if a private key cannot be retrieved.
            var keyPairEC = this.getKeyPair(address);
            return keyPairEC.toWIF();
        };
        TokenController.prototype.isMyAddressDB = function (address) {
            return this.isMyAddressChange(address) || this.isMyAddressReveive(address);
        };
        TokenController.prototype.isMyAddressReveive = function (address) {
            return this.getAddressIndexReceive(address) !== -1;
        };
        TokenController.prototype.isMyAddressChange = function (address) {
            return this.getAddressIndexChange(address) !== -1;
        };
        TokenController.prototype.isAddressInternal = function (address) {
            return this._db.isAddressInternal(address);
        };
        TokenController.prototype.getAddressIndex = function (address) {
            var ind = this.getAddressIndexReceive(address);
            if (ind === -1) {
                return this.getAddressIndexChange(address);
            }
            return ind;
        };
        TokenController.prototype.getAddressIndexReceive = function (address) {
            return this._db.getAddressesReceive().indexOf(address);
        };
        TokenController.prototype.getAddressIndexChange = function (address) {
            return this._db.getAddressesChange().indexOf(address);
        };
        TokenController.prototype.getAddressChange = function (i) {
            return this._accountService.getAddressChange(i);
        };
        TokenController.prototype.getAddressReceive = function (i) {
            return jaxx.Registry.Ethereum.getAddressReceive(i);
            // return this._accountService.getAddressReceive(i)
        };
        TokenController.prototype.getCurrentPublicAddresReceive = function () {
            return this._accountService.getCurrentAddressReceive();
        };
        TokenController.prototype.getCurrentAddressChange = function () {
            return this._accountService.getCurrentAddressChange();
        };
        TokenController.prototype.getCurrentIndexReceive = function () {
            return this._db.getCurrentIndexReceive();
        };
        TokenController.prototype.getCurrentIndexChange = function () {
            return this._db.getCurrentIndexChange();
        };
        TokenController.prototype.getAddressesReceive = function () {
            return this._db.getAddressesReceive();
        };
        TokenController.prototype.getAddressesChange = function () {
            return this._db.getAddressesChange();
        };
        TokenController.prototype.getAddressesAll = function () {
            return this._db.getAddressesChange().concat(this._db.getAddressesReceive());
        };
        TokenController.prototype.getQRCode = function () {
            //thirdparty.qrImage.imageSync(uri, {type: "png", ec_level: "H", size: 7, margin: 1}).toString('base64');
            return '';
        };
        TokenController.prototype.onTransactionUserConfirmed = function (data) {
            this.rawTransaction = data;
        };
        TokenController.prototype.setCuurentAddresses = function () {
            var lastIndexReceive = this._db.getCurrentAddressReceive();
        };
        TokenController.prototype.startBalancesCheck = function () {
            // this function start intervals for balances check bt
            var _this = this;
            // test.getCryptoController(COIN_BITCOIN).startBalancesCheck()
            // description of the function
            // () => ()
            var self = this;
            console.log(' startBalancesCheck ' + this.intervalBalancesCheck);
            if (this.intervalBalancesCheck === 0) {
                this.stopBalancesCheck();
                //this.intervalBalancesCheck = setInterval(err=>this.onError(err), this.intervalAllBalancesCheckCurrent);
                this.intervalBalancesCheck = setInterval(function () { return _this.checkAllBalances(function (res) {
                }, function (err) { return _this.onError(err); }); }, this.intervalAllBalancesCheckCurrent);
                /*this.intervalBalanceReceive = setInterval(() => this.checkBalanceCurrentReceive(), this.intervalCurrentBalanceCheck);

                 },err=>this.onError(err))}, this.intervalAllBalancesCheckCurrent
                 );*/
                this.intervalBalanceReceive = setInterval(function () {
                    self.checkBalanceCurrentReceive();
                    if (jaxx.Utils.hasEnoughTimeElapsedToSleepJaxx()) {
                        jaxx.Registry.application$.triggerHandler(jaxx.Registry.GO_SLEEP);
                    }
                }, this.intervalCurrentBalanceCheck);
                this.checkAllBalances(function () {
                }, function (err) { return _this.onError(err); });
            }
        };
        TokenController.prototype.stopBalancesCheck = function () {
            // console.warn(this.name + '   stopBalancesCheck   ');
            clearInterval(this.intervalBalancesCheck);
            clearInterval(this.intervalBalanceReceive);
            this.intervalBalancesCheck = 0;
        };
        /*

         onNewTransactions():void{


         }*/
        TokenController.prototype.onCurrentReceiveAddressGotBalance = function (balance) {
            var oldAddress = this._db.getCurrentAddressReceive();
            if (balance.id !== oldAddress) {
                console.warn(' it is not current addresss ', balance);
                return;
            }
            this._accountService.goToNextIndexReceive();
            this.downloadAllBalances(function () {
                // this._accountService.downloadNewTransactions([balance.id]);
            }, function (err) {
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
        };
        TokenController.prototype.checkBalanceCurrentReceive = function () {
            var _this = this;
            var address = this._db.getCurrentAddressReceive();
            if (!this.isActive || !address) {
                this.stopBalancesCheck();
                return;
            }
            if (typeof (address) === 'undefined' || address === null || this.isBusy || this.isRestoringHistory) {
                return;
            }
            console.log(this.name + ' checkBalanceCurrentReceive  ' + address + '  ' + this.isActive + ' ' + new Date().toTimeString());
            this._accountService.downloadBalances([address])
                .done(function (balances) {
                var balance = balances[0];
                var oldBalance = _this._db.getBalanceReceive();
                var newBalance = balance.balance;
                if (oldBalance !== newBalance) {
                    var delta = newBalance - oldBalance;
                    _this._db._saveBalancesReceive(balances);
                    _this._db.resetBalancesSpent();
                    //this.dispatchChages('new balance');
                    _this.onBalanceChange(delta);
                }
                console.log('%c ' + _this.name + ' old Balance  ' + oldBalance + ' new Balance ' + newBalance, 'color:green');
            })
                .fail(jaxx.Registry.onError);
        };
        TokenController.prototype.checkAllBalances = function (cb, onError) {
            // console.warn('checkAllBalances')
            if (!this.isActive) {
                this.stopBalancesCheck();
                return;
            }
            /// console.log(' checkAllBalances  ');
            this.downloadAllBalances(cb, onError);
            return cb;
        };
        TokenController.prototype.getBalancesTimestamp = function () {
            return this._db.balancesTimestamp;
        };
        TokenController.prototype.downloadAllBalances = function (onSuccess, onError) {
            var _this = this;
            if (this.isToken) {
                if (onSuccess)
                    onSuccess();
                return;
            }
            ;
            if (this.isRestoringHistory) {
                if (onSuccess)
                    onSuccess('restoring history');
                return;
            }
            ;
            if (this.isBusy) {
                if (onSuccess)
                    onSuccess('busy');
                return;
            }
            ;
            var start = Date.now();
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
            this._accountService.downloadBalancesAll(function (diffs, delta) {
                if (!_this.isActive)
                    _this.stopBalancesCheck();
                var now = Date.now();
                var balaceReceive = _this._db.getBalanceReceive();
                var balanceChange = _this._db.getBalanceChange();
                var balanceTemp = _this._db.getBalanceTemp();
                var balanceSum = balanceChange + balaceReceive;
                var balanceTotal = balanceSum - balanceTemp;
                var downloadTime = now - start;
                var color = delta ? 'color:red' : 'color:#f99';
                console.log('%c' + _this.name + ' balance in ' + downloadTime / 1000 + ' sec sum: ' + balanceSum / 1e8 + ' receive: ' + balaceReceive / 1e8 +
                    ' change: ' + balanceChange / 1e8 + ' spent: ' + balanceTemp / 1e8 + ' total ' + balanceTotal / 1e8 + ' delta ' + delta, color);
                _this._db.balancesTimestamp = now;
                if (downloadTime * 3 > _this.intervalAllBalancesCheckCurrent)
                    _this.downloadingBalancesCounter = 5;
                else
                    _this.downloadingBalancesCounter = 0;
                if (delta) {
                    _this.onBalanceChange(delta);
                    //this._accountService.downloadNewTransactions1(<string[]>_.map(diffs,'id'));
                }
                jaxx.Registry.application$.triggerHandler(jaxx.Registry.ON_BALANCES_DOWNLOADED, _this._coinType);
                if (onSuccess)
                    onSuccess(diffs, delta);
            }, function (err) {
                _this.downloadingBalancesCounter = 0;
                _this.onError(err);
                onError(err);
            });
        };
        TokenController.prototype.generateBalancesFor0Indexes = function () {
            var addressReceive = this.getAddressReceive(0);
            this._db._saveBalancesReceive([new VOBalance({
                    id: addressReceive,
                    balance: 0
                })]);
            var indexChange = this._db.getCurrentIndexChange();
            if (indexChange == 0) {
                var addressChange = this.getAddressChange(0);
                this._db._saveBalancesChange([new VOBalance({
                        id: addressChange,
                        balance: 0
                    })]);
            }
        };
        TokenController.prototype.onRestoreHistorySuccess = function (result) {
        };
        TokenController.prototype.restoreHistoryAll = function (callBack) {
            /* if(this.newWallet){
             this.newWallet = false;
             //let addressRecaive:string = this.getAddressReceive(0);
             // let addressChange:string = this.getAddressChange(0);
             // this._db.saveCurrentIndexChange(0);
             // this._db.saveCurrentIndexReceive(0);


             console.warn(this.getCurrentPublicAddresReceive() + '   ' +this.getCurrentPublicAddresChange());


             callBack();
             return
             }*/
            var _this = this;
            if (this._db.getCurrentIndexReceive() !== -1) {
                var balances = this._db.getBalancesReceive(true);
                if (balances.length === 0)
                    this.generateBalancesFor0Indexes();
                if (callBack) {
                    callBack();
                }
                return;
            }
            var self = this;
            var now = Date.now();
            if (this.isRestoringHistory)
                return;
            this.isRestoringHistory = true;
            if (this.isBusy)
                return;
            this.timestampBusy = Date.now();
            console.log('%c restoring history please wait ', 'color:red');
            this.emitter$.triggerHandler(this.ON_RESTORE_HISTORY_START);
            if (this.isActive)
                jaxx.Registry.application$.triggerHandler(jaxx.Registry.ON_RESTORE_HISTORY_START);
            this._db.saveHistoryTimestamp(Date.now());
            this.isBusy = true;
            this.transactionController.deactivate();
            this._accountService.restoreHistoryAll().then(function (res) {
                _this.isRestoringHistory = false;
                _this.isBusy = false;
                _this.emitter$.triggerHandler(_this.ON_RESTORE_HISTORY_DONE);
                _this.transactionController.activate();
                _this.dispatchNewTransactions();
                jaxx.Registry.application$.triggerHandler(jaxx.Registry.ON_RESTORE_HISTORY_DONE);
                console.log('%c history succesfully restored => ' +
                    'Change: index: ' + _this._db.getCurrentIndexChange() + ' in ' + res.timeChange / 1000 + ' s' +
                    ' Receive: index: ' + _this._db.getCurrentIndexReceive() + ' in ' + res.timeReceive / 1000 + ' s', 'color:green');
                _this.dispatchChages('history_restored');
                if (callBack)
                    callBack();
            }).fail(function (err) {
                _this.isBusy = false;
                _this.isRestoringHistory = false;
                jaxx.Registry.application$.triggerHandler(jaxx.Registry.ON_RESTORE_HISTORY_ERROR);
                _this.onError(err);
                if (callBack)
                    callBack(err);
            }).always(function () { return _this._db.saveHistoryTimestamp(Date.now()); });
        };
        TokenController.prototype.onError = function (err) {
            console.error(this.name, err);
            err = err || {};
            this.errors.push(err);
            err.coinType = this._coinType;
            jaxx.Registry.application$.triggerHandler(jaxx.Registry.ON_APPLICATION_ERROR, err);
            if (this.errors.length > 1000)
                this.errors.shift();
        };
        TokenController.prototype.convertEtherNumber = function (num) {
            // console.log(this._coinType, num, COIN_UNITLARGE);
            return HDWalletHelper.convertCoinToUnitType(this._coinType, num, COIN_UNITLARGE); // = function(coinType, coinAmount, coinUnitType) ;;
        };
        TokenController.prototype.getTransactionsAll = function () {
            return this._db.getTransactionsReceive();
        };
        TokenController.prototype.getTransactionsFromDB = function (coinType) {
            return [];
        };
        return TokenController;
    }());
    jaxx.TokenController = TokenController;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=token-controller.js.map