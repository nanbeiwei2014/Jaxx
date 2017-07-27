/**
 * Created by Vlad on 11/7/2016.
 */
    ///<reference path="../com/models.ts"/>
module jaxx {

    declare var g_JaxxApp:any;

    export class EnableDisableItem {
        onChange:Function;
        $checkBox:JQuery;
        name:string;
        isChecked:boolean = false;

        constructor(public  $view:JQuery) {

            this.name = $view.attr('value');
            this.$checkBox = $view.find('div').first();
            $view.on('click', (evt) => {
                this.isChecked = this.$checkBox.hasClass('cssCurrencyisChecked');
                this.onChange(this);
            })
        }

    }

    export class CryptoEnableDisableView {

        $coinList:JQuery;
        list:EnableDisableItem[];
        onViewStatusChanged:Function;

        onItemChange(item:EnableDisableItem):void {
            // console.log(item);
            var obj = {
                name: item.name,
                enabled: item.isChecked
            }
            if (this.onViewStatusChanged) this.onViewStatusChanged(obj)
        }

        constructor() {


            //console.warn(g_JaxxApp.getSettings().getCryptoCurrencyPositionList())


            this.init();


        }

        init():void {

            g_JaxxApp.getSettings().getCryptoCurrencyPositionList().forEach(item => {
                // console.log(g_JaxxApp.getSettings().isCryptoCurrencyEnabled(item));
                var obj = {
                    name: item,
                    enabled: g_JaxxApp.getSettings().isCryptoCurrencyEnabled(item)
                }


                jaxx.Registry.application$.triggerHandler('CRYPTO_SELECTED', obj);
               // g_JaxxApp.cryptoDispatcher$.triggerHandler('CRYPTO_SELECTED', obj);
            })


            this.$coinList = $('.coinList.cssCoinList').first();

            var list:EnableDisableItem[] = []
            this.$coinList.find('tr').each((index:number, el:Element) => {
                // console.warn(index,el);
                var item = new EnableDisableItem($(el));
                item.onChange = (item) => this.onItemChange(item)
                list.push(item);

            })

            this.list = list;
            // console.warn(list);
        }


    }

    export class CryptoEnableDisable {
        view:CryptoEnableDisableView;

        constructor() {

            setTimeout(() => this.init(), 3000);

        }

        init():void {

            this.view = new CryptoEnableDisableView();

            this.view.onViewStatusChanged = (obj) => {
                jaxx.Registry.application$.triggerHandler('CRYPTO_SELECTED', obj);
                //  g_JaxxApp.getGlobalDispatcher().
               // g_JaxxApp.cryptoDispatcher$.triggerHandler('CRYPTO_SELECTED', obj);
                // this.emitter$.triggerHandler(this.CRYPTO_CHANGE,obj);
            }
        }

    }

}


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
