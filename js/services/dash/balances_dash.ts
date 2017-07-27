/**
 * Created by fieldtempus on 2016-11-07.
 */


    ///<reference path="../../com/models.ts"/>
    ///<reference path="../../com/Utils2.ts"/>
    ///<reference path="../service-mapper.ts"/>
    ///<reference path="../blockchain/balances_blockchain.ts"/>

var RelayManager;

module jaxx {
    export class BalancesDash extends BalancesBlockchain {

        constructor() {
            super();
        }

        init():void {
            this._enableLog = false;

            this._batchSize = 20;
        }
    }
}