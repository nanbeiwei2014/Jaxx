/**
 * Created by Vlad on 10/18/2016.
 */
///<reference path="../../com/models.ts"/>
///<reference path="../../com/Utils2.ts"/>
///<reference path="../service-mapper.ts"/>
///<reference path="bitcoin-send-trans.ts"/>
///<reference path="restore_blockr.ts"/>
///<reference path="balances-blockr.ts"/>
///<reference path="check-trans-blockr.ts"/>
///<reference path="download_transactions_blokr.ts"/>
var jaxx;
(function (jaxx) {
    var RequestBlockr = (function () {
        function RequestBlockr(coin_HD_index, service) {
            this.coin_HD_index = coin_HD_index;
            this.service = service;
            this.i = 0;
            this.attempts = 10;
            this.speed = 200;
            this.apiKey = '';
            this.nullCount = 0;
            this.init();
        }
        RequestBlockr.prototype.initialize = function () {
        };
        RequestBlockr.prototype.init = function () {
            this.name = this.service.name;
            this.generator = new jaxx.GeneratorBlockchain(this.name, this.service.id, this.coin_HD_index);
            this.urlBalance = 'http://btc.blockr.io/api/v1/address/balance/{{address}}';
            this.urlTransactions = 'http://btc.blockr.io/api/v1/address/txs/{{address}}';
        };
        //////////////////////////////////////////
        //TODO implement Blockr
        RequestBlockr.prototype.setTransactionEventEmiter = function (emitter$) {
            var sendTransaction = new jaxx.EthereumSendTransaction();
            sendTransaction.setTransactionEventEmiter(emitter$);
        };
        /*   getTransactionStatus(transaction_id):JQueryPromise<VOTransactionStatus>{
               console.error('need implement ')
   
               return null;
           }*/
        RequestBlockr.prototype.downloadBalances = function (addresses) {
            var promise = $.Deferred();
            promise.resolve([]);
            return promise;
        };
        RequestBlockr.prototype.checkTransactionByAddress = function (transasction_id, address) {
            console.error('need implement ');
            return null;
        };
        //////////////////////////////////////////////
        RequestBlockr.prototype.sendTransaction2 = function (transaction) {
            return null;
        };
        RequestBlockr.prototype.downloadTransactionsUnspent = function (addresses) {
            var promise = $.Deferred();
            promise.resolve({ result: [], utxos: [] });
            return promise;
        };
        RequestBlockr.prototype.sendTransactinsStart = function (trans) {
            var relays = g_JaxxApp.getBitcoinRelays();
            return null;
        };
        RequestBlockr.prototype.restoreHistory = function (receive_change) {
            var _this = this;
            var req = new jaxx.RestoreBlockr(this.coin_HD_index, this.generator);
            return req.restoreHistory(receive_change).done(function (res) {
                console.log(_this.name + ' ' + receive_change + ' done ', res);
                return res;
            });
        };
        /* getMiningFee():number{
             return 0.00000002 //20,000,000
         }*/
        RequestBlockr.prototype.generateKeyPairReceive = function (i) {
            return this.generator.generateKeyPairReceive(i);
        };
        RequestBlockr.prototype.generateKeyPairChange = function (i) {
            return this.generator.generateKeyPairChange(i);
        };
        RequestBlockr.prototype.checkTransaction = function (trs) {
            var req = new jaxx.CheckTransactionBlockr();
            return req.checkTransaction(trs, this.apiKey);
        };
        RequestBlockr.prototype.downloadTransactions = function (addresses) {
            var req = new jaxx.DownloadTransactoionsBlockr(this.name);
            return req.downloadTransactions(addresses);
        };
        /* downloadTransactions2(voaddresses:VOAddress[]):JQueryDeferred<VOAddress[]>{
             var req:DownloadTransactoionsBlockr = new DownloadTransactoionsBlockr(this.name);
             return req.downloadTransactions2(voaddresses);
         }*/
        RequestBlockr.prototype.getBalances = function (addr) {
            var d = $.Deferred();
            var req = new jaxx.BalancesBlockr();
            req.loadBalances(addr).done(function (res) { return d.resolve(res); }).fail(function (err) { return d.reject(err); });
            return d;
        };
        RequestBlockr.prototype.downloadTransactionsForAddress = function (address) {
            var url = this.urlTransactions.replace('{{address}}', address);
            return $.getJSON(url).then(function (res) {
                var result = res.result;
                return jaxx.ServiceMappers.mapEtherTransactions(result, address);
            });
        };
        RequestBlockr.prototype.checkBalanceForAddress = function (address) {
            var url = this.urlBalance.replace('{{address}}', address);
            return $.getJSON(url).then(function (res) {
                //console.warn(res);
                return new VOBalance({
                    id: address,
                    balance: +res.result,
                    timestamp: Date.now()
                });
            });
        };
        RequestBlockr.prototype.getTransactionStatus = function (transactionId) {
            var deffered = $.Deferred();
            // thirdparty.web3.eth.getTransaction(transactionId,[(res)=>{
            //     console.log(transactionId);
            //     console.warn(res);
            // }])
            return deffered;
        };
        RequestBlockr.prototype.getMiningFees = function () {
            return 0.00002;
        };
        return RequestBlockr;
    }());
    RequestBlockr.RECEIVE = 'receive';
    RequestBlockr.CHANGE = 'change';
    jaxx.RequestBlockr = RequestBlockr;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=main_blokr.js.map