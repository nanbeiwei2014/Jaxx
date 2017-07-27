/**
 * Created by Vlad on 11/7/2016.
 */
///<reference path="../com/models.ts"/>
var jaxx;
(function (jaxx) {
    var EnableDisableItem = (function () {
        function EnableDisableItem($view) {
            var _this = this;
            this.$view = $view;
            this.isChecked = false;
            this.name = $view.attr('value');
            this.$checkBox = $view.find('div').first();
            $view.on('click', function (evt) {
                _this.isChecked = _this.$checkBox.hasClass('cssCurrencyisChecked');
                _this.onChange(_this);
            });
        }
        return EnableDisableItem;
    }());
    jaxx.EnableDisableItem = EnableDisableItem;
    var CryptoEnableDisableView = (function () {
        function CryptoEnableDisableView() {
            //console.warn(g_JaxxApp.getSettings().getCryptoCurrencyPositionList())
            this.init();
        }
        CryptoEnableDisableView.prototype.onItemChange = function (item) {
            // console.log(item);
            var obj = {
                name: item.name,
                enabled: item.isChecked
            };
            if (this.onViewStatusChanged)
                this.onViewStatusChanged(obj);
        };
        CryptoEnableDisableView.prototype.init = function () {
            var _this = this;
            g_JaxxApp.getSettings().getCryptoCurrencyPositionList().forEach(function (item) {
                // console.log(g_JaxxApp.getSettings().isCryptoCurrencyEnabled(item));
                var obj = {
                    name: item,
                    enabled: g_JaxxApp.getSettings().isCryptoCurrencyEnabled(item)
                };
                jaxx.Registry.application$.triggerHandler('CRYPTO_SELECTED', obj);
                // g_JaxxApp.cryptoDispatcher$.triggerHandler('CRYPTO_SELECTED', obj);
            });
            this.$coinList = $('.coinList.cssCoinList').first();
            var list = [];
            this.$coinList.find('tr').each(function (index, el) {
                // console.warn(index,el);
                var item = new EnableDisableItem($(el));
                item.onChange = function (item) { return _this.onItemChange(item); };
                list.push(item);
            });
            this.list = list;
            // console.warn(list);
        };
        return CryptoEnableDisableView;
    }());
    jaxx.CryptoEnableDisableView = CryptoEnableDisableView;
    var CryptoEnableDisable = (function () {
        function CryptoEnableDisable() {
            var _this = this;
            setTimeout(function () { return _this.init(); }, 3000);
        }
        CryptoEnableDisable.prototype.init = function () {
            this.view = new CryptoEnableDisableView();
            this.view.onViewStatusChanged = function (obj) {
                jaxx.Registry.application$.triggerHandler('CRYPTO_SELECTED', obj);
                //  g_JaxxApp.getGlobalDispatcher().
                // g_JaxxApp.cryptoDispatcher$.triggerHandler('CRYPTO_SELECTED', obj);
                // this.emitter$.triggerHandler(this.CRYPTO_CHANGE,obj);
            };
        };
        return CryptoEnableDisable;
    }());
    jaxx.CryptoEnableDisable = CryptoEnableDisable;
})(jaxx || (jaxx = {}));
/*
 $(document).ready(function(){

 setTimeout(function(){
 var ed:jaxx.CryptoEbableDisable = new jaxx.CryptoEbableDisable();
 },2000)

 /!* var disptcher = $({});

 disptcher.on('NAME_OF_EVENT', function(evt,data,data2){

 })

 disptcher.triggerHandler('NAME_OF_EVENT',[data,dat2])
 *!/
 })*/
//# sourceMappingURL=crypto_enabling_disabliing.js.map