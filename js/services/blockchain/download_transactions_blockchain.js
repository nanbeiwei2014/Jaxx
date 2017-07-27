///<reference path="../../com/models.ts"/>
///<reference path="../../com/Utils2.ts"/>
///<reference path="../service-mapper.ts"/>
var jaxx;
(function (jaxx) {
    var DownloadTransactionsBlockchain = (function () {
        function DownloadTransactionsBlockchain(name, options) {
            this.name = name;
            this.requestsDelay = 200;
            this.errorDelay = 10000;
            this.maxErrors = 20;
            this.apiKey = '';
            this.url = options.urlTransactions + this.apiKey;
            this.init();
        }
        DownloadTransactionsBlockchain.prototype.init = function () {
        };
        DownloadTransactionsBlockchain.prototype.abort = function () {
            if (this.deferred)
                this.deferred.reject('aborted');
            if (this.currentRequest)
                this.currentRequest.abort();
            clearTimeout(this.timeout);
            return this;
        };
        DownloadTransactionsBlockchain.prototype.destroy = function () {
            this.currentRequest = null;
            this.addresses = null;
            this.deferred = null;
            this.progress = 0;
        };
        DownloadTransactionsBlockchain.prototype.reset = function () {
            this._currentIndex = -1;
            this.transactions = [];
            this.errors = 0;
            this.requestsDelay = 200;
            this.progress = 0;
        };
        DownloadTransactionsBlockchain.prototype.wait = function () {
            this.onHold = true;
        };
        DownloadTransactionsBlockchain.prototype.resume = function () {
            this.onHold = false;
            this.loadNextAddress();
        };
        DownloadTransactionsBlockchain.prototype.parse = function (result, address) {
            console.error(' override this method');
            return jaxx.ServiceMappers.mapEtherTransactions(result.result, address);
        };
        DownloadTransactionsBlockchain.prototype.onError = function (num, message) {
            var _this = this;
            console.warn(this.errors + '   error  ' + message);
            this.errors++;
            if (this.errors > this.maxErrors) {
                this.deferred.reject({
                    error: num,
                    message: message,
                });
                setTimeout(function () { return _this.destroy(); }, 100);
                return;
            }
            this._currentIndex--;
            setTimeout(function () { _this.loadNextAddress(); }, 10000);
        };
        DownloadTransactionsBlockchain.prototype.downloadTransactions = function (addresses) {
            this.deferred = $.Deferred();
            var transactions = [];
            this.reset();
            this.addresses = addresses;
            this.loadNextAddress();
            return this.deferred;
        };
        DownloadTransactionsBlockchain.prototype.loadNextAddress = function () {
            var _this = this;
            if (this.onHold || !this.addresses)
                return;
            this._currentIndex++;
            this.progress = 1 + Math.round(100 * this._currentIndex / this.addresses.length);
            this.deferred.notify(this.progress);
            var n = this.addresses.length;
            if (this._currentIndex >= n) {
                this.deferred.resolve(this.transactions);
                this.timeout = setTimeout(function () { return _this.destroy(); }, 100);
                this.destroy();
                return;
            }
            var address = this.addresses[this._currentIndex];
            var url = this.url.replace('{{address}}', address);
            //console.log(this.name + ' '+url);
            this.currentRequest = $.getJSON(url);
            this.currentRequest.done(function (res) {
                var transactions = _this.parse(res, address);
                _this.transactions = _this.transactions.concat(transactions);
                _this.timeout = setTimeout(function () { return _this.loadNextAddress(); }, _this.requestsDelay);
            }).fail(function (err) { return _this.onError(1404, url + ' ' + JSON.stringify(err)); });
        };
        return DownloadTransactionsBlockchain;
    }());
    jaxx.DownloadTransactionsBlockchain = DownloadTransactionsBlockchain;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=download_transactions_blockchain.js.map