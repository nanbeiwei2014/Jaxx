/**
 * Created by Vlad on 10/6/2016.
 */
///<reference path="../../typings/jquery/jquery.d.ts"/>
///<reference path="../../typings/lodash/lodash.d.ts"/>
///<reference path="../services/account-service.ts"/>
///<reference path="Registry.ts"/>
var VOTransactionEther = (function () {
    function VOTransactionEther(t) {
        this.deltaDAO = 77777;
        this.blockNumber = t.block;
        this.confirmations = t.confirmed;
        this.deltaBalance = t.value + '';
        this.gasCost = t.miningFee;
        this.timestamp = t.timestamp;
        this.toAddressFull = t.to;
        this.toAddress = t.to.substr(0, 5) + '...' + t.to.substr(t.to.length - 5);
        this.txid = t.id;
    }
    return VOTransactionEther;
}());
var VOBalance = (function () {
    function VOBalance(obj) {
        for (var str in obj)
            this[str] = obj[str];
    }
    return VOBalance;
}());
var VOBalanceTemp = (function () {
    function VOBalanceTemp(obj) {
        for (var str in obj)
            this[str] = obj[str];
    }
    return VOBalanceTemp;
}());
var VOBalanceSend = (function () {
    function VOBalanceSend(obj) {
        for (var str in obj)
            this[str] = obj[str];
    }
    return VOBalanceSend;
}());
var VOBalanceDiff = (function () {
    function VOBalanceDiff(b_old, b_new) {
        this.id = b_old.id;
        this.balance_new = b_new.balance;
        this.old_new = b_old.balance - b_new.balance;
    }
    return VOBalanceDiff;
}());
var VOBuiltTransaction = (function () {
    function VOBuiltTransaction(obj) {
        for (var str in obj)
            this[str] = obj[str];
    }
    return VOBuiltTransaction;
}());
/* export class VOSendTransactionResult{
 message:string;
 confirmed:boolean;
 error:number;
 }*/
var VOTransactionStatus = (function () {
    function VOTransactionStatus(obj) {
        for (var str in obj)
            this[str] = obj[str];
    }
    return VOTransactionStatus;
}());
var VOTransactionStart = (function () {
    function VOTransactionStart() {
    }
    return VOTransactionStart;
}());
//////////////////////////////////////Bitcoin send transaction /////////////////////
var VOTransactionSent = (function () {
    function VOTransactionSent(obj) {
        for (var str in obj)
            this[str] = obj[str];
        if (this.inputs)
            this.inputs = this.inputs.map(function (o) { return new VOInput(o); });
        if (this.outputs)
            this.outputs = this.outputs.map(function (o) { return new VOOutput(o); });
    }
    return VOTransactionSent;
}());
var VOTransactionSentObj = (function () {
    function VOTransactionSentObj(obj) {
        this.sent = new VOTransactionSent(obj._kkMockTx);
        this.fee = obj._kkTransactionFee;
        this.sent.fee = obj.fee;
        if (Array.isArray(obj._kkToSpend))
            this.toSpent = obj._kkToSpend.map(function (o) { return new VOOutput(o); });
    }
    return VOTransactionSentObj;
}());
/////////////////////////////////////////////////////////////////////////////////////
var VOSendTransactionResult = (function () {
    function VOSendTransactionResult() {
    }
    return VOSendTransactionResult;
}());
var VOInput2 = (function () {
    function VOInput2(obj) {
        this.address = obj.address;
        this.amount = +obj.satoshis;
    }
    return VOInput2;
}());
var VOOutput2 = (function () {
    function VOOutput2(obj) {
        this.address = obj.address;
        this.amount = +obj.satoshis;
    }
    return VOOutput2;
}());
var VOTransactionRaw = (function () {
    function VOTransactionRaw(obj) {
        // console.log(obj)
        this.id = obj.hash;
        this.block = obj.height;
        this.confirmations = obj.confirmations;
        this.timestamp = Math.round(new Date(obj.time_utc).getTime());
        var t1 = 0;
        var t2 = 0;
        obj.vin.forEach(function (o) {
            t1 += +o.amount;
            t2 += +o.satoshis;
        });
        obj.vout.forEach(function (o) {
            t1 += +o.amount;
            t2 += +o.satoshis;
        });
        /// let totalInputs:number = obj.vin.reduce(function (a,b) { return a+= +b.amount},0);
        // let totalOuts:number = obj.vout.reduce(function (a,b) { return a+= +b.amount},0);
        this.fee = t2; //t1;
        this.fee2 = t2;
        this.from = obj.vin[0].address;
        var last = obj.vout.length - 1;
        this.to = obj.vout[last].address;
        this.amount2 = +obj.vout[last].amount;
        this.amount = +obj.vout[last].satoshis;
    }
    return VOTransactionRaw;
}());
var VOSendTransaction = (function () {
    function VOSendTransaction() {
    }
    return VOSendTransaction;
}());
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
var VOTransactionView = (function () {
    function VOTransactionView(obj) {
        for (var str in obj)
            this[str] = obj[str];
    }
    return VOTransactionView;
}());
var VOTransaction = (function () {
    //
    function VOTransaction(obj) {
        this.block = -1;
        for (var str in obj)
            this[str] = obj[str];
    }
    return VOTransaction;
}());
var TransactionCheckModel = (function () {
    function TransactionCheckModel() {
    }
    return TransactionCheckModel;
}());
var VOutxo = (function () {
    function VOutxo(obj) {
        for (var str in obj)
            this[str] = obj[str];
    }
    return VOutxo;
}());
var VOInput = (function () {
    function VOInput(obj) {
        for (var str in obj)
            this[str] = obj[str];
    }
    return VOInput;
}());
var VOOutput = (function () {
    function VOOutput(obj) {
        for (var str in obj)
            this[str] = obj[str];
    }
    return VOOutput;
}());
var VOTransactionUnspent = (function () {
    function VOTransactionUnspent(obj) {
        for (var str in obj)
            this[str] = obj[str];
        this.id = this.txid;
    }
    return VOTransactionUnspent;
}());
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
var VOAddress = (function () {
    function VOAddress(obj) {
        for (var str in obj)
            this[str] = obj[str];
    }
    return VOAddress;
}());
/*
 class VOInit{
 coinType:string;
 mnemonic:string;
 storageKey:string;
 networkType:string;
 }*/
var VORelayedTransactionList = (function () {
    function VORelayedTransactionList(obj) {
        this.address = "undefined address";
        this.txListDict = {};
        this.utxoListDict = {};
        for (var str in obj) {
            this[str] = obj[str];
        }
    }
    return VORelayedTransactionList;
}());
var VORelayedTransactionListAndUTXOsForAddress = (function () {
    function VORelayedTransactionListAndUTXOsForAddress(obj) {
        this.address = "undefined address";
        this.txListDict = {};
        this.utxoListDict = {};
        for (var str in obj) {
            this[str] = obj[str];
        }
    }
    return VORelayedTransactionListAndUTXOsForAddress;
}());
var VORelayedUTXOData = (function () {
    function VORelayedUTXOData(obj) {
        for (var str in obj) {
            this[str] = obj[str];
        }
    }
    return VORelayedUTXOData;
}());
var ReferenceRelaysTxListData = (function () {
    function ReferenceRelaysTxListData(obj) {
        this.data = [];
        for (var str in obj) {
            this[str] = obj[str];
        }
    }
    return ReferenceRelaysTxListData;
}());
//@note: @reference:
//     txid: primaryUTXOData.txid,
//     index: primaryUTXOData.index,
//     confirmations: primaryUTXOData.confirmations,
//     amount: primaryUTXOData.amount,
var ReferenceRelaysUTXOData = (function () {
    function ReferenceRelaysUTXOData(obj) {
        this.txid = "unknown txid";
        this.index = -1;
        this.confirmations = -1;
        this.amount = -1;
        for (var str in obj) {
            this[str] = obj[str];
        }
    }
    return ReferenceRelaysUTXOData;
}());
//@note: @reference:
//     txid: primaryTxDetailData.txid,
//     block: primaryTxDetailData.blockheight,
//     confirmations: primaryTxDetailData.confirmations,
//     time_utc: primaryTxDetailData.time,
//     inputs: inputs,
//     outputs: outputs
var ReferenceRelaysTxDetailsData = (function () {
    function ReferenceRelaysTxDetailsData(obj) {
        this.txid = "unknown txid";
        this.block = -1;
        this.confirmations = -1;
        this.time_utc = -1;
        this.inputs = [];
        this.outputs = [];
        for (var str in obj) {
            this[str] = obj[str];
        }
    }
    return ReferenceRelaysTxDetailsData;
}());
//@note: @reference:
//     address: input.addr,
//     amount: parseFloat(-input.value).toFixed(8),
//     index: i,
//     previousTxId: input.txid,
//     previousIndex: input.vout,
//     standard: !(input.scriptSig === 'null')
var ReferenceRelaysUTXOInput = (function () {
    function ReferenceRelaysUTXOInput(obj) {
        for (var str in obj) {
            this[str] = obj[str];
        }
    }
    return ReferenceRelaysUTXOInput;
}());
//@note: @reference:
//     address: output.scriptPubKey.addresses[0],
//     amount: output.value,
//     index: i,
//     spent: !(output.spentTxId === 'null'),
//     standard: !(primaryTxDetailData.vin[0].scriptPubKey === 'null')
var ReferenceRelaysUTXOOutput = (function () {
    function ReferenceRelaysUTXOOutput(obj) {
        for (var str in obj) {
            this[str] = obj[str];
        }
    }
    return ReferenceRelaysUTXOOutput;
}());
//# sourceMappingURL=models.js.map