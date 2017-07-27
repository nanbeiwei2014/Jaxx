///<reference path="../../com/models.ts"/>
///<reference path="../../com/Utils2.ts"/>
///<reference path="../service-mapper.ts"/>
///<reference path="../blockchain/balances_blockchain.ts"/>

module jaxx {
    export class BalancesEthereum implements IMobileRequest {

        onDestroyed: Function;
        destroyed: boolean;
        _currentBatch: number = 20;
        _name: string = "";
        apikey;
        deferred: JQueryDeferred<VOBalance[]>
        errors: number;
        addresses: string[][];
        results: VOBalance[];
        request: JQueryXHR;
        url: string;
        maxErrors: number = 20;
        requestsDelay: number = 20;
        onHold: boolean;
        progress: number;

        //@note: @here: for relay managed classes. eventually it will be applicabe to all of the blockchains.
        _relayManager: any = null;

        //@note: @here: for gathering transactions in a batch.
        _batchSize: number = 20;

        _enableLog: boolean = true;


        constructor(public options:OptionsCrypto) {
            this.url = options.urlBalance + options.apiKey;

            this.init();
        }
/*
        initialize(name: string, relayManager: any): void {

            //this.url = 'https://api.etherscan.io/api?module=account&action=balancemulti&address={{addresses}}&tag=latest';
            //this.apikey = '';
            //this.url += this.apikey;
        }*/

        init(): void {
           // this.url = 'https://api.etherscan.io/api?module=account&action=balancemulti&address={{addresses}}&tag=latest';
           // this.apikey = '';
           // this.url += this.apikey;
        }

        abort(): IMobileRequest {
            return this;
        }

        wait() {
            this.onHold = true;
        }

        resume() {
            this.onHold = false;
            this.getNextBalances();
        }

        reset(): void {
            this.results = [];
            this.errors = 0;
            this._currentBatch = -1;
        }

        destroy(): void {
            if (this.request) {
                this.request.abort();
                this.request = null;
            }
            this.deferred = null;
            this.results = null;
            this.destroyed = true;
            if (this.onDestroyed) this.onDestroyed();
        }

        onError(id: number, message: string): void {
            this.errors++;
            if (this.errors > this.maxErrors) {
                this.deferred.reject({
                    error: id,
                    message: message
                })
                this.destroy();
                return;
            }
            this._currentBatch--
            setTimeout(() => this.getNextBalances(), 10000);
        }

        parse(resp: any): VOBalance[] {

            if (resp && resp.result) {
               // console.log(resp.result);
                var t: number = Date.now();
                return resp.result.map(function (item) {
                    return new VOBalance({id: item.account, balance: Number(item.balance), timestamp: t});
                    ///return new VOBalance({id:item.account,balance:+item.balance/Math.pow(10,20),timestamp:t})
                })

            }
            // this.onError(' no-data ');
            return null;
        }

        loadBalances(addresses: string[]): JQueryDeferred<VOBalance[]> {
            this.reset();

           // console.log(addresses);
            this.addresses = Utils.splitInCunks(addresses, this._batchSize);

            this.deferred = $.Deferred();

            this.getNextBalances();
            return this.deferred;
        }

        onSuccess(): void {
            this.deferred.resolve(this.results);
            setTimeout(() => this.destroy(), 10);
        }

        getNextBalances(): void {
            this._currentBatch++;
            if (this._currentBatch >= this.addresses.length) {
                this.onSuccess();
                return;
            }

            var addresses: string[] = this.addresses[this._currentBatch];


            var url = this.url.replace('{{addresses}}', addresses.toString());
           // console.log(url);

            this.request = <JQueryXHR>$.getJSON(url);
            this.request.then(res => this.parse(res)).done(res => {
                this.request = null;
              //  console.log(res);
                if (res) {
                    this.results = this.results.concat(res);
                    setTimeout(() => this.getNextBalances(), this.requestsDelay);
                } else  this.onError(1245, url + ' result ' + res.toString());

            }).fail(err => this.onError(1404, err.toString()));
        }
    }
}