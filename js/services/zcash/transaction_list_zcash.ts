/**
 * Created by fieldtempus on 2016-11-08.
 */
    //<reference path="../../com/models.ts"/>
    ///<reference path="../../com/Utils2.ts"/>
    ///<reference path="../service-mapper.ts"/>
    ///<reference path="../blockchain/transaction_list_blockchain.ts"/>


module jaxx {

    export class TransactionListZCash extends TransactionListBlockchain {

        constructor(coin_HD_index:number, generator:GeneratorBlockchain) {
            super(coin_HD_index, generator);
        }

        init():void {
            this._enableLog = false;

            this._batchSize = 10;
        }
    }
}