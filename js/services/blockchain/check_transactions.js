///<reference path="../../com/models.ts"/>
///<reference path="../../com/Utils2.ts"/>
///<reference path="../service-mapper.ts"/>
var jaxx;
(function (jaxx) {
    var CheckTransactions = (function () {
        function CheckTransactions() {
            this.apiKey = '';
        }
        CheckTransactions.prototype.destroy = function () {
            this.trs = null;
        };
        CheckTransactions.prototype.checkAddress = function (address, trsHex, promise) {
            var _this = this;
            var url = 'https://api.etherscan.io/api?module=account&action=txlist&address=' +
                '' + address + '&tag=latest' + this.apiKey;
            $.get(url).done(function (res) {
                console.log('  checkAddress    ' + address, res);
                if (res.result && res.result.length) {
                    var trs = jaxx.ServiceMappers.mapEtherTransactions(res.result, address);
                    var search = trs.filter(function (item) {
                        return (item.id == trsHex);
                    });
                    if (search.length) {
                        promise.resolve(search);
                        _this.destroy();
                        return;
                    }
                }
                setTimeout(function () { return _this.checkAddress(address, trsHex, promise); }, 10000);
            }).fail(function (err) {
                promise.reject(err);
                console.error(err);
            });
        };
        CheckTransactions.prototype.checkTransaction = function (trs, apiKey) {
            this.apiKey = apiKey;
            this.trs = trs;
            var address = trs.to.toLowerCase();
            var promise = $.Deferred();
            this.checkAddress(address, trs.id, promise);
            return promise;
        };
        return CheckTransactions;
    }());
    jaxx.CheckTransactions = CheckTransactions;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=check_transactions.js.map