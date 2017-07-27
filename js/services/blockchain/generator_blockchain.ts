///<reference path="../../com/models.ts"/>
///<reference path="../../com/Utils2.ts"/>
///<reference path="../service-mapper.ts"/>

module jaxx {
    export class GeneratorBlockchain {
        _coinType:number = -1;
        _coin_HD_index:number = -1;
        name:string;
        masterNode:any;

       // addressesRceive={};
       // addresseChange = {};
        constructor(name:string, coinType:number, coin_HD_index:number) {
            this.name = name;
            this._coinType = coinType;
            this._coin_HD_index = coin_HD_index;


        }



        generateAddressReceive(index:number):string {
           // if(!this.addressesRceive[index]) {
                let coinNetwork = HDWalletPouch.getStaticCoinPouchImplementation(this._coinType).networkDefinitions.mainNet;

                return  HDWalletPouch.getCoinAddress(this._coinType, Utils2.getReceiveNode(this._coin_HD_index, index, coinNetwork));
           // }
            //return this.addressesRceive[index];
            // return Utils2.getBitcoinAddress(Utils2.getReceiveNode(this.coin_HD_index, index, coinNetwork));
        }

        generateAddressChange(index:number):string {
           // if(!this.addresseChange[index]){
                let coinNetwork = HDWalletPouch.getStaticCoinPouchImplementation(this._coinType).networkDefinitions.mainNet;
               return  HDWalletPouch.getCoinAddress(this._coinType, Utils2.getChangeNode(this._coin_HD_index, index, coinNetwork));
           // }
           // return this.addresseChange[index];
            // return Utils2.getBitcoinAddress(Utils2.getChangeNode(this.coin_HD_index, index, coinNetwork));
        }

        generateAddress(index:number, receive_change:string):string {
           // console.error('hello generateAddress');
            if (receive_change === "receive") {
                return this.generateAddressReceive(index);
            } else {
                return this.generateAddressChange(index);
            }
        }

        generateKeyPairReceive(index:number):any {
            let coinNetwork = HDWalletPouch.getStaticCoinPouchImplementation(this._coinType).networkDefinitions.mainNet;

            return Utils2.getNodeKeyPair(Utils2.getReceiveNode(this._coin_HD_index, index, coinNetwork));
        }

        generateKeyPairChange(index:number):any {
            var coinNetwork = HDWalletPouch.getStaticCoinPouchImplementation(this._coinType).networkDefinitions.mainNet;

            return Utils2.getNodeKeyPair(Utils2.getChangeNode(this._coin_HD_index, index, coinNetwork));
        }
    }
}