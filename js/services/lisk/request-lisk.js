var jaxx;
(function (jaxx) {
    var RequestLisk //implements IRequestServer
     = (function () {
        function RequestLisk(settings) {
        }
        RequestLisk.prototype.setType = function (str) {
        };
        RequestLisk.prototype.loadTransactions = function () {
            return null;
        };
        RequestLisk.prototype.getAddress = function (i) {
            return '';
        };
        RequestLisk.prototype.getBalances = function (addr) {
            return null;
        };
        RequestLisk.prototype.setTransactionEventEmiter = function (emitter$) {
        };
        RequestLisk.prototype.checkTransaction = function (trs) {
            return null;
        };
        RequestLisk.prototype.restoreIndex = function (type) {
            return null;
        };
        return RequestLisk;
    }());
    jaxx.RequestLisk = RequestLisk;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=request-lisk.js.map