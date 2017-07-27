/**
 * Created by Vlad on 11/17/2016.
 */
///<reference path="../js/app/datastore_controller.ts"/>
var test;
(function (test) {
    var SendOneTranasciton = (function () {
        function SendOneTranasciton(parent) {
            this.parent = parent;
            this.parent.onBalanceChange = function (value, diff) {
                console.log(value, diff);
            };
            this.parent.transactionController.emitter$.on(this.parent.transactionController.ON_ONE_TRANSACTION_SENT, function (evt, data) {
                console.log(data);
            });
        }
        SendOneTranasciton.prototype.start = function () {
            this.parent.setInputs(0.01);
            this.parent.sendTransaction();
        };
        return SendOneTranasciton;
    }());
    test.SendOneTranasciton = SendOneTranasciton;
    var SendAmounts = (function () {
        function SendAmounts(parent) {
            var _this = this;
            this.parent = parent;
            this.balaces = [];
            this.service = this.parent.transactionController.accountService;
            this.controller = this.parent.transactionController;
            this.db = this.parent.ctr._db;
            this.controller.emitter$.on(this.controller.ON_ONE_TRANSACTION_SENT, function (evt, data) {
                console.warn(_this.controller.ON_ONE_TRANSACTION_SENT, data);
                _this.balaces.push(data);
                setTimeout(function () { return _this.sendNext(); }, 2000);
            });
            this.service.emitter$.on(this.service.ON_BALANCES_DIFFERENCE, function (evt, delta, diff) {
                console.log(_this.service.ON_BALANCES_DIFFERENCE, delta, diff);
            });
            /* this.parent.onBalanceChange = (value, diff:VOBalance[])=>{
                 console.log(value,diff);
             }*/
        }
        SendAmounts.prototype.start = function (nums) {
            this.amounts = nums;
            this.sendNext();
        };
        SendAmounts.prototype.sendNext = function () {
            console.log('%c sending next left: ' + this.amounts.length, 'color:green');
            if (this.amounts.length === 0) {
                return;
            }
            var amoint = this.amounts.shift();
            this.parent.setInputs(amoint);
            this.parent.sendTransaction();
        };
        return SendAmounts;
    }());
    test.SendAmounts = SendAmounts;
    var TestSendTransaction = (function () {
        ///$dataSend;
        function TestSendTransaction() {
            //console.error('TestSendTransaction');
            this.errorcount = 0;
            // setTimeout(()=>this.init(),5000);
            // setTimeout(()=>this.sendTransaction(),1200);
            //return;
            /* if(this.howManyBalancesSpendable()>12){
                 this.sendFullAmount();
     
             }else{
                 this.setInputs(0.01);
                 setTimeout(()=>this.sendTransaction(),1000);
             }
     */
        }
        TestSendTransaction.prototype.stop = function () {
            clearTimeout(this.timeout);
        };
        TestSendTransaction.prototype.start = function () {
            this.sendTransaction();
        };
        TestSendTransaction.prototype.sendOne = function () {
            this.sendOnetest.start();
        };
        TestSendTransaction.prototype.sendMany = function () {
            var amounts = [0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01];
            this.sendAmounts.start(amounts);
        };
        TestSendTransaction.prototype.onBalanceChange = function (value, diff) {
        };
        TestSendTransaction.prototype.init = function () {
            var _this = this;
            console.warn('init test');
            this.main = jaxx.Registry.datastore_controller_test;
            // this.ctr = this.main._currentCryptoController;
            this.ctr.emitter$.on(this.ctr.ON_BALANCE_CHANGE, function (evt, value, diff) {
                console.warn(_this.ctr.ON_BALANCE_CHANGE, value, diff);
                _this.onBalanceChange(value, diff);
            });
            this.transactionController = this.ctr.transactionController;
            this.service = this.ctr._accountService;
            console.log(this.ctr);
            var fee = this.ctr._accountService.getMiningFees();
            var price = this.ctr._accountService.getMiningFees();
            var sp = this.ctr.getBalanceSpendableDB();
            console.log(' spendable: ' + sp / 1e15);
            console.log(' spendable2: ' + (sp - (price * 14610)) / 1e15);
            console.log('spendable accounts ' + this.howManyBalancesSpendable());
            // this.$to = $('.tabContent .address input').first();
            // this.$amount = $('.tabContent .amount input').first();
            // this.$dataSend = $('.modal.send').first();
            this.sendOnetest = new SendOneTranasciton(this);
            this.sendAmounts = new SendAmounts(this);
        };
        TestSendTransaction.prototype.sendOneMore = function () {
            var _this = this;
            console.log('%c !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! sending next ', 'color:red');
            if (this.allwassent) {
                console.warn(' test ends');
                return;
            }
            var num = this.howManyBalancesSpendable();
            if (num < 10) {
                this.setInputs(0.01);
                setTimeout(function () { return _this.sendTransaction(); }, 1000);
            }
            else {
                this.sendFullAmount();
            }
            console.log(' balances with amounts ' + num);
            console.log('balances spendable : ' + this.howManyBalancesSpendable());
        };
        TestSendTransaction.prototype.sendFullAmount = function () {
            var _this = this;
            var spendable = this.ctr.getBalanceSpendableDB();
            // var fee =
            this.allwassent = true;
            var price = this.ctr._accountService.getMiningFees();
            spendable = spendable - (price * 14610);
            console.log('%c sendig max  spendable balances: ' + spendable / 1e15, 'color:red');
            this.setInputs(spendable / 1e18);
            setTimeout(function () { return _this.sendTransaction(); }, 1000);
        };
        TestSendTransaction.prototype.sendO1 = function () {
            this.setInputs(0.01);
        };
        TestSendTransaction.prototype.sentCointoCurrentAddress = function () {
            ///sends amount to current address
            console.error(g_JaxxApp);
            //updateFromInputFieldEntry()
        };
        TestSendTransaction.prototype.howManyAddresseHasBalances = function () {
            return this.ctr.getBalancesNot0().length;
        };
        TestSendTransaction.prototype.howManyBalancesSpendable = function () {
            return this.ctr.getBalancesSpendableDB().length;
        };
        TestSendTransaction.prototype.dataReady = function () {
            var $dataSend = $('.modal.send').first();
            var data = $dataSend.data('transaction');
            console.log(data);
            if (!data) {
                this.errorcount++;
                console.log(' no data');
            }
            else if (!data.readyTxArray)
                console.log(' no data.readyTxArray ');
            else {
                this.errorcount = 0;
                console.log(' got transactions: ' + data.readyTxArray.length);
            }
            return data && data.readyTxArray && data.readyTxArray.length;
        };
        TestSendTransaction.prototype.resetData = function () {
            var $dataSend = $('.modal.send').first();
            $dataSend.data('transaction', null);
        };
        TestSendTransaction.prototype.setInputs = function (amount) {
            var to = this.ctr.getCurrentPublicAddresReceive();
            console.log(' sending to ' + to);
            $('.tabContent .address input').first().val(to);
            $('.tabContent .amount input').first().val(amount + '');
        };
        TestSendTransaction.prototype.sendTransaction = function () {
            var _this = this;
            if (!this.dataReady()) {
                console.log('data is no ready ');
                if (this.errorcount < 50) {
                    this.timeout = setTimeout(function () { return _this.sendTransaction(); }, 1000);
                }
            }
            else {
                // console.log('send transaction');
                // this.sendIterval  = setTimeout(()=>this.sendOneMore(),10000);
                sendTransaction();
            }
        };
        return TestSendTransaction;
    }());
    test.TestSendTransaction = TestSendTransaction;
})(test || (test = {}));
//# sourceMappingURL=test-send-transaction.js.map