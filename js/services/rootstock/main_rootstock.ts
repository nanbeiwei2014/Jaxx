/**
 * Created by Daniel on 2017-01-11.
 */
module jaxx {
    declare var thirdparty: any;

    export class CryptoRootstockEthereum implements IRequestServer {

        _coinType: number = -1;

        i: number = 0;
        static RECEIVE: string = 'receive';
        static CHANGE: string = 'change';
        gasPrice: number = 2e10;
        gasLimit: number;// for ETH 21000; ///56000 for contracts;
        gasLimitDefault: number = 150000;

        attempts: number = 10;
        speed: number = 200;
        public apiKey = '';
        nullCount = 0;
        receive_change: string;
        addressesReceive: string[];
        addressesChange: string[];
        options: OptionsCrypto;
        generator: GeneratorBlockchain = null;
        name: string;


        constructor(public coinType: number, public coin_HD_index: number, public service: JaxxAccountService) {

            this._coinType = coinType;



            let options: OptionsCrypto = {
                urlBalance: 'http://54.67.34.99/api/eth/balance?addresses={{addresses}}',
                urlTransactions: 'http://54.67.34.99/api/eth/mergedTransactions?addresses={{address}}',
                urlTransactionStatus: 'http://54.67.34.99/api/eth?module=transaction&action=getstatus&txhash={{transaction_id}}',
                urlTransactionInternal: 'http://54.67.34.99/api/eth?module=account&action=txlistinternal&txhash={{transaction_id}}',
                apiKey: '',
                hd_index: coin_HD_index,
                name: service.name
            };
            this.options = options;

            this.init();
        }

        initialize(): void {

        }

        init(): void {
            this.gasLimit = this.gasLimitDefault;
            this.generator = new GeneratorBlockchain(this.service.name, COIN_ETHEREUM, this.coin_HD_index)
            console.log(this.generator);
            this.name = this.service.name;
        }

        sendTransaction2(transaction: any): any {
            var ctr: SendTransaction = new SendTransaction(this.name, this.gasPrice, this.gasLimit);
            return ctr.sendTransaction(transaction);
        }

        // web3.eth.getTransaction(transactionHash [, callback])

        downloadTransactionsDetails(txsIds:string[]):JQueryDeferred<{result:any[], transactions:VOTransaction[]}>{
            let deferred: JQueryDeferred<{result:any[], transactions:VOTransaction[]}> = $.Deferred();
            return deferred.resolve({result:[], transactions:[]});
        }

        checkTransactionByAddress(txid: string, address: string): JQueryPromise<VOTransaction[]> {

            var url: string = this.options.urlTransactions.replace('{{address}}', address);
            return $.getJSON(url).then(res => {
                // console.warn(address, txid, res);
                var trransactions: VOTransaction[] = ServiceMappers.mapEtherTransactions(res.result, address);
                //  console.log(trransactions);
                return trransactions.filter(o => o.id === txid);
            });
        }

        getTransactionStatus(transactionId: string): JQueryPromise<VOTransactionStatus> {
            var url = this.options.urlTransactionStatus.replace('{{transaction_id}}', transactionId);
            return $.getJSON(url).then((res) => {


                var out = new VOTransactionStatus({
                    txid: transactionId,
                    status: Number(res.status),
                })

                if (Number(res.result.isError)) {
                    out.error = res.result.errDescription;
                } else out.success = true;
                return out;
            });
        }
        restoreHistory2(receive_change: string):any{

            return null;
        }

        restoreHistory(receive_change: string): JQueryDeferred<{index: number, addresses: string[], transactions: VOTransaction[]}> {

            // console.log(this.options);
            var req:RestoreHistory = new RestoreHistory(this.options, this.generator);
            req.url = this.options.urlTransactions;

            req.parse = function (result:any, address:string) {
               // console.log(result,address);
                let ar:any[] = result.transactions || [];
                return ServiceMappers.mapEtherTransactions(ar,address);

            }
            return req.restoreHistory(receive_change).done((res)=>{
                // console.log(receive_change + ' done ',res);
                return res
            });
        }


        checkAddressesForTranasactions(addresses:string[]):JQueryDeferred<any[]>{
            return this.downloadTransactions(addresses);

        }

        sendTransactinsStart(transaction: VOTransactionStart): JQueryDeferred<VOSendTransactionResult> {
            var ctr: SendTransactionStartEther = new SendTransactionStartEther();
            return ctr.sendTransaction(transaction);
        }


        /*  sendBuiltTransactions(builtTransactions:VOBuiltTransaction[]):JQueryDeferred<VOBuiltTransaction[]>{
         var req:RequestSendTransactionEther = new RequestSendTransactionEther(this.service);
         return req.sendBuiltTransactions(builtTransactions);
         }
         */

////////////////////////////// Transactions //////


        downloadTransactionsUnspent(addresses: string[]): JQueryDeferred<{result: any[], utxos: VOTransactionUnspent[]}> {


            let deferred: JQueryDeferred<{result: any[], utxos: VOTransactionUnspent[]}> = $.Deferred();
            let req: DownloadTransactionsEthereum = new DownloadTransactionsEthereum(this.name);


            req.downloadTransactions(addresses).done(res => {
                //console.log(res)
                let out = res.map(function (item) {
                    return new VOTransactionUnspent(item);
                })
                deferred.resolve({result: [], utxos: out});
            }).fail(err => deferred.fail(err));


            return deferred


        }

        downloadingTransaction: IMobileRequest;

        downloadTransactions(addresses: string[]): JQueryDeferred<VOTransaction[]> {

            var req: DownloadTransactionsBlockchain = new DownloadTransactionsBlockchain(this.name, this.options);
            req.parse = function (result, address) {

               // console.log(result);
                let ar:any[] = result.transactions || [];
                return ServiceMappers.mapEtherTransactions(ar,address);

            }

            /// if(this.downloadingTransaction) this.downloadingTransaction.abort().destroy();
            this.downloadingTransaction = req;
            return req.downloadTransactions(addresses);
        }

        downloadTransactions2(voaddresses: VOAddress[]): JQueryDeferred<VOAddress[]> {
            return null;
        }

        downloadTransactionsForAddress(address: string): JQueryPromise<VOTransaction[]> {
            var url: string = this.options.urlTransactions.replace('{{address}}', address);
            return $.getJSON(url).then(res => {
                var result = res.result;
                return ServiceMappers.mapEtherTransactions(result, address);
            });
        }

        setTransactionEventEmiter(emitter$: JQuery): void {
            var sendTransaction: EthereumSendTransaction = new EthereumSendTransaction();
            sendTransaction.setTransactionEventEmiter(emitter$);
        }


        //////////////////////////////////////// Balances /////////////////////
        downloadBalances(addresses: string[]): JQueryDeferred<VOBalance[]> {

            var req:BalancesEthereum = new BalancesEthereum(this.options);
            req.parse = function (resp) {
                let date:number = Date.now();
               // console.log(resp);
                let out:VOBalance[] = []
                for(let str in resp) out.push(new VOBalance({
                    id:str,
                    balance:+resp[str],
                    timestamp:date
                }))

               // console.log(out);
                return out;
            };

            return req.loadBalances(addresses);
        }

        checkBalanceForAddress(address: string): JQueryPromise<VOBalance> {
            var url: string = this.options.urlBalance.replace('{{address}}', address);
            return $.getJSON(url).then((res) => {
                //console.warn(res);
                return new VOBalance({
                    id: address,
                    balance: +res.result,
                    timestamp: Date.now()
                });
            });
        }

        getMiningPrice(): number {
            return this.gasPrice;
        }

        getMiningFees(): number {
            return this.gasPrice * this.gasLimit;
        }

        getMiningFeeLimit(): number {
            return this.gasLimit;
        }

    }


}