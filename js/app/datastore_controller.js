///<reference path="../com/models.ts"/>
///<reference path="../services/account-service.ts"/>
///<reference path="../com/Registry.ts"/>
///<reference path="../datastore/crypto_controller.ts"/>
///<reference path="../datastore/refresh_data_controller.ts"/>
///<reference path="balance.ts"/>
//import JaxxAccountService = jaxx.JaxxAccountService;
//import TransactionController = jaxx.TransactionController;
var EthereumController = jaxx.EthereumController;
var JaxxDatastoreController = (function () {
    function JaxxDatastoreController() {
        //    console.error(this);
        //     jaxx.Registry.application$.triggerHandler(jaxx.Registry.GO_SLEEP);
        // jaxx.Registry.application$.triggerHandler(jaxx.Registry.WAKE_UP);
        var _this = this;
        this._cryptoControllers = [];
        /*  addCoinType(pouch:HDWalletPouch):JaxxCryptoController {
         var newCryptoController = new JaxxCryptoController(pouch);
         console.log(pouch);
         this._cryptoControllers.push(newCryptoController);
         return newCryptoController;
      
         }*/
        /* testFunction() {
           this.activate('Ethereum');
           //this.activate('Bitcoin');
       
         }*/
        ///////////////////////////////Interface implementation////////////////////////////////////////////////
        this.status$ = $({}); //    ON_READY | ON_ERROR | ON_NO_SERVICE  | SWITCHING_TO | SWITCHED_TO
        this.totalChange$ = $({}); // evt,number
        /*
        
            $(document).ready(() => {
              this.balance = new jaxx.BalanceController(this);
              console.warn('document  ready ');
        
            });
        */
        jaxx.Registry.application$.on(jaxx.Registry.GO_SLEEP, function (evt) {
            console.log("Sleeping balances");
            $(".suspendOverlay").show();
            if (!!_this.isSleeping)
                return;
            _this.isSleeping = true;
            _this._cryptoControllers.forEach(function (ctr) {
                ctr.goSleep();
            });
        });
        jaxx.Registry.application$.on(jaxx.Registry.WAKE_UP, function (evt) {
            if (!_this.isSleeping)
                return;
            _this.isSleeping = false;
            _this._cryptoControllers.forEach(function (ctr) {
                ctr.wakeUp();
            });
        });
        jaxx.Registry.application$.on(jaxx.Registry.BEGIN_SWITCH_TO_COIN_TYPE, function (evt, data) {
            //{currentCoinType:currentCoinType, targetCoinType:targetCoinType}
            // console.error('BEGIN_SWITCH_TO_COIN_TYPE   ' + data);
            /*   var target: number = data;
               setTimeout(() => this.activate(target), 500);
               ;*/
        });
        jaxx.Registry.application$.on(jaxx.Registry.COMPLETE_SWITCH_TO_COIN_TYPE, function (evt, coinType) {
            //{currentCoinType:currentCoinType, targetCoinType:targetCoinType}
            setTimeout(function () { return _this.activate(coinType); }, 500);
        });
        /*jaxx.Registry.application$.on(jaxx.Registry.ON_USER_TRANSACTION_COFIRMED,(evt,tr:VOSendRawTransaction)=>{
         console.log(jaxx.Registry.ON_USER_TRANSACTION_COFIRMED,tr);
    
         /!*  if(this.tempHex){
         tr.hex = this.tempHex;
         this.tempHex = null;
         this._currentCryptoController.sendTransaction(tr).done(res=>{console.log(res)}).fail(err=>{console.error(err)});
         }*!/
         });
         */
        jaxx.Registry.application$.on(jaxx.Registry.ON_SEND_TRANSACTION, function (evt, tr) {
            _this.tempHex = tr.hex;
            console.log(jaxx.Registry.ON_SEND_TRANSACTION, tr);
        });
        /*jaxx.Registry.database$.on('CURRENCY_MODEL_READY',(evt,id)=>{
         console.warn('CURRENCY_MODEL_READY     '  +id);
         if( id== 'Ethereum'){
         var model = this.getCurrencyModelById(id);
         model.loadHistory();
         }
         })*/
        jaxx.Registry.datastore_controller_test = this;
        jaxx.Registry.application$.triggerHandler('JaxxDatastoreController', this);
    }
    JaxxDatastoreController.prototype.initialize = function (config) {
        // config.options = _.keyBy(config.coinsOptions,'id');
        var _this = this;
        // console.log(config);
        this.config = config;
        console.log("[ JaxxDatastoreController :: Initialize ]");
        // console.log( JaxxAppStatic);
        // g_JaxxApp.getGlobalDispatcher().addEvent(this,'CRYPTO_SELECTED',(evt,data) =>{
        jaxx.Registry.application$.on('CRYPTO_SELECTED', function (evt, data) {
            switch (data.name) {
                case 'BTC':
                    data.name = 'Bitcoin';
                    break;
                case 'ETH':
                    data.name = 'Ethereum';
                    break;
                case 'DASH':
                    data.name = 'Dash';
                    break;
                case 'ETC':
                    data.name = 'EthereumClassic';
                    break;
                case 'REP':
                    data.name = 'AugurEthereum';
                    break;
                case 'LTC':
                    data.name = 'Litecoin';
                    break;
                case 'SBTC':
                    data.name = 'RootstockEthereum';
                    break;
                case 'ICN':
                    data.name = 'IconomiEthereum';
                    break;
                case 'GNT':
                    data.name = 'GolemEthereum';
                    break;
                case 'GNO':
                    data.name = 'GnosisEthereum';
                    break;
                case 'SNGLS':
                    data.name = 'SingulardtvEthereum';
                    break;
                case 'DGD':
                    data.name = 'DigixEthereum';
                    break;
                case 'BCAP':
                    data.name = 'BockchainCapitalEthereum';
                    break;
                case 'CVC':
                    data.name = 'CivicEthereum';
                    break;
                case 'ZEC':
                    data.name = 'ZCash';
                    break;
                case 'DOGE':
                    data.name = 'Doge';
                    break;
            }
            // console.log('   enable - disable ',data);
            _this.enableDisableCryptoController(data.name, data.enabled);
        });
        /* JaxxAppStatic.cryptoDispatcher$.on('CRYPTO_SELECTED',(evt,data) =>{
         console.warn(data);
         });*/
    };
    JaxxDatastoreController.prototype.enableDisableCryptoController = function (name, enabled) {
        var ctr = this.getCryptoControllerByName(name);
        if (ctr) {
            ctr.setEnabled(enabled);
        }
        else {
            console.warn(' cant find controller with name ' + name);
        }
    };
    JaxxDatastoreController.prototype.onSendTransactionStart = function (data) {
        if (jaxx.Registry.current_crypto_controller)
            jaxx.Registry.current_crypto_controller.onSendTransactionStart(data);
    };
    JaxxDatastoreController.prototype.setCoinTypes = function (ar) {
        var _this = this;
        var out = [];
        var config = this.config;
        // console.warn(config);
        _.each(ar, function (pouch) {
            //  console.log(pouch);
            if (pouch) {
                var ctr = void 0;
                if (pouch._coinFullName === 'Ethereum') {
                    var cfg = config.coinsOptions['ETH'];
                    ctr = new EthereumController(pouch, cfg);
                    jaxx.Registry.Ethereum = ctr;
                }
                else
                    ctr = new JaxxCryptoController(pouch, config);
                out.push(ctr);
            }
        });
        this._cryptoControllers = out;
        this.refreshDataController = new jaxx.RefreshDataController(out);
        // console.log(this._cryptoControllers);
        setTimeout(function () {
            var defaultId = jaxx.Registry.currentCoinType;
            _this.activate(defaultId);
            if (jaxx.Registry.appState && jaxx.Registry.appState.create)
                delete jaxx.Registry.appState.create;
        }, 1000);
    };
    JaxxDatastoreController.prototype.addCoinTypes = function (ar) {
        var _this = this;
        var config = this.config;
        var out = this._cryptoControllers;
        _.each(ar, function (pouch) {
            if (pouch) {
                var ctr = new jaxx.TokenController(pouch, config);
                out.push(ctr);
            }
        });
        // this._cryptoControllers = out;
        // this.refreshDataController = new jaxx.RefreshDataController(out);
        // console.log(this._cryptoControllers);
        setTimeout(function () {
            var defaultId = jaxx.Registry.currentCoinType;
            _this.activate(defaultId);
            $('#splashScreen').fadeOut();
        }, 1000);
    };
    /* getBalance(): number {
     return this._currentCryptoController.getBalance();
     }*/
    JaxxDatastoreController.prototype.getCurrentName = function () {
        return jaxx.Registry.current_crypto_controller.controllerSettings.id;
    };
    JaxxDatastoreController.prototype.getHistory = function () {
        return null;
        //return this.currentModel.getTransactions();
    };
    /*  historyChange: JQuery = $({});
     onNewTransactions$: JQuery = $({});//evt, VOTransaction[]
  
  
     onSendTransactionConfirmed$: JQuery = $({});//evt , isConfirmed, transactionid
  
     */
    JaxxDatastoreController.prototype.setDefault = function (coinType) {
        this.defaultName = coinType;
    };
    JaxxDatastoreController.prototype.activate = function (coinType) {
        var cryptoController;
        if (typeof coinType === 'number') {
            cryptoController = this.getCryptoControllerById(coinType);
        }
        else
            cryptoController = this.getCryptoControllerByName(coinType);
        //console.warn(cryptoController);
        //console.warn(jaxx.Registry.current_crypto_controller);
        if (cryptoController) {
            if (jaxx.Registry.current_crypto_controller && jaxx.Registry.current_crypto_controller._coinType !== cryptoController._coinType) {
                //  console.warn(' deactivationg ',jaxx.Registry.current_crypto_controller);
                jaxx.Registry.current_crypto_controller.deactivate();
            }
            cryptoController.activate();
            jaxx.Registry.current_crypto_controller = cryptoController;
        }
        else
            console.log('%c dont have cotroller for ' + coinType, 'color:red');
        //this.addListeners(cryptoController);
    };
    //////////////////////////////////////////////end of interface ////////////////////////////////////////////////////
    JaxxDatastoreController.prototype.getCryptoControllerByCoinType = function (coinType) {
        return this.getCryptoControllerById(coinType);
    };
    JaxxDatastoreController.prototype.getCryptoControllerById = function (id) {
        var ar = this._cryptoControllers.filter(function (item) {
            return (item.id == id);
        });
        if (ar.length === 1)
            return ar[0];
        else {
            console.log('%c   something wrong with id  ' + id, 'color:red');
        }
        return null;
    };
    JaxxDatastoreController.prototype.getCryptoControllerByName = function (name) {
        var ar = this._cryptoControllers.filter(function (item) {
            return (item.controllerSettings.name == name);
        });
        if (ar.length === 1)
            return ar[0];
        else {
            console.log('%c no controlller with name ' + name, 'color:#0FF');
        }
        return null;
    };
    JaxxDatastoreController.prototype.clearAndReset = function () {
        this._cryptoControllers.forEach(function (ctr) {
            ctr.resetStorage();
        });
        console.log("dataStore :: clearAndReset");
    };
    JaxxDatastoreController.onAddressChangeChanged = function () {
        JaxxDatastoreController.emitter$.triggerHandler(JaxxDatastoreController.ON_NEW_ADDRESS_CHANGE, [arguments]);
    };
    JaxxDatastoreController.onAddressReceiveChanged = function () {
        JaxxDatastoreController.emitter$.triggerHandler(JaxxDatastoreController.ON_NEW_ADDRESS_RECEIVE, [arguments]);
    };
    JaxxDatastoreController.onBalanceChanged = function () {
        JaxxDatastoreController.emitter$.triggerHandler(JaxxDatastoreController.ON_SPENDABLE_CHANGED, [arguments]);
        JaxxDatastoreController.emitter$.triggerHandler(JaxxDatastoreController.ON_BALANCE_CHANGED, [arguments]);
    };
    JaxxDatastoreController.onTransactionToBuildPreparing = function () {
        JaxxDatastoreController.emitter$.triggerHandler(JaxxDatastoreController.ON_TRANSACTION_TO_BUILD_PREPARING);
    };
    JaxxDatastoreController.onTransactionToBuildReady = function () {
        JaxxDatastoreController.emitter$.triggerHandler(JaxxDatastoreController.ON_TRANSACTION_TO_BUILD_READY);
    };
    JaxxDatastoreController.onNetworkError = function () {
        JaxxDatastoreController.emitter$.triggerHandler(JaxxDatastoreController.ON_NETWORK_ERROR, [arguments]);
    };
    JaxxDatastoreController.onNewTransactions = function () {
        JaxxDatastoreController.emitter$.triggerHandler(JaxxDatastoreController.ON_TRANSACTIONS_CHANGE, [arguments]);
    };
    return JaxxDatastoreController;
}());
/*addListeners(ctr:JaxxCryptoController): void {
  var trc: jaxx.TransactionController = ctr.transactionController;

  ctr.emitter$.on(ctr.ON_NEW_TRANSACTIONS,JaxxDatastoreController.onNewTransactions)

  ctr.emitter$.on(ctr.ON_RESTORE_HISTORY_START, JaxxDatastoreController.onRestoreHistoryStart);
  ctr.emitter$.on(ctr.ON_RESTORE_HISTORY_DONE, JaxxDatastoreController.onRestoreHistorydDone);

  ctr.emitter$.on(ctr.ON_TRANSACTION_SEND_START, JaxxDatastoreController.onTransactionSendStart);
  ctr.emitter$.on(ctr.ON_TRANSACTION_SENT, JaxxDatastoreController.onTransactionSent);
  ctr.emitter$.on(ctr.ON_TRANSACTION_SEND_PROGRESS, JaxxDatastoreController.onTransactionSendProgress);


}
*/
/* removeListeners(): void {
   var ctr: JaxxCryptoController = this._currentCryptoController;
   if (!ctr) return;
   var service: jaxx.JaxxAccountService = ctr._accountService;
   var trc: jaxx.TransactionController = ctr.transactionController;
   //var self=this;

   ctr.emitter$.off(ctr.ON_RESTORE_HISTORY_START, JaxxDatastoreController.onRestoreHistoryStart);
   ctr.emitter$.off(ctr.ON_RESTORE_HISTORY_DONE, JaxxDatastoreController.onRestoreHistorydDone);

   ctr.emitter$.off(ctr.ON_TRANSACTION_SEND_START, JaxxDatastoreController.onTransactionSendStart);
   ctr.emitter$.off(ctr.ON_TRANSACTION_SENT, JaxxDatastoreController.onTransactionSent);
   ctr.emitter$.off(ctr.ON_TRANSACTION_SEND_PROGRESS, JaxxDatastoreController.onTransactionSendProgress);

   // service.balances$.off(service.ON_BALANCE_CHANGE_CHANGE,self.onBalanceChangeChanged);
   // service.balances$.off(service.ON_BALANCE_RECEIVE_CHANGE,self.onBalanceReceiveChanged);

 }
*/
JaxxDatastoreController.ON_NEW_ADDRESS_RECEIVE = 'ON_NEW_ADDRESS_RECEIVE';
JaxxDatastoreController.ON_NEW_ADDRESS_CHANGE = 'ON_NEW_ADDRESS_CHANGE';
JaxxDatastoreController.ON_NEW_BALANCE = 'ON_NEW_BALANCE';
JaxxDatastoreController.ON_NEW_BACKGROUND_BALANCE = 'ON_NEW_BACKGROUND_BALANCE';
JaxxDatastoreController.ON_BALANCE_CHANGED = 'ON_BALANCE_CHANGED';
JaxxDatastoreController.ON_SPENDABLE_CHANGED = 'ON_SPENDABLE_CHANGED';
JaxxDatastoreController.ON_TRANSACTION_TO_BUILD_PREPARING = 'ON_TRANSACTION_TO_BUILD_PREPARING';
JaxxDatastoreController.ON_TRANSACTION_TO_BUILD_READY = 'ON_TRANSACTION_TO_BUILD_READY';
/*

  static ON_TRANSACTION_SEND_START: string = 'ON_TRANSACION_SEND_START';
  static ON_TRANSACTION_SENT: string = 'ON_TRANSACTION_SENT';
  static ON_TRANSACTION_SEND_PROGRESS: string = 'ON_TRANSACTION_SEND_PROGRESS';

  static ON_TRANSACTION_SENT_ERROR: string = 'ON_TRANSACTION_SENT_ERROR';
*/
/* static onTransactionSendStart(): void {
   JaxxDatastoreController.emitter$.triggerHandler(JaxxDatastoreController.ON_TRANSACTION_SEND_START, [arguments]);
 }*/
/*  static onTransactionSent(): void {
    JaxxDatastoreController.emitter$.triggerHandler(JaxxDatastoreController.ON_TRANSACTION_SENT, [arguments]);
  }*/
/*  static onTransactionSendProgress(): void {
    JaxxDatastoreController.emitter$.triggerHandler(JaxxDatastoreController.ON_TRANSACTION_SEND_PROGRESS, [arguments]);
  }*/
/*  static onTransactionSendError(): void {
    JaxxDatastoreController.emitter$.triggerHandler(JaxxDatastoreController.ON_TRANSACTION_SENT_ERROR, [arguments]);
  }*/
/* static ON_NEW_TRANSACTIONS_HISTORY: string = 'ON_NEW_TRANSACTIONS_HISTORY';
 static ON_TRANSACTIONS_HISTORY_UPDATED: string = 'ON_TRANSACTIONS_HISTORY_UPDATED';*/
/*
  static onNewTransactionsHistory(): void {
    JaxxDatastoreController.emitter$.triggerHandler(JaxxDatastoreController.ON_NEW_TRANSACTIONS_HISTORY, [arguments]);
  }

  static onNewTransactionsHistoryUpdated(): void {
    JaxxDatastoreController.emitter$.triggerHandler(JaxxDatastoreController.ON_TRANSACTIONS_HISTORY_UPDATED, [arguments]);
  }
*/
// static ON_RESTORE_HISTORY_START: string = 'ON_RESTORE_HISTORY_START';
// static ON_RESTORE_HISTORY_DONE: string = 'ON_RESTORE_HISTORY_DONE';
// static ON_RESTORE_HISTORY_ERROR: string = 'ON_RESTORE_HISTORY_ERROR';
/*static onRestoreHistoryStart(): void {
  JaxxDatastoreController.emitter$.triggerHandler(JaxxDatastoreController.ON_RESTORE_HISTORY_START, [arguments]);

}
*/
/*
  static onRestoreHistorydDone(): void {
    JaxxDatastoreController.emitter$.triggerHandler(JaxxDatastoreController.ON_RESTORE_HISTORY_DONE, [arguments]);

  }*/
/*static onRestoreHistoryError(): void {
  JaxxDatastoreController.emitter$.triggerHandler(JaxxDatastoreController.ON_RESTORE_HISTORY_ERROR, [arguments]);

}*/
JaxxDatastoreController.ON_NETWORK_ERROR = 'ON_NETWORK_ERROR';
JaxxDatastoreController.ON_SWITCHING_CRYPTO = 'ON_SWITCHING_CRYPTO';
JaxxDatastoreController.ON_CTYPTO_CHANGED = 'ON_CTYPTO_CHANGED';
JaxxDatastoreController.ON_CRYPTO_OFF = 'ON_CRYPTO_OFF';
JaxxDatastoreController.ON_TRANSACTIONS_CHANGE = 'ON_TRANSACTIONS_CHANGE';
JaxxDatastoreController.emitter$ = $({});
var jaxxconfig = {
    "ver": "1.01",
    "defaults": {
        "checkBalances": 15000,
        "checkCurrentBalanceReceive": 5000
    },
    "coinsOptions": {
        "BTC": {
            "id": 0,
            "name": "Bitcoin",
            "hd_index": 0,
            "request": "RequestBitcoin",
            "checkBalances": 15000,
            "checkCurrentBalanceReceive": 5000
        },
        "ETH": {
            "id": 1,
            "name": "Ethereum",
            "abbr": "ETH",
            "hd_index": 60,
            "request": "EthereumService",
            "urlBalance": 'https://api.etherscan.io/api?module=account&action=balancemulti&address={{addresses}}&tag=latest',
            "urlTransactions": 'http://api.etherscan.io/api?module=account&action=txlist&address={{address}}',
            "urlTransactionStatus": 'https://api.etherscan.io/api?module=transaction&action=getstatus&txhash={{transaction_id}}',
            "urlTransactionInternal": 'https://api.etherscan.io/api?module=account&action=txlistinternal&txhash={{transaction_id}}',
            "balanceParser": null,
            "checkAllBalances": 30000,
            "checkCurrentBalanceReceive": 5000,
            "tokens": []
        },
        "ETC": {
            "id": 1,
            "name": "Ethereum",
            "hd_index": 60,
            "request": "EthereumService",
            "checkAllBalances": 30000,
            "checkCurrentBalanceReceive": 5000,
            "tokens": []
        },
        "DASH": {
            "id": 3,
            "name": "Dash",
            "hd_index": 1,
            "request": "RequestBitcoin",
            "checkBalances": 15000,
            "checkCurrentBalanceReceive": 5000
        },
        "LTC": {
            "id": 6,
            "name": "LIGHT",
            "hd_index": 2,
            "request": "CryptoLitecoin",
            "urlBalance": [
                ""
            ]
        }
    }
};
//var JAXX$ = JaxxDatastoreController.emitter$ 
//# sourceMappingURL=datastore_controller.js.map