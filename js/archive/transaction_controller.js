/**
 * Created by Vlad on 11/10/2016.
 */
///<reference path="../datastore/crypto_controller.ts"/>
var jaxx;
(function (jaxx) {
    var TransactionControllerOld = (function () {
        function TransactionControllerOld(controller) {
            this.controller = controller;
            //inQueue:jaxx.CheckTransaction[] = [];
            this.nonces = {};
            this.balancesTemp = [];
            this.accountService = controller._accountService;
            this.db = controller._db;
            this.reset();
            this.accountService.balances$.on(this.accountService.ON_BALANCE_RECEIVE_CHANGE, function (evt, diff, delta) {
                // console.log(diff,delta/1e15)
                /*   var have:number = this.db.balanceSpent;
   
                   if(have === 0 || delta>0){
                       this.reset();
                      // console.log('%c not processing have '+have +' delta ' + delta/1e15,'color:red');
                       return
                   }
   
                   var indiff:number =0
                   diff.forEach(function(bal){
                       indiff+= bal.delta
                   })
   
   
                   this.db.addSpending(indiff);
                       //this.db.balanceSpent += diff;
                 // console.log('indiff ' + indiff/1e15 + '    ' +this.db.balanceSpent/1e15);
                   if(this.db.balanceSpent == 0){
                      this.reset();
                     // console.log('%c  bingo  balances spent 0 ','coleor:red');
                       return;
                   }
                   var balancesTemp:VOBalanceTemp[] = this.db.getBalancesTemp();
                  // console.log(balancesTemp);
                   this.removeTempBalances(diff);
                   if(this.db.balanceSpent == 0){
                       this.reset();
                       return;
                   }
                   //    console.log(' bingo balances spent 0  ' );
   
                   console.log('%c still have spent balance  ' + this.db.balanceSpent/1e15,'color:red');*/
            });
            this.accountService.balances$.on(this.accountService.ON_BALANCE_CHANGE_CHANGE, function (evt, diff, delta) {
                // console.log(this.accountService.ON_BALANCE_CHANGE_CHANGE + '   '+delta/1e15,diff);
                /// this.resetTempBalances(diff);
            });
        }
        TransactionControllerOld.prototype.startTimer = function (balance) {
            /*  setTimeout(() => {
                  var balance:VOBalanceTemp = this.removeBalanceTemp(balance);
                  console.log(' removing balance manualy ', balance);
  
              },2*60*1000);*/
        };
        TransactionControllerOld.prototype.reset = function () {
            /*   var balances:VOBalanceTemp[] = this.db.getBalancesTemp();
               balances.forEach((bal)=>{
                   this.startTimer(bal);
               })
               //this.db.saveBalancesTemp([]);
               this.db.balanceSpent=0;*/
        };
        TransactionControllerOld.prototype.clearBalancesTemp = function () {
            var bals = this.balancesTemp;
            this.balancesTemp = [];
            return bals;
        };
        TransactionControllerOld.prototype.getNonceForAddress = function (address) {
            return this.nonces[address] || 0;
        };
        // removeBalanceTemp(balance:VOBalanceTemp):VOBalanceTemp{
        /*  var balances = this.db.getBalancesTemp();
          var i = balances.indexOf(balance);
          if(i !== -1 ){
              this.db.removeSpending(balance.spent);
              balances.splice(i,1);
              this.db.saveBalancesTemp(balances);
              return balance;
          }else {
              //console.log('%c balance was removed  ' + balance.spent/1e15,'color:brown');
          }*/
        // }
        TransactionControllerOld.prototype.removeTempBalances = function (diff) {
            /*  var balances = this.db.getBalancesTemp();
  
              var indexed = _.keyBy(diff, 'id');
  
             // console.log(balances,indexed);
  
  
              var haveChanges:boolean = false;
              var total:number = 0;
  
              for (var i= balances.length-1; i >= 0; i--){
  
                  var diffInd:VOBalance = indexed[balances[i].id];
                  if(diffInd){
                      if(diffInd.delta == balances[i].balance){
                          this.db.removeSpending(balances[i].spent);
                          total+= diffInd.delta;
                         /// console.log('%c bingo   removing temp balance  ' + balances[i].id,'color:red');
                          balances[i].balance = 0;
                          balances.splice(i,1);
                          haveChanges = true;
                      }
                  }
              }
  
              if(haveChanges) {
  
                  this.db.saveBalancesTemp(balances);
              }
              return total;*/
            return 0;
        };
        TransactionControllerOld.prototype.prepareAddresses = function (addresses) {
            //if(this.isBusy)return;
            // console.warn(addresses);
            var _this = this;
            var unique = [];
            addresses.forEach(function (adderssr) {
                if (unique.indexOf(adderssr) == -1)
                    unique.push(adderssr);
            });
            addresses = unique;
            var deferred = $.Deferred();
            //TODO uncomment busy
            //this.controller.isBusy = true;
            this.accountService.downloadTransactions(addresses).done(function (transactions) {
                _this.preparedTransactions = transactions;
                var nonces = jaxx.Utils.getNoncesOfAddresses(transactions);
                _this.nonces = nonces;
                deferred.resolve(_this.nonces);
            }).fail(function (err) { return deferred.resolve(err); })
                .progress(function (p) { return deferred.notify(p); });
            // .always(res=>this.controller.isBusy = false);
            return deferred;
        };
        /*
        
                removeChecker(ctr:jaxx.CheckTransaction):void{
        
                    this.inQueue.splice(this.inQueue.indexOf(ctr),1);
                    ctr.destroy();
                }
        */
        TransactionControllerOld.prototype.registerSentTransaction = function (result) {
            //  console.log(result);
            //console.log(this.nonces);
            var balanceTemp = this.generateBalanceTemp(result.sent);
            if (result.result.error) {
                console.error(result.result, balanceTemp);
                return;
            }
            this.startTimer(balanceTemp);
            //TODO  set this number to 45 minutes
            /*  var ctr:jaxx.CheckTransaction = new jaxx.CheckTransaction(this.accountService);
  
              ctr.onError = () =>(ctr) => {
  
                  this.removeChecker(ctr);
  
                  var balanceTemp:VOBalanceTemp = ctr.balanacsTemp;
                  this.db.removeBalanceTemp(balanceTemp);
              }
  
              ctr.onProcessed = () =>(ctr, transactions) => {
  
                  console.warn(' Transaction processed ',ctr);
                  this.removeChecker(ctr)
                  var balanceTemp:VOBalanceTemp = ctr.balanacsTemp;
                  this.db.removeBalanceTemp(balanceTemp);
              }*/
            // console.log(balanceTemp);
            // console.log(balanceTemp);
            //ctr.init(result.sent, result.result, balanceTemp);
            var spent = balanceTemp.spent;
            // var sp:number = this.db.addSpending(spent);
            /// console.log('%c  spent: ' + spent/1e15 +'  total '+ this.db.balanceSpent/1e15,'color:red');
            // console.log(' add balance temp ',balanceTemp);
            // this.balancesTemp.push(balanceTemp);
            // this.db.addBalanceTemp(balanceTemp);
            // this.inQueue.push(ctr);
        };
        TransactionControllerOld.prototype.removeTempTransactions = function (transactions) {
            //console.warn('new transactions',transactions);
            /*    var balancesTemp:VOBalanceTemp[] = this.db.getBalancesTemp();
                if(balancesTemp.length){
    
                    var indexed = _.keyBy(transactions,'id');
    
                    var out:VOBalanceTemp[] = [];
                    balancesTemp.forEach((item)=>{
    
                        if(!indexed[item.txid]){
                            out.push(item)
                        }else{
                            var spent:number = item.spent
                            this.db.removeSpending(spent);
                           // console.log('  bingo removing temp transaction ');
                        }
                    })
    
    
    
                  //  console.log('%c after transactions removed  have spent ' + this.db.balanceSpent/1e15,'color:red');
                    if(balancesTemp.length !== out.length){
                        this.db.saveBalancesTemp(out);
                    }
                }
    */
        };
        //sortedHighestAccountArray:{index:number, balance:number, address:string}[] = [];
        TransactionControllerOld.prototype.getHighestAccountBalanceAndIndex = function () {
            // if(this.highestAccountBalanceAndIndex) return this.highestAccountBalanceAndIndex;
            var balancesReceive = this.db.getBalancesIndexedReceiveNot0WithIndex();
            var balancesChange = this.db.getBalancesIndexedChangeNot0WithIndex();
            /// console.log(balancesReceive);
            var balances = balancesReceive.concat(balancesChange);
            var ar = _.sortBy(balances, ['balance']).reverse();
            var out = [];
            _.each(ar, function (item) {
                out.push({ index: item.index, balance: item.balance, address: item.id });
            });
            if (out.length === 0) {
                this.controller._sortedHighestAccountArray = [];
                return null;
            }
            return out;
            // return this.controller._sortedHighestAccountArray[0];
        };
        TransactionControllerOld.prototype.generateBalanceTemp = function (trs) {
            var from = trs.from;
            var id = from;
            var txid = trs.txid;
            var tomestamp = trs.timestamp;
            var sent = -trs.valueDelta;
            var fee = trs.gasPrice * trs.gasUsed;
            var balance = -(sent + fee);
            var spent = (sent + fee);
            var to = trs.to;
            var nonce = trs.nonce;
            var bal = new VOBalanceTemp({
                id: id,
                from: from,
                txid: txid,
                sent: sent,
                fee: fee,
                to: to,
                balance: balance,
                nonce: nonce,
                spent: spent
            });
            return bal;
        };
        return TransactionControllerOld;
    }());
    jaxx.TransactionControllerOld = TransactionControllerOld;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=transaction_controller.js.map