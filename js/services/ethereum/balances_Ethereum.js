///<reference path="../../com/models.ts"/>
///<reference path="../../com/Utils2.ts"/>
///<reference path="../service-mapper.ts"/>
///<reference path="../blockchain/balances_blockchain.ts"/>
var jaxx;
(function (jaxx) {
    var BalancesEthereum = (function () {
        function BalancesEthereum(options) {
            this.options = options;
            this._currentBatch = 20;
            this._name = "";
            this.maxErrors = 20;
            this.requestsDelay = 20;
            //@note: @here: for relay managed classes. eventually it will be applicabe to all of the blockchains.
            this._relayManager = null;
            //@note: @here: for gathering transactions in a batch.
            this._batchSize = 20;
            this._enableLog = true;
            this.url = options.urlBalance + options.apiKey;
            this.init();
        }
        /*
                initialize(name: string, relayManager: any): void {
        
                    //this.url = 'https://api.etherscan.io/api?module=account&action=balancemulti&address={{addresses}}&tag=latest';
                    //this.apikey = '';
                    //this.url += this.apikey;
                }*/
        BalancesEthereum.prototype.init = function () {
            // this.url = 'https://api.etherscan.io/api?module=account&action=balancemulti&address={{addresses}}&tag=latest';
            // this.apikey = '';
            // this.url += this.apikey;
        };
        BalancesEthereum.prototype.abort = function () {
            return this;
        };
        BalancesEthereum.prototype.wait = function () {
            this.onHold = true;
        };
        BalancesEthereum.prototype.resume = function () {
            this.onHold = false;
            this.getNextBalances();
        };
        BalancesEthereum.prototype.reset = function () {
            this.results = [];
            this.errors = 0;
            this._currentBatch = -1;
        };
        BalancesEthereum.prototype.destroy = function () {
            if (this.request) {
                this.request.abort();
                this.request = null;
            }
            this.deferred = null;
            this.results = null;
            this.destroyed = true;
            if (this.onDestroyed)
                this.onDestroyed();
        };
        BalancesEthereum.prototype.onError = function (id, message) {
            var _this = this;
            this.errors++;
            if (this.errors > this.maxErrors) {
                this.deferred.reject({
                    error: id,
                    message: message
                });
                this.destroy();
                return;
            }
            this._currentBatch--;
            setTimeout(function () { return _this.getNextBalances(); }, 10000);
        };
        BalancesEthereum.prototype.parse = function (resp) {
            if (resp && resp.result) {
                // console.log(resp.result);
                var t = Date.now();
                return resp.result.map(function (item) {
                    return new VOBalance({ id: item.account, balance: Number(item.balance), timestamp: t });
                    ///return new VOBalance({id:item.account,balance:+item.balance/Math.pow(10,20),timestamp:t})
                });
            }
            // this.onError(' no-data ');
            return null;
        };
        BalancesEthereum.prototype.loadBalances = function (addresses) {
            this.reset();
            // console.log(addresses);
            this.addresses = jaxx.Utils.splitInCunks(addresses, this._batchSize);
            this.deferred = $.Deferred();
            this.getNextBalances();
            return this.deferred;
        };
        BalancesEthereum.prototype.onSuccess = function () {
            var _this = this;
            this.deferred.resolve(this.results);
            setTimeout(function () { return _this.destroy(); }, 10);
        };
        BalancesEthereum.prototype.getNextBalances = function () {
            var _this = this;
            this._currentBatch++;
            if (this._currentBatch >= this.addresses.length) {
                this.onSuccess();
                return;
            }
            var addresses = this.addresses[this._currentBatch];
            var url = this.url.replace('{{addresses}}', addresses.toString());
            // console.log(url);
            this.request = $.getJSON(url);
            this.request.then(function (res) { return _this.parse(res); }).done(function (res) {
                _this.request = null;
                //  console.log(res);
                if (res) {
                    _this.results = _this.results.concat(res);
                    setTimeout(function () { return _this.getNextBalances(); }, _this.requestsDelay);
                }
                else
                    _this.onError(1245, url + ' result ' + res.toString());
            }).fail(function (err) { return _this.onError(1404, err.toString()); });
        };
        return BalancesEthereum;
    }());
    jaxx.BalancesEthereum = BalancesEthereum;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=balances_Ethereum.js.map