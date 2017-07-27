/**
 * Created by Vlad on 10/31/2016.
 */
var jaxx;
(function (jaxx) {
    var OutgoingTransactionController = (function () {
        function OutgoingTransactionController(database, service) {
            this.database = database;
            this.service = service;
            this.createdTimestamp = Date.now();
            this.id = this.createdTimestamp;
        }
        OutgoingTransactionController.prototype.destroy = function () {
            clearInterval(this.checkInterval);
            this.transactionsIds = null;
            this.initTransactions = null;
            this.addressesFrom = null;
            if (this.onDestory)
                this.onDestory(this);
            this.onDestory = null;
        };
        /*
                compare(transactions1:VOTransaction[],transactions2:VOTransaction[]):VOTransaction[]{
        
                    var out:VOTransaction[] = [];
                }*/
        OutgoingTransactionController.prototype.setBalancesUsed = function (balances) {
        };
        OutgoingTransactionController.prototype.checkTransactions = function () {
            var _this = this;
            if (Date.now() - this.createdTimestamp > 1000 * 3600 * 100)
                this.destroy();
            this.service.downloadTransactions(this.addressesFrom).done(function (res) {
                // console.log(res);
                var diff = res.length - _this.initTransactions.length;
                if (diff) {
                    console.warn(_this.service.name + ' OutgoingTransactionController new transactions ' + diff);
                    if (_this.onNewTransactions)
                        _this.onNewTransactions(res);
                }
                else {
                    console.log(_this.service.name + ' OutgoingTransactionController  same length');
                }
            });
        };
        OutgoingTransactionController.prototype.calculateNonces = function (addresses, transactions) {
            return jaxx.Utils.getNoncesOfAddresses(transactions);
        };
        OutgoingTransactionController.prototype.startAddressesCheck = function (addresses) {
            var _this = this;
            // console.log( 'startAddressesCheck  ', addresses);
            this.addressesFrom = addresses;
            this.service.downloadTransactions(addresses).done(function (res) {
                console.warn(_this.service.name + ' startTransactionCheck  ', res);
                _this.initTransactions = res;
                var noces = _this.calculateNonces(addresses, res);
                _this.transactionsIds = _.map(res, function (o) { return o.id; });
                // this.checkInterval = setInterval(()=>this.checkTransactions(),5000);
            }).fail(function (err) { return console.error(err); });
        };
        return OutgoingTransactionController;
    }());
    jaxx.OutgoingTransactionController = OutgoingTransactionController;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=outgoing_transaction_controller.js.map