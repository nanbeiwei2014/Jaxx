/**
 * Created by fieldtempus on 2016-11-15.
 */
    //<reference path="../../com/models.ts"/>
    ///<reference path="../../com/Utils2.ts"/>
    ///<reference path="../service-mapper.ts"/>
    ///<reference path="../blockchain/utxos_blockchain.ts"/>

module jaxx {

    export class UTXOsDoge extends UTXOsBlockchain {

        constructor() {
            super(null);
        }

        init():void {
            this._enableLog = false;

            this._batchSize = 10;
        }
    }
}