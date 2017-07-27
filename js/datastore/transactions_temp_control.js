/**
 * Created by Vlad on 11/7/2016.
 */
///<reference path="../com/models.ts"/>
var jaxx;
(function (jaxx) {
    var TransactionsTempControl = (function () {
        function TransactionsTempControl(controller) {
            this.controller = controller;
            this.delayCheckTransaction = 10000;
            this.ON_TRANSACTION_IN_LIST = 'ON_TRANSACTION_IN_LIST';
            this.transactions = [];
            this.intervalCheckTransactions = 0;
            this.doNextCheck();
        }
        TransactionsTempControl.prototype.onTransactionsSent = function (trs) {
        };
        TransactionsTempControl.prototype.onTransactionsConfirmed = function (trs) {
        };
        TransactionsTempControl.prototype.checkConfirmed = function () {
            var ar = this.transactions;
            var out = [];
            for (var i = ar.length - 1; i >= 0; i--) {
                if (ar[i].confirmed) {
                    out.push(ar.splice(i, 1)[0]);
                }
            }
            this.transactions = ar;
            if (out.length)
                this.onTransactionsConfirmed(out);
        };
        TransactionsTempControl.prototype.getTransactionsTemp = function (orig) {
            if (orig)
                return this.transactions;
            else {
                var out = [];
                this.transactions.forEach(function (tr) { return out.push(new VOTransaction(tr)); });
                return out;
            }
        };
        TransactionsTempControl.prototype.getTransactionsIds = function () {
            var out = [];
            this.transactions.forEach(function (tr) { return out.push(tr.id); });
            return out;
        };
        //newTransactions = [];
        TransactionsTempControl.prototype.onSentTransactions = function () {
            // this.onTransactionsSent(this.newTransactions);
            // this.newTransactions = [];
        };
        TransactionsTempControl.prototype.doNextCheck = function () {
            if (this.transactions.length === 0) {
                clearInterval(this.intervalCheckTransactions);
                this.intervalCheckTransactions = 0;
            }
            else {
                var addresses = jaxx.Utils.deepCopy(this.transactions).map(function (item) { return item.address; });
                this.service.downloadTransactions(addresses).done(function (transactions) {
                    console.log(transactions);
                });
            }
        };
        TransactionsTempControl.prototype.addTransactionTemp = function (tr) {
            var _this = this;
            if (this.intervalCheckTransactions === 0) {
                this.intervalCheckTransactions = setInterval(function () { return _this.doNextCheck(); }, this.delayCheckTransaction);
            }
            clearTimeout(this.timeoutAdd);
            this.transactions.push(tr);
        };
        return TransactionsTempControl;
    }());
    jaxx.TransactionsTempControl = TransactionsTempControl;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=transactions_temp_control.js.map