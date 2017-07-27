///<reference path="../../com/models.ts"/>
///<reference path="../../com/Utils2.ts"/>
///<reference path="../service-mapper.ts"/>
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
///
var jaxx;
(function (jaxx) {
    var BalancesBlockr = (function (_super) {
        __extends(BalancesBlockr, _super);
        function BalancesBlockr() {
            return _super.call(this) || this;
        }
        BalancesBlockr.prototype.init = function () {
            this.url = 'http://btc.blockr.io/api/v1/address/balance/{{addresses}}';
        };
        BalancesBlockr.prototype.parse = function (resp) {
            if (resp && resp.data) {
                var ar = _.isArray(resp.data) ? resp.data : [resp.data];
                var t = Date.now();
                return _.map(ar, function (item) {
                    return new VOBalance({ id: item.address, balance: +item.balance, timestamp: t });
                });
            }
            // this.onError(' no-data ');
            return null;
        };
        return BalancesBlockr;
    }(jaxx.BalancesBlockchain));
    jaxx.BalancesBlockr = BalancesBlockr;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=balances-blockr.js.map