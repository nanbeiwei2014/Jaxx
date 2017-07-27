///<reference path="transaction_list_bitcoin.ts"/>
///<reference path="balances_bitcoin.ts"/>
///<reference path="transaction_details_bitcoin.ts"/>
///<reference path="utxos_bitcoin.ts"/>
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
    var CryptoBitcoin = (function (_super) {
        __extends(CryptoBitcoin, _super);
        function CryptoBitcoin(coinType, coin_HD_index, service) {
            var _this = _super.call(this, coinType, coin_HD_index, service) || this;
            _this.name = "Bitcoin";
            _this.miningFee = 100000;
            _this.currentHookIndex = 0;
            _this.relay = ['coinfabrik', 'blockr'];
            _this.options = {
                APIs: {
                    'coinfabrik': {
                        unspent: {
                            url: 'http://api.jaxx.io:2082/insight-api/addrs/{{addresses}}/utxo',
                            parser: 'parseUTXOsCoinfabrikBTC'
                        }
                    },
                    'blockr': {
                        unspent: {
                            url: 'http://btc.blockr.io/api/v1/address/unspent/{{addresses}}?unconfirmed=1',
                            parser: 'parseUTXOsBlocker'
                        }
                    }
                }
            };
            return _this;
        }
        CryptoBitcoin.prototype.init = function () {
            var _this = this;
            this._cryptoMethods['transactionList'] = jaxx.TransactionListBitcoin;
            this._cryptoMethods['transactionDetails'] = jaxx.TransactionDetailsBitcoin;
            this._cryptoMethods['utxos'] = jaxx.UTXOsBitcoin;
            this._cryptoMethods['balances'] = jaxx.BalancesBitcoin;
            this.generator = new jaxx.GeneratorBlockchain(this._service.name, this._coinType, this._coin_HD_index);
            this._relayManagerImplementation = new RelayManagerBitcoin();
            this._relayManager = new RelayManager();
            this._relayManager.initialize(this._relayManagerImplementation);
            jaxx.Registry.application$.on(jaxx.Registry.BITCOIN_MINING_FEE, function (evt, fee) { return _this.miningFee = fee; });
        };
        /*
        
                _downloadTransactionsUnspent(addresses:string[], onSuccess:Function, onError:Function):void{
                    this.utxosAttempts++;
                    if(this.utxosAttempts > 5){
                        onError({error:200, message:'no connection to any services'});
                    }
        
                    if(this.currentHookIndex >= this.relay.length) this.currentHookIndex = 0;
                    let hookName:string = this.relay[this.currentHookIndex];
                    let API = this.options.APIs[hookName];
                    let APIunspent:{url:string, parser:string} = API.unspent ;
                  //  console.log(unspentHook);
                    let url = APIunspent.url; //"https://api.jaxx.io/api/zec/transactionParams/{{addresses}}";
                    let parserName:string = APIunspent.parser;// 'mapUTXOsCoinfabrik';
                    let parserFn:Function = ServiceMappers[parserName];
        
                    if(typeof parserFn !== 'function') {
                        console.error(parserName + ' is not a function');
                        onError({error:1003, message:parserName + ' is not a function'});
                        return
                    }
        
                    let reg:any = '{{addresses}}';
                    url= url.replace(reg, addresses.toString());
                   // console.log(url);
        
                    $.getJSON(url).done((res)=>{
                      //   console.log(res);
                        let utxos:VOutxo[] = parserFn(res);
                      //  console.log(utxos);
                        onSuccess(utxos);
                    }).fail(err=>{
                        this.currentHookIndex++;
                        this._downloadTransactionsUnspent(addresses,onSuccess,onError);
                    });
                }
        */
        /* downloadTransactionsUnspent(addresses:string[]):JQueryDeferred<{result:any[],utxos:VOTransactionUnspent[]}> {
 
             var deferred:JQueryDeferred<{result:any[], utxos:VOTransactionUnspent[]}> = $.Deferred();
 
            // console.log(addresses);
 
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
        CryptoBitcoin.prototype.getMiningFees = function () {
            //return this.miningFee;
            return CryptoBitcoin.getMiningFeesStatic();
        };
        CryptoBitcoin.getMiningFeesStatic = function () {
            return wallet.getPouchFold(COIN_BITCOIN).getCurrentMiningFee();
        };
        return CryptoBitcoin;
    }(jaxx.MainBlockchain));
    jaxx.CryptoBitcoin = CryptoBitcoin;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=crypto_bitcoin.js.map