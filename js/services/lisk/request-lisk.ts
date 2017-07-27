
module jaxx{
    export class RequestLisk //implements IRequestServer
    {
        constructor(settings){

        }

        setType(str:string):void {

        }

        loadTransactions():JQueryDeferred<VOTransaction[]> {

            return null
        }

        getAddress(i:number):string {

            return ''
        }

        getBalances(addr:string[]):JQueryDeferred<VOBalance[]> {
            return null
        }

        setTransactionEventEmiter(emitter$:JQuery) {

        }

        checkTransaction(trs:VOTransaction):JQueryDeferred<VOTransaction[]> {
            return null
        }

        restoreIndex(type:string):JQueryDeferred<number> {

            return null;
        }
    }
}