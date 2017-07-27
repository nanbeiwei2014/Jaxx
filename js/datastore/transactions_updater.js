/**
 * Created by Vlad on 2016-11-24.
 */
var jaxx;
(function (jaxx) {
    var TransactionsUpdater = (function () {
        function TransactionsUpdater(controller, options) {
            this.controller = controller;
            this.options = options;
            this.emitter$ = $({});
            this.ON_TRANSACTION_CONFIRMED = 'ON_TRANSACTION_CONFIRMED';
            this.name = controller.name;
            this.updateTime = options.updateTimeout;
        }
        TransactionsUpdater.prototype.onError = function (err) {
        };
        TransactionsUpdater.prototype.activate = function () {
            var _this = this;
            clearInterval(this.updateInterval);
            this.updateInterval = setInterval(function () { return _this.onTimer(); }, this.updateTime);
        };
        TransactionsUpdater.prototype.setTimeout = function (fast) {
            var timeout = fast ? this.options.updateTimeout : this.options.updateTimeout * 3;
            if (this.updateTime !== timeout) {
                this.updateTime = timeout;
                this.activate();
            }
        };
        TransactionsUpdater.prototype.deactivate = function () {
            clearInterval(this.updateInterval);
        };
        TransactionsUpdater.prototype.onTimer = function () {
            if (!this.controller.isActive)
                return;
            if (this.isBusy) {
                console.warn(' skipping request => no respond from server ');
                this.isBusy = false;
                return;
            }
            var trs = this.controller._db.getTransactionsReceive();
            var addresses;
            /*  = this.getAddressesWithBalanceNoTransactions(trs);
             if(addresses.length){
                 console.log('%c ' + this.name + ' addresses without transactions ' + addresses.toString(), 'color:blue');
 
                 this.controller._accountService.downloadNewTransactions2(addresses);
                 this.setTimeout(true);
                 return;
             }*/
            var min = this.options.confirmations;
            var unconfirmed = _.filter(trs, function (item) { return item.confirmations < min; });
            unconfirmed = _.uniqBy(unconfirmed, 'id');
            var allConfirmed = _.every(unconfirmed, 'confirmations');
            this.setTimeout(!allConfirmed);
            //this.setTimeout(hasUnconfirmed);
            addresses = _.map(unconfirmed, function (item) { return item.address; });
            addresses = _.uniq(addresses);
            // let uncAddresses:string[] = this.getUnconfirmedTransactionsAddresses(trs);
            //console.log(addresses);
            this.downloadUpdatesForAddresses(addresses);
        };
        /*
        
                getUnconfirmedTransactionsAddresses(trs:VOTransaction[]):string[]{
                    let min:number = this.options.confirmations;
        
                   // console.warn(' getUnconfirmedTransactionsAddresses    ' + min);
                    let unconfirmed:VOTransaction[] = trs.filter(function (item) {
                        // console.log(item.confirmations);
                        return item.confirmations < min;
                    });
        
        
        
                    let timeout:number;
                    if(_.every(unconfirmed, 'confirmations')) {
                        timeout = this.options.updateTimeout * 3;
        
        
                    }else{
        
                    }
        
                    let addresses:string[] = unconfirmed.map(function (item) {
                        return item.address;
                    });
        
                    return addresses
        
                }
        */
        // setUnconfirmedTransactionsInterval()
        TransactionsUpdater.prototype.getAddressesWithBalanceNoTransactions = function (trs) {
            var addresses = this.controller.getBalancesNot0().map(function (item) { return item.id; });
            trs.forEach(function (item) {
                if ((addresses.indexOf(item.address) !== -1) || (addresses.indexOf(item.from) !== -1) || (addresses.indexOf(item.to) !== -1))
                    addresses.splice(addresses.indexOf(item.address), 1);
            });
            return addresses;
        };
        TransactionsUpdater.prototype.checkTransactinsLast5Addresses = function (trs) {
            var addresses = this.controller.getAddressesReceive();
            addresses = _.takeRight(addresses, 5);
            trs.forEach(function (item) {
                if (addresses.indexOf(item.address) !== -1)
                    addresses.splice(addresses.indexOf(item.address), 1);
            });
            return addresses;
        };
        /* checUncofirmed(trs:VOTransaction[]):boolean{
             let min:number = this.options.confirmations;
             // console.log(trs);
 
 
 
             let unconfirmed:VOTransaction[] = trs.filter(function (item) {
                // console.log(item.confirmations);
                 return item.confirmations < min;
             })
 
             console.log('%c ' + this.controller.name + '  checkForUpdates total: ' + trs.length + ' unconfirmed: ' + unconfirmed.length,'color:red');
 
 
 
             if(unconfirmed.length){
                 this.checkForUpdates(unconfirmed);
                 return true;
             }
 
         }*/
        TransactionsUpdater.prototype.downloadUpdatesForAddresses = function (addresses) {
            var _this = this;
            var db = this.controller._db;
            var ctr = this.controller;
            var service = this.controller._accountService;
            if (addresses.length == 0)
                return;
            addresses = _.take(addresses, 5);
            // console.log(' downloadTransactions   '+out.toString());
            console.log('%c ' + this.name + ' download transactions need confirmations  for addresses  ' + addresses.toString(), 'color:blue');
            this.isBusy = true;
            service.downloadTransactions(addresses).done(function (result) {
                _this.isBusy = false;
                var newTransactions = result.transactions || result;
                // console.log('%c '+this.name +' this new transactions ', 'color:blue');
                // console.log(newTransactions);
                var indexed = _.keyBy(newTransactions, 'id');
                var oldTrs = db.getTransactionsReceive();
                var justConfiremed = [];
                oldTrs.forEach(function (item) {
                    if (indexed[item.id]) {
                        //console.log(' old confirmations: ' + item.confirmations + ' new ' + indexed[item.id].confirmations);
                        if (!item.confirmations && indexed[item.id].confirmations) {
                            item.timestamp = indexed[item.id].timestamp;
                            console.log(' TRANSACTION_CONFIRMED  ' + item.confirmations + '   new ' + indexed[item.id].confirmations + '  at ' + new Date(item.timestamp * 1000).toLocaleTimeString());
                            justConfiremed.push(item);
                        }
                        // if(!isNaN(indexed[item.id].timestamp))  item.timestamp = indexed[item.id].timestamp;
                        item.block = indexed[item.id].block;
                        item.confirmations = indexed[item.id].confirmations || 0;
                    }
                });
                if (justConfiremed.length)
                    _this.emitter$.triggerHandler(_this.ON_TRANSACTION_CONFIRMED, [justConfiremed]);
                db.setTransactions(oldTrs);
                ctr.dispatchNewTransactions();
            }).fail(function (err) {
                _this.isBusy = false;
                _this.onError(err);
            });
        };
        return TransactionsUpdater;
    }());
    jaxx.TransactionsUpdater = TransactionsUpdater;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=transactions_updater.js.map