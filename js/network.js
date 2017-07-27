var TESTNET = false;

var NETWORK = null;
var STATIC_RELAY_URL = 'https://btc.blockr.io';
if (TESTNET) {
    NETWORK = thirdparty.bitcoin.networks.testnet;
    STATIC_RELAY_URL = 'https://tbtc.blockr.io';
}