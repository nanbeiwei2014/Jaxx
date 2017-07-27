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
    var DownloadTransactionsEthereum = (function (_super) {
        __extends(DownloadTransactionsEthereum, _super);
        function DownloadTransactionsEthereum(name) {
            var _this = _super.call(this, name) || this;
            _this.name = name;
            return _this;
        }
        DownloadTransactionsEthereum.prototype.init = function () {
            this.url = 'https://api.etherscan.io/api?module=account&action=txlist&address={{address}}&tag=latest' + this.apiKey;
        };
        DownloadTransactionsEthereum.prototype.parse = function (result, address) {
            //console.log(address + ' has ' + result.result.length );
            return jaxx.ServiceMappers.mapEtherTransactions(result.result, address);
        };
        return DownloadTransactionsEthereum;
    }(jaxx.DownloadTransactionsBlockchain));
    jaxx.DownloadTransactionsEthereum = DownloadTransactionsEthereum;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=download_transactions_ethereum.js.map