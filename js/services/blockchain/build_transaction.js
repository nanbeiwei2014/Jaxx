/**
 * Created by Vlad on 11/1/2016.
 */
var jaxx;
(function (jaxx) {
    var BuildTransaction = (function () {
        function BuildTransaction(Service, db) {
            this.Service = Service;
            this.db = db;
        }
        BuildTransaction.prototype.buildTransaction = function (userTransaction) {
        };
        return BuildTransaction;
    }());
    jaxx.BuildTransaction = BuildTransaction;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=build_transaction.js.map