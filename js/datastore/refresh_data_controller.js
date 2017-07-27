/**
 * Created by Vlad on 11/2/2016.
 */
///<reference path="crypto_controller.ts"/>
var jaxx;
(function (jaxx) {
    var RefreshDataController = (function () {
        function RefreshDataController(controllers) {
            this.controllers = controllers;
            this.currentIndex = -1;
            this.delay = 10000;
            this.timeout = 0;
            this.errorscount = 0;
            ///vladedit  temp disabling refresh other accounts
            // setTimeout(()=>this.resetInterval(),5000);
        }
        RefreshDataController.prototype.resetInterval = function () {
            var _this = this;
            clearInterval(this.interval);
            this.interval = setInterval(function () { return _this.checkNextHistory(); }, this.delay);
        };
        RefreshDataController.prototype.destroy = function () {
            clearInterval(this.interval);
            clearTimeout(this.timeout);
        };
        RefreshDataController.prototype.checkNextHistory = function () {
            var busy = this.controllers.some(function (ctr) { return ctr.isBusy; });
            //console.warn(busy +' ' + this.delay);
            if (busy) {
                return;
            }
            this.currentIndex++;
            if (this.currentIndex >= this.controllers.length)
                this.currentIndex = 0;
            var ctr = this.controllers[this.currentIndex];
            //console.warn('checkNextHistory '+ this.currentIndex + '  ' + ctr.name + '  active: ' + ctr.isActive + ' timestamp:  '+ctr.getHistoryTimestamp());
            //console.log(ctr.isEnabled);
            if (ctr.isActive || !ctr.isEnabled) {
                // setTimeout(() => checkNextHistory)
                return;
            }
            var now = Date.now();
            /// console.warn(ctr.name + '  '+ctr.getHistoryTimestamp());
            if (ctr.getHistoryTimestamp() === 0) {
                // this.currentIndex--;
                ctr.restoreHistoryAll(function (res) {
                });
                this.delay = 60e3;
                this.resetInterval();
                return;
            }
            // console.log(ctr.hasIndexes());
            if (ctr.hasIndexes()) {
                var timestamp = ctr.getBalancesTimestamp();
                // console.log(timestamp);
                var delta = Date.now() - timestamp;
                //console.log(delta);
                if (delta < 60e3) {
                    this.delay += 1000;
                    this.resetInterval();
                }
                if (delta > 200e3) {
                    this.delay = 10000;
                    this.resetInterval();
                }
                /* ctr.downloadAllBalances((error) =>{
                     console.log(ctr.name + ' balance ');
                 });*/
            } //else  this.timeout = setTimeout(() => this.checkNextHistory(),100);
        };
        return RefreshDataController;
    }());
    jaxx.RefreshDataController = RefreshDataController;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=refresh_data_controller.js.map