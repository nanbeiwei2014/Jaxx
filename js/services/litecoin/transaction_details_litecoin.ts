/**
 * Created by fieldtempus on 2016-11-08.
 */
    //<reference path="../../com/models.ts"/>
    ///<reference path="../../com/Utils2.ts"/>
    ///<reference path="../service-mapper.ts"/>
    ///<reference path="../bitcoin/transaction_details_bitcoin.ts"/>


module jaxx {

    export class TransactionDetailsLitecoin extends TransactionDetailsBitcoin {

        constructor() {
            super();
        }

        init():void {
            this._enableLog = false;

            this._batchSize = 10;
        }
    }
}