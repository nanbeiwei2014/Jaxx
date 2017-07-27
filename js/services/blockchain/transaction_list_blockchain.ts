///<reference path="../../com/models.ts"/>
///<reference path="../../com/Utils2.ts"/>
///<reference path="../service-mapper.ts"/>


module jaxx {
    export class TransactionListBlockchain implements IMobileRequest {
        _currentIndex:number = 0;
        _numberOfTransactionsWithoutHistory:number;
        _receive_change:string;
        _coinType:number = -1;
        startIndex:number = -1;

        _coin_HD_index:number = -1
        generator:GeneratorBlockchain;
        numberOfTransactionsWithoutHistory = 10;

        name:string;

        deferred:JQueryDeferred<VORelayedTransactionList[]>;

        _addresses:string[];
        txsIds:string[];
        _resolveTxList:VORelayedTransactionList[] = [];

        //@note: transaction specific member variables that deal with things like request resolution, how many errors
        //are going to be retried, and whether this class is on hold.
        _onHold:boolean;
        progress:number;

        _attempts:number = 10;

        _onDestroyed:Function;
        _destroyed:boolean;

        //@note: @here: for relay managed classes. eventually it will be applicabe to all of the blockchains.
        _relayManager:any = null;

        //@note: @here: for gathering _resolveTxList in a batch.
        _batchSize:number = 20;

        _enableLog:boolean = true;

        options:any={
            delayRequest:2
        };

       /* log(params):void {
            if (this._enableLog) {
                var args = [].slice.call(arguments);

                args[0] = "[ TransactionsList " + this._name + " ] :: " + args[0];

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
            }*/
       // }

        constructor(coin_HD_index:number, generator:GeneratorBlockchain, options?:any) {

            if(options) for (let str in options) this.options[str] = options[str];
            this._coin_HD_index = coin_HD_index;
            this.generator = generator;
            this.name = generator.name;

            Registry.application$.on(Registry.KILL_HISTORY,(evt,name:string)=>{
             //  console.warn(' history killed ');

                this.deferred.reject({error:100,message:'history killed'});
                setTimeout(()=>this.destroy(),20);
            })

            this.init();
        }

        initialize(name:string, coinType:number, relayManager:any):void {
            this.name = name;
            this._coinType = coinType;
            this._relayManager = relayManager;
            // this.log('initialize :: error :: override this method');
        }

        getAddresses():string[] {
            return this._addresses;
        }
        getTxsIds():string[]{
            return this.txsIds;
        }

        abort():IMobileRequest {
            return this;
        }

        init():void {
        }

        wait() {
            this._onHold = true;
        }

        resume() {
            this._onHold = false;
            this.loadNextAddress();
        }

        destroy():void {
            // if(this._currentRequest){
            //     this._currentRequest.abort();
            //     this._currentRequest = null;
            // }
            this._addresses = null;
            this._resolveTxList = null;
            this._destroyed = true;
            if (this._onDestroyed) {
                this._onDestroyed();
            }
        }

        reset():void {
            this._currentIndex = this.startIndex;
            this._numberOfTransactionsWithoutHistory = 0;
            this._addresses = [];
            this._resolveTxList = [];
            this.txsIds = [];
            this._attempts = 10;
            // this._requestDelays = 20;
        }

        getNextAddress():string {
            var address:string = this.generator.generateAddress(this._currentIndex, this._receive_change);
            this._addresses[this._currentIndex] = address;
            return address;
        }

        setTheEnd():void {
            this._numberOfTransactionsWithoutHistory = 100; //to stop next step;
        }

        parse(txList:ReferenceRelaysTxListData):VORelayedTransactionList[] {
            if (txList && txList.data && txList.data.length) {
                var parsedRelayTxLists = [];

                for (var i = 0; i < txList.data.length; i++) {
                    var newRelayedTxList = new VORelayedTransactionList(null);
                    newRelayedTxList.address = txList.data[i].address;

                    for (var j = 0; j < txList.data[i].txs.length; j++) {
                        var curTxHash = txList.data[i].txs[j].txHash;

                        newRelayedTxList.txListDict[curTxHash] = null;
                    }
                    // @note: @here: @codereview:
                    // newRelayedTxList.txList.length = Object.keys(newRelayedTxList.txList).length;

                    parsedRelayTxLists.push(newRelayedTxList);
                }

                return parsedRelayTxLists;
            } else {
                return null;
            }
        }

        onError(num:number, url:string, message:string):void {
            console.log("error :: attempts :: " + this._attempts + " :: message :: " + message);

            this._attempts--;
            if (this._attempts < 0) {
                this.deferred.reject({
                    error: num,
                    attempts: this._attempts,
                    message: message,
                    url: url
                });
                this.destroy();
                return;
            }

            this._currentIndex--;

            setTimeout(() => {
                this.loadNextAddress();
            }, 10000);
            jaxx.Registry.application$.triggerHandler(jaxx.Registry.ON_RESTORE_HISTORY_ERROR);
        }

        restoreHistory(receive_change:string):JQueryDeferred<VORelayedTransactionList[]> {
            //var promise:JQueryDeferred<{index:number,addresses:string[]}>
            /// console.warn(this._name + ' restoreHistory ' + receive_change);
            this.deferred = $.Deferred();
            this._receive_change = receive_change;
            this.reset();
            setTimeout(()=>this.loadNextAddress(),50);
            return this.deferred;
        }


        loadNextAddress():void {
            if (this._onHold || this._destroyed) {
                return;
            }

            this._currentIndex++;
            this._numberOfTransactionsWithoutHistory++;
            if (this._numberOfTransactionsWithoutHistory > this.numberOfTransactionsWithoutHistory) {

                this._addresses = this._addresses.slice(0, this._addresses.length - this.numberOfTransactionsWithoutHistory);

                var passthroughTxList:VORelayedTransactionList[] = this._resolveTxList.slice(0, this._resolveTxList.length - this.numberOfTransactionsWithoutHistory);

                this.deferred.resolve(this._resolveTxList);

                setTimeout(() => {
                    this.destroy();
                }, 100);

                return;
            }

            var self = this;

            let delayRequest:number = this.options.delayRequest;

            var curAddress:string = this.getNextAddress();

            let currentIndex:number = this._currentIndex;
            let addressType:string = this._receive_change;


            if (!curAddress) {
                this.onError(8888888, curAddress, 'current address is null')
                return;
            }

            //this._addresses.push(curAddress);



            //@note: @here: @relays: expects data in a single string, CSV type format.

            var delegateFunction = "getTxList";

            var relayArguments = [curAddress, function(status, relayReturnData) {
             // console.log(curAddress + '  '+ status, relayReturnData);

                if (status === "success") {

                    let resultTxs:string[] = relayReturnData.data.reduce(function (a,b) { return a = a.concat(b.txs.map(function(item){ return item.txHash})); },[]);
                   // console.log(resultTxs);

                    if(resultTxs) self.txsIds = self.txsIds.concat(resultTxs);

                    var txListDataFromRelay = new ReferenceRelaysTxListData(relayReturnData);


                  //  console.log(txListDataFromRelay);
                    var foundExistingTransactions:boolean = false;

                    //@note: @here: this should return just a single VORelayedTransactionList item since there's only one address posted into the relay arguments above, "curAddress".
                    var curTxListArray = self.parse(txListDataFromRelay);
                    if (curTxListArray && curTxListArray.length === 1) {
                        for (var i = 0; i < curTxListArray.length; i++) {
                            var curTxListItem = curTxListArray[i];

                            if(!Array.isArray( self._resolveTxList)) return;
                            self._resolveTxList.push(curTxListItem);

                            var numTx = Object.keys(curTxListItem.txListDict).length;

                            if (numTx > 0) {
                                foundExistingTransactions = true;
                            } else {

                            }
                        }

                        if (foundExistingTransactions === true) {
                            self._numberOfTransactionsWithoutHistory = 0;
                        }

                       console.log(self.name+ " " +currentIndex+ ' '  + curTxListArray[0].address + ' ' + addressType + " has " + Object.keys(curTxListArray[0].txListDict).length + " transactions" );
                    }
                } else {
                    console.log("getTxList :: failure :: " + status + " :: numberOfTransactionsWithoutHistory :: " + self._numberOfTransactionsWithoutHistory);
                }

              //  console.log(delayRequest);
                self.loadNextAddress();
               // setTimeout(self.loadNextAddress(), delayRequest);
            }];

            var callbackIndex = 1;

            var isCallbackSuccessfulFunction = function(status) {
                if (typeof(status) === 'string' && status === 'success') {
                    // console.log("callback successful");
                    return true;
                } else {
                    console.log("callback unsuccessful");
                    var color = HDWalletPouch.getStaticCoinPouchImplementation(self._coinType).uiComponents.coinDisplayColor;
                    console.log("%c Relay Node Failure :: Transaction_List_Blockchain.ts :: " + HDWalletPouch.getStaticCoinPouchImplementation(self._coinType).uiComponents.coinFullName + " Printing Arguments", 'color:' + color);
                    console.log(arguments)
                    return false;
                }
            }

            var isCallbackPermanentFailureFunction = function(status) {
                // self.log("Transaction Lists: Relay call failure..."); // log function not defined yet
                //@note: @here: @todo: @next: @relays:
                return false;
                //                return false;
            }

            var actionTakenWhenTaskIsNotExecuted = function(returnArgs) {
                console.log("Transaction Lists: failure with relay system...");
                self.onError(self._currentIndex, "relay manager: no url", "Transaction Lists: failure with node...");
            };


            //@note: @here: @todo: @next: @relays:

            this._relayManager.startRelayTaskWithBestRelay(delegateFunction, relayArguments, callbackIndex, isCallbackSuccessfulFunction, isCallbackPermanentFailureFunction, actionTakenWhenTaskIsNotExecuted);

        }
    }

}