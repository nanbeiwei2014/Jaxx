///<reference path="../../com/models.ts"/>
///<reference path="../../com/Utils2.ts"/>
///<reference path="../service-mapper.ts"/>
///<reference path="./send_transaction_ethereum.ts"/>
///<reference path="balances_Ethereum.ts"/>
///<reference path="../blockchain/send_test.ts"/>
///<reference path="../blockchain/restore_history.ts"/>
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var jaxx;
(function (jaxx) {
    var RestoreEthereum = (function (_super) {
        __extends(RestoreEthereum, _super);
        /*  name:string;
          onDestroyed:Function;
          destroyed:boolean;
          numberOfTransactionsWithoutHistory:number;
          attempts:number = 10;
          //receive_change:string;
          apiKey:string='';
          requestDelays:number = 200;
          i:number;
          addresses:string[];
          transactions:VOTransaction[];
          url:string;
          currentRequest: JQueryXHR;
          onHold:boolean;
          deferred:JQueryDeferred<{index:number, addresses:string[], transactions:VOTransaction[]}>
          receive_change:string;
          progress:number;*/
        function RestoreEthereum(options, generator) {
            var _this = _super.call(this, options, generator) || this;
            _this.generator = generator;
            return _this;
            // this.init();
        }
        RestoreEthereum.prototype.init = function () {
            this.url = this.options.urlTransactions; //https://api.etherscan.io/api?module=account&action=txlist&address={{address}}&tag=latest';
            this.url += this.apiKey;
            this.name = this.generator.name;
        };
        /* wait(){
             this.onHold = true;
         }
     
         resume(){
             this.onHold = false;
             this.loadNextAddress();
         }
     
         destroy():void{
             if(this.currentRequest){
                 this.currentRequest.abort();
                 this.currentRequest = null;
             }
             this.addresses = null;
             this.transactions = null;
             this.destroyed = true;
             if(this.onDestroyed)this.onDestroyed();
     
         }
     
         reset():void{
             this.i=-1;
             this.numberOfTransactionsWithoutHistory = 0;
             this.addresses = [];
             this.transactions = [];
             this.attempts = 10;
             this.requestDelays = 200;
         }*/
        RestoreEthereum.prototype.parse = function (result, address) {
            if (result.result) {
                var ar = result.result;
                return jaxx.ServiceMappers.mapEtherTransactions(ar, address);
            }
            return null;
        };
        return RestoreEthereum;
    }(jaxx.RestoreHistory));
    jaxx.RestoreEthereum = RestoreEthereum;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=restore_Ethereum.js.map