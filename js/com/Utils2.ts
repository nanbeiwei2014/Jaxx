/**
 * Created by Vlad on 10/11/2016.
 */
    ///<reference path="models.ts"/>

    //@note: @here: @todo: @refactor refactor this to have wallet coming from g_JaxxApp.
declare  var wallet:any;
declare var HDWalletMain:any;

module jaxx {
    declare var Buffer;
    declare var thirdparty;

    export class Utils2 {

        static signEther(etehr_trans:any, privateKey:string):string {

            var buff = new Buffer(privateKey, 'hex');
            var tx = new thirdparty.ethereum.tx(etehr_trans);
            // var buf = new Buffer(this._pouchManager.getPrivateKey(fromNodeInternal, fromNodeIndex).d.toBuffer(32), 'hex');
            tx.sign(buff);

            return tx.serialize();
        }


        //var pubKey = node.keyPair.getPublicKeyBuffer();
        static _masterNodeCache:_.Dictionary<{network:any, masterHDNode:any}> = {};
        static seedHex:string;
        static _mnemonic:string;
        static set mnemonic(str:string) {
           // console.error(str);
            Utils2._mnemonic = str
        };
        static get mnemonic():string {
            return Utils2._mnemonic;
        };


        static getWallet():any{

          //  return wallet || jaxx.Registry.tempWallet;
            if (typeof(wallet) !== 'undefined' && wallet !== null){
                return wallet;
            } else {

                return jaxx.Registry.tempWallet;
            }
        }
        static setMnemonic(mnemonic:string):void {
           /// console.error(mnemonic);
           // if (!Utils2.mnemonic)
          Utils2.mnemonic = mnemonic;
          Utils2._masterNodeCache = {};
        }

        static setSeedHex(seedHex:any):void {
            Utils2.seedHex = seedHex;
        }

        static getSeedHex():string {
            //console.log(wallet);

            return jaxx.Utils2.getWallet().getPouchFold(COIN_BITCOIN)._seedHex;

             //if (!Utils2.seedHex) Utils2.seedHex = thirdparty.bip39.mnemonicToSeedHex(Utils2.mnemonic);
            // return Utils2.seedHex;
        }

        static setHex(mnemonicHex:string):void {
            Utils2.seedHex = mnemonicHex;

        }

        static getMasterNode(network:any):any {
            var networkKey:string = "null";

            if (typeof(network) === 'undefined' || network === null) {
                network = null;
            } else {
                networkKey = network.messagePrefix.toString().hashCode().toString();
            }

            var masterNode:any = null;

            if (typeof(Utils2._masterNodeCache[networkKey]) !== 'undefined' && Utils2._masterNodeCache[networkKey] !== null) {
            } else {
                Utils2._masterNodeCache[networkKey] = {network:null, masterHDNode:null};
                Utils2._masterNodeCache[networkKey].network = network;
                Utils2._masterNodeCache[networkKey].masterHDNode = thirdparty.bitcoin.HDNode.fromSeedHex(Utils2.getSeedHex(), network);
            }

            masterNode = Utils2._masterNodeCache[networkKey].masterHDNode;

            return masterNode;
        }

        /*
         BIP0044 specifies the structure as consisting of five predefined tree levels:
         m / purpose' / coin_type' / account' / change / address_index
         */

        static getReceiveNode(coinHDIndex:number, address_index:number, network:any):any {
            var account:number = 0; // most of the time 0
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

        }

        static getChangeNode(coinHDIndex:number, address_index:number, network?:any):any {
            // var rootNode = thirdparty.bitcoin.HDNode.fromSeedHex(Utils2.seedHex, network);
            var account:number = 0; // most of the time 0
            return Utils2.getMasterNode(network).deriveHardened(44).deriveHardened(coinHDIndex).deriveHardened(account).derive(1).derive(address_index);
        }

        static getNodeKeyPair(node:any):any {
            return node.keyPair;
        }

        static getNodePrivateKey(node:any):string {
            return node.keyPair.d.toBuffer(32).toString('hex');
        }

        static getPrivateKey(keyPair:any):string {
            return keyPair.d.toBuffer(32).toString('hex');
        }


        static getKeyPairBuffer(keyPair:any):string {
            return new Buffer(keyPair.d.toBuffer(32), 'hex');
        }


        static getEtherAddress(node:any):string {

            var ethKeyPair = node.keyPair;      //        console.log("[ethereum] keyPair :: " + ethKeyPair.d + " :: " + ethKeyPair.__Q);
            var prevCompressed = ethKeyPair.compressed;
            ethKeyPair.compressed = false;
            var pubKey = ethKeyPair.getPublicKeyBuffer();
            //  console.log('ethKeyPairPublicKey     ',ethKeyPairPublicKey);
            var pubKeyHexEth = pubKey.toString('hex').slice(2);
            //  console.log('pubKeyHexEth    ',pubKeyHexEth);
            var pubKeyWordArrayEth = thirdparty.CryptoJS.enc.Hex.parse(pubKeyHexEth);
            var hashEth = thirdparty.CryptoJS.SHA3(pubKeyWordArrayEth, {outputLength: 256});
            var address = hashEth.toString(thirdparty.CryptoJS.enc.Hex).slice(24);
            ethKeyPair.compressed = prevCompressed;
            return "0x" + address;
        }

        static getBitcoinAddress(node:any):string {
            var pubKey = node.keyPair.getPublicKeyBuffer();
            var pubKeyHash = thirdparty.bitcoin.crypto.hash160(pubKey);

            var payload = new Buffer(21);
            //    console.log("bitcoin :: pubkeyhash :: " + node.keyPair.network.pubKeyHash);
            payload.writeUInt8(node.keyPair.network.pubKeyHash, 0);
            pubKeyHash.copy(payload, 1);

            var address = thirdparty.bs58check.encode(payload);

            //        console.log("[bitcoin] address :: " + address);
            return address;
        }


        //////////////////////////////////////

        static getOldChangeNode(mnemonic:string, network:string, cointype:number, address_index:number):any {


            var seedHex = thirdparty.bip39.mnemonicToSeedHex(mnemonic);

            var rootNodeBase58 = thirdparty.bitcoin.HDNode.fromSeedHex(seedHex, network).toBase58();

            var rootNode = thirdparty.bitcoin.HDNode.fromBase58(rootNodeBase58, network);
            var accountNodeBase58 = rootNode.derive(44).derive(cointype).derive(0).toBase58();


            var accountNode = thirdparty.bitcoin.HDNode.fromBase58(accountNodeBase58, network);

            var changeNodeBase58 = accountNode.derive(1).toBase58();

            var changeNode = thirdparty.bitcoin.HDNode.fromBase58(changeNodeBase58, network);
            return changeNode;
        }

    }
}