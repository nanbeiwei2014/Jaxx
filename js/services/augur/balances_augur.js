/**
 * Created by Daniel on 2017-01-11.
 */
///<reference path="../../com/models.ts"/>
///<reference path="../../com/Utils2.ts"/>
///<reference path="../service-mapper.ts"/>
///<reference path="../blockchain/balances_blockchain.ts"/>
var jaxx;
(function (jaxx) {
    var BalancesAugur = (function () {
        function BalancesAugur() {
            this._currentBatch = 20;
            this._name = "";
            this.maxErrors = 20;
            this.requestsDelay = 20;
            //@note: @here: for relay managed classes. eventually it will be applicabe to all of the blockchains.
            this._relayManager = null;
            //@note: @here: for gathering transactions in a batch.
            this._batchSize = 20;
            this._enableLog = true;
            this.init();
        }
        BalancesAugur.prototype.log = function (params) {
            if (this._enableLog) {
                console.log("[ Balances " + this._name + " ] :: " + params);
            }
        };
        BalancesAugur.prototype.initialize = function (name, relayManager) {
            // https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0x48c80F1f4D53D5951e5D5438B54Cba84f29F32a5&address=0x25040290d7Ed172C74A0CcAE37E09B413C26155B&&tag=latest&apikey=WGWHHAU4F2Y58UW5FQWTUJWSXBNHU7WBSX
            // https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0x48c80F1f4D53D5951e5D5438B54Cba84f29F32a5&address={{addresses}}&tag=latest&apikey=WGWHHAU4F2Y58UW5FQWTUJWSXBNHU7WBSX';
            this.url = 'https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0x48c80F1f4D53D5951e5D5438B54Cba84f29F32a5&address={{address}}&&tag=latest&apikey=WGWHHAU4F2Y58UW5FQWTUJWSXBNHU7WBSX';
            this.apikey = '';
            this.url += this.apikey;
        };
        BalancesAugur.prototype.init = function () {
            // https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0x48c80F1f4D53D5951e5D5438B54Cba84f29F32a5&address=0x25040290d7Ed172C74A0CcAE37E09B413C26155B&tag=latest
            this.url = 'https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0x48c80F1f4D53D5951e5D5438B54Cba84f29F32a5&address={{address}}&&tag=latest&apikey=WGWHHAU4F2Y58UW5FQWTUJWSXBNHU7WBSX';
            this.apikey = '';
            this.url += this.apikey;
        };
        BalancesAugur.prototype.abort = function () {
            return this;
        };
        BalancesAugur.prototype.wait = function () {
            this.onHold = true;
        };
        BalancesAugur.prototype.resume = function () {
            this.onHold = false;
            this.getNextBalances();
        };
        BalancesAugur.prototype.reset = function () {
            this.results = [];
            this.errors = 0;
            this._currentBatch = -1;
        };
        BalancesAugur.prototype.destroy = function () {
            if (this.request) {
                this.request.abort();
                this.request = null;
            }
            this.deferred = null;
            this.results = [];
            this.destroyed = true;
            if (this.onDestroyed)
                this.onDestroyed();
        };
        BalancesAugur.prototype.onError = function (id, message) {
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
        BalancesAugur.prototype.parse = function (resp, address) {
            console.log(address);
            return new VOBalance({ id: address, balance: Number(resp.result), timestamp: Date.now() });
            // if (resp && resp.result) {
            //   var t: number = Date.now();
            //   return resp.result.map(function (item) {
            //return new VOBalance({id: item.account, balance: Number(item.balance), timestamp: t});
            ///return new VOBalance({id:item.account,balance:+item.balance/Math.pow(10,20),timestamp:t})
            //})
            //}
            // this.onError(' no-data ');
            // return null;
        };
        BalancesAugur.prototype.loadBalances = function (addresses) {
            this.reset();
            this.addresses = jaxx.Utils.splitInCunks(addresses, this._batchSize);
            this.deferred = $.Deferred();
            this.getNextBalances();
            return this.deferred;
        };
        BalancesAugur.prototype.onSuccess = function () {
            var _this = this;
            this.deferred.resolve(this.results);
            setTimeout(function () { return _this.destroy(); }, 10);
        };
        BalancesAugur.prototype.getNextBalances = function () {
            this._currentBatch++;
            if (this._currentBatch >= this.addresses.length) {
                this.onSuccess();
                return;
            }
            var addresses = this.addresses[this._currentBatch];
            for (var i = 0; i < addresses.length; i++) {
                this.getNextBalancesHelper(addresses[i]);
            }
            /*
            var url = this.url.replace('{{address}}', addresses.toString());
            this.request = <JQueryXHR>$.getJSON(url);
            this.request.then(res => this.parse(res)).done(res => {
              this.request = null;
              // console.log(res);
              if (res) {
                this.results = this.results.concat(res);
                setTimeout(() => this.getNextBalances(), this.requestsDelay);
              } else  this.onError(1245, url + ' result ' + res.toString());
      
            }).fail(err => this.onError(1404, err.toString()));*/
        };
        BalancesAugur.prototype.getNextBalancesHelper = function (address) {
            var _this = this;
            var url = this.url.replace('{{address}}', address.toString());
            console.log(url);
            this.request = $.getJSON(url);
            this.request.then(function (res) { return _this.parse(res, address); }).done(function (res) {
                // res.id = address;
                _this.request = null;
                // console.log(res);
                if (res) {
                    _this.results = _this.results.concat(res);
                    setTimeout(function () { return _this.getNextBalances(); }, _this.requestsDelay);
                }
                else
                    _this.onError(1245, url + ' result ' + res.toString());
            }).fail(function (err) { return _this.onError(1404, err.toString()); });
        };
        return BalancesAugur;
    }());
    jaxx.BalancesAugur = BalancesAugur;
})(jaxx || (jaxx = {}));
