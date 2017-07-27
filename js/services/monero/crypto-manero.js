var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/**
 * Created by Vlad on 2016-12-09.
 */
var jaxx;
(function (jaxx) {
    var CryptoManero = (function (_super) {
        __extends(CryptoManero, _super);
        function CryptoManero(coinType, coin_HD_index, service) {
            _super.call(this, coinType, coin_HD_index, service);
            this.coinType = coinType;
            this.coin_HD_index = coin_HD_index;
            this.service = service;
        }
        return CryptoManero;
    }(jaxx.CryptoEthereum));
    jaxx.CryptoManero = CryptoManero;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=crypto-manero.js.map