///<reference path="../../com/models.ts"/>
///<reference path="../../com/Utils2.ts"/>
///<reference path="../service-mapper.ts"/>
var jaxx;
(function (jaxx) {
    var DownloadTransactionsBlockchain2 = (function () {
        function DownloadTransactionsBlockchain2(name) {
            this.name = name;
            this.requestsDelay = 200;
            this.errorDelay = 10000;
            this.maxErrors = 20;
            this.apiKey = '';
            this.url += this.apiKey;
            this.init();
        }
        DownloadTransactionsBlockchain2.prototype.init = function () {
        };
        DownloadTransactionsBlockchain2.prototype.abort = function () {
        };
        DownloadTransactionsBlockchain2.prototype.destroy = function () {
            if (this.currentRequest) {
                this.currentRequest.abort();
                this.currentRequest = null;
            }
            this.voaddresses = null;
            // this.addresses = null;
            // this.deferred = null;
            this.deferred2 = null;
            this.progress = 0;
        };
        DownloadTransactionsBlockchain2.prototype.reset = function () {
            this.i = -1;
            this.voaddresses = [];
            // this._resolveTxList = [];
            this.errors = 0;
            this.requestsDelay = 200;
            this.progress = 0;
        };
        DownloadTransactionsBlockchain2.prototype.wait = function () {
            this.onHold = true;
        };
        DownloadTransactionsBlockchain2.prototype.resume = function () {
            this.onHold = false;
            this.loadNextAddress();
        };
        DownloadTransactionsBlockchain2.prototype.parse = function (result, address) {
            console.error(' override this method');
            return jaxx.ServiceMappers.mapEtherTransactions(result.result, address);
        };
        DownloadTransactionsBlockchain2.prototype.onError = function (num, message) {
            var _this = this;
            console.warn(this.errors + '   error  ' + message);
            this.errors++;
            if (this.errors > this.maxErrors) {
                this.deferred2.reject({
                    error: num,
                    message: message,
                });
                setTimeout(function () { return _this.destroy(); }, 100);
                return;
            }
            this.i--;
            setTimeout(function () { _this.loadNextAddress(); }, 10000);
        };
        DownloadTransactionsBlockchain2.prototype.downloadTransactions2 = function (voaddresses) {
            this.deferred2 = $.Deferred();
            var transactions = [];
            this.reset();
            //this.addresses = null;
            this.voaddresses = voaddresses;
            this.loadNextAddress();
            return this.deferred2;
        };
        DownloadTransactionsBlockchain2.prototype.loadNextAddress = function () {
            var _this = this;
            if (this.onHold)
                return;
            this.i++;
            //this.progress = 1 + Math.round(100 * this.i/this.addresses.length);
            //this.deferred.notify(this.progress);
            var n = this.voaddresses.length;
            if (this.i >= n) {
                this.deferred2.resolve(this.voaddresses);
                setTimeout(function () { return _this.destroy(); }, 100);
                this.destroy();
                return;
            }
            var address = this.voaddresses[this.i].id;
            var url = this.url.replace('{{address}}', address);
            // console.log(this.name + ' '+url);
            this.currentRequest = $.getJSON(url);
            this.currentRequest.done(function (res) {
                if (res.result) {
                    var transactions = _this.parse(res, address);
                    if (_this.voaddresses)
                        _this.voaddresses[_this.i].transactions = transactions;
                    setTimeout(function () { return _this.loadNextAddress(); }, _this.requestsDelay);
                }
                else
                    _this.onError(1001, url + res.toString());
            }).fail(function (err) { return _this.onError(1404, url + ' ' + err.toString()); });
        };
        return DownloadTransactionsBlockchain2;
    }());
    jaxx.DownloadTransactionsBlockchain2 = DownloadTransactionsBlockchain2;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=download_transactions_blockchain2.js.map