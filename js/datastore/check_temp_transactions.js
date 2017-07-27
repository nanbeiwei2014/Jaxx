/**
 * Created by Vlad on 10/31/2016.
 */
///<reference path="../com/models.ts"/>
var jaxx;
(function (jaxx) {
    var CheckTempTransactions = (function () {
        function CheckTempTransactions(balances, service) {
            this.balances = balances;
            this.service = service;
            this.delay = 15000;
            this.start();
        }
        CheckTempTransactions.prototype.destroy = function () {
            clearInterval(this.interval);
            this.onComplete = null;
            this.onBalanceProcessed = null;
            this.balances = null;
            this.service = null;
        };
        CheckTempTransactions.prototype.removeBalanceById = function (id) {
            var ar = this.balances;
            for (var i = ar.length; i >= 0; i--) {
                if (ar[i].id == id)
                    ar.splice(i, 1);
            }
            this.balances = ar;
        };
        CheckTempTransactions.prototype.removeBalanceByTransactionId = function (id) {
            var ar = this.balances;
            for (var i = ar.length; i >= 0; i--) {
                //if(ar[i].transaction_id == id) ar.splice(i,1);
            }
            this.balances = ar;
        };
        CheckTempTransactions.prototype.onTransactionProcessed = function (balance) {
            console.error(' transaction processed  from address: ' + balance.id);
            this.removeBalanceById(balance.id);
            if (this.onBalanceProcessed)
                this.onBalanceProcessed(balance);
        };
        CheckTempTransactions.prototype.start = function () {
            var _this = this;
            this.interval = setInterval(function () { return _this.checkAddresses(); }, this.delay);
            this.checkAddresses();
        };
        CheckTempTransactions.prototype.checkAddresses = function () {
            var _this = this;
            var balances = this.balances;
            var addresses = [];
            _.each(balances, function (o) { return addresses.push(o.id); });
            // var tempbalances = _.keyBy(this.balances,'transaction_id');
            console.warn(' checkAddresses length: ', this.balances);
            this.service.downloadTransactions(addresses).done(function (transactions) {
                console.log(transactions);
                //console.log(tempbalances);
                _.each(transactions, function (transaction) {
                    // if(tempbalances[transaction.id]) this.onTransactionProcessed(tempbalances[transaction.id])
                });
                if (_this.balances.length == 0) {
                    if (_this.onComplete)
                        _this.onComplete();
                    _this.destroy();
                }
            });
        };
        /* compare(addresse1:VOAddress[],addresses2:VOAddress):VOAddress[]{
             var out:VOAddress[] = [];
         }*/
        CheckTempTransactions.prototype.checkTransactions = function () {
            /* var voaddresses:VOAddress[] = this.copyInitAddresses();
             this.service.downloadTransactions2(voaddresses).done(res=>{
 
             });*/
        };
        CheckTempTransactions.prototype.setTransactions = function (transactions) {
        };
        /*copyInitAddresses():VOAddress[]{
          //  return _.map(this.initAddresses,(o)=>new VOAddress(o));
        }*/
        CheckTempTransactions.prototype.startTransaction = function (voaddresses) {
            /*this.service.downloadTransactions2(voaddresses).done(res=>{
                    console.warn(res);
                this.initAddresses = res;
    
                });
                */
        };
        return CheckTempTransactions;
    }());
    jaxx.CheckTempTransactions = CheckTempTransactions;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=check_temp_transactions.js.map