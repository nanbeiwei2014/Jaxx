///<reference path="../../com/models.ts"/>
///<reference path="../../com/Utils2.ts"/>
///<reference path="../service-mapper.ts"/>
var jaxx;
(function (jaxx) {
    var CheckTransactionBlockr = (function () {
        function CheckTransactionBlockr() {
        }
        CheckTransactionBlockr.prototype.destroy = function () {
            this.trs = null;
        };
        CheckTransactionBlockr.prototype.checkAddress = function (address, account_index, trsHex, d) {
            var _this = this;
            var url = 'https://api.etherscan.io/api?module=account&action=txlist&address=' + address + '&tag=latest' + this.apiKey;
            $.get(url).done(function (res) {
                console.log('  checkAddress    ' + address, res);
                if (res.result && res.result.length) {
                    var trs = []; // ServiceMappers.mapEtherTransactions(res.result, address, account_index, 'receive');
                    var search = trs.filter(function (item) {
                        return (item.id == trsHex);
                    });
                    if (search.length) {
                        d.resolve(search);
                        _this.destroy();
                        return;
                    }
                }
                setTimeout(function () { return _this.checkAddress(address, account_index, trsHex, d); }, 10000);
            }).fail(function (err) {
                d.reject(err);
                console.error(err);
            });
        };
        CheckTransactionBlockr.prototype.checkTransaction = function (trs, apiKey) {
            var d = $.Deferred();
            this.apiKey = apiKey;
            this.trs = trs;
            console.error(' not implemented yet  ');
            d.reject(null);
            return d;
            // var address:string = trs.to.toLowerCase();
            // this.checkAddress(address,trs.address_index,trs.id,d);
            // return d;
        };
        return CheckTransactionBlockr;
    }());
    jaxx.CheckTransactionBlockr = CheckTransactionBlockr;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=check-trans-blockr.js.map