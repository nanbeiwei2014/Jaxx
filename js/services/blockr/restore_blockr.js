///<reference path="../../com/models.ts"/>
///<reference path="../../com/Utils2.ts"/>
///<reference path="../service-mapper.ts"/>
///<reference path="../blockchain/transaction_details_blockchain.ts"/>
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
    var RestoreBlockr = (function (_super) {
        __extends(RestoreBlockr, _super);
        function RestoreBlockr(coin_HD_index, generator) {
            var _this = _super.call(this, coin_HD_index, generator) || this;
            _this.coin_HD_index = coin_HD_index;
            _this.generator = generator;
            return _this;
        }
        RestoreBlockr.prototype.parse = function (result, address) {
            if (result && result.data && result.data.txs) {
                var ar = result.data.txs;
                return jaxx.ServiceMappers.mapBlockrTransactions(ar, address);
            }
            return null;
        };
        RestoreBlockr.prototype.init = function () {
            this.url = 'http://btc.blockr.io/api/v1/address/txs/{{address}}';
            this.name = this.generator.name;
        };
        return RestoreBlockr;
    }(jaxx.RestoreHistory));
    jaxx.RestoreBlockr = RestoreBlockr;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=restore_blockr.js.map