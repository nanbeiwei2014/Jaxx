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
    var EthereumController = (function () {
        // newWallet:boolean;
        function EthereumController(pouch, config) {
            // console.warn(this);
            var _this = this;
            this.pouch = pouch;
            this.config = config;
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
            var name = pouch._coinFullName;
            // console.warn(config);
            config._coinType = pouch._coinType;
            //  console.log(pouch);
            if (name === 'RSK Testnet')
                name = 'RootstockEthereum';
            this.pouch = pouch;
            this._coinType = pouch._coinType;
            this.id = pouch._coinType;
            this.name = name;
            this.coin_HD_index = pouch._hdCoinType;
            pouch.setDataStorageController(this);
            // setTimeout(()=>this.init(),5000);
            this.init();
            setTimeout(function () { return _this.afterAppInit(); }, 100);
        }
        EthereumController.prototype.init = function () {
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
                isToken: this.pouch.isToken(),
                contractAddress: this.pouch.contractAddress
            };
            this._db = new jaxx.EthereumStorage(this.controllerSettings, this.config);
            this._accountService = new jaxx.EthereumService(this.controllerSettings, this._db, this.config);
            this.transactionController = new jaxx.TransactionsEthereum(this);
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
                _this.pouch.setCurrentReceiveAddress(address);
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
            console.log(this.name + ' controller indexes R' + this._db.getCurrentIndexReceive());
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
        EthereumController.prototype.afterAppInit = function () {
        };
        EthereumController.prototype.resetStorage = function () {
            this._db.clearStorage();
            this.transactionController.reset();
            // this._db.saveCurrentIndexReceive(-1);
            // this._db._saveBalancesReceive([]);
            // this._db._saveBalancesChange([]);
        };
        EthereumController.prototype.getBalancesSpent = function () {
            return this._db.getBalancesTemp();
        };
        EthereumController.prototype.getBalanceTemp = function () {
            return this._db.getBalanceTemp();
        };
        EthereumController.prototype.getBalances = function () {
            return this._db.getBalancesAll();
        };
        EthereumController.prototype.getBalancesReceive = function () {
            return this._db.getBalancesReceive(true);
        };
        EthereumController.prototype.getBalanceByAddress = function (address) {
            var balances = this.getBalances();
            var returnBalance = null;
            for (var i = 0; i < balances.length; i++) {
                if (balances[i].id === address) {
                    returnBalance = balances[i].balance;
                }
            }
            return returnBalance;
        };
        EthereumController.prototype.resetBalancesSpent = function () {
            this._db.resetBalancesSpent();
        };
        EthereumController.prototype.setEnabled = function (enabled) {
            this.isEnabled = enabled;
            // console.log(this.name + (enabled?' enabling ':' disabling'))
        };
        EthereumController.prototype.onBalanceChange = function (delta) {
            console.log(jaxx.Registry.ON_BALANCE_RECEIVE_CHANGE + '   ' + delta);
            if (!this.isToken)
                this.transactionController.refreshData();
            jaxx.Registry.application$.triggerHandler(jaxx.Registry.ON_BALANCE_RECEIVE_CHANGE, {
                delta: delta,
                coinType: this._coinType,
                coinName: this.name
            });
        };
        EthereumController.prototype.dispatchNewTransactions = function () {
            var coinType = this._coinType;
            console.log(this.name + ' calling UI to refresh new transactions ' + coinType);
            g_JaxxApp.getUI().updateTransactionListWithCoin(coinType);
            //let trs:any[] = this.getTransactionsFromDB(this._coinType);
            // this.emitter$.triggerHandler(this.ON_NEW_TRANSACTIONS,[ this._coinType,trs]);
        };
        EthereumController.prototype.getHistoryTimestamp = function () {
            return this._db.getHistoryTimestamp();
        };
        EthereumController.prototype.deactivate = function () {
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
        EthereumController.prototype.goSleep = function () {
            this.isWasActive = this.isActive;
            if (this.isWasActive)
                console.log('%c  ' + this.name + ' go sleep  ', 'color:red');
            this.deactivate();
        };
        EthereumController.prototype.wakeUp = function () {
            if (this.isWasActive) {
                console.log('%c  ' + this.name + ' waking up   ', 'color:red');
                this.activate();
            }
        };
        EthereumController.prototype.hasIndexes = function () {
            var has = (this._db.getCurrentIndexReceive() !== -1);
            return has;
        };
        EthereumController.prototype.createNewWallet = function () {
            //console.error(this.name + '   createNewWallet ');
            var addressReceive = this.getAddressReceive(0);
            //this._db.saveCurrentAddressReceive(addressReceive);
            var balanceRceive = new VOBalance({
                id: addressReceive,
                balance: 0,
                index: 0,
                timestamp: Date.now()
            });
            this._db._saveBalancesReceive([balanceRceive]);
            this._db.setNewWallet(false);
        };
        EthereumController.prototype.activate = function () {
            var _this = this;
            console.log(this.name + ' activate ');
            if (this.isActive)
                return;
            this.isActive = true;
            this.isRestoringHistory = false;
            this.downloadingBalancesCounter = 0;
            if (this._db.isNewWallet())
                this.createNewWallet();
            // console.log(Date.now() - starttime);
            console.log('%c activating ' + this.name + ' hasIndexes: ' + this.hasIndexes() + ' recieve ' + this._db.getCurrentIndexReceive(), 'color:green');
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
            else
                this.startBalancesCheck();
            //this.checkIsSync(() => this.onReady(), err => this.onError(err));
            return this;
        };
        EthereumController.prototype.onReady = function () {
            var currentReceiveAddress = this._db.getCurrentAddressReceive();
            // console.warn('  current address receive ' + currentReceiveAddress);
            this.pouch.setCurrentReceiveAddress(currentReceiveAddress);
            this.transactionController.activate();
            this.startBalancesCheck();
            //this.dispatchInit();
        };
        /* dispatchInit(): void {
         if (this.hasIndexes()) {

         this.dispatchChages('init');
         }
         }*/
        EthereumController.prototype.dispatchChages = function (reason) {
            console.log(' dispatchChages ' + this.isActive + '  ' + this.isEnabled);
            // if(this.isActive && this.isEnabled){
            if (this.isActive) {
                console.log('caling UI for update ' + reason);
                this.pouch._notify(reason);
            }
        };
        EthereumController.prototype.downloadNonceForFirstAddress = function () {
            this.transactionController.downloadNonceForFirstAddress();
        };
        EthereumController.prototype.onSendTransactionStart = function (data) {
            this.transactionController.onSendTransactionStart(data);
        };
        EthereumController.prototype.registerSentTransaction = function (result) {
            this.transactionController.registerSentTransaction(result);
        };
        EthereumController.prototype.getHighestAccountBalanceAndIndex = function () {
            this._sortedHighestAccountArray = this.transactionController.getHighestAccountBalanceAndIndex();
            return this._sortedHighestAccountArray ? this._sortedHighestAccountArray[0] : null;
        };
        EthereumController.prototype.getMiningFees = function () {
            return this._accountService.getMiningFees();
        };
        EthereumController.prototype.prepareAddresses = function (addresses) {
            return this.transactionController.prepareAddresses(addresses);
        };
        EthereumController.prototype.getNonces = function () {
            return this.transactionController.nonces;
        };
        EthereumController.prototype.getNonceForFirstAddress = function () {
            return this.transactionController.getNonceForAddress(this.getAddressReceive(0));
        };
        EthereumController.prototype.getNonceForAddress = function (address) {
            return this.transactionController.getNonceForAddress(address);
        };
        EthereumController.prototype.getUTXOs = function () {
            return this.transactionController.getUTXOsNotInQueue(); //getTransactionsUnspent();
        };
        EthereumController.prototype.getTransactionController = function () {
            return this.transactionController;
        };
        EthereumController.prototype.getSpendableBalanceDB = function (minimumValue) {
            var fee = this._accountService.getMiningFees();
            console.log(this.name + ' getSpendableBalanceDB  fee ' + fee);
            var receive = jaxx.Utils.calculateBalanceSpendable(this._db.getBalancesReceive(true), fee);
            var spent = this._db.getBalanceTemp();
            var total = receive - spent;
            return total;
        };
        EthereumController.prototype.getBalanceSpendableDB = function (fee) {
            if (isNaN(fee))
                fee = this._accountService.getMiningFees();
            if (this.isToken)
                fee = 0;
            var total = 0;
            var balancesReceive = this._db.getBalancesReceive();
            total += jaxx.Utils.calculateBalanceSpendable(balancesReceive, fee);
            console.log(this.name + ' getBalanceSpendableDB   ' + total + '   ' + this._db.getBalanceTotal() + ' fee: ' + fee);
            if (total < 0) {
                console.warn(this.name + ' getBalanceSpendableDB  total ' + total + ' fee ' + fee);
                total = 0;
            }
            return total;
        };
        EthereumController.prototype.getBalanceTotalDB = function () {
            // () => 1860000000 // Test case 1
            // This function returns the total balance for all of the accounts with _coinType in this wallet
            if (this.isBusy) {
                return -1;
            }
            var receive = this._db.getBalanceReceive();
            var spent = this._db.getBalanceTemp();
            // console.log(this.name + ' getBalanceTotal change: '+ change +' receive: '+ receive +'  spent: ' + spent);
            var total = receive - spent;
            if (total < 0) {
                //  console.warn(this.name + ' getBalanceTotalDB   balance ' + total);
                total = 0;
            }
            //console.log(total);
            return total;
        };
        EthereumController.prototype.getBalancesForAmount = function (amount) {
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
        EthereumController.prototype.getBalancesHighestFirst = function () {
            return this._db.getBalancesHighestFirst();
        };
        EthereumController.prototype.getBalancesNot0 = function () {
            return this._db.getBalancesNot0();
        };
        EthereumController.prototype.getBalancesSpendableDB = function () {
            var fee = this._accountService.getMiningFees();
            ; // * this._accountService.getMiningPrice();
            var out = [];
            this._db.getBalancesNot0().forEach(function (balance) {
                if (balance.balance > fee)
                    out.push(balance);
            });
            console.warn(out);
            return out;
        };
        EthereumController.prototype.getBalancesNot0Amounts = function () {
            var out = [];
            this._db.getBalancesNot0().forEach(function (balance) { return out.push(balance.balance); });
            return out;
        };
        ////////////////////// Addresses////////////////////
        EthereumController.prototype.getPrivateKeyDB = function (isChange, index) {
            if (isChange) {
                return this._accountService.getKeyPairChange(index);
            }
            return this._accountService.getKeyPairReceive(index);
        };
        EthereumController.prototype.getKeyPairReceive = function (address) {
            var i = this._db.getAddressesReceive().indexOf(address);
            if (i === -1) {
                console.error(' ho index for address ' + address);
                return '';
            }
            return this._accountService.getKeyPairReceive(i);
        };
        EthereumController.prototype.getKeyPair = function (address) {
            return this.getKeyPairReceive(address);
            ;
        };
        // Just a default.... Might be undefined.
        EthereumController.prototype.getPrivateKeyByAddress = function (address) {
            // Returns '' if a private key cannot be retrieved.
            var keyPairEC = this.getKeyPair(address);
            return keyPairEC.toWIF();
        };
        EthereumController.prototype.isMyAddressDB = function (address) {
            return this.isMyAddressReveive(address);
        };
        EthereumController.prototype.isMyAddressReveive = function (address) {
            return this.getAddressIndexReceive(address) !== -1;
        };
        EthereumController.prototype.getAddressIndex = function (address) {
            return this.getAddressIndexReceive(address);
        };
        EthereumController.prototype.getAddressIndexReceive = function (address) {
            return this._db.getAddressesReceive().indexOf(address);
        };
        EthereumController.prototype.getAddressReceive = function (i) {
            return this._db.getAddressReceive(i) || this._accountService.getAddressReceive(i);
        };
        EthereumController.prototype.getCurrentPublicAddresReceive = function () {
            if (!this._db.getCurrentAddressReceive())
                this._db.saveAddressReceive(this.getAddressReceive(0));
            return this._db.getCurrentAddressReceive();
        };
        EthereumController.prototype.getCurrentIndexReceive = function () {
            return this._db.getCurrentIndexReceive();
        };
        EthereumController.prototype.getAddressesReceive = function () {
            return this._db.getAddressesReceive();
        };
        EthereumController.prototype.getAddressesAll = function () {
            return this._db.getAddressesReceive();
        };
        EthereumController.prototype.getQRCode = function () {
            //thirdparty.qrImage.imageSync(uri, {type: "png", ec_level: "H", size: 7, margin: 1}).toString('base64');
            return '';
        };
        EthereumController.prototype.onTransactionUserConfirmed = function (data) {
            this.rawTransaction = data;
        };
        EthereumController.prototype.setCuurentAddresses = function () {
            var lastIndexReceive = this._db.getCurrentAddressReceive();
        };
        EthereumController.prototype.startBalancesCheck = function () {
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
        EthereumController.prototype.stopBalancesCheck = function () {
            // console.warn(this.name + '   stopBalancesCheck   ');
            clearInterval(this.intervalBalancesCheck);
            clearInterval(this.intervalBalanceReceive);
            this.intervalBalancesCheck = 0;
        };
        /*

         onNewTransactions():void{


         }*/
        EthereumController.prototype.onCurrentReceiveAddressGotBalance = function (balance) {
            var oldAddress = this._db.getCurrentAddressReceive();
            if (balance.id !== oldAddress) {
                console.warn(' it is not current addresss ', balance);
                return;
            }
            //this._accountService.goToNextIndexReceive();
            this.downloadAllBalances(function () {
                // this._accountService.downloadNewTransactions([balance.id]);
            }, function (err) {
            });
        };
        EthereumController.prototype.checkBalanceCurrentReceive = function () {
            var _this = this;
            var address = this.getCurrentPublicAddresReceive();
            if (!this.isActive) {
                this.stopBalancesCheck();
                return;
            }
            if (typeof (address) === 'undefined' || address === null || this.isBusy || this.isRestoringHistory) {
                return;
            }
            console.log(this.name + ' checkBalanceCurrentReceive  ' + address + '  ' + this.isActive + ' ' + new Date().toTimeString());
            this._accountService.downloadBalances([address]).done(function (balances) {
                var balance = balances[0];
                //   console.log(balances);
                // console.log(' current receive balance ',balance);
                // if (balance.balance > 0) {
                if (_this.isToken) {
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
                }
                else
                    _this.onCurrentReceiveAddressGotBalance(balance);
                // } else console.log(this.name + ' balance ' + balance.balance + ' on ' + balance.id);
            });
        };
        EthereumController.prototype.checkAllBalances = function (cb, onError) {
            // console.warn('checkAllBalances')
            if (!this.isActive) {
                this.stopBalancesCheck();
                return;
            }
            /// console.log(' checkAllBalances  ');
            this.downloadAllBalances(cb, onError);
            return cb;
        };
        EthereumController.prototype.getBalancesTimestamp = function () {
            return this._db.balancesTimestamp;
        };
        EthereumController.prototype.downloadAllBalances = function (onSuccess, onError) {
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
                var balanceTemp = _this._db.getBalanceTemp();
                var balanceTotal = balaceReceive - balanceTemp;
                var downloadTime = now - start;
                var color = delta ? 'color:red' : 'color:#f99';
                console.log('%c' + _this.name + ' balance in ' + downloadTime / 1000 + ' sec receive: ' + balaceReceive / 1e8 +
                    ' spent: ' + balanceTemp / 1e8 + ' total ' + balanceTotal / 1e8 + ' delta ' + delta, color);
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
        EthereumController.prototype.generateBalancesFor0Indexes = function () {
            var addressReceive = this.getAddressReceive(0);
            this._db._saveBalancesReceive([new VOBalance({
                    id: addressReceive,
                    balance: 0
                })]);
        };
        EthereumController.prototype.onRestoreHistorySuccess = function (result) {
        };
        EthereumController.prototype.restoreHistoryAll = function (callBack) {
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
        EthereumController.prototype.onError = function (err) {
            console.error(this.name, err);
            err = err || {};
            this.errors.push(err);
            err.coinType = this._coinType;
            jaxx.Registry.application$.triggerHandler(jaxx.Registry.ON_APPLICATION_ERROR, err);
            if (this.errors.length > 1000)
                this.errors.shift();
        };
        EthereumController.prototype.convertEtherNumber = function (num) {
            // console.log(this._coinType, num, COIN_UNITLARGE);
            return HDWalletHelper.convertCoinToUnitType(this._coinType, num, COIN_UNITLARGE); // = function(coinType, coinAmount, coinUnitType) ;;
        };
        EthereumController.prototype.getTransactionsAll = function () {
            return this._db.getTransactionsReceive();
        };
        EthereumController.prototype.getTransactionsFromDB = function (coinType) {
            var price = this._accountService.getMiningFees();
            var trs = [];
            // console.log('getTransactionsFromDB  ' + coinType + '  '+trs.length,trs);
            switch (coinType) {
                case COIN_ETHEREUM_CLASSIC:
                case COIN_ETHEREUM:
                case COIN_TESTNET_ROOTSTOCK:
                    return jaxx.Utils.deepCopy(this._db.getTransactionsReceive()).reverse();
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
        };
        return EthereumController;
    }());
    jaxx.EthereumController = EthereumController;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=ethereum-controller.js.map