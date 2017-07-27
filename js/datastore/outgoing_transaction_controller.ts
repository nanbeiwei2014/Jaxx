/**
 * Created by Vlad on 10/31/2016.
 */

module jaxx{

    export class OutgoingTransactionController{
        id:number;
        initTransactions:VOTransaction[];
        transactionsIds:string[];
        addressesFrom:string[];
        createdTimestamp:number;
        checkInterval:any;
        onDestory:Function;
        initTransaction:VOTransactionStart;
        mockTxs:VOMockTx[];
        balancesTemp:VOBalanceTemp[];
        onHaveNonces:Function;

        destroy():void{
            clearInterval(this.checkInterval);
            this.transactionsIds = null;
            this.initTransactions = null;
            this.addressesFrom = null;
            if(this.onDestory) this.onDestory(this);
            this.onDestory = null;
        }


        constructor(private database:JaxxDatastoreLocal, private service:JaxxAccountService){
            this.createdTimestamp = Date.now();
            this.id = this.createdTimestamp;
        }

/*
        compare(transactions1:VOTransaction[],transactions2:VOTransaction[]):VOTransaction[]{

            var out:VOTransaction[] = [];
        }*/


        setBalancesUsed(balances:VOBalance[]):void{

        }

      /*  setTransaction(transaction:VOTransactionStart):void{
            this.initTransaction = transaction;
                var txItems:VOTXItem[] = transaction.txArray;
            var mockTxs:VOMockTx[] = _.map(txItems, item =>item._mockTx);
            console.log(mockTxs);

            var balances:VOBalanceTemp[] =  _.map(mockTxs, item => new VOBalanceTemp({
                                                                                    id:item.from,
                                                                                   index:item.addressIndex,
                                                                                    balance:item.valueDelta,
                                                                                    timestamp:item.timestamp,
                                                                                    transaction_id:item.hash
                                                                                    }));

            this.database.addBalancesTemp(balances);

            //this.balancesTemp = balances;
            //console.log(balances);

           // var addresses:string[] = [];
                //_.each(balances,item => addresses.push(item.id));
            //this.startAddressesCheck(addresses);
        }*/

        onNewTransactions:Function;

        checkTransactions():void{

            if(Date.now() - this.createdTimestamp > 1000*3600*100) this.destroy();
            this.service.downloadTransactions(this.addressesFrom).done(res=>{
               // console.log(res);
                var diff:number = res.length - this.initTransactions.length;

                if(diff){
                    console.warn(this.service.name + ' OutgoingTransactionController new transactions ' + diff );

                    if(this.onNewTransactions)this.onNewTransactions(res);
                }else{

                    console.log(this.service.name + ' OutgoingTransactionController  same length');
                }

            });
        }

        calculateNonces(addresses:string[], transactions:VOTransaction[]):any{
            return Utils.getNoncesOfAddresses(transactions);
        }

        startAddressesCheck(addresses:string[]):void{
           // console.log( 'startAddressesCheck  ', addresses);
            this.addressesFrom = addresses;
            this.service.downloadTransactions(addresses).done(res=>{
                    console.warn( this.service.name +' startTransactionCheck  ',res);
                this.initTransactions = res;

                var noces = this.calculateNonces(addresses,res);
                this.transactionsIds = _.map(res,(o:VOTransaction)=>o.id);


               // this.checkInterval = setInterval(()=>this.checkTransactions(),5000);
                }).fail(err =>console.error(err));
            }

    }
}