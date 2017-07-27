///<reference path="transaction_list_litecoin.ts"/>
///<reference path="balances_litecoin.ts"/>
///<reference path="transaction_details_litecoin.ts"/>
///<reference path="utxos_litecoin.ts"/>
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
///<reference path="../blockchain/main_blockchain.ts"/>
var jaxx;
(function (jaxx) {
    var CryptoLitecoin = (function (_super) {
        __extends(CryptoLitecoin, _super);
        function CryptoLitecoin(coinType, coin_HD_index, service, options) {
            var _this = _super.call(this, coinType, coin_HD_index, service, options) || this;
            _this._name = "Litecoin";
            _this.currentHookIndex = 0;
            _this.relay = ['coinfabrik', 'blockr'];
            if (options) {
                for (var str in options)
                    _this.options[str] = options[str];
            }
            return _this;
            // this.options = options;
        }
        CryptoLitecoin.prototype.init = function () {
            this._cryptoMethods['transactionList'] = jaxx.TransactionListLitecoin;
            this._cryptoMethods['transactionDetails'] = jaxx.TransactionDetailsLitecoin;
            this._cryptoMethods['utxos'] = jaxx.UTXOsLitecoin;
            this._cryptoMethods['balances'] = jaxx.BalancesLitecoin;
            this.options.delayRequest = 500;
        };
        CryptoLitecoin.prototype.initialize = function () {
            this._generator = new jaxx.GeneratorBlockchain(this._name, this._coinType, this._coin_HD_index);
            this._relayManagerImplementation = new RelayManagerLitecoin();
            this._relayManager = new RelayManager();
            this._relayManager.initialize(this._relayManagerImplementation);
        };
        CryptoLitecoin.prototype.downloadTransactionsUnspent = function (addresses) {
            var deferred = $.Deferred();
            if (addresses.length === 0) {
                deferred.resolve({ result: [], utxos: [] });
                return deferred;
            }
            var i = 0;
            var relayManager = this._relayManager;
            var address = addresses[i];
            var out = [];
            var utxos = [];
            //    console.log(addresses.toString());
            var onDataDownloaded = function (status, data) {
                for (var addr in data) {
                    var ar = data[addr];
                    utxos = utxos.concat(jaxx.ServiceMappers.mapTransactionsUnspent(ar, addr));
                }
                // utxos.push(new VOAddressUnspent(str, data[str]));
                // console.log(data);
                out.push(data);
                i++;
                if (i >= addresses.length) {
                    deferred.resolve({ result: out, utxos: utxos });
                    return;
                }
                address = addresses[i];
                setTimeout(getHext, 100);
                // console.log(arguments);
            };
            //console.warn(' downloadTransactionsUnspent  ' + addresses.length);
            var getHext = function () {
                relayManager.getUTXO(address, onDataDownloaded);
            };
            getHext();
            return deferred;
        };
        /*  _downloadTransactionsUnspent(addresses:string[], onSuccess:Function, onError:Function):void{
  
              this.utxosAttempts++;
              if(this.utxosAttempts > 5){
                  onError({error:200, message:'no connection to any services'});
              }
  
              if(this.currentHookIndex >= this.relay.length) this.currentHookIndex = 0;
              let hookName:string = this.relay[this.currentHookIndex];
              let hook = this.options.hooks[hookName];
              let unspentHook:{url:string, parser:string} = hook.unspent ;
              let url = unspentHook.url; //"https://api.jaxx.io/api/zec/transactionParams/{{addresses}}";
              let parserName:string = unspentHook.parser;// 'mapUTXOsCoinfabrik';
              let parserFn:Function = ServiceMappers[parserName];
              if(typeof parserFn !== 'function') {
                  console.error(parserName + ' is not a function');
                  onError({error:1003, message:parserName + ' is not a function'});
                  return
              }
  
              let reg:any = '{{addresses}}';
  
              url= url.replace(reg, addresses.toString());
              //console.log(url);
  
              $.getJSON(url).done((res)=>{
                 // console.log(res);
                  let utxos:VOutxo[] = parserFn(res);
                 // console.log(utxos);
                  onSuccess(utxos);
              }).fail(err=>{
                  this.currentHookIndex++;
                  this._downloadTransactionsUnspent(addresses,onSuccess,onError);
              });
  
          }
  
          downloadTransactionsUnspent(addresses:string[]):JQueryDeferred<{result:any[],utxos:VOTransactionUnspent[]}> {
  
  
              var deferred:JQueryDeferred<{result:any[], utxos:VOTransactionUnspent[]}> = $.Deferred();
              this.utxosAttempts = 0;
              this.currentHookIndex = 0;
  
              if (addresses.length === 0) {
                  deferred.resolve({result: [], utxos: []});
                  return deferred;
              }
  
              this._downloadTransactionsUnspent(addresses, utxos=>deferred.resolve({result:utxos, utxos:null}), err=>deferred.reject(err));
  
  
              return deferred;
          }
  
  */
        CryptoLitecoin.prototype.downloadBalances = function (addresses) {
            var d = $.Deferred();
            var balanceRequestManager = new this._cryptoMethods['balances'](this.options);
            balanceRequestManager.options.delayRequest = this.options.delayRequest;
            balanceRequestManager.initialize(this.name, this._coinType, this._relayManager);
            var promise = balanceRequestManager.loadBalances(addresses);
            promise.done(function (res) { return d.resolve(res); }).fail(function (err) { return d.reject(err); });
            return d;
        };
        CryptoLitecoin.prototype.restoreHistory = function (receive_change) {
            var _this = this;
            var mainRequestDeferred = $.Deferred();
            var txListRequest = new this._cryptoMethods['transactionList'](this._coin_HD_index, this.generator, this.options);
            txListRequest.initialize(this.name, this._coinType, this._relayManager);
            txListRequest.options.delayRequest = this.options.delayRequest;
            txListRequest.restoreHistory(receive_change).done(function (txList) {
                // console.warn(txListRequest.getAddresses());
                //vladedit previous respond contained extra addresses (+20)
                // did a hack to get addresses from TransactionListBitcoin
                //TODO remove extra addresses from next calls
                var addresses = txListRequest.getAddresses();
                var promise = _this.getUTXODataFromTxList(txList);
                promise.done(function (txListWithUTXOs) {
                    _this.getTransactionalDataFromTxList(txListWithUTXOs).done(function (transactionalData) {
                        transactionalData.addresses = addresses;
                        mainRequestDeferred.resolve(transactionalData);
                    }).fail(function (err) { return mainRequestDeferred.reject(err); });
                }).fail(function (err) { return mainRequestDeferred.reject(err); });
            }).fail(function (err) { return mainRequestDeferred.reject(err); });
            return mainRequestDeferred;
        };
        CryptoLitecoin.prototype.downloadTransactions = function (addresses) {
            var _this = this;
            var deffered = $.Deferred();
            var txListRequest = new jaxx.TransactionListBlockchain(this._coin_HD_index, this.generator, this.options); //this._cryptoMethods['transactionList'](this._coin_HD_index,this.generator);
            txListRequest.initialize(this.name, this._coinType, this._relayManager);
            txListRequest.getNextAddress = function () {
                var address = addresses.pop();
                if (addresses.length == 0) {
                    txListRequest.setTheEnd();
                }
                return address;
            };
            txListRequest.restoreHistory('nothing').done(function (txList) {
                // console.log(txList);
                _this.getUTXODataFromTxList(txList).done(function (txListWithUTXOs) {
                    _this.getTransactionalDataFromTxList(txListWithUTXOs)
                        .done(function (transactionalData) {
                        deffered.resolve(transactionalData);
                    });
                });
            });
            return deffered;
        };
        /* downloadBalances(addresses:string[]):JQueryDeferred<VOBalance[]> {


             var d:JQueryDeferred<VOBalance[]> = $.Deferred();
             var balanceRequestManager:BalancesBlockchain = new this._cryptoMethods['balances']();

             balanceRequestManager.initialize(this.name, this._coinType, this._relayManager);

             var promise:JQueryPromise<any> = balanceRequestManager.loadBalances(addresses);
             promise.done(res => d.resolve(res)).fail(err => d.reject(err));

             return d;
         }
 */
        CryptoLitecoin.prototype.getMiningFees = function () {
            return 55000; //20,000,000
        };
        return CryptoLitecoin;
    }(jaxx.MainBlockchain));
    jaxx.CryptoLitecoin = CryptoLitecoin;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=crypto_litecoin.js.map