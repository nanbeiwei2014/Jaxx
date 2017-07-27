///<reference path="../js/com/models.ts"/>
///<reference path="test-send-transaction.ts"/>
var mytest;
var testtrs;


$(document).ready(function(){
  // console.error('reday');
  if(testtrs) return;
  // mytest = new test.MyTest();

  testtrs = new test.TestSendTransaction();
})

module test{

    export function getBalances():VOBalance[]{
    return jaxx.Registry.current_crypto_controller.getBalances();
    }
    export function getBalancesNot0():VOBalance[]{
        return jaxx.Registry.current_crypto_controller.getBalancesNot0();
    }

    export function getBalancesChange():VOBalance[]{
        return jaxx.Registry.current_crypto_controller.getBalancesChange();
    }

    export function getBalancesReceive():VOBalance[]{
        return jaxx.Registry.current_crypto_controller.getBalancesReceive();
    }
    export function currentAddressReceive():string{
        return jaxx.Registry.current_crypto_controller.getCurrentPublicAddresReceive();
    }

    export function currentAddressChange():string{
        return jaxx.Registry.current_crypto_controller.getCurrentAddressChange();
    }
    export function getBalanceTemp():number{
        return jaxx.Registry.current_crypto_controller.getBalanceTemp();
    }

    export function getDatastore():any{
        return jaxx.Registry.current_crypto_controller._db;
    }



    import JaxxAccountService = jaxx.JaxxAccountService;

    declare var thirdparty:any;




    export class MyTest{







        ctr:JaxxCryptoController;
        main:JaxxDatastoreController;
        testSEnd:TestSendTransaction

        init():void{

            this.main = jaxx.Registry.datastore_controller_test;
            //this.testSEnd = new TestSendTransaction(this.main);
            console.log(this.testSEnd);
        }


        constructor(){
            setTimeout(() => {
                this.init();
            },5000);
        }





        start():void{

            this.testSEnd.sendOne();

        }

        stop():void{

        }


        sendOneTransaction():void{

        }

        test001(){

            var address:string = '0x35bc7e479cd875f379bfd32e382216e318d1ca1a';
            var txid = '0xc6185a37cc205c7f94eb1312ef1012c56df1ab327789289843b2abb1603ba378'
            var txid = "0x08b3de41b72ee2e7456e64a4f75d856abed6015a1f84e883995a34381ad0babc";

            console.warn('test 001 testing transaction '+ txid + ' exists in address ' + address);

            var ctr:JaxxCryptoController = this.main.getCryptoControllerByName('Ethereum');
            var service:JaxxAccountService = ctr._accountService;

            /*service.checkTransactionByAddress(txid, address)
                .done(res => console.warn(res));*/

        }

        test01(){
            console.warn('test 01');
            var ctr:JaxxCryptoController = this.main.getCryptoControllerByName('Ethereum');
            var service:JaxxAccountService = ctr._accountService;
            /*service.getTransactionStatus('0xc6185a37cc205c7f94eb1312ef1012c56df1ab327789289843b2abb1603ba378')
             .done(res => console.warn(res));*/

        }

        test1(){

            console.warn('test 1');
            var ctr:JaxxCryptoController = this.main.getCryptoControllerByName('Ethereum');

            ctr._pouch.setCurrentReceiveAddress(' hello');
            ctr._pouch._notify('new address');
            console.log(ctr._pouch.getCurrentReceiveAddress());

            // console.warn('test 1');

            //console.log(this.ctr);
            ///setTimeout(() => this.runTest(),1000);
            // this.runTest2();
            //this.runTest();
            // this.runTest2();
            // this.restoreHistoryAll();
            // this.test3();
        }

        test2(){
            console.warn(' test 2 ');

            var ctr:JaxxCryptoController = this.main.getCryptoControllerByName('Ethereum');
           // ctr.resetTempBalances();

        }

        test3(){
            this.testSEnd.sendOne();
            //sending
           /* var ctr:JaxxCryptoController = this.main.getCryptoControllerByName('Ethereum');

            var address:string = ctr.getCurrentPublicAddresReceive();

            var amount:number =   ctr.getBalanceSpendable()/5;
            ctr.sendAmountToAddress(address,amount,address);*/
        }




        test5(){
            console.log('test 5');
            this.ctr = this.main.getCryptoControllerByName('Ethereum');

            var start:number = Date.now();
            var service:jaxx.JaxxAccountService = this.ctr._accountService;
            var addresses:string[] = [];

            for(var i = 100 ; i<120;i++){
                addresses.push(service.getAddressReceive(i));

            }
            var end:number = Date.now();
            console.warn(' generate 20 addresses takes '+ (end -start));
            alert(' generate 20 addresses takes '+ (end -start));
        }

        test6():void{
            console.log('test 6');
            var start:number = Date.now();

            for(var i = 0 ; i<20;i++) {
                var uri: string = '0x86abFd0FC05a736D32AB265050Ee994e93d91d80 0x86abFd0FC05a736D32AB265050Ee994e93d91d80' +i;
                var qrcode = "data:image/png;base64," + thirdparty.qrImage.imageSync(uri, {
                        type: "png",
                        ec_level: "H",
                        size: 5,
                        margin: 1
                    }).toString('base64');
            }
            var end:number = Date.now();
            //console.warn(' generate 20 qrcodes takes '+ (end -start));
            alert(' generate 20 qrcodes takes '+ (end -start));

        }

        runTest2(){
            console.log(this.ctr._db.getCurrentIndexReceive());
            console.log(this.ctr._db.getAddressesReceive().length);
            console.log(this.ctr._db.getBalancesReceive().length);
        }



        getTrm(){
          //  return this.main._currentCryptoController;
        }
        runTest():void{

            var balancesNot0 = this.ctr._db.getBalancesNot0();

            var fee:number = this.ctr._accountService.getMiningFees();

            console.log(balancesNot0);

            var out:VOBalance[] =[];
           /* balancesNot0.forEach(balance =>{
                // console.log(balance);
                if(balance.balance>fee){
                    var address:string = balance.id;
                    var i:number = this.ctr._db.getAddressesReceive().indexOf(address);
                    console.log('address i '+ i  + '  ' + address);
                    var keyPair:any =  this.ctr._accountService.getKeyPairReceive(i);
                    //  console.log(keyPair);
                    balance.keyPair = keyPair;
                    out.push(balance)
                } else{
                    console.warn(' balance dont have to cover fees ',balance);

                }

            });*/

            // out.shift();
            // out.shift();
            console.log(out);

            var amount:number = jaxx.Utils.calculateBalanceSpendable(out,fee);

            var transaction:VOSendTransaction = new VOSendTransaction();

            transaction.toAddress = this.ctr.getCurrentPublicAddresReceive();
            transaction.balancesReceive = out;
            transaction.amount = amount;
            //transaction.fee = fee;
            //transaction.gasLimit = 21000;

          /*  this.ctr._accountService.sendTransactin2(transaction).done((res) =>{
                console.warn('sendTransactin2 result  ',res)
            });*/
            /*console.log(Utils.calculateBalanceSpendable(balancesNot0,20000))
             console.log(this._db.getCurrentAddressReceive())*/

            // this.restoreHistoryAll(null);
            // var balances:VOBalance[] = this._db.getBalancesReceive();

//console.warn(balances)
            //var tr = this.getTransactionsForAddress('0x0bf897372c8c1f3b431b3be7e83baa32a0716a24');
            //console.warn(tr);

            // var testAddresses:string[] = ['0x7590785d7d69918bb92f229b4eff0920cb261d1d','0xb9793ba5eb26e281b22faf67be85b0dd394c1f1e','0x8e48a17dbe7a929213e89b0b41dd3a2d5a2a51d3']
            //this._accountService.downloadTransactions(testAddresses).done(res =>console.error(res));

            //var voaddresses:VOAddress[] = _.map(testAddresses,(o)=>new VOAddress({id:o}));

            /*
             this._accountService.downloadTransactions2(voaddresses).done(res=>{
             console.warn(res);
             });*/

            //console.log( ' this._accountService.downloadTransactions   ')

            //this.startTransactionCheck(testAddresses);
            /* this._accountService.downloadTransactions(testAddresses).done(res=>{
             console.warn(res);
             });*/

            /*  var testTransaction:string = '{"addresses":["0x631DD2637910D6fDbdEB85FC6a7d606f88e2C325"],' +
             '"amount":"50000000000000000.0","feePrice":21000000000,' +
             '"feeLimit":21000,"data":null,"signed":null}'

             var trs:any = JSON.parse(testTransaction);

             console.log(trs);

             var builtTransactions = this._pouch._coinPouchImpl.buildEthereumTransactionList(trs.addresses, trs.amount, trs.feePrice,
             trs.feeLimit, trs.data, trs.signed);
             */
            /* this._accountService.sendBuiltTransactions(builtTransactions.txArray).done(res =>{
             console.warn(res);
             }).fail(err => this.onError(err));*/
            //this.onSendTransaction(JSON.parse(this.testTransaction));
        }

      /*  clearBalancesTemp():any{
            var ctr = this.main.getCryptoControllerByName('Ethereum');
            return ctr.clearBalancesTemp();
        }

        getBalancesTemp():any{
            var ctr = this.main.getCryptoControllerByName('Ethereum');
            //return ctr.getBalancesTemp();
        }

        nonces():any{
            var ctr = this.main.getCryptoControllerByName('Ethereum');
            return ctr.getNonces();
        }*/



    }

}




/*

  export class VOTXProcessed {
    id: string;
    processed: boolean;
    constructor(obj: any) {
      for (var str in obj) this[str] = obj[str];
    }
  }



  function myfunv(myargs){

  }
  export class VOTransaction {
    id: string;
    accountBalance: number;
    accountTXProcessed: VOTXProcessed[]
    index: number
    internal: number;
    isTheDAOAssociated: boolean;
    newSendTX: string;
    nonce: number;
    updatedTimestamp: number;
    used: boolean;
    coinType:string;


    constructor(obj: any) {
      for (var str in obj) this[str] = obj[str];
      if(obj.accountTXProcessed){
        var ar:VOTXProcessed[] =[];
        for (var str2 in obj.accountTXProcessed) {
          ar.push(new VOTXProcessed({id:str2, processed:obj.accountTXProcessed[str2]}))
        }
        this.accountTXProcessed = ar;
      }
      var myfunc = function(gghhj){

      }
    }

  }
//////////////////////////////////////////////////////////

  export class DataUtils {
    static isTwoEqual(item1: VOTransaction, item2: VOTransaction): boolean {
      var same: boolean = true;
      for (var str in item1) if (item1[str] != item2[str]) return false;
      return true;
    }

    static  selectById(id: string, ar: VOTransaction[]): VOTransaction[] {
      return ar.filter(function (item: VOTransaction) {
        return item.id=== id;
      })
    }


    static isDataEual(ar1: VOTransaction[], ar2: VOTransaction[]): boolean {

      for (var i = 0, n = ar1.length; i < n; i++) {
        var item: VOTransaction = ar1[i];
        var items = DataUtils.selectById(item.id, ar2);
        if (items.length) {
          if (!DataUtils.isTwoEqual(item, items[0])) return false
        } else return false;
      }
      return true;
    }

    static getDifferense(ar1: VOTransaction[], ar2: VOTransaction[]): VOTransaction[] {
      var diff:VOTransaction[]=[]
      for (var i = 0, n = ar1.length; i < n; i++) {
        var item: VOTransaction = ar1[i];
        var items = DataUtils.selectById(item.id ,ar2);
        if (items.length) {
          if (!DataUtils.isTwoEqual(item, items[0])) {
            diff.push(item)
            diff.push( items[0]);
          }
        };
      }
      return diff;
    }
    static getDuplicates(data: VOTransaction[]): VOTransaction[] {
      var ar: VOTransaction[] = []
      var obj: any = {};
      data.forEach(function (item: VOTransaction) {
        if (obj[item.id])  ar.push(item);
        else obj[item.id] = item;
      })
      return ar;
    }


    static parseData(obj: any, coinType:string): VOTransaction[] {
      var ar: VOTransaction[] = [];
      for (var str in obj) {
        var t = obj[str];
        t.id = str;
        t.coinType = coinType;
        var tr:VOTransaction = new VOTransaction(t);
        ar.push(tr);
      }
      return ar;
    }


  }

///////////////////////////////////////////////////////////////////////////////


  export class VOAddresses{
    network:string;
    current:string;
    next:string;
    start:string;
    all:string[];

    constructor(obj: any) {
      for (var str in obj) this[str] = obj[str];

    }
  }


  export class DataModel{
    data:VOTransaction[];
    addresses:VOAddresses;

    inprocess:VOTransaction[];

    constructor(obj,private coinType:string){
      console.log(coinType);
      this.data = DataUtils.parseData(obj,coinType);
    }

    getDuplicates():VOTransaction[]{
      return  DataUtils.getDuplicates(this.data);
    }


    getTotal():number{
      var total:number = 0
      this.data.forEach(function(tr:VOTransaction){
        total+=tr.accountBalance || 0;
      })
      return total;
    }

    saveAddresses():void{

      localStorage.setItem('addersses_'+this.coinType,JSON.stringify(this.addresses));
    }

    loadAddresses():VOAddresses{

      var str:string= localStorage.getItem('addersses_'+this.coinType);
      if(str) return JSON.parse(str);
      return null;
    }
  }


  export class DataCollection{
    prev:DataModel;
    data:DataModel[]=[];
    onTotalChanged:Function;
    onLengthChanged:Function;
    ///static types:string[]=['','COIN_BITCOIN','COIN_ETHEREUM','COIN_THEDAO_ETHEREUM:number','COIN_DASH','COIN_NUMCOINTYPES'];


    max:number=30;
    onAdded:Function;

    total:number=0;
    transLength:number=0;

    constructor( public id:string){
      var saved=localStorage.getItem('DataCollection_'+this.id);
      if(saved)this.addModel(new DataModel(JSON.parse(saved),this.id));
      console.log(this.total);
    }
    getTotal():number{
      if(this.data.length)  return this.data[this.data.length-1].getTotal();
      console.error(' no date in collection');
      return 0;
    }
    saveLast():void{
      if(this.data.length) localStorage.setItem('DataCollection_'+this.id,JSON.stringify(this.data[this.data.length-1]))
    }

    getModel():DataModel{
      return this.data[this.data.length-1];
    }

    addData(obj:any):DataCollection{
      var model = new DataModel(obj,this.id);
      this.addModel(model);
      return this;
    }

    addModel(model:DataModel):void{
      var length:number = model.data.length;
      if(this.onLengthChanged && this.transLength !==length) this.onLengthChanged({prev:this.transLength,curr:length});
      this.transLength = length;

      var total:number = model.getTotal();
      if(this.onTotalChanged && this.total!==total)this.onTotalChanged({prev:this.total,curr:total});
      this.total = total;

      if(this.data.length>this.max) this.data.shift();
      this.data.push(model);
      if(this.onAdded) this.onAdded(this.data.length);
    }

    getById(id:string):VOTransaction[]{
      if(this.data.length){
        var model:DataModel = this.data[this.data.length-1];
        return model.data.filter(function (item: VOTransaction) {
          return item.id === id;
        })
      }
      return null;
    }

  }



  export class All{
    static types:string[]=['','COIN_BITCOIN','COIN_ETHEREUM','COIN_THEDAO_ETHEREUM','COIN_DASH','COIN_NUMCOINTYPES'];
    static  dbs:any = {};

    static getById(ind:number):DataCollection{
      var  id = All.types[ind];
      if(!All.dbs[id])  All.dbs[id] = new DataCollection(id);
      return All.dbs[id];
    }

    static getTransById(id:string):VOTransaction[]{

      var ar = [];
      for(var str in All.dbs){
        var coll:DataCollection = All.dbs[str];
        var res = coll.getById(id);
        if(res.length) ar.push(res);
      }
      return ar;
    }

  }



*/




