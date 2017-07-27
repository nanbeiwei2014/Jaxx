/**
 * Created by fieldtempus on 2016-11-08.
 */
//<reference path="../../com/models.ts"/>
///<reference path="../../com/Utils2.ts"/>
///<reference path="../service-mapper.ts"/>
///<reference path="../blockchain/transaction_list_blockchain.ts"/>
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
var jaxx;
(function (jaxx) {
    var TransactionListDash = (function (_super) {
        __extends(TransactionListDash, _super);
        function TransactionListDash(coin_HD_index, generator) {
            return _super.call(this, coin_HD_index, generator) || this;
        }
        TransactionListDash.prototype.init = function () {
            this._enableLog = false;
            this._batchSize = 10;
        };
        return TransactionListDash;
    }(jaxx.TransactionListBitcoin));
    jaxx.TransactionListDash = TransactionListDash;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=transaction_list_dash.js.map