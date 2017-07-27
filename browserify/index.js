var Web3 = require('web3');
var web3 = new Web3();
var thirdparty = {
	bs58check: require('bs58check'),
    elliptic: require('elliptic'),
	  CryptoJS: require('crypto-js'),

    bip39: require('bip39'),
    bip69: require('bip69'),
    bitcoin: require('bitcoinjs-lib-zcash'),
    // zcash: require('bitcoinjs-lib-zcash'),

    createHmac: require('create-hmac'),
    ecurve: require('ecurve'),
    //  BigInteger: require('bigi'),
    Buffer: require('buffer'),
    Decimal: require('decimal.js'),
    qrImage: require('qr-image'),

    bigi: require('bigi'),
    Big: require('big.js'),
    ethereum: {
        tx: require('ethereumjs-tx'),
    },
    objectHash: require('object-hash'),
    // fastSha256: require('fast-sha256'),
    // serialijse: require('serialijse'),
    scrypt: require("js-scrypt"),
    iban: require('iban'),
    // pbkdf2: require('pbkdf2'),
    // scryptsy: require("scryptsy"),
    // strftime: require('strftime'),
    // uuid: require('uuid'),
    bnjs: require('bn.js'),
    web3: web3,
    zip: require('node-zip'),
    sanitizeHtml: require('sanitize-html'),

}

module.exports = thirdparty;
