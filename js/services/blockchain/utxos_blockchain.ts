/**
 * Created by fieldtempus on 2016-11-15.
 */
    ///<reference path="../../com/models.ts"/>
    ///<reference path="../../com/Utils2.ts"/>
    ///<reference path="../service-mapper.ts"/>


module jaxx {
    export class UTXOsBlockchain implements IMobileRequest {
        _currentBatch:number = 0;
        _coinType:number = -1;
        _name:string = "Undefined Blockchain :: UTXOsBlockchain";

        deferred:JQueryDeferred<VORelayedTransactionListAndUTXOsForAddress[]>;

        _batchTxListArray:VORelayedTransactionListAndUTXOsForAddress[][];
        _resolveTxList:VORelayedTransactionListAndUTXOsForAddress[];

        //@note: transaction specific member variables that deal with things like request resolution, how many errors
        //are going to be retried, and whether this class is on hold.
        _request:JQueryXHR;
        _errors:number;
        _maxErrors:number = 20;
        _onHold:boolean;
        progress:number;

        _onDestroyed:Function;
        _destroyed:boolean;

        //@note: @here: for relay managed classes. eventually it will be applicabe to all of the blockchains.
        _relayManager:any = null;

        //@note: @here: for gathering _resolveTxList in a batch.
        _batchSize:number = 20;

        _enableLog:boolean = true;

        options:any ={
            delayRequest:300
        };



        log(params):void {
            if (this._enableLog) {
                var args = [].slice.call(arguments);

                args[0] = "[ UTXOs " + this._name + " ] :: " + args[0];

                if (this._coinType !== -1 && typeof(HDWalletPouch.getStaticCoinPouchImplementation(this._coinType)) !== 'undefined' && HDWalletPouch.getStaticCoinPouchImplementation(this._coinType) !== null) {
                    var debugColor = "background: black;"

                    var coinDisplayColor = HDWalletPouch.getStaticCoinPouchImplementation(this._coinType).uiComponents['coinDisplayColor'];

                    if (typeof(coinDisplayColor) !== 'undefined' && coinDisplayColor !== null) {
                        debugColor = "color: " + coinDisplayColor + "; font-weight: 300;";
                    }

                    var curLength = args.length;

                    args[0] = "%c" + args[0];
                    args[args.length] = debugColor;
                    //        args.length++;
                }

                console.log.apply(console, args);
            }
        }

        constructor(options) {
            if(options){
               for(let str in options) this.options[str] = options.str;
            }
            this.init();
        }

        initialize(name:string, coinType:number, relayManager:any):void {
            this._name = name;
            this._coinType = coinType;
            this._relayManager = relayManager;

            this.log('initialize :: error :: override this method');
        }

        init():void {
            console.log(' override this method ');
        }

        abort():IMobileRequest {
            return this;
        }

        wait() {
            this._onHold = true;
        }

        resume() {
            this._onHold = false;
            this.getNextUTXOsBatch();
        }

        reset():void {
            this._resolveTxList = [];
            this._errors = 0;
            this._currentBatch = -1;
        }

        destroy():void {
            if (this._request) {
                this._request.abort();
                this._request = null;
            }
            this.deferred = null;
            this._resolveTxList = null;
            this._destroyed = true;
            if (this._onDestroyed) {
                this._onDestroyed();
            }
        }

        onError(id:number, message:string):void {
            this._errors++;
            if (this._errors > this._maxErrors) {
                this.deferred.reject({
                    error: id,
                    message: message
                })
                this.destroy();
                return;
            }

            this._currentBatch--;

            this.log("error :: " + id + " :: message :: " + message);

            setTimeout(() => this.getNextUTXOsBatch(), 10000);
        }

        parseReferenceUTXO(address:string, referenceUTXOsData:any):VORelayedUTXOData[] {
            if (referenceUTXOsData && referenceUTXOsData.length) {
                var returnRelayedUTXOsData:VORelayedUTXOData[] = [];

                for (var i = 0; i < referenceUTXOsData.length; i++) {
                    var relayReferenceUTXOData:ReferenceRelaysUTXOData = new ReferenceRelaysUTXOData(referenceUTXOsData[i]);

                    var newUTXORelayedData:VORelayedUTXOData = new VORelayedUTXOData(null);

                    newUTXORelayedData.address = address;
                    newUTXORelayedData.utxoData = relayReferenceUTXOData;

                    returnRelayedUTXOsData.push(newUTXORelayedData);
                }

                return returnRelayedUTXOsData;
            }


            this.log("error :: parseReferenceUTXO :: address :: " + address + " :: referenceUTXOData :: " + JSON.stringify(referenceUTXOsData, null, 4));
            return [];
        }

        loadUTXOsData(txList:VORelayedTransactionListAndUTXOsForAddress[]):JQueryDeferred<VORelayedTransactionListAndUTXOsForAddress[]> {
            this._batchTxListArray = Utils.splitInCunks(txList, this._batchSize);
            this.reset();

            this.deferred = $.Deferred();

            this.getNextUTXOsBatch();
            return this.deferred;
        }

        getNextUTXOsBatch():void {
            this._currentBatch++;
            if (this._currentBatch >= this._batchTxListArray.length) {
                this.deferred.resolve(this._resolveTxList);

                setTimeout(() => {
                    this.destroy();
                }, 100);

                return;
            }

            var txListArray:VORelayedTransactionListAndUTXOsForAddress[] = this._batchTxListArray[this._currentBatch];

            this._resolveTxList = this._resolveTxList.concat(txListArray);

            //@note: @here: since the modification to the txList array is happening in this function, and operating on the objects themselves, a shallow clone is not necessary.
            var associativeArray:_.Dictionary<VORelayedTransactionListAndUTXOsForAddress> = {};

            var checkAddresses:string[] = [];

            for (var i = 0; i < txListArray.length; i++) {
                var curTxList = txListArray[i];

                associativeArray[curTxList.address] = curTxList;

                checkAddresses.push(curTxList.address);
            }

            let delayRequest:number = this.options.delayRequest;
            var self = this;

            if (checkAddresses.length > 0) {
                this.log("loading txListArray :: " + JSON.stringify(txListArray, null, 4));



                var delegateFunction = "getUTXO";

                var relayArguments = [checkAddresses, function(status, relayReturnData) {
                    if (relayReturnData) {
                        var relayReturnDataKeys = (relayReturnData) ? Object.keys(relayReturnData): [];

                        if (relayReturnDataKeys.length > 0) {
                            var allUTXOsFromRelay = [];

                            for (var i = 0; i < relayReturnDataKeys.length; i++) {
                                var curRelayReturnData = relayReturnData[relayReturnDataKeys[i]];

                                var utxosFromRelay:VORelayedUTXOData[] = self.parseReferenceUTXO(relayReturnDataKeys[i], curRelayReturnData);

                                for (var j = 0; j < utxosFromRelay.length; j++) {
                                    var curUTXO = utxosFromRelay[j];

                                    allUTXOsFromRelay.push(curUTXO);
                                }
                            }

                            if (allUTXOsFromRelay.length > 0) {
                                for (var i = 0; i < allUTXOsFromRelay.length; i++) {
                                    var curUTXO:VORelayedUTXOData = allUTXOsFromRelay[i];

                                    //@note: @here: @codereview: is this actually going to associate it properly to addresses that are not yet in the associative array list?!
                                    if (typeof(associativeArray[curUTXO.address]) !== 'undefined' && associativeArray[curUTXO.address] !== null) {
                                        associativeArray[curUTXO.address].utxoListDict[curUTXO.utxoData.txid + "_" + curUTXO.utxoData.index] = curUTXO.utxoData;

                                        //@note: @here: @codereview: I'm trying to treat this as a javascript-style object, but with typescript style code completion and the like.
                                        //  however, this means that I have to manually assign the length after everything has been assigned, which is sort of strange and does no
                                        //  good for intermediate calculations (of which I've made sure there are none at this point.)
                                        // associativeArray[curUTXO.address].utxoList.length = Object.keys(associativeArray[curUTXO.address].utxoList).length;
                                    }
                                }
                            }

                            self.log("getNextUTXOsBatch :: completed relay task getUTXO :: " + JSON.stringify(relayReturnData, null, 4) + " :: # of _resolveTxList :: " + self._resolveTxList.length);
                        }
                    }

                   setTimeout(self.getNextUTXOsBatch(),  delayRequest);
                }];

                var callbackIndex = 1;

                var isCallbackSuccessfulFunction = function(status) {
                    if (typeof(status) === 'string' && status === 'success') {
                        // console.log("callback successful");
                        return true;
                    } else {
                        self.log("callback unsuccessful");
                        var color = HDWalletPouch.getStaticCoinPouchImplementation(self._coinType).uiComponents.coinDisplayColor;
                        console.log("%c Relay Node Failure :: UTXOs.ts :: " + HDWalletPouch.getStaticCoinPouchImplementation(self._coinType).uiComponents.coinFullName + " Printing Arguments", 'color:' + color);
                        console.log(arguments)
                        return false;
                    }
                }

                var isCallbackPermanentFailureFunction = function(status) {
                    //@note: @here: @todo: @next: @relays:
                    self.log("UTXOs: Relay call failure...");
                    return false;
                    //                return false;
                }

                var actionTakenWhenTaskIsNotExecuted = function(returnArgs) {
                    self.log("UTXOs: failure with relay system...");
                    self.onError(self._currentBatch, "UTXOs: failure with node...");
                };

                //            this._workerManager._relayManager.startRelayTaskWithBestRelay(delegateFunction,


                //@note: @here: @todo: @next: @relays:

                this._relayManager.startRelayTaskWithBestRelay(delegateFunction, relayArguments, callbackIndex, isCallbackSuccessfulFunction, isCallbackPermanentFailureFunction, actionTakenWhenTaskIsNotExecuted);
            } else {
                this.log("no utxos in addresses.");

               // this.getNextUTXOsBatch();
                console.log(delayRequest);
                setTimeout(self.getNextUTXOsBatch(),  delayRequest);
            }
        }
    }
}