/**
 * Created by Vlad on 11/7/2016.
 */

///<reference path="../com/models.ts"/>

module jaxx {
    export class TransactionsTempControl {
        error: string;
        interval: number;
        delayCheckTransaction: number = 10000;
        ON_TRANSACTION_IN_LIST: string = 'ON_TRANSACTION_IN_LIST';

        transactions: VOTransaction[] = [];
        service:JaxxAccountService;

        intervalCheckTransactions: number = 0;

        onTransactionsSent(trs: VOTransaction[]): void {

        }

        onTransactionsConfirmed(trs: VOTransaction[]): void {

        }

        checkConfirmed(): void {

            var ar: VOTransaction[] = this.transactions;
            var out: VOTransaction[] = [];
            for (var i = ar.length - 1; i >= 0; i--) {
                if (ar[i].confirmed) {
                    out.push(ar.splice(i, 1)[0]);
                }
            }

            this.transactions = ar;

            if (out.length) this.onTransactionsConfirmed(out);
        }

        getTransactionsTemp(orig?: boolean): VOTransaction[] {

            if (orig) return this.transactions;
            else {
                var out: VOTransaction[] = [];
                this.transactions.forEach(tr => out.push(new VOTransaction(tr)));
                return out;
            }
        }

        getTransactionsIds(): string[] {
            var out: string[] = [];
            this.transactions.forEach(tr => out.push(tr.id));
            return out;
        }

        timeoutAdd: number
        //newTransactions = [];


        onSentTransactions(): void {
           // this.onTransactionsSent(this.newTransactions);
           // this.newTransactions = [];
        }

        doNextCheck(): void{
            if(this.transactions.length === 0){
                clearInterval( this.intervalCheckTransactions);
                this.intervalCheckTransactions = 0;
            }else{
                var addresses: string[] = Utils.deepCopy(this.transactions).map(function (item) { return item.address });
                this.service.downloadTransactions(addresses).done(transactions => {
                    console.log(transactions);
                })

            }

        }


        addTransactionTemp(tr: VOTransaction): void {

            if(this.intervalCheckTransactions === 0){
                this.intervalCheckTransactions = setInterval(() => this.doNextCheck(), this.delayCheckTransaction);
            }

            clearTimeout(this.timeoutAdd);
            this.transactions.push(tr);
        }



        constructor(private controller: JaxxCryptoController) {
         this.doNextCheck();
        }

       /* downloadTransactions(): void {

            var addresses: string[] = [];
            this.transactions.forEach(tr => addresses.push(tr.from));

            if (addresses.length == 0) {
                this.timeoutCheck = 0;
                return;
            }


            //  console.log(address,txid);
            /!* this.service.checkTransactionByAddress(txid, address).done(transaction => {
             //   console.warn(transactions);
             if (transaction.length) {

             //  clearInterval(this.interval);
             }
             });*!/


            this.service.downloadTransactions(addresses).done((transactions: VOTransaction[]) => {

                var ids: string[] = this.getTransactionsIds();
                // console.log(addresses,ids,transactions);
                var have: number = 0;
                transactions.forEach((tr) => {
                    var ind: number = ids.indexOf(tr.id);
                    if (ind !== -1) {
                        have++;
                        this.transactions[ind] = tr
                    }
                });

                console.log('have  ' + have + ' temp transactions length ' + this.transactions.length);
                if (have) this.checkConfirmed();


            }).always(() => {
                this.timeoutCheck = setTimeout(() => this.downloadTransactions(), 2000);
            })
        }

        timeoutCheck: number;*/
    }


}