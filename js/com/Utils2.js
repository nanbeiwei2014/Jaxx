/**
 * Created by Vlad on 10/11/2016.
 */
///<reference path="models.ts"/>
var jaxx;
(function (jaxx) {
    var Utils2 = (function () {
        function Utils2() {
        }
        Utils2.signEther = function (etehr_trans, privateKey) {
            var buff = new Buffer(privateKey, 'hex');
            var tx = new thirdparty.ethereum.tx(etehr_trans);
            // var buf = new Buffer(this._pouchManager.getPrivateKey(fromNodeInternal, fromNodeIndex).d.toBuffer(32), 'hex');
            tx.sign(buff);
            return tx.serialize();
        };
        Object.defineProperty(Utils2, "mnemonic", {
            get: function () {
                return Utils2._mnemonic;
            },
            set: function (str) {
                // console.error(str);
                Utils2._mnemonic = str;
            },
            enumerable: true,
            configurable: true
        });
        ;
        ;
        Utils2.getWallet = function () {
            //  return wallet || jaxx.Registry.tempWallet;
            if (typeof (wallet) !== 'undefined' && wallet !== null) {
                return wallet;
            }
            else {
                return jaxx.Registry.tempWallet;
            }
        };
        Utils2.setMnemonic = function (mnemonic) {
            /// console.error(mnemonic);
            // if (!Utils2.mnemonic)
            Utils2.mnemonic = mnemonic;
            Utils2._masterNodeCache = {};
        };
        Utils2.setSeedHex = function (seedHex) {
            Utils2.seedHex = seedHex;
        };
        Utils2.getSeedHex = function () {
            //console.log(wallet);
            return jaxx.Utils2.getWallet().getPouchFold(COIN_BITCOIN)._seedHex;
            //if (!Utils2.seedHex) Utils2.seedHex = thirdparty.bip39.mnemonicToSeedHex(Utils2.mnemonic);
            // return Utils2.seedHex;
        };
        Utils2.setHex = function (mnemonicHex) {
            Utils2.seedHex = mnemonicHex;
        };
        Utils2.getMasterNode = function (network) {
            var networkKey = "null";
            if (typeof (network) === 'undefined' || network === null) {
                network = null;
            }
            else {
                networkKey = network.messagePrefix.toString().hashCode().toString();
            }
            var masterNode = null;
            if (typeof (Utils2._masterNodeCache[networkKey]) !== 'undefined' && Utils2._masterNodeCache[networkKey] !== null) {
            }
            else {
                Utils2._masterNodeCache[networkKey] = { network: null, masterHDNode: null };
                Utils2._masterNodeCache[networkKey].network = network;
                Utils2._masterNodeCache[networkKey].masterHDNode = thirdparty.bitcoin.HDNode.fromSeedHex(Utils2.getSeedHex(), network);
            }
            masterNode = Utils2._masterNodeCache[networkKey].masterHDNode;
            return masterNode;
        };
        /*
         BIP0044 specifies the structure as consisting of five predefined tree levels:
         m / purpose' / coin_type' / account' / change / address_index
         */
        Utils2.getReceiveNode = function (coinHDIndex, address_index, network) {
            var account = 0; // most of the time 0
            // var rootNode = thirdparty.bitcoin.HDNode.fromSeedHex(Utils2.seedHex, network);
            /*  var networkDash = {
                  messagePrefix: '\x19DarkCoin Signed Message:\n',
                  bip32: {
                      public: 0x02fe52cc,
                      private: 0x02fe52f8
                  },
                  pubKeyHash: 0x4c,
                  scriptHash: 0x10,
                  wif: 0xcc,
                  dustThreshold: 5460
              }*/
            // thirdparty.bitcoin.HDNode.fromSeedHex(Utils2.seedHex, networkDash).deriveHardened(44).deriveHardened(coinHDIndex).deriveHardened(account).derive(0).derive(address_index);
            return Utils2.getMasterNode(network).deriveHardened(44).deriveHardened(coinHDIndex).deriveHardened(account).derive(0).derive(address_index);
        };
        Utils2.getChangeNode = function (coinHDIndex, address_index, network) {
            // var rootNode = thirdparty.bitcoin.HDNode.fromSeedHex(Utils2.seedHex, network);
            var account = 0; // most of the time 0
            return Utils2.getMasterNode(network).deriveHardened(44).deriveHardened(coinHDIndex).deriveHardened(account).derive(1).derive(address_index);
        };
        Utils2.getNodeKeyPair = function (node) {
            return node.keyPair;
        };
        Utils2.getNodePrivateKey = function (node) {
            return node.keyPair.d.toBuffer(32).toString('hex');
        };
        Utils2.getPrivateKey = function (keyPair) {
            return keyPair.d.toBuffer(32).toString('hex');
        };
        Utils2.getKeyPairBuffer = function (keyPair) {
            return new Buffer(keyPair.d.toBuffer(32), 'hex');
        };
        Utils2.getEtherAddress = function (node) {
            var ethKeyPair = node.keyPair; //        console.log("[ethereum] keyPair :: " + ethKeyPair.d + " :: " + ethKeyPair.__Q);
            var prevCompressed = ethKeyPair.compressed;
            ethKeyPair.compressed = false;
            var pubKey = ethKeyPair.getPublicKeyBuffer();
            //  console.log('ethKeyPairPublicKey     ',ethKeyPairPublicKey);
            var pubKeyHexEth = pubKey.toString('hex').slice(2);
            //  console.log('pubKeyHexEth    ',pubKeyHexEth);
            var pubKeyWordArrayEth = thirdparty.CryptoJS.enc.Hex.parse(pubKeyHexEth);
            var hashEth = thirdparty.CryptoJS.SHA3(pubKeyWordArrayEth, { outputLength: 256 });
            var address = hashEth.toString(thirdparty.CryptoJS.enc.Hex).slice(24);
            ethKeyPair.compressed = prevCompressed;
            return "0x" + address;
        };
        Utils2.getBitcoinAddress = function (node) {
            var pubKey = node.keyPair.getPublicKeyBuffer();
            var pubKeyHash = thirdparty.bitcoin.crypto.hash160(pubKey);
            var payload = new Buffer(21);
            //    console.log("bitcoin :: pubkeyhash :: " + node.keyPair.network.pubKeyHash);
            payload.writeUInt8(node.keyPair.network.pubKeyHash, 0);
            pubKeyHash.copy(payload, 1);
            var address = thirdparty.bs58check.encode(payload);
            //        console.log("[bitcoin] address :: " + address);
            return address;
        };
        //////////////////////////////////////
        Utils2.getOldChangeNode = function (mnemonic, network, cointype, address_index) {
            var seedHex = thirdparty.bip39.mnemonicToSeedHex(mnemonic);
            var rootNodeBase58 = thirdparty.bitcoin.HDNode.fromSeedHex(seedHex, network).toBase58();
            var rootNode = thirdparty.bitcoin.HDNode.fromBase58(rootNodeBase58, network);
            var accountNodeBase58 = rootNode.derive(44).derive(cointype).derive(0).toBase58();
            var accountNode = thirdparty.bitcoin.HDNode.fromBase58(accountNodeBase58, network);
            var changeNodeBase58 = accountNode.derive(1).toBase58();
            var changeNode = thirdparty.bitcoin.HDNode.fromBase58(changeNodeBase58, network);
            return changeNode;
        };
        return Utils2;
    }());
    //var pubKey = node.keyPair.getPublicKeyBuffer();
    Utils2._masterNodeCache = {};
    jaxx.Utils2 = Utils2;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=Utils2.js.map