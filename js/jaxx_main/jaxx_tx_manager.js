var TX_GENERIC = 0;
var TX_SHAPESHIFT = 1;

var JaxxTXManager = function() {
    this._currentTXType = TX_GENERIC;
    
    this._txTypes = [];
}

JaxxTXManager.prototype.initialize = function() {
    for (var i = 0; i < COIN_NUMCOINTYPES; i++) {
        this._txTypes[i] = {};
    }
}

JaxxTXManager.prototype.setCurrentTXType = function(txType) {
    this._currentTXType = txType;
}

JaxxTXManager.prototype.getCurrentTXType = function(txType) {
    return this._currentTXType;
}

JaxxTXManager.prototype.addTXOfType = function(txType, coinType, txHash) {
    this._txTypes[coinType][txHash] = txType;
}

JaxxTXManager.prototype.sendEthereumLikeTXList = function(coinType, data, callbackMain) {


    var transactionReceipts = {txSuccessCount: 0, txFailedCount: 0, txCount: data.txArray.length};

   // console.log(coinType);

//console.log(wallet.getPouchFold(coinType).getPouchFoldImplementation());
    wallet.getPouchFold(coinType).getPouchFoldImplementation()._dataStorageController.onTransactionUserConfirmed(data);

    var passthroughParams = {};
    passthroughParams.transactionReceipts = transactionReceipts;
    passthroughParams.coinType = coinType;
    var name = data.name;

    var sendTransaction = function (curTX, callBack) {


        curTX.name = name;
        wallet.getPouchFold(coinType).getPouchFoldImplementation().sendEthereumTransaction(curTX, function (status, tx, passthroughParams) {

           // var txReceipts = passthroughParams.transactionReceipts;
            if (status === 'success') {
                transactionReceipts.txSuccessCount++;
            } else {
                transactionReceipts.txFailedCount++;
            }
            callBack(status);

            //console.log("sendEthereumTXList :: coinType :: " + passthroughParams.coinType + " :: received status :: " + status);
            // console.log("sendEthereumTXList :: coinType :: " + passthroughParams.coinType + " :: txReceipts.txSuccessCount :: " + txReceipts.txSuccessCount + " :: txReceipts.txFailedCount :: " + txReceipts.txFailedCount);
/*
            if (txReceipts.txSuccessCount + txReceipts.txFailedCount === txReceipts.txCount) {
                if (txReceipts.txFailedCount === 0) {
                    //callback('success');
                } else if (txReceipts.txSuccessCount === 0) {
                   // callback('failure');
                } else {
                    //callback('partial');
                }
            }*/

        }, passthroughParams);

    }




        var results=[];

        var gonext = function(num, txArray){
            num++
            if(num >= txArray.length){
               console.log('%c all transactions sent','color:red');

                if (transactionReceipts.txFailedCount === 0) {
                    callbackMain('success');
                } else if (transactionReceipts.txSuccessCount === 0) {
                    callbackMain('failure');
                } else {
                    callbackMain('partial');
                }

               return;
            }

            var curTX = txArray[num];


            console.log('%c sending transaciom '+ (num+1),'color:green');

            sendTransaction(curTX,function(result){

                console.log('%c  transaciom '+ (num+1) + ' result  '+result,'color:green');



                results.push(result);
                setTimeout(gonext(num,txArray),2000);
            })
        }

        //var num = 0;

        //var ar = data.txArray;
        gonext(-1, data.txArray);



   /* for (var i = 0; i < data.txArray.length; i++) {

        var curTX = data.txArray[i];
        
        wallet.getPouchFold(coinType).getPouchFoldImplementation().sendEthereumTransaction(curTX, function(status, tx, passthroughParams) {
            var txReceipts = passthroughParams.transactionReceipts;
            
            if (status === 'success') {
                txReceipts.txSuccessCount++;
            } else {
                txReceipts.txFailedCount++;
            }

            console.log("sendEthereumTXList :: coinType :: " + passthroughParams.coinType + " :: received status :: " + status);
            console.log("sendEthereumTXList :: coinType :: " + passthroughParams.coinType + " :: txReceipts.txSuccessCount :: " + txReceipts.txSuccessCount + " :: txReceipts.txFailedCount :: " + txReceipts.txFailedCount);

            if (txReceipts.txSuccessCount + txReceipts.txFailedCount === txReceipts.txCount) {
                //@note: all of the batch succeeded:

                //                            console.log("numTXSuccess :: " + txReceipts.txSuccessCount + " :: txReceipts.txFailedCount :: " + txReceipts.txFailedCount);
                if (txReceipts.txFailedCount === 0) {
                    callback('success');
                } else if (txReceipts.txSuccessCount === 0) {
                    callback('failure');
                } else {
                    callback('partial');
                }
            }
        }, passthroughParams, i);
    }*/
}