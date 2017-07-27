///<reference path="transaction_list_dash.ts"/>
///<reference path="balances_dash.ts"/>
///<reference path="transaction_details_dash.ts"/>
///<reference path="utxos_dash.ts"/>
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
///<reference path="../blockchain/main_blockchain.ts"/>
var jaxx;
(function (jaxx) {
    var CryptoDash = (function (_super) {
        __extends(CryptoDash, _super);
        function CryptoDash(coinType, coin_HD_index, service) {
            var _this = _super.call(this, coinType, coin_HD_index, service) || this;
            _this.name = "Dash";
            return _this;
        }
        CryptoDash.prototype.init = function () {
            this._cryptoMethods['transactionList'] = jaxx.TransactionListDash;
            this._cryptoMethods['transactionDetails'] = jaxx.TransactionDetailsDash;
            this._cryptoMethods['utxos'] = jaxx.UTXOsDash;
            this._cryptoMethods['balances'] = jaxx.BalancesDash;
        };
        CryptoDash.prototype.initialize = function () {
            this.generator = new jaxx.GeneratorBlockchain(this.name, this._coinType, this._coin_HD_index);
            this._relayManagerImplementation = new RelayManagerDash();
            this._relayManager = new RelayManager();
            this._relayManager.initialize(this._relayManagerImplementation);
            this._relayManager.initialize(this._relayManagerImplementation);
            g_JaxxApp.setRelays(COIN_DASH, this._relayManager);
        };
        /* downloadTransactions(addresses:string[]):JQueryDeferred<VOTransaction[]> {
             var deffered: JQueryDeferred<any> = $.Deferred();
             console.log(addresses);
 
             var txListRequest: TransactionListBlockchain = new this._cryptoMethods['transactionList'](this._coin_HD_index, this.generator, this.options);
 
             txListRequest.initialize(this.name, this._coinType, this._relayManager);
 
 
             txListRequest.getNextAddress = function () {
                 var address: string = addresses.pop()
                 if (addresses.length == 0) {
                     txListRequest.setTheEnd();
                 }
                 return address;
 
             }
 
             txListRequest.restoreHistory('nothing').done((txList:VORelayedTransactionList[]) => {
 
                 this.getUTXODataFromTxList(txList).done((txListWithUTXOs:VORelayedTransactionList[]) => {
                     this.getTransactionalDataFromTxList(txListWithUTXOs)
                         .done((transactionalData:{index:number, addresses:string[], transactions:VOTransaction[], relayedTransactionListArray:VORelayedTransactionList[]}) => {
                             console.log(transactionalData);
                             deffered.resolve(transactionalData);
                         });
                 });
             });
 
             return deffered;
         }*/
        CryptoDash.prototype.getMiningFees = function () {
            return 55000; //20,000,000
        };
        return CryptoDash;
    }(jaxx.MainBlockchain));
    jaxx.CryptoDash = CryptoDash;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=crypto_dash.js.map