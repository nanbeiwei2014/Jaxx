///<reference path="../../com/models.ts"/>
///<reference path="../../com/Utils2.ts"/>
///<reference path="../service-mapper.ts"/>
///<reference path="../blockchain/download_transactions_blockchain.ts"/>
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
    var DownloadTransactoionsBlockr = (function (_super) {
        __extends(DownloadTransactoionsBlockr, _super);
        function DownloadTransactoionsBlockr(name) {
            var _this = _super.call(this, name) || this;
            _this.name = name;
            return _this;
        }
        DownloadTransactoionsBlockr.prototype.init = function () {
            this.url = 'http://btc.blockr.io/api/v1/address/txs/{{address}}';
        };
        DownloadTransactoionsBlockr.prototype.parse = function (result, address) {
            if (result && result.data && result.data.txs) {
                var ar = result.data.txs;
                return jaxx.ServiceMappers.mapBlockrTransactions(ar, address);
            }
            return null;
        };
        return DownloadTransactoionsBlockr;
    }(jaxx.DownloadTransactionsBlockchain));
    jaxx.DownloadTransactoionsBlockr = DownloadTransactoionsBlockr;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=download_transactions_blokr.js.map