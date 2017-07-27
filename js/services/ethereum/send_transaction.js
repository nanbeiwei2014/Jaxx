///<reference path="../../com/models.ts"/>
///<reference path="../../com/Utils2.ts"/>
///<reference path="../service-mapper.ts"/>
///<reference path="./send_transaction_ethereum.ts"/>
///<reference path="balances_Ethereum.ts"/>
///<reference path="../blockchain/send_test.ts"/>
///<reference path="restore_Ethereum.ts"/>
///<reference path="download_transactions_ethereum.ts"/>
var jaxx;
(function (jaxx) {
    var SendTransaction = (function () {
        /*
         error:
               code:-32010
               data:null
               message:"Transaction with the same hash was already imported."


        * error{
        * code:-32010
        * message:"Transaction nonce is too low. Try incrementing the nonce."
        *
        * }
        *
        * error{
        * code:-32010
        * message:"Transaction gas is too low. There is not enough gas to cover minimal cost of the transaction (minimal: 53000, got: 21000). Try increasing supplied gas."
        *
        * }
        *
        * Object {
        * id: 1
        * jsonrpc: "2.0"
        * result: "0x90ac1d65cc8c2d65931595bf0a3a3de9db4e57a5955c21e5c039f843508c68da"
        * }
        *
         error
         code:  -32010
         data:null
         message: "Transaction gas is too low. There is not enough gas to cover minimal cost of the transaction (minimal: 21000, got: 5000). Try increasing supplied gas."

        * */
        // Insufficient funds. Account you try to send transaction from does not have enough funds. Required 1441000000000000 and got: 0
        //gasLimit:number = 	53000;// this good for contracts
        //gasLimit:number = 	21000;
        function SendTransaction(name, gasPrice, gasLimit) {
            this.name = name;
            this.gasPrice = gasPrice;
            this.gasLimit = gasLimit;
            this.apiKey = '';
            this.amountSent = 0;
            this.amountSpent = 0;
            this.balancesSent = [];
            this.transactions = [];
            this.init();
        }
        SendTransaction.prototype.destroy = function () {
            this.deferred = null;
            //TODO destroy
        };
        SendTransaction.prototype.init = function () {
            this.txlistUrl = 'https://api.etherscan.io/api?module=account&action=txlist&address={{address}}&tag=latest' + this.apiKey;
            this.txSendUrl = 'https://api.etherscan.io/api?module=proxy&action=eth_sendRawTransaction&hex={{hex}}';
        };
        SendTransaction.prototype.parse = function (result, address) {
            //console.log(address + ' has ' + result.result.length );
            return jaxx.ServiceMappers.mapEtherTransactions(result.result, address);
        };
        SendTransaction.prototype.buildTransaction = function (toAddress, amount, nonce) {
            var rawTx = {
                nonce: thirdparty.web3.toHex(nonce),
                gasPrice: thirdparty.web3.toHex(this.gasPrice),
                gasLimit: thirdparty.web3.toHex(this.gasLimit),
                to: toAddress,
                value: thirdparty.web3.toHex(amount),
            };
            //console.log(rawTx);
            return new thirdparty.ethereum.tx(rawTx);
        };
        SendTransaction.prototype.onSuccess = function () {
            var _this = this;
            var res = this.formResult();
            res.success = true;
            this.deferred.resolve(res);
            // console.warn(' balances ready', res);
            setTimeout(function () { return _this.destroy(); }, 100);
        };
        SendTransaction.prototype.formResult = function () {
            var result = new VOSendTransactionResult();
            result.id = this.initTransaction.id;
            result.timestampStart = this.timestampStart;
            result.timestampEnd = Date.now();
            result.amount = this.amount;
            result.amountSent = this.amountSent;
            result.balancesSent = this.balancesSent;
            result.balancesSmall = this.balancesSmall;
            result.transactions = this.transactions;
            return result;
        };
        SendTransaction.prototype.onError = function (err) {
            var res = this.formResult();
            res.error = err;
            this.deferred.reject(res);
        };
        SendTransaction.prototype.calculateToSend = function (balance) {
            var gasLimit = this.gasLimit;
            var gasPrice = this.gasPrice;
            var fee = gasLimit * gasPrice;
            // console.log(' fee: '+fee/1e15);
            var canSend = balance - fee;
            var need = this.amount - this.amountSent;
            var toSend;
            if (need < canSend) {
                toSend = need;
            }
            else {
                toSend = canSend;
            }
            var remain = balance - (toSend + fee);
            if (remain < fee)
                toSend += remain;
            return toSend;
        };
        SendTransaction.prototype.sendTransactionOnServer = function (hex, balance, toSend, nonce) {
            var _this = this;
            var url = this.txSendUrl.replace('{{hex}}', hex);
            var p = $.getJSON(url);
            p.then(function (res) {
                console.log(res);
                if (res.error) {
                    _this.sendNext();
                    return;
                    /* console.warn(res.error.message);
                     var errorMessage1:string = 'Try incrementing the nonce';
                     var errorMessage2:string = 'Transaction with the same hash was already imported';
                     if(res.error.message.indexOf(errorMessage1) !== -1){
                         if(nonce>100){
                             this.onError(' nonce more then 100 and message: ' + res.error.message);
 
                         }else{
 
                             nonce++;
                             console.warn( ' icreasing nonce on server demend ' + nonce );
 
                                 setTimeout(() =>{
                                     this.sendTransactionWithNonce(balance, this.toAddress, toSend, nonce);
                                 },3000);
 
 
                             // this.testTransaction(balance,nonce);
                           //  return;
                         }
 
                     }else this.onError(res);*/
                }
                else {
                    var transaction = new VOTransaction({
                        id: res.result,
                        from: balance.id,
                        to: _this.toAddress,
                        timestamp: Date.now(),
                        value: toSend,
                    });
                    _this.transactions.push(transaction);
                    var fee = _this.gasLimit * _this.gasPrice;
                    _this.amountSent += toSend;
                    _this.amountSent += toSend + fee;
                    if (_this.sendingChange) {
                        // balance.spent2 = toSend + balance.feeforempty;
                        // balance.delta2 = balance.balance - balance.spent2;
                        //balance.fee = balance.feeforempty;
                        //balance.deltatotal = balance.balance - balance.spent - balance.spent2;
                        // this.balanceChange.change = toSend;
                        _this.balancesSent.push(new VOBalance(_this.balanceChange));
                        _this.onSuccess();
                    }
                    else {
                        balance.delta = balance.balance - (toSend + fee);
                        // balance.spent = toSend + fee;
                        // balance.miningFee = fee;
                        var out = new VOBalance(balance);
                        // out.keyPair = null;
                        _this.balancesSent.push(out);
                        setTimeout(function () { return _this.sendNext(); }, 1500);
                    }
                }
                //console.log(res);
            }).fail(function (err) { return _this.onError(err); });
            return p;
        };
        SendTransaction.prototype.sendTransactionWithNonce = function (balance, toAddress, toSend, nonce) {
            console.log(' amount Sent ' + this.amountSent / 1e15 + ' need: ' + this.amount / 1e15);
            console.log(' sending ' + toSend / 1e15 + ' nonce: ' + nonce);
            console.log(' to ' + this.toAddress + ' from: ' + balance.id);
            var transaction = this.buildTransaction(toAddress, toSend, nonce);
            // transaction.sign(new Buffer(balance.keyPair.d.toBuffer(32),'hex'));
            var txid = ('0x' + transaction.hash().toString('hex'));
            var hex = '0x' + transaction.serialize().toString('hex');
            this.sendTransactionOnServer(hex, balance, toSend, nonce); //.done(res)
        };
        SendTransaction.prototype.prepareTransaction = function (balance, toSend) {
            var _this = this;
            balance.miningFee = this.gasLimit * this.gasPrice;
            if (!toSend)
                toSend = this.calculateToSend(balance.balance);
            this.getNonceForAddress(balance.id).done(function (nonce) {
                _this.sendTransactionWithNonce(balance, _this.toAddress, toSend, nonce);
            });
        };
        SendTransaction.prototype.getNonceForAddress = function (address) {
            var _this = this;
            var url = this.txlistUrl.replace('{{address}}', address);
            return $.getJSON(url).then(function (res) {
                var transactions = _this.parse(res, address);
                console.log(transactions);
                //  var nonces: number[] = _.map(transactions, o=>o.nonce);
                var nonce = transactions.filter(function (tr) { return tr.from == address; }).length;
                return nonce;
            });
        };
        SendTransaction.prototype.sendTosmall = function () {
        };
        SendTransaction.prototype.sendChange = function (balance) {
            var gasLimit = this.gasLimit;
            var gasPrice = this.gasPrice;
            var fee = gasLimit * gasPrice;
            var canSend;
            ; // = balance.balance - balance.spent;
            console.log('%c sending !!!!!! change  can send: ' + canSend / 1e15, 'color:red');
            if (canSend > (fee * 5)) {
                this.sendingChange = true;
                //fee = (fee/2);
                //  balance.feeforempty = fee ;
                // var toSend:number = canSend - balance.feeforempty;
                // var toSend:number = canSend - fee;
                var toSend = 5 * fee; ///just to recover account
                console.log('%c sending change ' + toSend / 1e15 + ' fee ' + fee / 1e15 + ' from ' + balance.id + ' to: ' + this.toAddress, 'color:red');
                this.prepareTransaction(balance, toSend);
            }
            else {
                console.log(' balance not sufficient founds ' + canSend / 1e15 + ' fee ' + fee / 1e15 + '  ' + balance.id);
                this.onSuccess();
            }
        };
        SendTransaction.prototype.sendNext = function () {
            if (this.amountSent >= this.amount) {
                if (this.balancesSmall.length) {
                    this.balanceChange = new VOBalance(this.balancesSmall[0]);
                    this.toAddress = this.balanceChange.id;
                    // this.balanceChange = this.balances[this.currentIndex];
                    var from = this.balances[this.currentIndex];
                    this.sendChange(from);
                }
                else
                    this.onSuccess();
                return;
            }
            this.currentIndex++;
            if (this.currentIndex >= this.balances.length) {
                var result = new VOSendTransactionResult();
                result.balancesSent = this.balancesSent;
                this.deferred.reject(result);
                return;
            }
            var balance = this.balances[this.currentIndex];
            this.prepareTransaction(balance);
        };
        SendTransaction.prototype.filterBalances = function () {
            var fee = this.gasLimit * this.gasPrice;
            var out = [];
            var balancesSmall = [];
            this.balances.forEach(function (balance) {
                if (balance.balance > fee)
                    out.push(balance);
                else
                    balancesSmall.push(balance);
            });
            this.balances = out;
            this.balancesSmall = balancesSmall;
        };
        SendTransaction.prototype.sendTransaction = function (transaction) {
            this.initTransaction = transaction;
            this.balances = _.sortBy(transaction.balancesReceive, 'balance');
            this.toAddress = transaction.toAddress;
            this.amount = transaction.amount;
            this.amountSent = 0;
            this.timestampStart = Date.now();
            this.addressChange = transaction.changeAddress;
            this.filterBalances();
            //this.gasLimit = transaction.gasLimit;
            // this.gasPrice =
            this.deferred = $.Deferred();
            this.currentIndex = -1;
            console.warn(transaction);
            this.sendNext();
            // this.downloadHextBalanceHistory();
            return this.deferred;
        };
        return SendTransaction;
    }());
    jaxx.SendTransaction = SendTransaction;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=send_transaction.js.map