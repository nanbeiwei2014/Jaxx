/**
 * Created by Daniel on 2017-01-11.
 * edit by Vlad 2017-04-27
 */
var jaxx;
(function (jaxx) {
    var EthereumToken = (function () {
        function EthereumToken(config) {
            this.config = config;
            this.urlBalance = 'https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress={{contractAddress}}&address={{address}}&tag=latest&apikey=WGWHHAU4F2Y58UW5FQWTUJWSXBNHU7WBSX';
            //  console.log(config);
            this.urlBalance = this.urlBalance.replace('{{contractAddress}}', config.contractAddress);
            this.name = config.name;
            // this.urlBalance = config.urlBalance;
            this.init();
        }
        EthereumToken.prototype.init = function () {
        };
        EthereumToken.prototype.sendTransactinsStart = function (transaction) {
            var ctr = new jaxx.SendTransactionStartEther();
            return ctr.sendTransaction(transaction);
        };
        EthereumToken.prototype.downloadBalances = function (addresses) {
            var d = $.Deferred();
            var address = addresses[0];
            if (!address) {
                d.reject({
                    error: 'downloadBalances',
                    addresses: addresses.toString()
                });
                return d;
            }
            var url = this.urlBalance.replace('{{address}}', address);
            var name = this.name;
            $.get(url).done(function (res) {
                if (isNaN(res.result)) {
                    d.reject(res.result);
                    return;
                }
                if (name === "DigixEthereum") {
                    res.result = +res.result * 1000000000;
                }
                else if (name === "CivicEthereum") {
                    res.result = +res.result * 10000000000;
                }
                else if (name == "BlockchainCapitalEthereum" && !!thirdparty) {
                    var toBig = new thirdparty.Big('1000000000000000000');
                    res.result = toBig.mul(res.result);
                    //res.result = +res.result;
                }
                d.resolve([new VOBalance({
                        id: address,
                        balance: +res.result
                    })]);
            });
            return d;
        };
        EthereumToken.prototype.checkBalanceForAddress = function (address) {
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
        /* getMiningPrice(): number {
             return this.gasPrice;
         }
 
         getMiningFees(): number {
             return this.gasPrice * this.gasLimit;
         }
 
         getMiningFeeLimit(): number {
             return this.gasLimit;
         }*/
        EthereumToken.prototype.initialize = function () { };
        EthereumToken.prototype.downloadTransactionsUnspent = function (addresses) { return null; };
        EthereumToken.prototype.getMiningFees = function () { return 0; };
        ;
        EthereumToken.prototype.restoreHistory2 = function (receive_change, startIndex) {
            return null;
        };
        EthereumToken.prototype.restoreHistory = function (receive_change) {
            return null;
        };
        EthereumToken.prototype.downloadTransactionsForAddress = function (address) { return null; };
        EthereumToken.prototype.downloadTransactions = function (addresses) { return null; };
        EthereumToken.prototype.checkAddressesForTranasactions = function (addresses) { return null; };
        EthereumToken.prototype.downloadTransactionsDetails = function (txsIds) { return null; };
        return EthereumToken;
    }());
    jaxx.EthereumToken = EthereumToken;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=ethereum_token.js.map