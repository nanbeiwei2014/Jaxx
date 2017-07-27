///<reference path="transaction_list_doge.ts"/>
///<reference path="balances_doge.ts"/>
///<reference path="transaction_details_doge.ts"/>
///<reference path="utxos_doge.ts"/>
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
    // declare var RelayManagerDoge;
    var CryptoDoge = (function (_super) {
        __extends(CryptoDoge, _super);
        function CryptoDoge(coinType, coin_HD_index, service) {
            var _this = _super.call(this, coinType, coin_HD_index, service) || this;
            _this.service = service;
            _this.name = "Doge";
            return _this;
        }
        CryptoDoge.prototype.init = function () {
            this._cryptoMethods['transactionList'] = jaxx.TransactionListDoge;
            this._cryptoMethods['transactionDetails'] = jaxx.TransactionDetailsDoge;
            this._cryptoMethods['utxos'] = jaxx.UTXOsDoge;
            this._cryptoMethods['balances'] = jaxx.BalancesDoge;
        };
        CryptoDoge.prototype.initialize = function () {
            this.generator = new jaxx.GeneratorBlockchain(this.name, this._coinType, this._coin_HD_index);
            this._relayManagerImplementation = new RelayManagerDoge();
            this._relayManager = new RelayManager();
            //console.warn(this._relayManagerImplementation);
            this._relayManager.initialize(this._relayManagerImplementation);
        };
        /* downloadBalances(addresses:string[]):JQueryDeferred<VOBalance[]> {
             var d:JQueryDeferred<VOBalance[]> = $.Deferred();
             var balanceRequestManager:BalancesBlockchain = new this._cryptoMethods['balances']();
 
             balanceRequestManager.initialize(this.name, this._coinType, this._relayManager);
 
             var promise:JQueryPromise<any> = balanceRequestManager.loadBalances(addresses);
             promise.done(res => d.resolve(res)).fail(err => d.reject(err));
 
             return d;
         }
 
 */
        CryptoDoge.prototype.getMiningFees = function () {
            return 55000; //20,000,000
        };
        return CryptoDoge;
    }(jaxx.MainBlockchain));
    jaxx.CryptoDoge = CryptoDoge;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=crypto_doge.js.map