/**
 * Created by Vlad on 10/11/2016.
 */
///<reference path="../com/models.ts"/>
///<reference path="../com/Registry.ts"/>
var jaxx;
(function (jaxx) {
    var BalanceController = (function () {
        function BalanceController(main) {
            this.main = main;
            this.$overlay = $('<div>')
                .addClass('overlay')
                .css({
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0,0,0,0.5)'
            });
            this.init();
        }
        BalanceController.prototype.init = function () {
            var _this = this;
            this.$refreshBtn = $('.scriptAction.refresh').first();
            //console.error(this.$refreshBtn.length);
            if (this.$refreshBtn.length == 0) {
                setTimeout(function () { return _this.init(); }, 2000);
                return;
            }
            /*
             this.$controls = $('#CryptoControls');
             this.$controls.get(0).addEventListener('click',(evt)=>{
                 var v = $(evt.currentTarget);
     
               //  console.log(v.hasClass('off'));
                 if(v.hasClass('off')){
                     evt.stopPropagation();
                 }else{
     
                 }
             },true);*/
            var controls = this.$controls;
            //  console.warn( this.$refreshBtn);
            this.$refreshBtn.click(function () {
                console.error('click');
            });
            /*   this.$refreshBtn.click(()=>{
       
                   ///console.log('  refresh ');
                   //this.$refreshBtn.show();
                   console.error('click');
                   if(this.$controls.hasClass('off'))return;
                   //this.$controls.addClass('off');
                   //this.$controls.fadeTo('fast',0.5);
                 this.main._currentCryptoController.checkBalanceCurrentReceive();
                 jaxx.Registry.application$.triggerHandler(jaxx.Registry.ON_RESTORE_BALANCE_START);
                 this.main._currentCryptoController.downloadAllBalances((err)=>{
                   jaxx.Registry.application$.triggerHandler(jaxx.Registry.ON_RESTORE_BALANCE_END);
                 })
                   // 22nd Jan 2017 Anthony only wants to refresh balance and not transaction history
                   //this.main._currentCryptoController.restoreHistoryAll((err)=>{
       
                       //this.$refreshBtn.hide();
                      // controls.removeClass('off');
                      // controls.fadeTo('fast',1.0);
                   //})
               })
       */
        };
        return BalanceController;
    }());
    jaxx.BalanceController = BalanceController;
    var CurrentAddressController = (function () {
        function CurrentAddressController() {
        }
        return CurrentAddressController;
    }());
    jaxx.CurrentAddressController = CurrentAddressController;
    var SendOptionsController = (function () {
        function SendOptionsController() {
            this.init();
        }
        SendOptionsController.prototype.init = function () {
            var _this = this;
            this.$view = $('.advancedTabContentEthereum.cssGapSmall.cssAdvancedTabContentEthereum').first();
            this.$customData = $('.advancedTabButton.cssAdvancedTabButton').first().click(function (evt) {
                if (_this.isVisible)
                    _this.isVisible = false;
                else
                    _this.isVisible = true;
                _this.toggleView();
            });
        };
        SendOptionsController.prototype.showButton = function () {
            if (this.isOptions) {
            }
            else {
                this.isOptions = true;
                this.$optionsBtn.show();
            }
        };
        SendOptionsController.prototype.hideButton = function () {
            if (this.isOptions)
                this.$optionsBtn.hide();
        };
        SendOptionsController.prototype.toggleView = function () {
            if (this.isVisible) {
                this.$view.show('fast');
            }
            else {
                this.$view.hide('fast');
            }
        };
        return SendOptionsController;
    }());
    jaxx.SendOptionsController = SendOptionsController;
    var SendConfirmationController = (function () {
        function SendConfirmationController() {
            this.init();
        }
        SendConfirmationController.prototype.init = function () {
            var _this = this;
            this.$view = $('.modal.send').first();
            this.$btnClose = this.$view.find('.cssClose').first().click(function () { console.log('on close click'); });
            this.$btnConfirm = $('#Send-Confirm-Button').click(function (evt) { return _this.onConfirmed(); });
        };
        SendConfirmationController.prototype.show = function () {
            this.$view.show();
        };
        SendConfirmationController.prototype.hide = function () {
            this.$view.hide();
        };
        SendConfirmationController.prototype.setTransaction = function (tr) {
            this.tr = tr;
        };
        SendConfirmationController.prototype.setAmount = function (num) {
        };
        SendConfirmationController.prototype.setMessage = function (str) {
        };
        return SendConfirmationController;
    }());
    jaxx.SendConfirmationController = SendConfirmationController;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=balance.js.map