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


    export class TokenService {


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

        generator: GeneratorBlockchain;

        crypto_class: IRequestServer ;
        _db: jaxx.JaxxDatastoreLocal;


        config: any;
        options: any;

        constructor(settings: any, db: jaxx.JaxxDatastoreLocal, options: any) {

            this._db = db;
            this.id = settings.id;
            this.name = settings.name;
            this.coin_HD_index = settings.coin_HD_index;
            this.is_Token = settings.isToken;

            this.options = options;

            ///console.log(this. name + ' : ' + settings.request + ' coin_HD_index   ' + this.coin_HD_index);

            var fn = jaxx[settings.crypto_class];
            // console.warn(fn);

            if(this.is_Token){

                this.crypto_class = new jaxx.EthereumToken(settings);
            }
            else if (typeof fn === "function") {
                this.crypto_class = new fn(this.id, settings.coin_HD_index, this, options);

                if (typeof(this.crypto_class.initialize) === 'function') {
                    this.crypto_class.initialize();
                }
            }

            if (!this.crypto_class) {
                console.log('%c  ' + this.name + ' please specify valid class name settings.request  for ' + JSON.stringify(settings), 'color:red');
            } else {
                //if (this.request.hasOwnProperty('setTransactionEventEmite'))this.request.setTransactionEventEmiter(this.onTransaction$);
            }
        }


        stop(): void {

        }


        /* getMiningFees(): number {
         return this.request.getMiningFees();
         }*/

        getMiningFees(): number {
            return this.crypto_class.getMiningFees();
        }


        //////////////////////////////////////    Generator

        addKeyPairToBalances(balances: VOBalanceSend[], change_receive: string): void {
            var i: number
            balances.forEach(balance => {
                // console.log(balance);
                var address: string = balance.id;
                if (change_receive == 'change') {
                    i = this._db.getAddressesChange().indexOf(address);
                    balance.keyPair = this.getKeyPairChange(i);
                } else {
                    i = this._db.getAddressesReceive().indexOf(address);
                    balance.keyPair = this.getKeyPairReceive(i);
                }
            });

        }


        getKeyPairReceive(index: number): any {
            return this.crypto_class.generator.generateKeyPairReceive(index);
        }

        getKeyPairChange(index: number): string {
            return this.crypto_class.generator.generateKeyPairChange(index);
        }

        getCurrentAddressReceive(): string {
            let address: string = this._db.getCurrentAddressReceive();

            if (address.length===0) {
                if (this._db.isNewWallet()){
                    this.createNewWallet();
                    return this._db.getCurrentAddressReceive();

                }
                return  this.crypto_class.generator.generateAddressReceive(0);
            }

            return address;

        }

        getCurrentAddressChange(): string {
            return this._db.getCurrentAddressChange();
        }

        getAddressReceive(index: number): string {
            if(this.is_Token) return Registry.Ethereum.getAddressReceive(0);
            if (index == -1) return '';
            var addresses: string[] = this._db.getAddressesReceive();

            if (index < addresses.length) {
                return addresses[index];
            } else {
                if (!this.crypto_class) {
                    console.warn(this.name + ' getAddressReceive  no  crypto_class  ');
                    return '';
                }
                return this.crypto_class.generator.generateAddressReceive(index);
            }
        }


        getAddressChange(index: number): string {

            if (this.is_Token || index == -1) return '';
            var addresses: string[] = this._db.getAddressesChange();

            if (index < addresses.length) {
                return addresses[index];
            } else {
                if (!this.crypto_class) {
                    console.warn(this.name + ' getAddressChange  no  crypto_class  ');
                    return '';
                }
                ;
                return this.crypto_class.generator.generateAddressChange(index);
            }
        }

        getAddress(index: number, receive_change: string): string {
            var address: string;
            if (receive_change == 'change') {
                address = this.getAddressChange(index);
            } else {
                address = this.getAddressReceive(index);
            }

            return address;
        }


        createNewWallet(): void {

            console.warn(this.name + '   createNewWallet  ');


            //  this._db.saveCurrentIndexReceive(0);

            // this._db._saveBalancesChange()
            // this._db.saveCurrentIndexChange(0);


            let addressReceive = this.getAddressReceive(0);

            //this._db.saveCurrentAddressReceive(addressReceive);

            let balanceRceive: VOBalance = new VOBalance({
                id: addressReceive,
                balance: 0,
                index:0,
                timestamp: Date.now()
            })

            this._db._saveBalancesReceive([balanceRceive]);

            let addressChange = this.getAddressChange(0);
            //this._db.saveCurrentAddressChange(addressChange);
            let balanceChange: VOBalance = new VOBalance({
                id: addressChange,
                balance: 0,
                index:0,
                timestamp: Date.now()
            });

            this._db._saveBalancesChange([balanceChange]);
            this._db.setNewWallet(false);
        }


        //////////////////////////

        ON_ADDRESS_CHANGE_CAHANGE: string = 'ON_ADDRESS_CHANGE_CAHANGE';

        goToNextIndexChange(): void {

            var indexChange: number = this._db.getCurrentIndexChange();
            indexChange++;
            console.log('%c going new ingex change ' + indexChange, 'color:red');

            var address: string = this.getAddressChange(indexChange);
            // this._db.saveCurrentAddressChange(address);
            var bal: VOBalance = new VOBalance({id: address, balance: 0});
            this._db.addBalanceChange(bal);
            this.emitter$.triggerHandler(this.ON_ADDRESS_CHANGE_CAHANGE, address);

        }

        ON_ADDRESS_RECEIVE_CAHANGE: string = 'ON_ADDRESS_RECEIVE_CAHANGE';

        goToNextIndexReceive(): void {

            var currentIndex: number = this._db.getCurrentIndexReceive();
            currentIndex++;
            console.log('%c going new ingex receive ' + currentIndex, 'color:red');
            let address = this.getAddressReceive(currentIndex);
            this._db.addBalanceReceive(new VOBalance({id: address, balance: 0}));
            this.emitter$.triggerHandler(this.ON_ADDRESS_RECEIVE_CAHANGE, address);
        }

//////////////////////////////////////////////

        initTokenData(): void {
            console.warn(' initTokenData  ');
            let address: string = Registry.Ethereum.getAddressReceive(0);

            //this._db.saveCurrentIndexReceive(0);
            //this._db.saveCurrentAddressReceive(address);
            this._db.setTransactions([]);
            this._db._saveBalancesChange([]);
            this._db._saveBalancesReceive([new VOBalance({id: address, balance: 0})]);

            this.downloadBalances([address]).done(balances => {
                this._db._saveBalancesReceive(balances);
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
                let currentAddressReceive: string = this.getAddressReceive(addresses.length);
                addresses.push(currentAddressReceive)

                /*if(addresses.length == 0){
                 /!*let address:string = this.getAddressReceive(0);
                 addresses = [address];*!/


                 this._db.saveCurrentIndexReceive(0);
                 callBack();
                 return;
                 }*/

                //console.log(addresses);

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

                //console.log(balances);

                this._db._saveBalancesReceive(balances);
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

                    Utils.updateBalances(this._db.getBalancesReceive(true), newbalances);

                    this._db._saveBalancesReceive();

                    // var ind: number = addresses.length;
                    // var address = this.crypto_class.generator.generateAddressReceive(ind);
                    //this._db.saveCurrentAddressReceive(address);
                    //this._db.saveCurrentIndexReceive(ind);


                    var transactions: VOTransaction[] = res.transactions;
                    if (transactions && transactions.length) {
                        Utils.sortByTimestamp(transactions);
                        this._db.transactionTimestampReceive = transactions[transactions.length - 1].timestamp;

                        this._db.addTransactions(transactions);
                    }


                    console.log(this.name + ' restored balance receive: ' + this._db.getBalanceReceive());
                    this.emitter$.triggerHandler(this.ON_RESTORED_HISTORY_RECEIVE);

                    callBack();
                });

            }).fail(err => callBack(err));
        }


        ON_RESTORED_HISTORY_CHANGE: string = 'ON_RESTORED_HISTORY_CHANGE';

        restoreHistoryChange(callBack: Function): void {
            let start: number = Date.now();

            this.restoreHistory('change').then((res) => {

                console.log(this.name + ' restored history change  in ' + (Date.now() - start) / 1000 + ' s', res);
                var addresses: string[] = res.addresses;
                var currentAddressChange: string = this.getAddressChange(addresses.length);
                addresses.push(currentAddressChange);


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

                // console.log(balances);

                this._db._saveBalancesChange(balances);


                if (addresses.length == 1) {
                    callBack();
                    return;
                }

                this.downloadBalances(addresses).done(newbalances => {

                    let difference: VOBalance[] = Utils.updateBalances(this._db.getBalancesChange(true), newbalances);

                    this._db._saveBalancesChange();


                    //  console.log(this.name + ' + balances change total:  ' + Utils.calculateBalance(balances));
                    var ind: number = addresses.length;

                    //this._db.saveCurrentIndexChange(ind-1);

                    // this.goToNextIndexChange();

                    var transactions: VOTransaction[] = res.transactions;

                    Utils.sortByTimestamp(transactions);

                    this._db.addTransactions(transactions);

                    console.log(this.name + ' restored balance change: ' + this._db.getBalanceChange());

                    this.emitter$.triggerHandler(this.ON_RESTORED_HISTORY_CHANGE);

                    callBack()
                });

            }).fail(err => callBack(err));

        }


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
            var timeChange: number = 0;
            var timeReceive: number = 0;
            this.restoreHistoryChange((err) => {
                if (err) {
                    deferred.reject(err);
                    return;
                }
                timeChange = Date.now() - start;
                if (timeReceive && timeChange) {
                    this.emitter$.triggerHandler(this.ON_RESTORED_HISTORY_ALL);
                    this._db.saveHistoryTimestamp(Date.now());
                    deferred.resolve({timeChange: timeChange, timeReceive: timeReceive})
                }
            })

            this.restoredHistoryReceive((err) => {
                if (err) {
                    deferred.reject(err);
                    return;
                }
                timeReceive = Date.now() - start;
                if (timeReceive && timeChange) {
                    this._db.saveHistoryTimestamp(Date.now());
                    this.emitter$.triggerHandler(this.ON_RESTORED_HISTORY_ALL);
                    console.log('%c ' + this.name + ' restored history balance total: ' + this._db.getBalanceTotal(), 'color:brown');
                    deferred.resolve({timeChange: timeChange, timeReceive: timeReceive});
                }
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

            var newTransactions: VOTransaction[] = this._db.updateTransactionsReceiveGetNew(transactions);

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

                let newTransactions: VOTransaction[] = this._db.updateTransactionsReceiveGetNew(transactions);
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

                let diff: VOBalance[] = Utils.updateBalances(this._db.getBalancesReceive(true), balanaces);
                diff = diff.concat(Utils.updateBalances(this._db.getBalancesChange(true), balanaces));

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

            this._db.onBalancesDifference(diff);

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

            this.downloadBalancesReceive((diffR, deltaR) => {
                //console.log(' on downloadBalancesReceive ');
                this.downloadBalancesChange((diffC, deltaC) => {
                    // console.log(' on downloadBalancesChange ');
                    let diff = diffR.concat(diffC);
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

            }, err => onError(err));

        }


        ON_BALANCE_RECEIVE_CHANGE: string = 'ON_BALANCE_RECEIVE_CHANGE';


        downloadBalancesReceive(callBack: Function, onError: Function): void {

            ///  console.log('   downloadBalancesReceive   ');

            let diff: VOBalanceDiff[] = [];

            let addresses: string[] = this._db.getAddressesReceive();

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

                let balanceOld = this._db.getBalanceReceive();

                let difference: VOBalance[] = Utils.updateBalances(this._db.getBalancesReceive(true), newbalances);

                let balanceNew: number = this._db.getBalanceReceive();

                if (difference.length) {
                    this._db._saveBalancesReceive();
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


        downloadBalancesChange(callBack: Function, onError: Function): void {
            // var diff:VOBalanceDiff[] = [];

            var addresses: string[] = this._db.getAddressesChange();

            if (addresses.length === 0) {
                this.newBalanceChange = 0;
                callBack([]);
                return;
            }

            //  console.log(' addresses change: ' + addresses);

            let currentAddressChange: string = this._db.getCurrentAddressChange();

           // console.log(this.name + ' current address change ' + currentAddressChange + ' total: ' + addresses.length);
            //   console.log(this.name + ' downloadBalancesChange ' + addresses.length);


            this.downloadBalances(addresses).done(newbalances => {

                let delta: number = 0;
              //  console.log(addresses.length + '<= addresses length balances  => ' + newbalances.length);

                let balanceOld = this._db.getBalanceChange();

                let difference: VOBalance[] = Utils.updateBalances(this._db.getBalancesChange(true), newbalances);


                var balanceNew: number = this._db.getBalanceChange();

                if (difference.length) {
                    this._db._saveBalancesChange();
                   // console.warn(' balances change difference ', difference);
                }
                ;

                delta = balanceOld - balanceNew;
                var precision = balanceNew / 1e5;
                //console.log(newbalances);

                // console.log(delta + ' ' + precision );


                if (Math.abs(delta) > precision) {

                    console.log('%c ' + this.name + ' balances change delta more then precision ' + delta + ' precision ' + precision, 'color:red');


                    let curChange = this._db.getCurrentAddressChange();

                    let balanceOnCurrent: number = Utils.filterBalanceOnAddress(curChange, difference);


                   // console.log(' on current address change ' + currentAddressChange + ' balance: ' + balanceOnCurrent);
                    if (balanceOnCurrent) {
                        console.log('%c  got balance on current change moving next address change ', 'color:red');
                        this.goToNextIndexChange();
                    }

                    //  console.log('%c'+this.ON_BALANCE_CHANGE_CHANGE + ' new:  ' + balance/1e15 + ' old ' + old/1e15,'color:#f00')
                    console.log(this.ON_BALANCE_CHANGE_CHANGE, difference);

                    this.balances$.triggerHandler(this.ON_BALANCE_CHANGE_CHANGE, [difference]);

                } else {
                    delta = 0;

                   // console.log('%c' + this.name + ' same balance change ' + balanceOld / 1e15, 'color:#f99');
                }

                // console.log('change',diff);
                callBack(difference, delta);

            }).fail(err => onError(err));
        }


    }
}



