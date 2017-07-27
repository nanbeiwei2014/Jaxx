///<reference path="../../com/models.ts"/>
///<reference path="../../com/Utils2.ts"/>
///<reference path="../service-mapper.ts"/>

module jaxx {
    export class BalancesBlockchain implements IMobileRequest {
        onDestroyed:Function;
        destroyed:boolean;
        _currentBatch:number = 0;
        _name:string = "Undefined Blockchain :: BalancesBlockchain";
        _coinType:number = -1;

        deferred:JQueryDeferred<VOBalance[]>
        errors:number;
        addresses:string[][];
        results:VOBalance[];
        request:JQueryXHR;
        url:string;
        maxErrors:number = 20;
        onHold:boolean;
        progress:number;

        //@note: @here: for relay managed classes. eventually it will be applicabe to all of the blockchains.
        _relayManager:any = null;

        //@note: @here: for gathering transactions in a batch.
        _batchSize:number = 20;

        _enableLog:boolean = true;
        options:any={
            delayRequest:2
        };

        log(params):void {
            if (this._enableLog) {
                console.log("[ Balances " + this._name + " ] :: " + params);
            }
        }

        constructor() {
           // if(options) for (let str in options) this.options[str] = options[str];
            this.init();

        }

        init() {

        }

        initialize(name:string, coinType:number, relayManager:any): void {
            this._name = name;
            this._coinType = coinType;
            this._relayManager = relayManager;
        }

        abort():IMobileRequest {
            return this;
        }

        wait() {
            this.onHold = true;
        }

        resume() {
            this.onHold = false;
            this.getNextBalances();
        }

        reset():void {
            this.results = [];
            this.errors = 0;
            this._currentBatch = -1;
        }

        destroy():void {
            if (this.request) {
                this.request.abort();
                this.request = null;
            }
            this.deferred = null;
            this.results = null;
            this.destroyed = true;
            if (this.onDestroyed) this.onDestroyed();
        }

        onError(id:number, message:string):void {
            this.errors++;
            if (this.errors > this.maxErrors) {
                this.deferred.reject({
                    error: id,
                    message: message
                })
                this.destroy();
                return;
            }
            this._currentBatch--;

            setTimeout(() =>this.getNextBalances(), 10000);
        }

        parse(response: any[]): VOBalance[] {
            // console.log(resp);
            // if (resp && resp.result) {
            var t: number = Date.now();

            if (!Array.isArray(response)) {
                response = [response];
            }

          //  console.log(response);

            return response.map(function(item) {
                if(item){
                    let returnVO =  new VOBalance({
                        id: item.address,
                       // balance: item.balance ? HDWalletHelper.convertBitcoinsToSatoshis(+item.balance) : 0,
                        balance: item.balance ? Math.round(+item.balance*1e8) : 0,
                        timestamp: t
                    });

                    return returnVO;
                }else console.error(' item is null ', response);
                // console.log(item.balance );
                //  console.log(HDWalletHelper.convertBitcoinsToSatoshis(item.balance);
                //console.log(item.balance);

                //  return new VOBalance({id:item.account,balance:+item.balance/Math.pow(10,20),timestamp:t})
            })
            //}
            // this.onError(' no-data ');

        }

        loadBalances(addresses: string[]): JQueryDeferred<VOBalance[]> {
            this.reset();


           //console.log("%c load balance for addresses " + addresses, "color: #bbb0FF;");

            this.addresses = Utils.splitInCunks(addresses, this._batchSize);


            //console.warn(this._name + '  ' +this.addresses.toString());

            this.deferred = $.Deferred();

            this._currentBatch = -1;

            this.getNextBalances();

            return this.deferred;
        }

        getNextBalances(): void {


          //   console.error(' getNextBalances   ' +  this._currentBatch + '   ' + this.addresses.length)

            this._currentBatch++;

            if (this._currentBatch >= this.addresses.length) {
                this.deferred.resolve(this.results);

                setTimeout(() => {
                    this.destroy();
                }, 100);

                return;
            }

            var self = this;
            let dealayRequest:number = this.options.delayRequest;

            var batchAddresses: string[] = this.addresses[this._currentBatch];


            if (batchAddresses.length === 0) {
                return;
            }




            var addressParam = batchAddresses.join(',');



            var delegateFunction = "getMultiAddressBalance";

            var relayArguments = [addressParam, function(status, accountBalances) {

               // console.log(addressParam.toString()  +'    balance: ' + Utils.calculateBalance(accountBalances));
              // console.log(status,accountBalances);


                self.results = self.results.concat(self.parse(accountBalances));

                //console.log(dealayRequest);
              // setTimeout(self.getNextBalances(), dealayRequest);

                self.getNextBalances();

                ///console.log("accountBalances :: " + JSON.stringify(accountBalances, null, 4));

                //self._populateHistory(txList);
            }];

            var callbackIndex = 1;

            var isCallbackSuccessfulFunction = function(status) {
                if (typeof(status) === 'string' && status === 'success') {
                    // console.log("callback successful");
                    return true;
                } else {
                    self.log("callback unsuccessful");
                    var color = HDWalletPouch.getStaticCoinPouchImplementation(self._coinType).uiComponents.coinDisplayColor;
                    console.log("%c Relay Node Failure :: BalancesBlockchain.ts :: " + HDWalletPouch.getStaticCoinPouchImplementation(self._coinType).uiComponents.coinFullName + " Printing Arguments", 'color:' + color);
                    console.log(arguments)
                    return false;
                }
            }

            var isCallbackPermanentFailureFunction = function(status) {
                self.log("Balances: Relay call failure...");
                //@note: @here: @todo: @next: @relays:
                return false;
                //                return false;
            }

            var actionTakenWhenTaskIsNotExecuted = function(returnArgs) {
                self.log("Balances: failure with relay system...");
                self.onError(self._currentBatch, "Balances: failure with node...");
            };

            //            this._workerManager._relayManager.startRelayTaskWithBestRelay(delegateFunction,


            //@note: @here: @todo: @next: @relays:



            this._relayManager.startRelayTaskWithBestRelay(delegateFunction, relayArguments, callbackIndex, isCallbackSuccessfulFunction, isCallbackPermanentFailureFunction, actionTakenWhenTaskIsNotExecuted);
        }
    }
}