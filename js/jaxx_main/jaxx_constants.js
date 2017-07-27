/**
 * Created by Daniel on 2017-03-01.
 */
//This condition is for ios version because ios webview does not support console.warn
if(typeof console.warn === 'undefined') {
    console.warn = function () {
        console.log(arguments);
    }
}
var exports = {};
var IS_RELEASE_VERSION = true;
var COIN_BITCOIN = 0;
var COIN_ETHEREUM = 1;
var COIN_THEDAO_ETHEREUM = 2;
var COIN_DASH = 3;
var COIN_ETHEREUM_CLASSIC = 4;
var COIN_AUGUR_ETHEREUM = 5;
var COIN_LITECOIN = 6;
var COIN_LISK = 7;
var COIN_ZCASH = 8;
var COIN_TESTNET_ROOTSTOCK = 9;
//@note@:@here:@zcash
//var COIN_NUMCOINTYPES = 9;
var COIN_DOGE = 10;
var COIN_ICONOMI_ETHEREUM = 11;
var COIN_GOLEM_ETHEREUM = 12;
var COIN_GNOSIS_ETHEREUM = 13;
var COIN_SINGULARDTV_ETHEREUM = 14;
var COIN_DIGIX_ETHEREUM = 15;
var COIN_BLOCKCHAINCAPITAL_ETHEREUM = 16;
var COIN_CIVIC_ETHEREUM = 17;
var COIN_NUMCOINTYPES = 18;
var COIN_UNITLARGE = 0;
var COIN_UNITSMALL = 1;
var COIN_NUMUNITTYPES = 2;
//# sourceMappingURL=jaxx_constants.js.map