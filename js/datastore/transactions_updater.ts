/**
 * Created by Vlad on 2016-11-24.
 */
module jaxx{

    export class TransactionsUpdater{
        service: JaxxAccountService;
        db: JaxxDatastoreLocal;

        private transactions: VOTransaction[];

        updateInterval:number;
        updateTime:number;

        name:string;
        emitter$=$({});


        ON_TRANSACTION_CONFIRMED:string = 'ON_TRANSACTION_CONFIRMED';

        constructor(
            private controller:any,
            private options:{updateTimeout:number, confirmations:number}
            ){

            this.name = controller.name;
            this.updateTime = options.updateTimeout;


        }

        onError(err:any){

        }

        activate():void{
            clearInterval(this.updateInterval);
            this.updateInterval  = setInterval(()=>this.onTimer(), this.updateTime);

        }

        setTimeout(fast:boolean):void{
                let timeout = fast?this.options.updateTimeout:this.options.updateTimeout*3;
            if(this.updateTime !== timeout){
                this.updateTime = timeout;
                this.activate();
            }
        }

        deactivate():void{
                clearInterval(this.updateInterval);
        }

        onTimer():void{
            if(!this.controller.isActive) return;
            if(this.isBusy ) {
                console.warn(' skipping request => no respond from server ');
                this.isBusy = false;
                return;
            }


            let trs:VOTransaction[] = this.controller._db.getTransactionsReceive();
            let addresses:string[];
           /*  = this.getAddressesWithBalanceNoTransactions(trs);
            if(addresses.length){
                console.log('%c ' + this.name + ' addresses without transactions ' + addresses.toString(), 'color:blue');

                this.controller._accountService.downloadNewTransactions2(addresses);
                this.setTimeout(true);
                return;
            }*/

            let min:number = this.options.confirmations;
            let unconfirmed:VOTransaction[] = _.filter(trs,function (item) { return item.confirmations < min; });
            unconfirmed = _.uniqBy(unconfirmed,'id');

           let allConfirmed = _.every(unconfirmed, 'confirmations');
           this.setTimeout(!allConfirmed);
            //this.setTimeout(hasUnconfirmed);

            addresses =  _.map(unconfirmed,function(item){return item.address});
            addresses = _.uniq(addresses);
           // let uncAddresses:string[] = this.getUnconfirmedTransactionsAddresses(trs);



            //console.log(addresses);

            this.downloadUpdatesForAddresses(addresses);
        }

/*

        getUnconfirmedTransactionsAddresses(trs:VOTransaction[]):string[]{
            let min:number = this.options.confirmations;

           // console.warn(' getUnconfirmedTransactionsAddresses    ' + min);
            let unconfirmed:VOTransaction[] = trs.filter(function (item) {
                // console.log(item.confirmations);
                return item.confirmations < min;
            });



            let timeout:number;
            if(_.every(unconfirmed, 'confirmations')) {
                timeout = this.options.updateTimeout * 3;


            }else{

            }

            let addresses:string[] = unconfirmed.map(function (item) {
                return item.address;
            });

            return addresses

        }
*/

       // setUnconfirmedTransactionsInterval()

        getAddressesWithBalanceNoTransactions(trs:VOTransaction[]):string[]{
            let addresses:string[] =   this.controller.getBalancesNot0().map(function (item) {  return item.id;  });


            trs.forEach(function (item) {
                if((addresses.indexOf(item.address) !==-1) || (addresses.indexOf(item.from) !==-1) || (addresses.indexOf(item.to) !==-1) ) addresses.splice(addresses.indexOf(item.address),1);
            });

            return addresses;
        }


        checkTransactinsLast5Addresses(trs:VOTransaction[]):string[]{
              let addresses:string[] =   this.controller.getAddressesReceive();

              addresses = _.takeRight(addresses,5);

              trs.forEach(function (item) {
                  if(addresses.indexOf(item.address) !==-1) addresses.splice(addresses.indexOf(item.address),1);
              });

            return addresses;
        }

        isBusy:boolean;

       /* checUncofirmed(trs:VOTransaction[]):boolean{
            let min:number = this.options.confirmations;
            // console.log(trs);



            let unconfirmed:VOTransaction[] = trs.filter(function (item) {
               // console.log(item.confirmations);
                return item.confirmations < min;
            })

            console.log('%c ' + this.controller.name + '  checkForUpdates total: ' + trs.length + ' unconfirmed: ' + unconfirmed.length,'color:red');



            if(unconfirmed.length){
                this.checkForUpdates(unconfirmed);
                return true;
            }

        }*/



        downloadUpdatesForAddresses(addresses:string[]):void{

            let db:JaxxDatastoreLocal = this.controller._db;
            let ctr:JaxxCryptoController = this.controller;
            let service:JaxxAccountService = this.controller._accountService;

            if(addresses.length==0) return;

            addresses =  _.take(addresses, 5);

            // console.log(' downloadTransactions   '+out.toString());

            console.log('%c ' + this.name + ' download transactions need confirmations  for addresses  ' + addresses.toString(), 'color:blue');

            this.isBusy = true;

            service.downloadTransactions(addresses).done((result:any)=>{

                this.isBusy = false;

                let newTransactions = result.transactions || result;
                // console.log('%c '+this.name +' this new transactions ', 'color:blue');
                // console.log(newTransactions);
                let indexed:any  = _.keyBy(newTransactions,'id');

                let oldTrs:VOTransaction[] =  db.getTransactionsReceive();

                let justConfiremed:VOTransaction[] =[];

                oldTrs.forEach(function (item) {

                    if(indexed[item.id]) {
                        //console.log(' old confirmations: ' + item.confirmations + ' new ' + indexed[item.id].confirmations);
                        if(!item.confirmations && indexed[item.id].confirmations) {

                            item.timestamp = indexed[item.id].timestamp;

                            console.log(' TRANSACTION_CONFIRMED  ' + item.confirmations +'   new ' + indexed[item.id].confirmations +'  at ' + new Date(item.timestamp*1000).toLocaleTimeString());
                            justConfiremed.push(item);
                        }
                        // if(!isNaN(indexed[item.id].timestamp))  item.timestamp = indexed[item.id].timestamp;
                        item.block = indexed[item.id].block;
                        item.confirmations = indexed[item.id].confirmations || 0;
                    }
                });

                if(justConfiremed.length) this.emitter$.triggerHandler(this.ON_TRANSACTION_CONFIRMED,[justConfiremed]);
                db.setTransactions(oldTrs);

                ctr.dispatchNewTransactions();


            }).fail(err=>{
                this.isBusy = false;
                this.onError(err)
            });
        }

       /* checkForUpdates(trs:VOTransaction[]):void{

                if(trs.length === 0) return;

                let db:JaxxDatastoreLocal = this.controller._db;
                let ctr:JaxxCryptoController = this.controller;
                let service:JaxxAccountService = this.controller._accountService;




            let addresses:string[] = trs.map(function (item) {
                return item.address;
            });

            let out:string[] = addresses.filter(function (item, pos) {
                return addresses.indexOf(item) == pos;
            });
            if(out.length>20) out =  _.take(out, 20);

           // console.log(' downloadTransactions   '+out.toString());

            this.isBusy = true;

                service.downloadTransactions(out).done((result:any)=>{

                    this.isBusy = false;

                    let newTransactions = result.transactions || result;
                 //   console.log(newTransactions);
                    let indexed:any  = _.keyBy(newTransactions,'id');
                    let oldTrs:VOTransaction[] =  db.getTransactionsReceive();

                    let justConfiremed:VOTransaction[] =[];

                   oldTrs.forEach(function (item) {

                       if(indexed[item.id]) {
                           //console.log(' old confirmations: ' + item.confirmations + ' new ' + indexed[item.id].confirmations);
                           if(!item.confirmations && indexed[item.id].confirmations) {

                               item.timestamp = indexed[item.id].timestamp;

                               console.log(' TRANSACTION_CONFIRMED  ' + item.confirmations +'   new ' + indexed[item.id].confirmations +'  at ' + new Date(item.timestamp*1000).toLocaleTimeString());
                               justConfiremed.push(item);
                           }
                          // if(!isNaN(indexed[item.id].timestamp))  item.timestamp = indexed[item.id].timestamp;
                           item.block = indexed[item.id].block;
                           item.confirmations = indexed[item.id].confirmations || 0;
                       }
                    });

                   if(justConfiremed.length) this.emitter$.triggerHandler(this.ON_TRANSACTION_CONFIRMED,[justConfiremed]);
                   db.setTransactions(oldTrs);

                    ctr.dispatchNewTransactions();

                }).fail(err=>{
                    this.isBusy = false;
                    this.onError(err)
                });
        }
*/


    }
}