///<reference path="../../com/models.ts"/>
///<reference path="../../com/Utils2.ts"/>
///<reference path="../service-mapper.ts"/>
var jaxx;
(function (jaxx) {
    var SendTransactionStartEther = (function () {
        function SendTransactionStartEther() {
            this.requestDelay = 500;
            this.url = 'https://api.etherscan.io/api?module=proxy&action=eth_sendRawTransaction&hex={{hex}}';
            this.urlCheckTransaction = 'https://api.etherscan.io/api?module=transaction&action=getstatus&txhash={{urlCheck}}';
            this.apiKey = '';
            this.checkStatusCount = 10;
            this.url += this.apiKey;
        }
        SendTransactionStartEther.prototype.destroy = function () {
            this.txTransactions = null;
            this.deferred = null;
            // this.results = null;
            this.curentRequest = null;
        };
        SendTransactionStartEther.prototype.reset = function () {
            this.i = -1;
            // this.results = [];
        };
        SendTransactionStartEther.prototype.onError = function (code, error, src) {
            var _this = this;
            var message = error.message || error;
            this.deferred.reject({
                code: code,
                message: message,
                src: src
            });
            setTimeout(function () { return _this.destroy(); }, 100);
        };
        /*sendRawTransaction(transaction:VOSendRawTransaction):JQueryDeferred<VORawTransactionResult[]>{
            this.deferred = $.Deferred();
            console.log(transaction);
    
            return this.deferred
        }*/
        SendTransactionStartEther.prototype.sendTransaction = function (sendTransaction) {
            this.reset();
            this.deferred = $.Deferred();
            this.transactionStart = sendTransaction;
            this.txTransactions = sendTransaction.txArray;
            this.sendTransactions(this.deferred);
            //  console.log(transaction);
            return this.deferred;
        };
        SendTransactionStartEther.prototype.sendTransactions = function (deferred) {
            var _this = this;
            var txids = [];
            var result = new VOSendTransactionResult();
            result.timestampStart = Date.now();
            this.txTransactions.forEach(function (item) {
                var mockTxs = item._mockTx;
                var bal = new VOBalanceTemp({
                    id: mockTxs.from,
                    index: mockTxs.addressIndex,
                    balance: mockTxs.valueDelta,
                    timestamp: mockTxs.timestamp,
                    transaction_id: mockTxs.txid
                });
                var hex = '0x' + item.serialize().toString('hex');
                //bal.hex = hex;
                //console.log(item);
                //  result.balancesSent.push(bal);
                var url = _this.url.replace('{{hex}}', hex);
                $.getJSON(url).done(function (res) {
                    res.txid = res.result;
                    result.results.push(res);
                    if (result.results.length == result.balancesSent.length) {
                        result.timestampEnd = Date.now();
                        deferred.resolve(result);
                    }
                    //console.log(res);
                });
            });
            /* var hex: string = builtTransaction.hex;
     
     
             console.warn('  sendNextBuiltTransaction   ' + this.i + ' of ' + this.builtTransactions.length, url);
             this.curentRequest = $.getJSON(url);
             this.curentRequest.then((res) => {
                 this.curentRequest = null;
                 if(res.result) {
                     builtTransaction.id = res.result;
                 }else{
                     this.onError(5555,(res.error || res),url);
                     return;
                 }
                 this.checkStatusCount = 20;
                 setTimeout(() => this.checkCurrentTransactionStatus(),this.requestDelay);
                 //setTimeout(() => this.sendNextBuiltTransaction(),this.requestDelay);
             }).fail(err=>this.onError(10001, err,url));*/
        };
        SendTransactionStartEther.prototype.checkCurrentTransactionStatus = function () {
            /*  this.checkStatusCount --;
              if(this.checkStatusCount < 0) {
                  this.onError(1009,JSON.stringify(this.builtTransactions),'checkCurrentTransactionStatus')
      
                  return;
              }
      
              var transactionid:string = this.builtTransactions[this.i].id;
              var url:string = this.urlCheckTransaction.replace('{{urlCheck}}',transactionid);
              console.log(' this.checkStatusCount ' + this.checkStatusCount + '  url ' + url);
              this.curentRequest = $.getJSON(url);
      
              this.curentRequest.done((res) => {
                  if(res.result && res.result.isError == '0'){
                      this.builtTransactions[this.i].timestamp = Date.now();
                      this.sendNextBuiltTransaction();
                  }else setTimeout(() => this.checkCurrentTransactionStatus(),this.requestDelay);
              }).fail(err =>this.onError(2404,JSON.stringify(err), url));*/
        };
        return SendTransactionStartEther;
    }());
    jaxx.SendTransactionStartEther = SendTransactionStartEther;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=send_transaction_ethereum.js.map