/**
 * Created by Vlad on 2017-05-31.
 */
///<reference path="../com/models.ts"/>
///<reference path="../com/Registry.ts"/>
var jaxx;
(function (jaxx) {
    var SendAmmountController = (function () {
        function SendAmmountController($sendView) {
            var _this = this;
            this.$sendView = $sendView;
            this.$amountInput = $('#amountSendInput').on('input', function () {
                var val = _this.$amountInput.val();
                //console.log(val);
                _this.rawTransaction.amount = val;
                // this.checkIsvalid();
            });
            // console.error( " SendAmmountController ");
            this.optionsController = new jaxx.SendOptionsController();
            this.sendConfirmation = new jaxx.SendConfirmationController();
            // this.rawTransaction = new VOSendRawTransaction();
            /* this.sendConfirmation.onConfirmed = ()=>{
                 console.warn('   send confirmation confirmed   ');
 
                 Registry.application$.triggerHandler(Registry.ON_USER_TRANSACTION_COFIRMED,this.rawTransaction);
             }*/
            //this.init();
        }
        SendAmmountController.prototype.onInvalid = function (reason) {
            console.error(reason);
        };
        SendAmmountController.prototype.checkIsvalid = function () {
            if (this.total < (this.rawTransaction.amount + this.rawTransaction.miningFee))
                this.onInvalid('amount to send more then total');
        };
        SendAmmountController.prototype.setCoinType = function (str) {
            this.rawTransaction.coinType = str;
            this.rawTransaction.miningFee = 21000;
        };
        SendAmmountController.prototype.setTotal = function (num) {
            this.total = num;
            this.checkIsvalid();
        };
        SendAmmountController.prototype.setTax = function (num) {
            this.rawTransaction.miningFee = num;
            this.checkIsvalid();
        };
        SendAmmountController.prototype.getAmount = function () {
            return this.rawTransaction.amount;
        };
        SendAmmountController.prototype.getTax = function () {
            return this.rawTransaction.miningFee;
        };
        SendAmmountController.prototype.onCoinTypeChanged = function (coinType) {
            this.rawTransaction.coinType = coinType;
            if (this.rawTransaction.coinType === 'Ether') {
                this.optionsController.showButton();
            }
            else
                this.optionsController.hideButton();
        };
        SendAmmountController.prototype.initButtons = function () {
            var _this = this;
            this.$sendStartBtn = $('.tabSend.scriptAction.tab.send').first().click(function (evt) {
                console.log(evt.currentTarget);
                if (_this.isActive)
                    _this.isActive = false;
                else
                    _this.isActive = true;
                //this.changeActive();
            });
            this.$sendBtn = $('#Send_Recieve_Btn').click(function () {
                console.log('send clicked');
                _this.rawTransaction.amount = _this.$amountInput.val();
                _this.rawTransaction.to = _this.$addressInput.val();
                _this.rawTransaction.from = _this.$myAddress.text();
                _this.sendConfirmation.setTransaction(_this.rawTransaction);
                _this.sendConfirmation.show();
            });
            //console.log(this.$sendStartBtn);
            this.$myAddress = $('.populateAddress.cssAddress').first();
            this.$addressInput = $('#receiver_address').on('input', function () {
                var val = _this.$addressInput.val();
                _this.rawTransaction.to = val;
                _this.checkIsvalid();
                // console.log(val);
            });
            //console.log(this.$addressInput);
            //console.log(this.$amountInput);
        };
        SendAmmountController.prototype.onSendClick = function () {
            var addresTo = this.$addressInput.val();
            var addressFrom = this.$myAddress.text();
            var value = this.$amountInput.val();
            var tax = this.getTax();
        };
        return SendAmmountController;
    }());
    jaxx.SendAmmountController = SendAmmountController;
    var TransferAmmountController = (function () {
        function TransferAmmountController() {
        }
        return TransferAmmountController;
    }());
    jaxx.TransferAmmountController = TransferAmmountController;
    var SendTransactionModule = (function () {
        function SendTransactionModule() {
            SendTransactionModule.sendController = new SendAmmountController();
        }
        return SendTransactionModule;
    }());
    jaxx.SendTransactionModule = SendTransactionModule;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=send-module.js.map