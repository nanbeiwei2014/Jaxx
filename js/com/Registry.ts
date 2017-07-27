/**
 * Created by Vlad on 10/6/2016.
 */
///<reference path="models.ts"/>
///<reference path="../datastore/datastore_local.ts"/>
///<reference path="../app/datastore_controller.ts"/>


/*var MyRegistry={
 $emmiter:$({}),
 ON_ADDRESSES:'ON_ADDRESSES',
 addressData:{},
 ddatabase:null
 }*/

var starttime = Date.now();

declare var HDWalletHelper: any;
declare var COIN_UNITLARGE: number;
declare var COIN_UNITSMALL: number;
declare var COIN_ETHEREUM_CLASSIC;
declare var COIN_ETHEREUM;
declare var COIN_TESTNET_ROOTSTOCK;
declare var COIN_BITCOIN;
declare var COIN_GOLEM_ETHEREUM;
declare var COIN_GNOSIS_ETHEREUM;
declare var COIN_SINGULARDTV_ETHEREUM;
declare var COIN_DIGIX_ETHEREUM;
declare var COIN_BLOCKCHAINCAPITAL_ETHEREUM;
declare var COIN_CIVIC_ETHEREUM;
declare var COIN_ICONOMI_ETHEREUM
declare var COIN_DASH;
declare var COIN_LITECOIN;
declare var COIN_LISK;
declare var COIN_ZCASH;
declare var  COIN_DOGE;
declare var COIN_AUGUR_ETHEREUM;

module jaxx {

    export function sendError(err:any){
       /* err.passphrase = 'jaxx';
        err.userId = 0;
        err.errorId = 700;

        err.deviceType = Registry.deviceType;
        err.OS = Registry.OS;
        if(!err.details)err.details = '';
        if(!err.message)err.message = '';

        $.post('', JSON.stringify(err))
            .done(function (res) {
                console.log('error reporting ',res);
        }).fail(function (err) {
            console.log(err);
        })*/

    }
    export class Registry {

        jaxxjs:any;
        jaxxui:any;
        static deviceType = '';//navigator.appVersion;
        static OS = navigator.userAgent;

        static ON_MNEMONIC_CHANGED:string = 'ON_MNEMONIC_CHANGED';
        static ON_APPLICATION_ERROR:string = 'ON_APPLICATION_ERROR';

        static RESET_STORAGE:string = 'RESET_STORAGE';
        static GO_SLEEP:string = 'GO_SLEEP';
        static WAKE_UP:string = 'WAKE_UP';




        static BALANCE_OUT_OFF_SYNC = 'BALANCE_OUT_OFF_SYNC';
        static BALANCE_IN_SYNC = 'BALANCE_IN_SYNC';
        static SYNC_CHECK_START:string = 'SYNC_CHECK_START';
        static SYNC_CHECK_END:string = 'SYNC_CHECK_END';

        static ON_SHAPE_SHIFT_ACTIVATE:string = 'ON_SHAPE_SHIFT_ACTIVATE';


        static ON_UTXOS_READY:string = 'ON_UTXOS_READY';
        static ON_NONCES_READY:string = 'ON_NONCES_READY';

        static ON_SEND_TRANSACTION: string = 'ON_SEND_TRANSACTION';
        static ON_USER_TRANSACTION_COFIRMED: string = 'ON_USER_TRANSACTION_COFIRME';
        static DATA_FROM_RELAY: string = 'DATA_FROM_RELAY';
        static ON_TRANSACTIONS_OBJECT: string = 'ON_TRANSACTIONS_OBJECT';
        static BEGIN_SWITCH_TO_COIN_TYPE: string = 'BEGIN_SWITCH_TO_COIN_TYPE';
        static COMPLETE_SWITCH_TO_COIN_TYPE: string = 'COMPLETE_SWITCH_TO_COIN_TYPE';
        ///////////TODO remove duplicates
        static TRANSACTION_BEFORE_SEND: string = 'TRANSACTION_BEFORE_SEND';
        static TRANSACTION_SENT: string = 'TRANSACTION_SENT';
        static TRANSACTION_FAILED: string = 'TRANSACTION_FAILED';
        static TRANSACTION_ACCEPTED: string = 'TRANSACTION_ACCEPTED';
        static TRANSACTION_CONFIRMED: string = 'TRANSACTION_CONFIRMED';
        static ON_RESTORE_HISTORY_START: string = 'ON_RESTORE_HISTORY_START';
        static ON_RESTORE_HISTORY_ERROR: string = 'ON_RESTORE_HISTORY_ERROR';
        static ON_RESTORE_HISTORY_DONE: string = 'ON_RESTORE_HISTORY_DONE';

        //Balances
      //  static ON_RESTORE_BALANCE_START = "ON_RESTORE_BALANCE_START";
        static ON_RESTORE_BALANCE_ERROR = "ON_RESTORE_BALANCE_ERROR";
      //  static ON_RESTORE_BALANCE_END = "ON_RESTORE_BALANCE_END";
        static ON_RESTORE_BALANCE_MANUAL_START = "ON_RESTORE_BALANCE_MANUAL_START";
        static ON_RESTORE_BALANCE_MANUAL_END = "ON_RESTORE_BALANCE_MANUAL_END";




        static ON_BALANCE_RECEIVE_CHANGE:string = 'ON_BALANCE_RECEIVE_CHANGE';
        static ON_BALANCE_DEEMED:string = 'ON_BALANCE_DEEMED';
        static ON_BALANCE_ACCURATE:string = 'ON_BALANCE_ACCURATE';
        static ON_BALANCES_DOWNLOADED:string = 'ON_BALANCES_DOWNLOADED';




//////////////////////
        static BITCOIN_MINING_FEE: string = 'BITCOIN_MINING_FEE';

        static ON_NEW_WALLET_CREATED: string = 'ON_NEW_WALLET_CREATED';

        /////////////////////////// Application events ////////////////////////////
        static OFFLINE: string = 'OFFLINE';
        static ONLINE: string = 'ONLINE';
        static PAUSE: string = 'PAUSE';
        static RESUME: string = 'RESUME';

        static KILL_HISTORY: string = 'KILL_HISTORY';

        static AMOUNT_TOO_BIG_ETHEREUM:string = 'AMOUNT_TOO_BIG_ETHEREUM';


        static appState:AppState;

        ////////////////////////////////////////////////////////////////////////////
        static datastore_controller_test: JaxxDatastoreController;
        static current_crypto_controller: JaxxCryptoController;
        //static crypto_controllers_test:any = {};

        //static database$ = $({});
        //static userActions$=$({});
        // static idatamodel:IDataModel;
        static application:Application;

        static application$ = $({});
        static sendTransaction$ = $({});
        static _currentCoinType: number;
        static set currentCoinType(currentCoinType: number) {
            // console.error(' setting currentCoinType ' + currentCoinType);
            Registry._currentCoinType = currentCoinType
        };

        static get currentCoinType() {
            return Registry._currentCoinType;
        };

        static tempStorage:any = {};
        static currentTransaction: any;
        static currentTransactionTemp: any;
        static ON_KEY_INIT: string = 'ON_KEY_INIT';
        static settings: any;
        // static implEthereum:any;
        static start: number;
        static tempWallet: any;

        static timeLastActive: any;
        static Ethereum:EthereumDB;
        static  onError(error){
            console.error(error);
                }

    }
    Registry.start = Date.now();
}