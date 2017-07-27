///<reference path="../../com/models.ts"/>
///<reference path="../../com/Utils2.ts"/>
///<reference path="../service-mapper.ts"/>
var jaxx;
(function (jaxx) {
    var EthereumSendTransaction = (function () {
        function EthereumSendTransaction() {
            var _this = this;
            this.apiKey = '';
            this.addListeners();
            jaxx.Registry.sendTransaction$.on('ON_TRANSACTION_USER_CONFIRMED_1', function (evt, data) {
                console.log('ON_TRANSACTION_USER_CONFIRMED_1', data);
                _this.onUserTransactionConfirmed(data);
            });
            /*
      
             Registry.sendTransaction$.on('TRANS_SEND_BEFORE_1', (evt: JQueryEventObject, data: any)=> {
             console.log('EthereumSendTransaction', data);
             });
      
      
      
             jaxx.Registry.sendTransaction$.on('ON_SEND_PREPARE_1', (evt, data)=> {
             // console.log('ON_SEND_DATA_1',data);
             this.estimatedData = data;
             });
             */
            /*  {
             depositAddresses:depositAddresses,
             coinAmountSmallType:coinAmountSmallType,
             gasPrice:gasPrice,
             gasLimit:gasLimit,
             ethereumTXData:ethereumTXData
             })*/
        }
        EthereumSendTransaction.prototype.setTransactionEventEmiter = function (emitter$) {
            this.emitter$ = emitter$;
        };
        EthereumSendTransaction.prototype.addListeners = function () {
            var _this = this;
            jaxx.Registry.sendTransaction$.on('SEND_TRANSACTION_FALED_1', function (evt, transaction, result) {
                _this.emitter$.trigger(jaxx.Registry.TRANSACTION_FAILED, _this.sentTransactions);
                console.log('SEND_TRANSACTION_FALED_1', transaction, result);
            });
            jaxx.Registry.sendTransaction$.on('SEND_TRANSACTION_SUCCESS_1', function (evt, transaction, result) {
                console.log('SEND_TRANSACTION_SUCCESS_1', transaction, result);
                var m = transaction._mockTx;
                var tr = new VOTransaction({
                    id: m.hash,
                    address_index: m.addressIndex,
                    tax: m.gasUsed,
                    nonce: m.nonce,
                    from: m.to,
                    to: m.to,
                    value: m.valueDelta,
                    timestamp: m.timestamp
                });
                //this.emitter$.triggerHandler(jaxx.Registry.TRANSACTION_ASSEPTED,tr);
                console.log('TRANSACTION_ASSEPTED', tr, result);
            });
        };
        EthereumSendTransaction.prototype.removeListeners = function () {
            jaxx.Registry.sendTransaction$.off('SEND_TRANSACTION_FALED_1');
            jaxx.Registry.sendTransaction$.off('SEND_TRANSACTION_SUCCESS_1');
        };
        EthereumSendTransaction.prototype.onUserTransactionConfirmed = function (data) {
            console.log('onUserTransactionConfirmed   ', data);
            var ar = data.txArray;
            var out = [];
            var transactions = ar.map(function (item) {
                var m = item._mockTx;
                var tr = new VOTransaction({
                    id: m.hash,
                    address_index: m.addressIndex,
                    tax: m.gasUsed,
                    nonce: m.nonce,
                    from: m.to,
                    to: m.to,
                    value: m.valueDelta,
                    timestamp: m.timestamp,
                    receive_change: 'receive'
                });
                return tr;
            });
            this.sentTransactions = transactions;
            // var request:RequestSendTransactionEther = new RequestSendTransactionEther();
            ///  request.sendTransaction(data).done((res)=>{ console.log(res)}).fail((err)=>{ console.error(err)});
            /*
                    id: string;
                  address:string;
                  from: string;
                  to:string;
                  value:number
                  miningFee: string;
                  nonce: number;
                  confirmed:boolean;
                  timestamp:number;
                  block:number;
                  address_index:number;*/
            //receive_change:string;
        };
        return EthereumSendTransaction;
    }());
    jaxx.EthereumSendTransaction = EthereumSendTransaction;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=send_test.js.map