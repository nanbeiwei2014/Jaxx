///<reference path="../com/models.ts"/>
///<reference path="../com/Utils.ts"/>
///<reference path="../com/Utils2.ts"/>
///<reference path="../services/ethereum/main_Ethereum.ts"/>
///<reference path="../services/bitcoin/crypto_bitcoin.ts"/>
///<reference path="../services/dash/crypto_dash.ts"/>
///<reference path="../services/litecoin/crypto_litecoin.ts"/>
///<reference path="../services/zcash/crypto_zcash.ts"/>
///<reference path="../datastore/datastore_local.ts"/>

///<reference path="../services/token_ethereum/ethereum_token.ts"/>

module jaxx {
    // import Utils2 = jaxx.Utils2;


    export class EthereumService {

        onTransaction$: JQuery = $({});

        id: number;
        name: string;
        //addressesReceive:string[];
        // addressesChange:string[];
        transactionsChange: VOTransaction[];
        transactionsReceive: VOTransaction[];
        coin_HD_index: number;
        network: any;
        is_Token: boolean;

       // generator: GeneratorBlockchain;

        crypto_class: IRequestServer ;
        //_db: jaxx.JaxxDatastoreLocal;


        config: any;
        options: any;

        constructor(settings: any, private db: EthereumStorage, config: any) {

         ///   console.log(config);
          //  this._db = db;
            this.id = settings.id;
            this.name = settings.name;
            this.coin_HD_index = settings.coin_HD_index;
            this.options = config;
            this.crypto_class = new CryptoEthereum(config);

           // this.generator = new GeneratorBlockchain(settings.name,  settings.id,  settings.coin_HD_index);


        }


        stop(): void {

        }


        /* getMiningFees(): number {
         return this.request.getMiningFees();
         }*/

        getMiningFees(): number {
            return 0;
        }

        //////////////////////////////////////    Generator

        addKeyPairToBalances(balances: VOBalanceSend[]): void {
            var i: number
            balances.forEach(balance => {
                // console.log(balance);
                var address: string = balance.id;
                    i = this.db.getAddressesReceive().indexOf(address);
                    balance.keyPair = this.getKeyPairReceive(i);
                })

        }


        getKeyPairReceive(index: number): any {
            return this.crypto_class.generator.generateKeyPairReceive(index);
        }

        getKeyPairChange(index: number): string {
            return this.crypto_class.generator.generateKeyPairChange(index);
        }




        getAddressReceive(index: number): string {
            return this.crypto_class.generator.generateAddressReceive(index);

        }



        //////////////////////////

        ON_ADDRESS_CHANGE_CAHANGE: string = 'ON_ADDRESS_CHANGE_CAHANGE';

        ON_ADDRESS_RECEIVE_CAHANGE: string = 'ON_ADDRESS_RECEIVE_CAHANGE';

//////////////////////////////////////////////

        initTokenData(): void {
          //  console.warn(' initTokenData  ');
            let address: string = Registry.Ethereum.getAddressReceive(0);

            //this._db.saveCurrentIndexReceive(0);
            //this._db.saveCurrentAddressReceive(address);
            this.db.setTransactions([]);
            this.db._saveBalancesReceive([new VOBalance({id: address, balance: 0})]);

            this.downloadBalances([address]).done(balances => {
                this.db._saveBalancesReceive(balances);
            })

        }


        errors: any[] = [];

        onError(err): void {
            console.error(err);
            this.errors.push(err);
            if (this.errors.length > 1000) this.errors.shift();
        }

        restoreHistory(receive_change: string): JQueryPromise<{index: number, addresses: string[], transactions: VOTransaction[], relayedTransactionListArray: VORelayedTransactionList[]}> {


            if (typeof this.crypto_class.restoreHistory === 'function') {

                return this.crypto_class.restoreHistory(receive_change);
            } else {
                var deferred: any = $.Deferred();
                deferred.reject({error: 1, message: this.name + '  no request method  restoreHistory '});
                return deferred;
            }
        }

        restoreHistory2(receive_change: string, startIndex: number): JQueryPromise<{index: number, addresses: string[], transactions: VOTransaction[], txdIds: string[], txsList: VORelayedTransactionList[]}> {
            if (typeof this.crypto_class.restoreHistory2 === 'function') {

                return this.crypto_class.restoreHistory2(receive_change, startIndex);
            } else {
                var deferred: any = $.Deferred();
                deferred.reject({error: 1, message: this.name + '  no request method  restoreHistory '});
                return deferred;
            }
        }


        ON_RESTORED_HISTORY_RECEIVE: string = 'ON_RESTORED_HISTORY_RECEIVE';


        restoredHistoryReceive(callBack: Function): void {
            //console.warn('%c restoredHistoryReceive  ','color:#AA0')

            let start: number = Date.now();

            this.restoreHistory('receive').then((res) => {

                console.log(this.name + ' restored history receive in ' + (Date.now() - start) / 1000 + ' s', res);

                var addresses: string[] = res.addresses;

                let timestamp: number = Date.now();
                let i: number = 0;
                let balances: VOBalance[] = addresses.map(function (address) {
                    return new VOBalance({
                        id: address,
                        balance: 0,
                        timestamp: timestamp,
                        index: i++
                    });
                });


                this.db._saveBalancesReceive(balances);
                if (addresses.length == 1) {
                    callBack();
                    return;
                }

                this.downloadBalances(addresses).done(newbalances => {


                    if (addresses.length !== newbalances.length) {

                        callBack({
                            error: 108,
                            message: 'downloaded addresses receive not equal length balances receive'
                        });
                        console.error(addresses, newbalances);
                        // return;
                    }

                    Utils.updateBalances(this.db.getBalancesReceive(true), newbalances);

                    this.db._saveBalancesReceive();

                    // var ind: number = addresses.length;
                    // var address = this.crypto_class.generator.generateAddressReceive(ind);
                    //this._db.saveCurrentAddressReceive(address);
                    //this._db.saveCurrentIndexReceive(ind);


                    var transactions: VOTransaction[] = res.transactions;
                    if (transactions && transactions.length) {
                        Utils.sortByTimestamp(transactions);
                        this.db.transactionTimestampReceive = transactions[transactions.length - 1].timestamp;

                        this.db.addTransactions(transactions);
                    }


                    console.log(this.name + ' restored balance receive: ' + this.db.getBalanceReceive());
                    this.emitter$.triggerHandler(this.ON_RESTORED_HISTORY_RECEIVE);

                    callBack();
                });

            }).fail(err => callBack(err));
        }


        ON_RESTORED_HISTORY_CHANGE: string = 'ON_RESTORED_HISTORY_CHANGE';
        ON_RESTORED_HISTORY_ALL: string = 'ON_RESTORED_HISTORY_ALL';

        restoreHistoryAll(): JQueryDeferred<{timeChange: number, timeReceive: number}> {
            var deferred: JQueryDeferred<{timeChange: number, timeReceive: number}> = $.Deferred();
            if (this.is_Token) {
                this.initTokenData();
                deferred.resolve({timeChange: 0, timeReceive: 0});
                return deferred;
            }
            // Assertion: Coin is not token
            var start: number = Date.now();


            this.restoredHistoryReceive((err) => {
                if (err) {
                    deferred.reject(err);
                    return;
                }

                    this.db.saveHistoryTimestamp(Date.now());
                    this.emitter$.triggerHandler(this.ON_RESTORED_HISTORY_ALL);
                    console.log('%c ' + this.name + ' restored history balance total: ' + this.db.getBalanceTotal(), 'color:brown');
                    deferred.resolve({timeChange:0, timeReceive:(Date.now() - start)});

            });

            return deferred;

        }

        emitter$: JQuery = $({});

        ON_NEW_TRANSACTIONS: string = 'ON_NEW_TRANSACTIONS';


        isContinueNewTranasctions(newTransactions: VOTransaction[]): void {
            let addressesWithNew: string[] = newTransactions.map(function (item) {
                return item.address;
            });

            this.addressesNeedTransactions = _.difference(this.addressesNeedTransactions, addressesWithNew);

            if (this.addressesNeedTransactions.length) {
                console.log('%c still need transactions for addresses ' + this.addressesNeedTransactions, 'color:brown');
                this._downloadNewTranasctions();
            } else console.log('%c all transactions renewed ', 'color:brown');
        }

        _downloadNewTranasctions(): void {

            if (Date.now() - this.downloadNewTransactionsTimestamp > 1000 * 100) {
                console.log('%c timeout downloading transactions ' + (Date.now() - this.downloadNewTransactionsTimestamp), 'color:brown');
                this.addressesNeedTransactions = [];
                return;
            }



            // if(attempt)console.warn(this.name + 'attempt: ' + attempt);

           // console.log(addresses)
            if (this.addressesNeedTransactions.length === 0)return;
            this.addressesNeedTransactions = _.uniq(this.addressesNeedTransactions);
            let addresses: string[] = this.addressesNeedTransactions;


            console.log('%c ' + this.name + '  download New Transactions total addresses: ' + addresses.toString(), 'color:brown');

            this.downloadTransactions(addresses).done(transactions => {
                //  console.log(transactions);

                if (transactions.hasOwnProperty('transactions')) {
                    transactions = transactions['transactions'];
                }

                // console.log(this.name +' _downloadNewTRanasctions ', transactions);

                this.onDownloadedNewTransactions(transactions);


            }).fail(err => {

                console.error('download new transactions error ');
                this.onError(err);
                if (this.addressesNeedTransactions.length) setTimeout(() => this._downloadNewTranasctions(), 20000);
            })

        }

        onDownloadedNewTransactions(transactions: VOTransaction[]): void {

            var newTransactions: VOTransaction[] = this.db.updateTransactionsReceiveGetNew(transactions);

            if (newTransactions.length) {

                this.emitter$.triggerHandler(this.ON_NEW_TRANSACTIONS, [newTransactions]);

                this.isContinueNewTranasctions(newTransactions);

            } else {


                setTimeout(() => this._downloadNewTranasctions(), 20000);

            }

            console.log('%c ' + this.name + ' new transactions  from ' + transactions.length + ' new ' + newTransactions.length, 'color:brown')
            console.log(newTransactions);

        }

        downloadNewTransactions1(addresses: string[]): void {
           addresses = _.uniq(addresses);
            console.log('%c '+ this.name +' download new transactions ' + addresses,'color:brown');

            this.downloadTransactions(addresses).done(transactions => {
                //  console.log(transactions);
                if (transactions.hasOwnProperty('transactions')) {
                    transactions = transactions['transactions'];
                }

                let newTransactions: VOTransaction[] = this.db.updateTransactionsReceiveGetNew(transactions);
                if (newTransactions.length) {

                    console.log('%c '+ this.name + ' new transactions  ' + transactions.length, 'color:brown');

                    this.emitter$.triggerHandler(this.ON_NEW_TRANSACTIONS, [newTransactions]);
                }else{
                    console.warn(' no new transactions for addresses ' + addresses.toString());
                }

                // console.log(this.name +' _downloadNewTRanasctions ', transactions);

               // this.onDownloadedNewTransactions(transactions);


            }).fail(err => {
                console.error('download new transactions error ');
                this.onError(err);
            })
        }

        private addressesNeedTransactions: string[] = [];


        private downloadNewTransactionsTimestamp: number;

        private isDownloadinNewTransactions:boolean;

        downloadNewTransactions2(addresses: string[]): void {


            this.downloadNewTransactionsTimestamp = Date.now();

            console.log('%c ' + this.name + ' download new transactions for addresses: ' + addresses.toString(), 'color:brown');
            // console.log(addresses);



            if(this.addressesNeedTransactions.length == 0 ){
                this.addressesNeedTransactions = addresses;
                this._downloadNewTranasctions();
            }else this.addressesNeedTransactions = this.addressesNeedTransactions.concat(addresses);

            /* console.log(' delay download new transactions  1, 20, 180 sec ' );

             setTimeout(()=>this._downloadNewTranasctions(addresses,1000), 1000);
             setTimeout(()=>this._downloadNewTranasctions(addresses,5000), 5000);
             setTimeout(()=>this._downloadNewTranasctions(addresses,10000), 10000);
             setTimeout(()=>this._downloadNewTranasctions(addresses,20000), 20000);
             setTimeout(()=>this._downloadNewTranasctions(addresses,180000), 180000);*/
        }


        downloadTransactionsUnspent(addresses: string[]): JQueryPromise<{result: any[], utxos: VOTransactionUnspent[]}> {

            return this.crypto_class.downloadTransactionsUnspent(addresses);
        }


        downloadTransactions(addresses: string[]): JQueryPromise<VOTransaction[]> {

            return this.crypto_class.downloadTransactions(addresses);
        }

        downloadTransactionsForAddress(address: string): JQueryPromise<VOTransaction[]> {
            return this.crypto_class.downloadTransactionsForAddress(address);
        }

        checkAddressesForTranasactions(addresses: string[]): JQueryPromise<string[]> {

            return this.crypto_class.checkAddressesForTranasactions(addresses).then(result => {
                console.log(result);
                return result;
            });
        }

        downloadTransactionsDetails(txsList: any[]): JQueryDeferred<{result: any[], transactions: VOTransaction[]}> {
            return this.crypto_class.downloadTransactionsDetails(txsList);
        }

        /////////////////////////////// Balances //////////////////////////////////

        ///  CheckAddressesController

        addressesToCheck: string[] = [];

        private _checkAddressesBalances(): void {
            if ((Date.now() - this.startAddressCheckTimestamp > 1000 * 100)) {
                console.log('%c killing thread because timeout ' + (Date.now() - this.startAddressCheckTimestamp), 'color:red');
                this.addressesToCheck = [];
                return;
            }

            let addresses: string[] = this.addressesToCheck;
            if (addresses.length == 0) {
                console.log('%c ' + this.name + ' all addresses checked  ', 'color:blue');
                return;
            }
            console.log('%c ' + this.name + ' continue check addresses  ' + addresses, 'color:blue');
            this.downloadBalances(addresses).done(res => {
                let balanaces: VOBalance[] = res;

                let diff: VOBalance[] = Utils.updateBalances(this.db.getBalancesReceive(true), balanaces);

                if (diff.length) this.onBalancesDifference(diff);

                setTimeout(() => this._checkAddressesBalances(), 2000);

            }).fail(err => {
                this.onError(err);
                setTimeout(() => this._checkAddressesBalances(), 20000);
            });
        }

        startAddressCheckTimestamp: number;

        startCheckAddressesBalances(addresses: string[]): void {
            console.log('%c ' + this.name + ' start check addresses ' + addresses, 'color:blue');
            this.addressesToCheck = this.addressesToCheck.concat(addresses);
            this.startAddressCheckTimestamp = Date.now();
            this._checkAddressesBalances();
        }

        downloadBalances(addresses: string[]): JQueryDeferred<VOBalance[]> {
            return this.crypto_class.downloadBalances(addresses);
        }


        balances$ = $({});

        ON_BALANCES_DIFFERENCE: string = 'ON_BALANCE_DIFFERENCES';

        onBalancesDifference(diff: VOBalance[]): void {

            this.db.onBalancesDifference(diff);

            let addresses: string[] = Utils.getIds(diff);
            this.addressesToCheck = _.difference(this.addressesToCheck, addresses);
            console.log('%c   onBalancesDifference(   ' + addresses, 'color:brown');
            this.downloadNewTransactions2(addresses);
            this.downloadNewTransactions1(<string[]>_.map(diff,'id'));

            this.balances$.triggerHandler(this.ON_BALANCES_DIFFERENCE, [diff]);
        }

        downloadBalancesAll(callBack: Function, onError: Function): void {
            if (this.is_Token) {
                callBack();
                return;
            }

            this.downloadBalancesReceive((diff, deltaR) => {
                //console.log(' on downloadBalancesReceive ');
               // this.downloadBalancesChange((diffC, deltaC) => {
                    // console.log(' on downloadBalancesChange ');
                  //  let diff = diffR.concat(diffC);
                    let delta = deltaR;// + deltaC;

                    // console.log(diff);
                    if (diff.length == 0) {
                        callBack([],delta);
                        return;
                    }

                    this.onBalancesDifference(diff);
                    console.log('%c balances diff ' + diff.length, 'color:brown');
                    callBack(diff, delta);
                    // this.balances$.triggerHandler(this.ON_BALANCE_DIFFERENCE_ADDRESSES,addresses);

                }, err => onError(err));

            //}, err => onError(err));

        }


        ON_BALANCE_RECEIVE_CHANGE: string = 'ON_BALANCE_RECEIVE_CHANGE';


        downloadBalancesReceive(callBack: Function, onError: Function): void {

            ///  console.log('   downloadBalancesReceive   ');

            let diff: VOBalanceDiff[] = [];

            let addresses: string[] = this.db.getAddressesReceive();

            if (addresses.length === 0) {
                ///this.newBalanceReceive = 0;
                callBack([]);
                return;
            }
            ;

            //    console.log('downloadBalancesReceive  length ' +addresses.length, addresses);

            this.downloadBalances(addresses).done(newbalances => {
                let delta = 0;
                // console.log(this._db.getBalancesTemp());

                console.log(addresses.length + '<= addresses length balances => ' + newbalances.length);

                let balanceOld = this.db.getBalanceReceive();

                let difference: VOBalance[] = Utils.updateBalances(this.db.getBalancesReceive(true), newbalances);

                let balanceNew: number = this.db.getBalanceReceive();

                if (difference.length) {
                    this.db._saveBalancesReceive();
                    console.warn(' balances receive difference ', difference);
                }


                delta = balanceNew - balanceOld;

                var precision = balanceNew / 1e5;
                /// console.log(delta + ' ' + precision );


                if (Math.abs(delta) > precision) {

                    console.log('%c ' + this.name + ' balances receive delta more then precision ' + delta + ' precision ' + precision, 'color:red');


                    if (difference.length) {

                        console.log(this.name + ' balances receive difference ' + difference.reduce(function (a, b) {
                                return a += b.delta;
                            }, 0), diff)
                    }


                    // console.log('%c ' + this.ON_BALANCE_RECEIVE_CHANGE + ' delta: '+ delta/1e15 +' new:  ' + balance/1e15 + ' old ' + old/1e15,'color:#f00');//
                    console.log(this.ON_BALANCE_RECEIVE_CHANGE, difference);


                    this.balances$.triggerHandler(this.ON_BALANCE_RECEIVE_CHANGE, [difference]);

                    //this.onNewBalancesRecaive(newbalances);

                } else {

                    delta = 0;
                    //console.log('%c ' + this.name + ' same balance receive ' + balanceOld / 1e8, 'color:#f99');
                }

                //console.log(' callback receive',diff);
                callBack(difference, delta);
                // return newbalances;
            }).fail(err => onError(err));
        }


        ON_BALANCE_CHANGE_CHANGE: string = 'ON_BALANCE_CHANGE_CHANGE';
        newBalanceChange: number = 0;



    }
}



