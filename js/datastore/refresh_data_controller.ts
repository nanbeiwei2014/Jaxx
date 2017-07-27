/**
 * Created by Vlad on 11/2/2016.
 */

///<reference path="crypto_controller.ts"/>

module jaxx{

    export class RefreshDataController{
        private currentIndex:number = -1;
        delay:number = 10000;
        onAllHaveHistory:Function;
        onErrorDownload:Function;
        timeout:number = 0;
        timestamp:number;
        interval:number;
        errorscount:number = 0;
        currentItem:JaxxCryptoController;

        constructor(private controllers:JaxxCryptoController[]){

          ///vladedit  temp disabling refresh other accounts
        // setTimeout(()=>this.resetInterval(),5000);
        }

        resetInterval():void{
            clearInterval(this.interval);
            this.interval = setInterval(() => this.checkNextHistory(),this.delay);
        }



        destroy():void{
            clearInterval(this.interval);
            clearTimeout(this.timeout);
        }

        checkNextHistory():void{

            var busy:Boolean = this.controllers.some(ctr => ctr.isBusy);

            //console.warn(busy +' ' + this.delay);
            if(busy) {
                return;
            }

            this.currentIndex++;



            if(this.currentIndex >=this.controllers.length) this.currentIndex = 0;

            var ctr = this.controllers[this.currentIndex];
          //console.warn('checkNextHistory '+ this.currentIndex + '  ' + ctr.name + '  active: ' + ctr.isActive + ' timestamp:  '+ctr.getHistoryTimestamp());
           //console.log(ctr.isEnabled);
            if(ctr.isActive || !ctr.isEnabled) {
               // setTimeout(() => checkNextHistory)
                return;
            }

            var now:number = Date.now();


           /// console.warn(ctr.name + '  '+ctr.getHistoryTimestamp());

            if(ctr.getHistoryTimestamp() ===0){

               // this.currentIndex--;

                ctr.restoreHistoryAll((res) =>{

                })


                this.delay = 60e3;
                this.resetInterval();
                return;

            }


           // console.log(ctr.hasIndexes());

                if(ctr.hasIndexes()){
                    var timestamp:number = ctr.getBalancesTimestamp();
                    // console.log(timestamp);
                    var delta:number = Date.now() - timestamp;
                    //console.log(delta);
                    if(delta < 60e3){
                        this.delay+=1000;
                        this.resetInterval();
                    }
                    if(delta > 200e3) {
                        this.delay = 10000;
                        this.resetInterval();
                    }

                   /* ctr.downloadAllBalances((error) =>{
                        console.log(ctr.name + ' balance ');
                    });*/
               }//else  this.timeout = setTimeout(() => this.checkNextHistory(),100);





        }


    }
}