///<reference path="../../com/models.ts"/>
///<reference path="../../com/Utils2.ts"/>
///<reference path="../service-mapper.ts"/>
///<reference path="./send_transaction_ethereum.ts"/>
///<reference path="balances_Ethereum.ts"/>
///<reference path="../blockchain/send_test.ts"/>
///<reference path="restore_Ethereum.ts"/>
///<reference path="download_transactions_ethereum.ts"/>
///<reference path="send_transaction.ts"/>
var jaxx;
(function (jaxx) {
    var CryptoEthereum = (function () {
        function CryptoEthereum(config) {
            this.config = config;
            this._coinType = -1;
            this.i = 0;
            // static RECEIVE:string= 'receive';
            // static CHANGE:string= 'change';
            this.gasPrice = 2e10;
            this.gasLimit = 21000; ///56000 for contracts;
            this.attempts = 10;
            this.speed = 200;
            this.apiKey = '';
            this.nullCount = 0;
            this.generator = null;
            this._coinType = config._coinType;
            this.coin_HD_index = config.hd_index;
            this.name = config.name;
            this.options = config;
            // console.log(options);
            /* let options:OptionsCrypto  = {
                 urlBalance :'http://api.jaxx.io/api/eth/balance?addresses={{addresses}}',
                 urlTransactions:'http://api.jaxx.io/api/eth/mergedTransactions?addresses={{address}}',
                 apiKey:'',
                 hd_index:coin_HD_index,
                 name:service.name
             };
 */
            // this.options = options;
            this.init();
        }
        CryptoEthereum.prototype.initialize = function () {
        };
        CryptoEthereum.prototype.init = function () {
            var options = {
                urlBalance: 'https://api.etherscan.io/api?module=account&action=balancemulti&address={{addresses}}&tag=latest',
                urlTransactions: 'http://api.etherscan.io/api?module=account&action=txlist&address={{address}}',
                urlTransactionStatus: 'https://api.etherscan.io/api?module=transaction&action=getstatus&txhash={{transaction_id}}',
                urlTransactionInternal: 'https://api.etherscan.io/api?module=account&action=txlistinternal&txhash={{transaction_id}}',
                balanceParser: null,
                apiKey: '',
                hd_index: this.coin_HD_index,
                name: this.name
            };
            /*  let options:OptionsCrypto  = {
                   urlBalance :'https://rinkeby.etherscan.io/api?module=account&action=balancemulti&address={{addresses}}&tag=latest',
                   urlTransactions:'http://rinkeby.etherscan.io/api?module=account&action=txlist&address={{address}}',
                   urlTransactionStatus:'https://rinkeby.etherscan.io/api?module=transaction&action=getstatus&txhash={{transaction_id}}',
                   urlTransactionInternal:'https://rinkeby.etherscan.io/api?module=account&action=txlistinternal&txhash={{transaction_id}}',
                   balanceParser:null,
                   apiKey:'',
   
                   hd_index:this.coin_HD_index,
                   name:this.service.name
               };*/
            this.options.urlBalance = options.urlBalance;
            this.options.urlTransactions = options.urlTransactions;
            // console.log(this.name, this._coinType, this.coin_HD_index);
            this.generator = new jaxx.GeneratorBlockchain(this.name, this._coinType, this.coin_HD_index);
            //  this.options.urlTransactions = this.options.API.transactions.url;
            // this.urlBalance = this.options.urlBalance + this.options.apiKey;
            // this.urlBalance += this.apiKey;
            this.name = this.name;
            this.options.apiKey = '';
        };
        CryptoEthereum.prototype.downloadTransactionsDetails = function (txsIds) {
            var deferred = $.Deferred();
            return deferred;
        };
        CryptoEthereum.prototype.restoreHistory2 = function (receive_change, startIndex) {
            var promise = $.Deferred();
            var req = new jaxx.RestoreEthereum(this.options, this.generator);
            req.parse = function (result, address) {
                // console.log(result);
                var ar = result.result || [];
                if (!Array.isArray(result.result)) {
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
        CryptoEthereum.prototype.checkAddressesForTranasactions = function (addresses) {
            // let promise:JQueryDeferred<string[]> = $.Deferred();
            // let relayManager:any = this._relayManager;
            return this.downloadTransactions(addresses);
            // return promise;
        };
        CryptoEthereum.prototype.sendTransaction2 = function (transaction) {
            var ctr = new jaxx.SendTransaction(this.name, this.gasPrice, this.gasLimit);
            return ctr.sendTransaction(transaction);
        };
        // web3.eth.getTransaction(transactionHash [, callback])
        CryptoEthereum.prototype.checkTransactionByAddress = function (txid, address) {
            var urlTransactions = this.options.urlTransactions;
            var url = urlTransactions.replace('{{address}}', address);
            return $.getJSON(url).then(function (res) {
                // console.warn(address, txid, res);
                var trransactions = jaxx.ServiceMappers.mapEtherTransactions(res.result, address);
                //  console.log(trransactions);
                return trransactions.filter(function (o) { return o.id === txid; });
            });
        };
        CryptoEthereum.prototype.getTransactionStatus = function (transactionId) {
            var urlTransactionStatus = this.options.urlTransactionStatus;
            var url = urlTransactionStatus.replace('{{transaction_id}}', transactionId);
            return $.getJSON(url).
                then(function (res) {
                /*
                from this.urlTransactionStatus1
                * {
                     status: "1",
                     message: "OK",
                     result: {
                     isError: "0",
                     errDescription: ""
                     }
                 }

                *
                * */
                var out = new VOTransactionStatus({
                    txid: transactionId,
                    status: Number(res.status),
                });
                if (Number(res.result.isError)) {
                    out.error = res.result.errDescription;
                }
                else
                    out.success = true;
                return out;
            });
        };
        /* checkTransaction(trs:VOTransaction):JQueryDeferred<VOTransaction[]>{
             var req:CheckTransactionEthereum = new CheckTransactionEthereum();
             return req.checkTransaction(trs,this.apiKey);
         }*/
        //  addressesChange:string[];
        // addressesReceive:string[];
        CryptoEthereum.prototype.killHistory = function () {
        };
        CryptoEthereum.prototype.restoreHistory = function (receive_change) {
            var _this = this;
            // console.log(this.options);
            var promise = $.Deferred();
            var req = new jaxx.RestoreEthereum(this.options, this.generator);
            req.parse = function (result, address) {
                // console.log(result);
                var ar = result.result;
                return jaxx.ServiceMappers.mapEtherTransactions(ar, address);
            };
            req.restoreHistory(receive_change).done(function (res) {
                // console.log(receive_change + ' done ',res);
                var addresses = req.addresses;
                // console.log(addresses);
                var withTransactions = _.dropRight(req.addresses, req.numberOfTransactionsWithoutHistory);
                var withoutTransactions = _.takeRight(req.addresses, req.numberOfTransactionsWithoutHistory);
                var req2 = new jaxx.BalancesEthereum(_this.options);
                req2.loadBalances(withoutTransactions).done(function (balances) {
                    if (jaxx.Utils.calculateBalance(balances)) {
                        console.log(' have balance ');
                        for (var i = balances.length - 1; i >= 0; i--) {
                            if (balances[i].balance === 0)
                                balances.pop();
                            else
                                break;
                        }
                        res.addresses = res.addresses.concat(jaxx.Utils.getIds(balances));
                    }
                    else
                        console.log(' dont have balance');
                    // console.log(balances)
                    promise.resolve(res);
                });
                return res;
            });
            return promise;
        };
        CryptoEthereum.prototype.sendTransactinsStart = function (transaction) {
            var ctr = new jaxx.SendTransactionStartEther();
            return ctr.sendTransaction(transaction);
        };
        /*  sendBuiltTransactions(builtTransactions:VOBuiltTransaction[]):JQueryDeferred<VOBuiltTransaction[]>{
              var req:RequestSendTransactionEther = new RequestSendTransactionEther(this.service);
              return req.sendBuiltTransactions(builtTransactions);
          }
          */
        ////////////////////////////// Transactions //////
        CryptoEthereum.prototype.downloadTransactionsUnspent = function (addresses) {
            var deferred = $.Deferred();
            var req = new jaxx.DownloadTransactionsEthereum(this.name);
            //console.log(addresses);
            req.downloadTransactions(addresses).done(function (res) {
                console.log(res);
                var out = res.map(function (item) {
                    return new VOTransactionUnspent(item);
                });
                deferred.resolve({ result: [], utxos: out });
            }).fail(function (err) { return deferred.fail(err); });
            return deferred;
        };
        CryptoEthereum.prototype.downloadTransactions = function (addresses) {
            var req = new jaxx.DownloadTransactionsBlockchain(this.name, this.options);
            // req.parse = ServiceMappers[mapFunction];
            req.parse = function (result, address) {
                // console.log(result);
                var ar = result.result || result.transactions;
                return jaxx.ServiceMappers.mapEtherTransactions(ar, address);
            };
            /*
                        req.parse = function (result: any, address:string) {
                            console.log(result);
            
                            let ar:any[] = result.transactions;
                            return ServiceMappers.mapEtherTransactions(ar,address);
                        }*/
            /*
                       req.parse = function (result: any, address: string) {
                           return ServiceMappers.mapEtherTransactions(result.result,address);
                       }*/
            /// if(this.downloadingTransaction) this.downloadingTransaction.abort().destroy();
            this.downloadingTransaction = req;
            return req.downloadTransactions(addresses);
        };
        CryptoEthereum.prototype.downloadTransactions2 = function (voaddresses) {
            /* var req:DownloadTransactionsEthereum2 = new DownloadTransactionsEthereum2(this.name);
             return req.downloadTransactions2(voaddresses);*/
            //TODO implement if need
            return null;
        };
        CryptoEthereum.prototype.downloadTransactionsForAddress = function (address) {
            var urlTransactions = this.options.urlTransactions;
            var url = urlTransactions.replace('{{address}}', address);
            return $.getJSON(url).then(function (res) {
                var result = res.result;
                return jaxx.ServiceMappers.mapEtherTransactions(result, address);
            });
        };
        /* sendTransaction(transaction:VOSendRawTransaction):JQueryDeferred<VORawTransactionResult[]>{
             var sendTransaction:RequestSendTransactionEther = new RequestSendTransactionEther(this.service)
             return sendTransaction.sendRawTransaction(transaction);
         }*/
        /*
        checkTransactions(trs:VOTransaction[]):JQueryDeferred<VOTransaction[]>{
          var d:JQueryDeferred<VOTransaction[]> = $.Deferred();
          var checkTrans:CheckTransactionsEther = new CheckTransactionsEther();
    
          checkTrans.checkTransactions(trs).done(res=>d.resolve(res)).fail(err => d.reject(err));
          return d;
        }
        getTransactionsFromAddresses(addresses:string[]):JQueryDeferred<VOTransaction[]>{
    
          var d:JQueryDeferred<VOTransaction[]> = $.Deferred();
          return d;
        }
        */
        /*
        
                setTransactionEventEmiter(emitter$:JQuery):void{
                    var sendTransaction:EthereumSendTransaction = new EthereumSendTransaction();
                    sendTransaction.setTransactionEventEmiter(emitter$);
                }
        */
        //////////////////////////////////////// Balances /////////////////////
        CryptoEthereum.prototype.downloadBalances = function (addresses) {
            // var d:JQueryDeferred<VOBalance[]> = $.Deferred();
            //  this.options.urlBalance = this.options.API.balances.url;
            // this.options.balanceParser =  ServiceMappers[this.options.API.balances.parser];
            // console.log(this.options);
            var req = new jaxx.BalancesEthereum(this.options);
            //  req._batchSize = 25;//this.options.API.balances.batchSize;
            // console.warn(req._batchSize);
            return req.loadBalances(addresses); //.done(res=>d.resolve(res)).fail(err=>d.reject(err));
            // return d;
        };
        /*
        
                checkBalanceForAddress(address:string):JQueryPromise<VOBalance>{
                    let urlBalance:string = this.options.urlBalance;
                    var url:string = urlBalance.replace('{{address}}',address);
                    return $.getJSON(url).then((res) => {
                        //console.warn(res);
                        return new VOBalance({
                            id:address,
                            balance:+res.result,
                            timestamp:Date.now()
                        });
                    });
                }
        */
        CryptoEthereum.prototype.getMiningPrice = function () {
            return this.gasPrice;
        };
        CryptoEthereum.prototype.getMiningFees = function () {
            //gasPrice:number = 2e10; //in Wei
            // var gasLimit:number = 53000;
            return this.gasPrice * this.gasLimit;
        };
        CryptoEthereum.prototype.getMiningFeeLimit = function () {
            return 0.0001;
        };
        return CryptoEthereum;
    }());
    jaxx.CryptoEthereum = CryptoEthereum;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=main_Ethereum.js.map