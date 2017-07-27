/**
 * Created by Vlad on 10/9/2016.
 */
///<reference path="../com/models.ts"/>
///<reference path="../com/Utils.ts"/>
var jaxx;
(function (jaxx) {
    var ServiceMappers = (function () {
        function ServiceMappers() {
        }
        ServiceMappers.parseTransactionsETHjaxxio = function (respond, address) {
            return respond.map(function (item) {
                if (item.timeStamp)
                    item.timestamp = item.timeStamp;
                var date = new Date(+item.timestamp * 1000);
                return new VOTransaction({
                    id: item.hash,
                    address: address,
                    from: item.from,
                    to: item.to,
                    value: (address === item.from) ? -Number(item.value) : Number(item.value),
                    // tax:+item.gasUsed,
                    miningFee: +item.gasUsed,
                    nonce: +item.nonce,
                    confirmations: +item.confirmations,
                    timestamp: +item.timestamp,
                    date: date.toLocaleDateString() + ' ' + date.toLocaleTimeString(),
                    block: +item.blockNumber,
                });
            });
        };
        ServiceMappers.parseBalanceETHjaxxio = function (respond) {
            var stamp = Math.round(Date.now() / 1000);
            // console.log(respond);
            var out = [];
            for (var str in respond) {
                out.push(new VOBalance({
                    id: str,
                    balance: +respond[str],
                    timestamp: stamp
                }));
            }
            return out;
        };
        ServiceMappers.parseUTXOsBlocker = function (response) {
            if (!Array.isArray(response.data))
                response.data = [response.data];
            var data = response.data;
            var out = [];
            data.forEach(function (addressutxos) {
                var address = addressutxos.address;
                var unspent = addressutxos.unspent;
                out = out.concat(unspent.map(function (item) {
                    return new VOutxo({
                        address: address,
                        amountBtc: item.amount,
                        amount: (+item.amount * 1e8),
                        txid: item.tx,
                        vout: item.n,
                        confirmations: item.confirmations
                    });
                }));
            });
            return out;
        };
        ServiceMappers.parseUTXOsCoinfabrikLTC = function (data) {
            var out = [];
            var _loop_1 = function (str) {
                var items = data[str];
                items.forEach(function (item) {
                    out.push(new VOutxo({
                        address: str,
                        amountBtc: item.amount,
                        amount: +item.litoshis,
                        txid: item.txhash,
                        vout: item.vout,
                        confirmations: (item.confirmations || -1)
                    }));
                });
            };
            for (var str in data) {
                _loop_1(str);
            }
            return out;
        };
        ServiceMappers.parseUTXOsCoinfabrikBTC = function (respond) {
            var out = [];
            return respond.map(function (item) {
                return new VOutxo({
                    address: item.address,
                    amountBtc: item.amount + '',
                    amount: +item.satoshis,
                    txid: item.txid,
                    vout: item.vout,
                    confirmations: item.confirmations
                });
            });
        };
        ServiceMappers.parseUTXOsCoinfabrikZCash = function (data) {
            var out = [];
            var _loop_2 = function (str) {
                var items = data[str];
                items.forEach(function (item) {
                    out.push(new VOutxo({
                        address: str,
                        amountBtc: item.amount,
                        amount: +item.zatoshis,
                        txid: item.txhash,
                        vout: item.vout,
                        confirmations: (item.confirmations || -1)
                    }));
                });
            };
            for (var str in data) {
                _loop_2(str);
            }
            return out;
        };
        ServiceMappers.mapBalancesCoinfabric = function (response) {
            var out = [];
            for (var address in response) {
                var item = response[address];
                var ac = +item.confirmed.zatoshis;
                // console.log(address + ' item.confirmed  ', item.confirmed);
                // console.log(address + ' item.unconfirmed  ', item.unconfirmed);
                var uc = +item.unconfirmed.zatoshis;
                if (uc < 0)
                    uc = 0;
                out.push(new VOBalance({
                    id: address,
                    balance: ac + uc
                }));
            }
            return out;
        };
        ServiceMappers.mapUTXOsCoinfabrik = function (data) {
            var out = [];
            var _loop_3 = function (str) {
                var items = data[str];
                items.forEach(function (item) {
                    out.push(new VOutxo({
                        address: str,
                        amountBtc: item.amount,
                        amount: +item.zatoshis,
                        txid: item.txhash,
                        vout: item.vout,
                        confirmations: (item.confirmations || -1)
                    }));
                });
            };
            for (var str in data) {
                _loop_3(str);
            }
            return out;
        };
        ServiceMappers.mapEtherTransactions = function (ar, address) {
            return ar.map(function (item) {
                if (item.timeStamp)
                    item.timestamp = item.timeStamp;
                var date = new Date(+item.timestamp * 1000);
                return new VOTransaction({
                    id: item.hash,
                    address: address,
                    from: item.from,
                    to: item.to,
                    value: (address === item.from) ? -Number(item.value) : Number(item.value),
                    // tax:+item.gasUsed,
                    miningFee: +item.gasUsed,
                    gasUsed: item.gasUsed,
                    gasPrice: item.gasPrice,
                    //nonce:+item.nonce,
                    confirmations: +item.confirmations,
                    timestamp: +item.timestamp,
                    date: date.toLocaleDateString() + ' ' + date.toLocaleTimeString(),
                    block: +item.blockNumber
                    // address_index:address_index,
                    // receive_change:receive_change
                });
            });
        };
        ServiceMappers.mapBlockrTransactions = function (ar, address) {
            return ar.map(function (item) {
                return new VOTransaction({
                    id: item.tx,
                    address: address,
                    // from:item.from,
                    // to:item.to,
                    value: +item.amount,
                    // miningFee:+item.gasUsed,
                    // nonce:+item.nonce,
                    confirmed: +item.confirmations,
                    timestamp: +item.timeStamp,
                });
            });
        };
        ServiceMappers.mapTransactionsUnspent = function (ar, address) {
            return ar.map(function (item) {
                var now = Date.now();
                return new VOTransactionUnspent({
                    id: item.txid,
                    txid: item.txid,
                    address: address,
                    amount: Math.round(Number(+item.amount) * 1e8),
                    amountBtc: item.amount,
                    nonce: +item.nonce,
                    index: +item.index,
                    outs: item.tempRemote ? +item.tempRemote.vout : +item.nonce,
                    confirmations: +item.confirmations,
                    timestamp: item.timeStamp || now,
                    height: item.tempRemote ? +item.tempRemote.height : 0,
                    //scriptPubKey:item.tempRemote.scriptPubKey || item.tempRemote.script,
                    tempRemote: item.tempRemote
                    // address_index:address_index,
                    // receive_change:receive_change
                });
            });
        };
        return ServiceMappers;
    }());
    jaxx.ServiceMappers = ServiceMappers;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=service-mapper.js.map