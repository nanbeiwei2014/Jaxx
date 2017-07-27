/**
 * Created by Vlad on 10/21/2016.
 */
var jaxx;
(function (jaxx) {
    var CryptoEthereumClassic = (function () {
        /* options:any ={
             hooks:{
                 'coinfabrik':{
                     nonce:{
                         url:'http://api.jaxx.io:8080/api/eth/nextNonce?address={{address}}',
                         parser:'parseUTXOsCoinfabrikLTC'
                     }
                 }
             }
   
         }*/
        function CryptoEthereumClassic(coinType, coin_HD_index, service, options) {
            this.service = service;
            this.generator = null;
            this.gasPrice = 2e10;
            this.gasLimit = 21000; ///56000 for co
            this.options = options;
            this.name = options.name;
            this.coin_HD_index = options.coin_HD_index;
            this.coinType = options.id;
            //console.log(coinType)
            //   console.warn(options);
            this.init();
        }
        CryptoEthereumClassic.prototype.init = function () {
            this.generator = new jaxx.GeneratorBlockchain(this.name, this.coinType, this.coin_HD_index);
            //this.options.urlBalance ='https://api.etherscan.io/api?module=account&action=balance&address={{address}}&tag=latest';
            //options.urlTransactionStatus = 'https://api.etherscan.io/api?module=transaction&action=getstatus&txhash={{transaction_id}}';
            // options.urlTransactionInternal = 'https://api.etherscan.io/api?module=account&action=txlistinternal&txhash={{transaction_id}}';
            // this.options.urlTransactions = 'https://etcchain.com/api/v1/getTransactionsByAddress?&address={{address}}';
            this.options.urlTransactions = 'https://api.jaxx.io/api/eth/mergedTransactions?addresses={{address}}'; //&limit=20&only_from=false&only_to=false&direction=descending';
            // this.options.urlTransactions2 = 'http://api.jaxx.io:8080/api/eth/mergedTransactions?addresses={{addresses}}';
            this.options.urlBalance = 'https://api.jaxx.io/api/eth/balance?addresses={{addresses}}';
            this.options.apiKey = '';
            //this.urlTransactionStatus= 'https://api.etherscan.io/api?module=transaction&action=getstatus&txhash={{transaction_id}}';
            //this.urlTransactionInternal = 'https://api.etherscan.io/api?module=account&action=txlistinternal&txhash={{transaction_id}}';
        };
        CryptoEthereumClassic.prototype.getMiningPrice = function () {
            return this.gasPrice;
        };
        CryptoEthereumClassic.prototype.getMiningFees = function () {
            //gasPrice:number = 2e10; //in Wei
            // var gasLimit:number = 53000;
            return this.gasPrice * this.gasLimit;
        };
        CryptoEthereumClassic.prototype.getMiningFeeLimit = function () {
            return 0.0001;
        };
        CryptoEthereumClassic.prototype._downloadTransactionsUnspent = function (addresses, onSuccess, onError) {
        };
        CryptoEthereumClassic.prototype.checkAddressesForTranasactions = function (addresses) {
            // let promise:JQueryDeferred<string[]> = $.Deferred();
            // let relayManager:any = this._relayManager;
            return this.downloadTransactions(addresses);
            // return promise;
        };
        CryptoEthereumClassic.prototype.downloadTransactionsUnspent = function (addresses) {
            var deferred = $.Deferred();
            console.warn(addresses);
            return deferred;
        };
        CryptoEthereumClassic.prototype.restoreHistory2 = function (receive_change, startIndex) {
            var promise = $.Deferred();
            var req = new jaxx.RestoreEthereum(this.options, this.generator);
            req.parse = function (result, address) {
                // console.log(result);
                var ar = result.transactions || [];
                if (!Array.isArray(result.transactions)) {
                    console.error(' not expected server response ', result);
                }
                return jaxx.ServiceMappers.mapEtherTransactions(ar, address);
            };
            req.restoreHistory(receive_change, startIndex).done(function (res) {
                // console.log(receive_change + ' done ',res);
                var result = {
                    index: res.index,
                    addresses: res.addresses,
                    transactions: res.transactions,
                    txdIds: null
                };
                promise.resolve(result);
            });
            return promise;
        };
        CryptoEthereumClassic.prototype.restoreHistory = function (receive_change) {
            // console.log(this.options);
            var req = new jaxx.RestoreEthereum(this.options, this.generator);
            req.parse = function (result, address) {
                // console.log(result);
                var ar = result.transactions;
                return jaxx.ServiceMappers.mapEtherTransactions(ar, address);
            };
            return req.restoreHistory(receive_change).done(function (res) {
                // console.log(receive_change + ' done ',res);
                return res;
            });
        };
        CryptoEthereumClassic.prototype.downloadTransactions = function (addresses) {
            /*let promise:JQueryDeferred<VOTransaction[]> = $.Deferred();
    
            let url:string = this.options.urlTransactions2.replace('{{addresses}}', addresses.toString());
            console.log(' downloadTransactions    ' + url);
    
            $.getJSON(url).done(function (res) {
                console.log(res);
    
            }).fail(function (er) {
                promise.reject(er);
            });*/
            var req = new jaxx.DownloadTransactionsBlockchain(this.name, this.options);
            req.url = this.options.urlTransactions;
            req.parse = function (result, address) {
                // console.log(result);
                var ar = result.transactions;
                return jaxx.ServiceMappers.mapEtherTransactions(ar, address);
            };
            return req.downloadTransactions(addresses);
            // var req:DownloadTransactionsEthereum = new DownloadTransactionsEthereum(this.name);
            /// if(this.downloadingTransaction) this.downloadingTransaction.abort().destroy();
            // this.downloadingTransaction = req;
            // return promise
        };
        CryptoEthereumClassic.prototype.downloadBalances = function (addresses) {
            // var d:JQueryDeferred<VOBalance[]> = $.Deferred();
            //    console.log(' downloadBalances   ' + addresses.toString());
            var req = new jaxx.BalancesEthereum(this.options);
            req.parse = function (res) {
                // console.log(res);
                var stamp = Math.round(Date.now() / 1000);
                var out = [];
                for (var str in res) {
                    out.push(new VOBalance({
                        id: str,
                        balance: +res[str],
                        timestamp: stamp
                    }));
                }
                return out;
            };
            return req.loadBalances(addresses); //.done(res=>d.resolve(res)).fail(err=>d.reject(err));
            // return d;
        };
        return CryptoEthereumClassic;
    }());
    jaxx.CryptoEthereumClassic = CryptoEthereumClassic;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=request-ethereum-classc.js.map