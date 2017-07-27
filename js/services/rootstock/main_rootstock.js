/**
 * Created by Daniel on 2017-01-11.
 */
var jaxx;
(function (jaxx) {
    var CryptoRootstockEthereum = (function () {
        function CryptoRootstockEthereum(coinType, coin_HD_index, service) {
            this.coinType = coinType;
            this.coin_HD_index = coin_HD_index;
            this.service = service;
            this._coinType = -1;
            this.i = 0;
            this.gasPrice = 2e10;
            this.gasLimitDefault = 150000;
            this.attempts = 10;
            this.speed = 200;
            this.apiKey = '';
            this.nullCount = 0;
            this.generator = null;
            this._coinType = coinType;
            var options = {
                urlBalance: 'http://54.67.34.99/api/eth/balance?addresses={{addresses}}',
                urlTransactions: 'http://54.67.34.99/api/eth/mergedTransactions?addresses={{address}}',
                urlTransactionStatus: 'http://54.67.34.99/api/eth?module=transaction&action=getstatus&txhash={{transaction_id}}',
                urlTransactionInternal: 'http://54.67.34.99/api/eth?module=account&action=txlistinternal&txhash={{transaction_id}}',
                apiKey: '',
                hd_index: coin_HD_index,
                name: service.name
            };
            this.options = options;
            this.init();
        }
        CryptoRootstockEthereum.prototype.initialize = function () {
        };
        CryptoRootstockEthereum.prototype.init = function () {
            this.gasLimit = this.gasLimitDefault;
            this.generator = new jaxx.GeneratorBlockchain(this.service.name, COIN_ETHEREUM, this.coin_HD_index);
            console.log(this.generator);
            this.name = this.service.name;
        };
        CryptoRootstockEthereum.prototype.sendTransaction2 = function (transaction) {
            var ctr = new jaxx.SendTransaction(this.name, this.gasPrice, this.gasLimit);
            return ctr.sendTransaction(transaction);
        };
        // web3.eth.getTransaction(transactionHash [, callback])
        CryptoRootstockEthereum.prototype.downloadTransactionsDetails = function (txsIds) {
            var deferred = $.Deferred();
            return deferred.resolve({ result: [], transactions: [] });
        };
        CryptoRootstockEthereum.prototype.checkTransactionByAddress = function (txid, address) {
            var url = this.options.urlTransactions.replace('{{address}}', address);
            return $.getJSON(url).then(function (res) {
                // console.warn(address, txid, res);
                var trransactions = jaxx.ServiceMappers.mapEtherTransactions(res.result, address);
                //  console.log(trransactions);
                return trransactions.filter(function (o) { return o.id === txid; });
            });
        };
        CryptoRootstockEthereum.prototype.getTransactionStatus = function (transactionId) {
            var url = this.options.urlTransactionStatus.replace('{{transaction_id}}', transactionId);
            return $.getJSON(url).then(function (res) {
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
        CryptoRootstockEthereum.prototype.restoreHistory2 = function (receive_change) {
            return null;
        };
        CryptoRootstockEthereum.prototype.restoreHistory = function (receive_change) {
            // console.log(this.options);
            var req = new jaxx.RestoreHistory(this.options, this.generator);
            req.url = this.options.urlTransactions;
            req.parse = function (result, address) {
                // console.log(result,address);
                var ar = result.transactions || [];
                return jaxx.ServiceMappers.mapEtherTransactions(ar, address);
            };
            return req.restoreHistory(receive_change).done(function (res) {
                // console.log(receive_change + ' done ',res);
                return res;
            });
        };
        CryptoRootstockEthereum.prototype.checkAddressesForTranasactions = function (addresses) {
            return this.downloadTransactions(addresses);
        };
        CryptoRootstockEthereum.prototype.sendTransactinsStart = function (transaction) {
            var ctr = new jaxx.SendTransactionStartEther();
            return ctr.sendTransaction(transaction);
        };
        /*  sendBuiltTransactions(builtTransactions:VOBuiltTransaction[]):JQueryDeferred<VOBuiltTransaction[]>{
         var req:RequestSendTransactionEther = new RequestSendTransactionEther(this.service);
         return req.sendBuiltTransactions(builtTransactions);
         }
         */
        ////////////////////////////// Transactions //////
        CryptoRootstockEthereum.prototype.downloadTransactionsUnspent = function (addresses) {
            var deferred = $.Deferred();
            var req = new jaxx.DownloadTransactionsEthereum(this.name);
            req.downloadTransactions(addresses).done(function (res) {
                //console.log(res)
                var out = res.map(function (item) {
                    return new VOTransactionUnspent(item);
                });
                deferred.resolve({ result: [], utxos: out });
            }).fail(function (err) { return deferred.fail(err); });
            return deferred;
        };
        CryptoRootstockEthereum.prototype.downloadTransactions = function (addresses) {
            var req = new jaxx.DownloadTransactionsBlockchain(this.name, this.options);
            req.parse = function (result, address) {
                // console.log(result);
                var ar = result.transactions || [];
                return jaxx.ServiceMappers.mapEtherTransactions(ar, address);
            };
            /// if(this.downloadingTransaction) this.downloadingTransaction.abort().destroy();
            this.downloadingTransaction = req;
            return req.downloadTransactions(addresses);
        };
        CryptoRootstockEthereum.prototype.downloadTransactions2 = function (voaddresses) {
            return null;
        };
        CryptoRootstockEthereum.prototype.downloadTransactionsForAddress = function (address) {
            var url = this.options.urlTransactions.replace('{{address}}', address);
            return $.getJSON(url).then(function (res) {
                var result = res.result;
                return jaxx.ServiceMappers.mapEtherTransactions(result, address);
            });
        };
        CryptoRootstockEthereum.prototype.setTransactionEventEmiter = function (emitter$) {
            var sendTransaction = new jaxx.EthereumSendTransaction();
            sendTransaction.setTransactionEventEmiter(emitter$);
        };
        //////////////////////////////////////// Balances /////////////////////
        CryptoRootstockEthereum.prototype.downloadBalances = function (addresses) {
            var req = new jaxx.BalancesEthereum(this.options);
            req.parse = function (resp) {
                var date = Date.now();
                // console.log(resp);
                var out = [];
                for (var str in resp)
                    out.push(new VOBalance({
                        id: str,
                        balance: +resp[str],
                        timestamp: date
                    }));
                // console.log(out);
                return out;
            };
            return req.loadBalances(addresses);
        };
        CryptoRootstockEthereum.prototype.checkBalanceForAddress = function (address) {
            var url = this.options.urlBalance.replace('{{address}}', address);
            return $.getJSON(url).then(function (res) {
                //console.warn(res);
                return new VOBalance({
                    id: address,
                    balance: +res.result,
                    timestamp: Date.now()
                });
            });
        };
        CryptoRootstockEthereum.prototype.getMiningPrice = function () {
            return this.gasPrice;
        };
        CryptoRootstockEthereum.prototype.getMiningFees = function () {
            return this.gasPrice * this.gasLimit;
        };
        CryptoRootstockEthereum.prototype.getMiningFeeLimit = function () {
            return this.gasLimit;
        };
        return CryptoRootstockEthereum;
    }());
    CryptoRootstockEthereum.RECEIVE = 'receive';
    CryptoRootstockEthereum.CHANGE = 'change';
    jaxx.CryptoRootstockEthereum = CryptoRootstockEthereum;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=main_rootstock.js.map