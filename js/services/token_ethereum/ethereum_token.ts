/**
 * Created by Daniel on 2017-01-11.
 * edit by Vlad 2017-04-27
 */
module jaxx {
    declare var thirdparty: any;
    declare var Big: any;
    export interface TokenConfig{
        coinType: number;
        name:string ;
        contractAddress:string;
        gasPrice: number;
        gasLimitDefault:number;
        urlBalance:string;
    }

    export class EthereumToken implements IRequestServer{

        urlBalance:string = 'https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress={{contractAddress}}&address={{address}}&tag=latest&apikey=WGWHHAU4F2Y58UW5FQWTUJWSXBNHU7WBSX';
        name:string ;

        constructor(private config:TokenConfig ) {
          //  console.log(config);
            this.urlBalance = this.urlBalance.replace('{{contractAddress}}',config.contractAddress);
            this.name = config.name;
           // this.urlBalance = config.urlBalance;
            this.init();
        }

        init(): void {

        }
        sendTransactinsStart(transaction: VOTransactionStart): JQueryDeferred<VOSendTransactionResult> {
            var ctr: SendTransactionStartEther = new SendTransactionStartEther();
            return ctr.sendTransaction(transaction);
        }

        downloadBalances(addresses: string[]): JQueryDeferred<VOBalance[]> {

            var d: JQueryDeferred<VOBalance[]> = $.Deferred();
            let address: string = addresses[0];
            if(!address){
                d.reject({
                    error:'downloadBalances',
                    addresses:addresses.toString()
                });
               return d;
            }

            let url: string = this.urlBalance.replace('{{address}}', address);
            let name = this.name;
            $.get(url).done(function (res) {
                if(isNaN(res.result)){
                    d.reject(res.result);
                    return
                }

              if(name === "DigixEthereum") {
                res.result = +res.result * 1000000000;
              } else if(name === "CivicEthereum"){
                  res.result = +res.result * 10000000000;
              }
              else if(name == "BlockchainCapitalEthereum" && !!thirdparty) {
                var toBig = new Big('1000000000000000000');
                res.result = toBig.mul(res.result);
                //res.result = +res.result;
              }
                d.resolve([new VOBalance({
                    id: address,
                    balance: +res.result
                })]);
            });

            return d;
        }

        checkBalanceForAddress(address: string): JQueryPromise<VOBalance> {
            var url: string = this.urlBalance.replace('{{address}}', address);
            return $.getJSON(url).then((res) => {
                //console.warn(res);
                return new VOBalance({
                    id: address,
                    balance: +res.result,
                    timestamp: Date.now()
                });
            });
        }

       /* getMiningPrice(): number {
            return this.gasPrice;
        }

        getMiningFees(): number {
            return this.gasPrice * this.gasLimit;
        }

        getMiningFeeLimit(): number {
            return this.gasLimit;
        }*/


        initialize():void{}
        downloadTransactionsUnspent(addresses:string[]):JQueryPromise<{result:any[],utxos:VOTransactionUnspent[]}>{ return null}
        generator:jaxx.GeneratorBlockchain;
        getMiningFees():number{return 0};

        restoreHistory2(receive_change:string, startIndex:number):JQueryDeferred<{index:number, addresses:string[], txdIds:string[], transactions:VOTransaction[]}>{
            return null
        }
        restoreHistory(receive_change:string):JQueryDeferred<{index:number, addresses:string[], transactions:VOTransaction[], relayedTransactionListArray:VORelayedTransactionListAndUTXOsForAddress[]}>{
            return null
        }

        downloadTransactionsForAddress(address:string):JQueryPromise<VOTransaction[]>{    return null; }
        downloadTransactions(addresses:string[]):JQueryDeferred<VOTransaction[]>{ return null;  }
        checkAddressesForTranasactions(addresses:string[]):JQueryDeferred<string[]>{ return null; }
        downloadTransactionsDetails(txsIds:string[]):JQueryDeferred<{result:any[], transactions:VOTransaction[]}>{ return null; }


    }


}