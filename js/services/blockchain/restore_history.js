/**
 * Created by fieldtempus on 2016-11-10.
 */
///<reference path="../../com/models.ts"/>
///<reference path="../../com/Utils2.ts"/>
///<reference path="../service-mapper.ts"/>
var jaxx;
(function (jaxx) {
    var RestoreHistory = (function () {
        function RestoreHistory(options, generator) {
            var _this = this;
            this.options = options;
            this.generator = generator;
            this.attempts = 10;
            //receive_change:string;
            this.apiKey = '';
            this.requestDelays = 200;
            this._currentIndex = 0;
            this.stratIndex = 0;
            this.numberOfTransactionsWithoutHistory = 20;
            //@note: @here: for relay managed classes. eventually it will be applicabe to all of the blockchains.
            this._relayManager = null;
            //@note: @here: for gathering _resolveTxList in a batch.
            this._batchSize = 20;
            this._enableLog = true;
            this.name = options.name;
            this.init();
            jaxx.Registry.application$.on(jaxx.Registry.KILL_HISTORY, function (evt, name) {
                console.log(_this.name + ' killing history ');
                _this.deferred.reject({ error: 100, message: 'process killed' });
                setTimeout(function () { return _this.destroy(); }, 100);
            });
        }
        RestoreHistory.prototype.initialize = function (name, relayManager) {
        };
        RestoreHistory.prototype.abort = function () {
            return this;
        };
        RestoreHistory.prototype.init = function () {
            //this.url = 'https://api.etherscan.io/api?module=account&action=txlist&address={{address}}&tag=latest';
            // this.url += this.apiKey;
            // this._name = this.generator.name;
        };
        RestoreHistory.prototype.wait = function () {
            this.onHold = true;
        };
        RestoreHistory.prototype.resume = function () {
            this.onHold = false;
            this.loadNextAddress();
        };
        RestoreHistory.prototype.destroy = function () {
            if (this.currentRequest) {
                this.currentRequest.abort();
                this.currentRequest = null;
            }
            this.addresses = null;
            this.transactions = null;
            this.destroyed = true;
            if (this.onDestroyed)
                this.onDestroyed();
        };
        RestoreHistory.prototype.reset = function () {
            this._currentIndex = this.stratIndex - 1;
            this._numberOfTransactionsWithoutHistory = 0;
            this.addresses = [];
            this.transactions = [];
            this.attempts = 10;
            this.requestDelays = 20;
        };
        RestoreHistory.prototype.parse = function (result, address) {
            if (result.result) {
                var ar = result.result;
                return jaxx.ServiceMappers.mapEtherTransactions(ar, address);
            }
            return null;
        };
        RestoreHistory.prototype.onError = function (num, url, message) {
            var _this = this;
            console.warn(this.attempts + '   error ' + message);
            this.attempts--;
            if (this.attempts < 0) {
                this.deferred.reject({
                    error: num,
                    attempts: this.attempts,
                    message: message,
                    url: url
                });
                this.destroy();
                return;
            }
            this._currentIndex--;
            setTimeout(function () { _this.loadNextAddress(); }, 10000);
        };
        //@note: @here: @codereview: wondering why this doesn't use the same interface as IRequestServer (which is what restore_ethereum.ts is being called from main_Ethereum.)
        RestoreHistory.prototype.restoreHistory = function (receive_change, startIndex) {
            var _this = this;
            if (startIndex === void 0) { startIndex = 0; }
            //var promise:JQueryDeferred<{index:number,addresses:string[]}>
            console.log('%c ' + this.name + ' restoreHistory ' + receive_change, 'color:brown');
            this.deferred = $.Deferred();
            this.receive_change = receive_change;
            this.stratIndex = startIndex;
            this.reset();
            setTimeout(function () { return _this.loadNextAddress(); }, 50);
            return this.deferred;
        };
        //
        RestoreHistory.prototype.loadNextAddress = function () {
            var _this = this;
            if (this.onHold || this.destroyed)
                return;
            this._currentIndex++;
            this._numberOfTransactionsWithoutHistory++;
            if (this._numberOfTransactionsWithoutHistory > this.numberOfTransactionsWithoutHistory) {
                var out = {
                    index: this._currentIndex - this.numberOfTransactionsWithoutHistory,
                    addresses: this.addresses.slice(0, this.addresses.length - this.numberOfTransactionsWithoutHistory),
                    transactions: this.transactions
                };
                this.deferred.resolve(out);
                this.destroy();
                return;
            }
            // var receive_change:string = this.receive_change;
            //  console.log('coin_HD_index  ' + this.coin_HD_index + '' +
            // ' ' + this.i +  '  nullcount: '+ this.numberOfTransactionsWithoutHistory + '  node: ' + this.receive_change);
            var address = this.generator.generateAddress(this._currentIndex, this.receive_change);
            //this.addresses.push(address);
            this.addresses[this._currentIndex] = address;
            var url = this.url.replace('{{address}}', address);
            /// console.log(url);
            this.currentRequest = $.getJSON(url);
            this.currentRequest.done(function (res) {
                //console.log(res);
                var transactions = _this.parse(res, address);
                if (transactions && transactions.length) {
                    _this._numberOfTransactionsWithoutHistory = 0;
                    _this.transactions = _this.transactions.concat(transactions);
                }
                console.log(_this.name + ' i ' + _this._currentIndex + ' ' + address + '   has ' + transactions.length + ' ' +
                    ' transactions ' + _this.receive_change);
                setTimeout(function () { _this.loadNextAddress(); }, _this.requestDelays);
            }).fail(function (err) { return _this.onError(1404, url, 'http error'); });
        };
        return RestoreHistory;
    }());
    jaxx.RestoreHistory = RestoreHistory;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=restore_history.js.map