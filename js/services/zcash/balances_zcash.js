/**
 * Created by fieldtempus on 2016-11-07.
 */
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
///<reference path="../../com/models.ts"/>
///<reference path="../../com/Utils2.ts"/>
///<reference path="../service-mapper.ts"/>
///<reference path="../blockchain/balances_blockchain.ts"/>
var RelayManager;
var jaxx;
(function (jaxx) {
    var BalancesZCash = (function (_super) {
        __extends(BalancesZCash, _super);
        function BalancesZCash() {
            return _super.call(this) || this;
        }
        BalancesZCash.prototype.init = function () {
            this._enableLog = false;
            this._batchSize = 20;
        };
        return BalancesZCash;
    }(jaxx.BalancesBlockchain));
    jaxx.BalancesZCash = BalancesZCash;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=balances_zcash.js.map