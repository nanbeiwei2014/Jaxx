/**
 * Created by Vlad on 10/19/2016.
 */
///<reference path="../../com/models.ts"/>
///<reference path="../../com/Utils2.ts"/>
///<reference path="../service-mapper.ts"/>
var jaxx;
(function (jaxx) {
    var BitcoinSendTransaction = (function () {
        function BitcoinSendTransaction() {
            jaxx.Registry.sendTransaction$.on('TRANS_SEND_BEFORE_0', function (evt, data) {
                console.log('BitcoinSendTransaction  ', data);
            });
        }
        BitcoinSendTransaction.prototype.setTransactionEventEmiter = function (emitter$) {
            this.emitter$ = emitter$;
        };
        return BitcoinSendTransaction;
    }());
    jaxx.BitcoinSendTransaction = BitcoinSendTransaction;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=bitcoin-send-trans.js.map