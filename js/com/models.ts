/**
 * Created by Vlad on 10/6/2016.
 */
    ///<reference path="../../typings/jquery/jquery.d.ts"/>

    ///<reference path="../../typings/lodash/lodash.d.ts"/>
    ///<reference path="../services/account-service.ts"/>
    ///<reference path="Registry.ts"/>




interface OptionsCrypto{
    urlBalance:string;
    urlTransactions:string;
    urlTransactions2?:string;
    urlTransactionStatus?:string;
    urlTransactionInternal?:string;
    apiKey:string;
    hd_index:number;
    name:string;
   // API:any;
   // APIs:any;
    balanceParser?:(resp: any)=> VOBalance[];
}





declare interface EventEmmiter extends JQuery {

}

interface HistoryResult{
    index:number;
    addresses:string[];
    transactions:VOTransaction[];
}

interface HistoryResult2 extends HistoryResult{
    relayedTransactionListArray:VORelayedTransactionList[];
}


interface AppState{
    create:{
        newWallet:boolean,
        express:boolean,
        custom:boolean
        coins:number[],
        currencies:number[]
    }
    pair:{
        newWallet:boolean,
        express:boolean,
        custom:boolean
        coins:number[],
        currencies:number[]
    }
    createType:string // Express or Custom
}



class VOTransactionEther {
    blockNumber;
    confirmations;
    deltaBalance;
    deltaDAO = 77777;
    gasCost;
    timestamp;
    toAddress;
    toAddressFull;
    txid;

    constructor(t:VOTransaction) {
        this.blockNumber = t.block;
        this.confirmations = t.confirmed;
        this.deltaBalance = t.value + '';
        this.gasCost = t.miningFee;
        this.timestamp = t.timestamp;
        this.toAddressFull = t.to;
        this.toAddress = t.to.substr(0, 5) + '...' + t.to.substr(t.to.length - 5);
        this.txid = t.id;
    }
}

interface IMobileRequest {
    wait():void;
    resume():void;
    destroy():void;
    reset():void;
    abort():IMobileRequest;
    progress:number;
}

////////////////////    main intrface between application and implementations



interface IRequestServer {
    initialize():void;
    downloadTransactionsUnspent(addresses:string[]):JQueryPromise<{result:any[],utxos:VOTransactionUnspent[]}>;
    generator:jaxx.GeneratorBlockchain;
   // getMiningFees():number;
    downloadBalances(addresses:string[]):JQueryDeferred<VOBalance[]>
    restoreHistory(receive_change:string):JQueryDeferred<{index:number, addresses:string[], transactions:VOTransaction[], relayedTransactionListArray:VORelayedTransactionListAndUTXOsForAddress[]}>
    restoreHistory2(receive_change:string, startIndex:number):JQueryDeferred<{index:number, addresses:string[], txdIds:string[], transactions:VOTransaction[]}>

    downloadTransactionsForAddress(address:string):JQueryPromise<VOTransaction[]>;
    downloadTransactions(addresses:string[]):JQueryDeferred<VOTransaction[]>;
    checkAddressesForTranasactions(addresses:string[]):JQueryDeferred<string[]>;
    downloadTransactionsDetails(txsIds:string[]):JQueryDeferred<{result:any[], transactions:VOTransaction[]}>

}
/////////////////////////////////////

/*interface IAccountService{
 setRelay(relay:any):void;
 setAccounts(accounts:string[]):IAccountService;
 loadBalance(addresses:string[]):JQueryDeferred<VOBalance[]>
 loadTransactionHistory(addresses:string[]):JQueryDeferred<VOTransaction[]>;
 checkTransaction(trs:VOTransaction):JQueryDeferred<VOTransaction>;

 }*/

// Usage Examples:
// g_JaxxApp.getDataStoreController().getCryptoControllerByCoinType(COIN_ETHEREUM).activate()
// g_JaxxApp.getDataStoreController().getCryptoControllerByCoinType(COIN_ETHEREUM).getUTXOs()

interface CoinDB{
    activate(): any;
    deactivate(): any;
}

interface EthereumDB extends CoinDB{
    transactionController:any;
    getAddressReceive(i:number):string;
}

interface BitcoinDB{

}

interface IControllerDB {
    activate(): JaxxCryptoController
    deactivate(): void;
    hasIndexes(): boolean; // 
    getHighestAccountBalanceAndIndex(): {index: number,balance: number, address: string};
    prepareAddresses(addresses: string[]): JQueryPromise<any>;
    getUTXOs(): VOutxo[];




    ///Balances//////////////

    getSpendableBalanceDB(minimumValue:number): number;
    getBalanceSpendableDB(fee?: number): number;


    getBalanceTotalDB(): number;
    getBalancesForAmount(amount: number): VOBalance[];
    getBalancesHighestFirst(): VOBalance[];
    getBalancesNot0(): VOBalance[];
    getBalancesSpendableDB(): VOBalance[];
    getBalancesNot0Amounts(): number[];
    ///Addresses/////////////
    getPrivateKeyDB(isChange: boolean, index: number): any;
    getKeyPairReceive(address: string):any;
    getKeyPairChange(address: string): any;
    getKeyPairChange(address: string): any;
    isMyAddressDB(address: string): boolean;
    isMyAddressReveive(address: string): boolean;
    isMyAddressChange(address: string): boolean;
    isAddressInternal(address: string): number;
    getAddressIndex(address: string): number;
    getAddressIndexReceive(address: string): number;
    getAddressIndexChange(address: string): number;
    getAddressChange(i: number): string;
    getAddressReceive(i: number): string;
    getCurrentPublicAddresReceive(): string;
    getCurrentAddressChange(): string;
    getCurrentIndexReceive(): number;
    getCurrentIndexChange(): number;
    getAddressesReceive(): string[];
    getAddressesChange(): string[];
    getAddressesAll(): string[];
    getBalances(): VOBalance[];

    getTransactionsAll():VOTransaction[];


    downloadAllBalances(onSuccess: Function, onError:Function):void;
    restoreHistoryAll(onSuccess: Function, onError:Function): void;
    checkBalanceCurrentReceive(): void
}

interface RelayBitcoin {
    getUTXO(address:string)
}

interface IDataModel {

    status$:EventEmmiter //ON_READY | ON_ERROR | ON_NO_SERVICE  |
    getBalance():number;
    getCurrentName():string;
    totalChange$:EventEmmiter // evt,number
    getHistory():VOTransaction[] ///
    historyChange:EventEmmiter;
    onNewTransactions$:EventEmmiter; //evt, VOTransaction[]
    //sendTransaction(trans:VORawTransaction):JQueryDeferred<RawTransactionResult>
    onSendTransactionConfirmed$:EventEmmiter //evt , isConfirmed, transactionid

    switchTo(cointType:string):void;
    setDefault(coinType:string):void;
    activate(coinType:string):void;
    refreshHistory(coinType:string):void
    finalized$:EventEmmiter//evt
    sleep():void;
}

class VOBalance {
    id:string; // one to one  address id
    balance:number;
    timestamp:number;
    index:number;
    confirmed:boolean;
    delta:number;
    constructor(obj:any) {
        for (var str in obj) this[str] = obj[str];
    }
}

class VOBalanceTemp {
    id: string;
    spent: number;
    fee: number;
    to: string;
    from: string;
    txid: string;
    value: number;
    count: number;
    timestamp: number;

    constructor(obj: any) {
      for (let str in obj) this[str] = obj[str];
    }

}


class VOBalanceSend {
    id: string;
    balance: number;
    index: number;
    timestamp: number;
    keyPair: any;
    nonce: number;
    spent: number;
    fee: number;

    constructor(obj:any) {
      for (let str in obj) this[str] = obj[str];
    }
}

class VOBalanceDiff {
    id: string;
    old_new: number;
    balance_new:number;

  constructor(b_old:VOBalance,b_new:VOBalance) {
    this.id=b_old.id;
    this.balance_new = b_new.balance;
    this.old_new = b_old.balance - b_new.balance;
  }
}

class VOBuiltTransaction {
    id:string;
    hex:string;
    addressFrom:string;
    addressTo:string;
    timestamp:number;

    constructor(obj:any) {
        for (var str in obj) this[str] = obj[str];
    }

}
/* export class VOSendTransactionResult{
 message:string;
 confirmed:boolean;
 error:number;
 }*/

class VOTransactionStatus {
    txid:string;
    status:string;
    error:string;
    success:boolean;

    constructor(obj:any) {
        for (var str in obj) this[str] = obj[str];
    }
}
class VOTransactionStart {
    id:number;
    addresses:string[];
    amount:number;
    amount_inLarge:number;
    feePrice:number;
    feeLimit:number;
    data:any;
    signed:boolean;
    txArray:VOTXItem[];
    balances:VOBalance[];
}

//////////////////////////////////////Bitcoin send transaction /////////////////////

class VOTransactionSent{
    txid:string;
    timestamp:number;
    fee:number;
    inputs:VOInput[];
    outputs:VOOutput[];

    constructor(obj:any) {
      for (let str in obj) this[str] = obj[str];
      if(this.inputs) this.inputs = this.inputs.map(o=>new VOInput(o));
      if(this.outputs) this.outputs = this.outputs.map(o=>new VOOutput(o));
    }
}

class VOTransactionSentObj{
    sent:VOTransactionSent;
    fee:number;
    toSpent:VOOutput[];
    constructor(obj:any){
      this.sent = new VOTransactionSent(obj._kkMockTx);
      this.fee = obj._kkTransactionFee;
      this.sent.fee = obj.fee;
      if( Array.isArray(obj._kkToSpend)) this.toSpent = obj._kkToSpend.map(o=>new VOOutput(o));

    }

}
/////////////////////////////////////////////////////////////////////////////////////
class VOSendTransactionResult {
    id:number;
    //balancesTempReceive:VOBalanceTemp[];
    //balancesTempChange:VOBalanceTemp[];
    balancesSent:VOBalance[];
    balancesSmall:VOBalance[];
    timestampStart:number;
    timestampEnd:number;
    success:boolean;
    amount:number;
    amountSent:number;
    results:any[];
    transactions:VOTransaction[];
    error:any;
}

interface ITransaction{
    id:string;
    timestamp:number;
    fee:number;
    confirmations:number;
    block:number | string;
    from:string;
    to:string;
    amount:number;
}

class VOInput2{
    address:string;
    amount:number;
    constructor(obj:any) {
        this.address = obj.address;
        this.amount = +obj.satoshis;
    }
}
class VOOutput2{
    address:string;
    amount:number;
    spent:boolean;
    constructor(obj:any) {
        this.address = obj.address;
        this.amount = +obj.satoshis;
    }
}
class VOTransactionRaw implements ITransaction{
    id:string;
    timestamp:number;
    fee:number;
    fee2:number;
    confirmations:number;
    block:number | string;
    from:string;
    to:string;
    amount:number;
    amount2:number;


    constructor(obj:any) {
        // console.log(obj)
        this.id = obj.hash;
        this.block = obj.height;
        this.confirmations = obj.confirmations;
        this.timestamp = Math.round(new Date(obj.time_utc).getTime());
        let t1:number=0;
        let t2:number =0;
        obj.vin.forEach(function (o) {
            t1+= +o.amount;
            t2+= +o.satoshis;
        });
        obj.vout.forEach(function (o) {
            t1+= +o.amount;
            t2+= +o.satoshis;
        });

        /// let totalInputs:number = obj.vin.reduce(function (a,b) { return a+= +b.amount},0);
        // let totalOuts:number = obj.vout.reduce(function (a,b) { return a+= +b.amount},0);

        this.fee = t2//t1;
        this.fee2 = t2;
        this.from = obj.vin[0].address;
        let last:number = obj.vout.length - 1;

        this.to = obj.vout[last].address;
        this.amount2 = +obj.vout[last].amount;
        this.amount = +obj.vout[last].satoshis;
    }
}




class VOSendTransaction {
    id:number;
    balancesReceive:VOBalance[];
    balancesChange:VOBalance[];
    fee:number;
    gasLimit:number;
    amount:number;
    toAddress:string;
    changeAddress:string;
}


/*
 }
 */
/*  class VORawTransactionResult{
 id:string;
 result_id:number;
 confirmed:boolean;
 starttimestamp:number;
 constructor(obj: any) {
 for (var str in obj) this[str] = obj[str];
 }
 /!*result:string;
 error:string;
 message:string;
 timestamp:number;
 confirmed:boolean;*!/

 }*/

/*  class VOSendTransaction{
 id:number;
 amount:number;
 miningFee:number;
 feeLimit:number;
 feePrice:number;
 feeSpent:number;
 from:string;
 to:string;
 toAddresses:string[];
 timestamp:number
 data:any;
 signed:boolean;
 }
 */
/* class VOSendRawTransaction{
 id:number;
 amount:number;
 miningFee:number;
 taxPrice:number;
 coinType:string;
 from:string;
 to:string;
 toAddresses:string[];
 timestamp:number
 hex:string;

 }*/


/*
 *
 jaxx_ui.js:1219 Object {toAddress: "Self", toAddressFull: null, blockHeight: 432568, confirmations: 5501,
 deltaBalance: -20000…}*/


class VOTransactionView {
    toAddressFull:string;
    blockHeight:number;

    toAddress:string;
    confirmations:number;
    timestamp:number;
    miningFee:number;
    txid:string;
    deltaBalance:string;

    constructor(obj:any) {
        for (var str in obj) this[str] = obj[str];
    }

}



class VOTransaction {
    id:string;
    address:string;
    from:string;
    to:string;
    value:number
    miningFee:number;
    nonce:number;
    confirmed:boolean;
    timestamp:number;
    block:number = -1;

    //@note: shared data from bitcoin inputs & bitcoin outputs.
    confirmations:number;

    amount:number;
    index:number;
    standard:boolean;


    output:boolean;
    //@note: unique data from bitcoin outputs.
    spent: boolean;

    gasUsed:number;
    gasPrice:number;

    input:boolean;
    //@note: unique data from bitcoin inputs.
    previousTxId:number;
    previousIndex:number;
    isTemp:boolean;

    //

    constructor(obj:any) {
        for (var str in obj) this[str] = obj[str];
    }

}

class TransactionCheckModel{
    id:string;
    address:string;
   // emitter$: JQuery = $({});
    //ON_IN_LIST:string = 'ON_IN_LIST';
    //ON_NOT_IN_LIST: string = 'ON_NOT_IN_LIST';

}

class VOutxo{
    id:string
    address:string;
    addressIndex:number;
    addressInternal:number;
    amount:number;
    index:number;
    confirmations:number;
    amountBtc:string;
    txid:string;
    previousTxId:string;
    standard:boolean;
    timestamp:number;
    inqueue:boolean;
    spent:boolean;
    queueTimesatmp:number;
    vout:number;
    constructor(obj:any) {
      for (let str in obj) this[str] = obj[str];

    }
}

class VOInput{
    address:string;
    addressIndex:number;
    addressInternal:number;
    amount:number;
    previousIndex:number;
    txid:string;
    previousTxId:string;
    standard:boolean;
    timestamp:number;

    constructor(obj:any) {
      for (let str in obj) this[str] = obj[str];
    }
}

class VOOutput{
    address:string;
    addressIndex:number;
    addressInternal:number;
    amount:number;
    previousIndex:number;
    previousTxId:string;
    standard:boolean;
    confirmations:number;
    index:number;
    spent:boolean;
    timesatamp:number;
    txid:string;

    constructor(obj:any) {
      for (let str in obj) this[str] = obj[str];
    }

}

class VOTransactionUnspent {
    id:string;
    txid:string;
    address:string;
    addressIndex:number;
    addressInternal:number;
    amount:number;
    amountBtc:string;
    confirmations:number;
    index:number;
    spent:boolean;
    statdard:boolean;
    dirty:boolean;
    timestamp:number;
    constructor(obj:any) {
      for (let str in obj) this[str] = obj[str];
      this.id = this.txid;
    }

}


/*  class VOTransactionTemp extends VOTransaction{
 balance:number;
 dirty:boolean;
 constructor(obj:any){
 super(obj);
 }
 }*/

interface VOMockTx {
    addressIndex:number
    addressInternal:boolean;
    blockNumber:number;
    confirmations:number;
    from:string//   "0x17812e9a4fda164f0e07fb959a038559ab83b628"
    gasPrice:number
    gasUsed:number;
    hash:string; // "0x1bbbe6fa6eb75e1196298165f3f46f41b4f33281a9a2ab135931dbd62bf6637d"
    nonce:number;
    timestamp:number; // 1476912457.555
    to:string;//  "0xe61b1a94AD37a6ea6B41823429fB6593F511E614"
    txid:string;// "0x1bbbe6fa6eb75e1196298165f3f46f41b4f33281a9a2ab135931dbd62bf6637d"
    valueDelta:number;//  -9559000000000000
    receive_change:string;
}

interface VOTXItem {
    _fields:string[];
    _mockTx:VOMockTx;
    data:Function;
    from:Function;
    to:Function;
    gasLimit:Function;
    gasPrice:Function;
    nonce:Function;
    r:Function;
    s:Function;
    serialize():any;
}

/*class VOAccount{
 id:string;  // one to one  address id
 address_id:string;  // for DB development
 balance:number;
 status:string;
 label:string;
 description:string;
 constructor(obj){
 for (var str in obj) this[str] = obj[str];
 }


 }*/

class VOAddress {
    id:string;  // one to one  address id
    change_receive:string;
    transactions:VOTransaction[];

    constructor(obj) {
        for (var str in obj) this[str] = obj[str];
    }


}

/*
 class VOInit{
 coinType:string;
 mnemonic:string;
 storageKey:string;
 networkType:string;
 }*/

class VORelayedTransactionList {

  address:string = "undefined address";

  txListDict:_.Dictionary<ReferenceRelaysTxDetailsData> = {};

  utxoListDict:_.Dictionary<ReferenceRelaysUTXOData> = {};

  constructor(obj:any) {
    for (let str in obj) {
      this[str] = obj[str];
    }
  }
}




class VORelayedTransactionListAndUTXOsForAddress {
    address:string = "undefined address";
    txListDict:_.Dictionary<ReferenceRelaysTxDetailsData> = {};
    utxoListDict:_.Dictionary<ReferenceRelaysUTXOData> = {};


    constructor(obj:any) {
        for (var str in obj) {
            this[str] = obj[str];
        }
    }
}

class VORelayedUTXOData {
    address: string;
    utxoData: ReferenceRelaysUTXOData;


    constructor(obj:any) {
        for (var str in obj) {
            this[str] = obj[str];
        }
    }
}


class ReferenceRelaysTxListData {
    data:{
        address:string,
        txs:{
            txHash:string
        }[],
        unconfirmed:{
            txs:{
                txHash:string
            }[]
        }
    }[] = [];


    constructor(obj:any) {
        for (var str in obj) {
            this[str] = obj[str];
        }
    }
}


//@note: @reference:
//     txid: primaryUTXOData.txid,
//     index: primaryUTXOData.index,
//     confirmations: primaryUTXOData.confirmations,
//     amount: primaryUTXOData.amount,
class ReferenceRelaysUTXOData {
    txid:string = "unknown txid";
    index:number = -1;
    confirmations:number = -1;
    amount:number = -1;


    constructor(obj:any) {
        for (var str in obj) {
            this[str] = obj[str];
        }
    }
}


//@note: @reference:
//     txid: primaryTxDetailData.txid,
//     block: primaryTxDetailData.blockheight,
//     confirmations: primaryTxDetailData.confirmations,
//     time_utc: primaryTxDetailData.time,
//     inputs: inputs,
//     outputs: outputs
class ReferenceRelaysTxDetailsData {
    txid:string = "unknown txid";
    block:number = -1;
    confirmations:number = -1;
    time_utc:number = -1;
    inputs:ReferenceRelaysUTXOInput[] = [];
    outputs:ReferenceRelaysUTXOOutput[] = [];


    constructor(obj:any) {
        for (var str in obj) {
            this[str] = obj[str];
        }
    }
}


//@note: @reference:
//     address: input.addr,
//     amount: parseFloat(-input.value).toFixed(8),
//     index: i,
//     previousTxId: input.txid,
//     previousIndex: input.vout,
//     standard: !(input.scriptSig === 'null')
class ReferenceRelaysUTXOInput {
    address:string;
    amount:number;
    index:number;
    previousTxId:number;
    previousIndex:number;
    standard:boolean;


    constructor(obj:any) {
        for (var str in obj) {
            this[str] = obj[str];
        }
    }
}

//@note: @reference:
//     address: output.scriptPubKey.addresses[0],
//     amount: output.value,
//     index: i,
//     spent: !(output.spentTxId === 'null'),
//     standard: !(primaryTxDetailData.vin[0].scriptPubKey === 'null')
class ReferenceRelaysUTXOOutput {
    address:string;
    amount:number;
    index:number;
    spent:boolean;
    standard:boolean;


    constructor(obj:any) {
        for (var str in obj) {
            this[str] = obj[str];
        }
    }
}



