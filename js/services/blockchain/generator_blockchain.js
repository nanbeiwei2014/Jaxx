///<reference path="../../com/models.ts"/>
///<reference path="../../com/Utils2.ts"/>
///<reference path="../service-mapper.ts"/>
var jaxx;
(function (jaxx) {
    var GeneratorBlockchain = (function () {
        // addressesRceive={};
        // addresseChange = {};
        function GeneratorBlockchain(name, coinType, coin_HD_index) {
            this._coinType = -1;
            this._coin_HD_index = -1;
            this.name = name;
            this._coinType = coinType;
            this._coin_HD_index = coin_HD_index;
        }
        GeneratorBlockchain.prototype.generateAddressReceive = function (index) {
            // if(!this.addressesRceive[index]) {
            var coinNetwork = HDWalletPouch.getStaticCoinPouchImplementation(this._coinType).networkDefinitions.mainNet;
            return HDWalletPouch.getCoinAddress(this._coinType, jaxx.Utils2.getReceiveNode(this._coin_HD_index, index, coinNetwork));
            // }
            //return this.addressesRceive[index];
            // return Utils2.getBitcoinAddress(Utils2.getReceiveNode(this.coin_HD_index, index, coinNetwork));
        };
        GeneratorBlockchain.prototype.generateAddressChange = function (index) {
            // if(!this.addresseChange[index]){
            var coinNetwork = HDWalletPouch.getStaticCoinPouchImplementation(this._coinType).networkDefinitions.mainNet;
            return HDWalletPouch.getCoinAddress(this._coinType, jaxx.Utils2.getChangeNode(this._coin_HD_index, index, coinNetwork));
            // }
            // return this.addresseChange[index];
            // return Utils2.getBitcoinAddress(Utils2.getChangeNode(this.coin_HD_index, index, coinNetwork));
        };
        GeneratorBlockchain.prototype.generateAddress = function (index, receive_change) {
            // console.error('hello generateAddress');
            if (receive_change === "receive") {
                return this.generateAddressReceive(index);
            }
            else {
                return this.generateAddressChange(index);
            }
        };
        GeneratorBlockchain.prototype.generateKeyPairReceive = function (index) {
            var coinNetwork = HDWalletPouch.getStaticCoinPouchImplementation(this._coinType).networkDefinitions.mainNet;
            return jaxx.Utils2.getNodeKeyPair(jaxx.Utils2.getReceiveNode(this._coin_HD_index, index, coinNetwork));
        };
        GeneratorBlockchain.prototype.generateKeyPairChange = function (index) {
            var coinNetwork = HDWalletPouch.getStaticCoinPouchImplementation(this._coinType).networkDefinitions.mainNet;
            return jaxx.Utils2.getNodeKeyPair(jaxx.Utils2.getChangeNode(this._coin_HD_index, index, coinNetwork));
        };
        return GeneratorBlockchain;
    }());
    jaxx.GeneratorBlockchain = GeneratorBlockchain;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=generator_blockchain.js.map