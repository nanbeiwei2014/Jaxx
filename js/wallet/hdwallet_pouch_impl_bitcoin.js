var HDWalletPouchBitcoin = function() {
    this._doDebug = true;
    this._pouchManager = null;
    this._baseFormatCoinType = COIN_BITCOIN;
    this._readyTransactionDict = null;
    this._bytesPerInput = 148;
    this._minimumMiningFee = 10000;
}

HDWalletPouchBitcoin.uiComponents = {
    coinFullName: 'Bitcoin',
    coinFullDisplayName: 'Bitcoin',
    coinWalletSelector3LetterSymbol: 'BTC',
    coinSymbol: '\u0E3F',
    coinButtonSVGName: 'bitcoin-here',
    coinLargePngName: '.imgBTC',
    coinButtonName: '.imageLogoBannerBTC',
    coinSpinnerElementName: '.imageBTCWash',
    coinDisplayColor: '#F7931A',
    csvExportField: '.backupPrivateKeyListBTC',
    transactionsListElementName: '.transactionsBitcoin',
    transactionTemplateElementName: '.transactionBitcoin',
    accountsListElementName: '.accountDataTableBitcoin',
    accountTemplateElementName: '.accountDataBitcoin',
    pageDisplayPrivateKeysName: 'backupPrivateKeysBitcoin',
    displayNumDecimals: 8,
};

HDWalletPouchBitcoin.pouchParameters = {
    coinHDType: 0,
    coinIsTokenSubtype: false,
    coinAbbreviatedName: 'BTC',
    isSingleToken: false,
    isTestnet: false
};


HDWalletPouchBitcoin.networkDefinitions = {
    mainNet: {
        messagePrefix: '\x18Bitcoin Signed Message:\n',
        bip32: {
            public: 0x0488b21e,
            private: 0x0488ade4
        },
        pubKeyHash: 0x00,
        scriptHash: 0x05,
        wif: 0x80,
        dustThreshold: 546
    },
    testNet: {
        messagePrefix: '\x18Bitcoin Signed Message:\n',
        bip32: {
            public: 0x043587cf,
            private: 0x04358394
        },
        pubKeyHash: 0x6f,
        scriptHash: 0xc4,
        wif: 0xef,
        dustThreshold: 546
    },
}


HDWalletPouchBitcoin.getCoinAddress = function(node) {
    var pubKey = node.keyPair.getPublicKeyBuffer();

    var pubKeyHash = thirdparty.bitcoin.crypto.hash160(pubKey);

    var payload = new thirdparty.Buffer.Buffer(21);
//    console.log("bitcoin :: pubkeyhash :: " + node.keyPair.network.pubKeyHash);
    payload.writeUInt8(node.keyPair.network.pubKeyHash, 0);
    pubKeyHash.copy(payload, 1);

    var address = thirdparty.bs58check.encode(payload);

    //        console.log("[bitcoin] address :: " + address);
    return address;
}

HDWalletPouchBitcoin.prototype.convertFiatToCoin = function(fiatAmount, coinUnitType, fiatUnit) {
    var coinAmount = 0;
    
    var satoshis = wallet.getHelper().convertFiatToSatoshis(fiatAmount);
    coinAmount = (coinUnitType === COIN_UNITLARGE) ? HDWalletHelper.convertSatoshisToBitcoins(satoshis) : satoshis;

    return coinAmount;
}

HDWalletPouchBitcoin.prototype.initialize = function(pouchManager) {
    this._pouchManager = pouchManager;
    this.setMiningFeeInMenuOnInitialization();
}

HDWalletPouchBitcoin.prototype.setMiningFeeInMenuOnInitialization = function(){

}

HDWalletPouchBitcoin.prototype.shutDown = function() {
}

HDWalletPouchBitcoin.prototype.setup = function() {
}

HDWalletPouchBitcoin.prototype.log = function(logString) {
    if (this._doDebug === false) {
        return;
    }
    var args = [].slice.call(arguments);
    args.unshift('BitcoinPouchLog:');
    console.log(args);
}

HDWalletPouchBitcoin.prototype.updateMiningFees = function() {
    var self = this;
    // consider using 'https://api.blockcypher.com/v1/btc/main'
    $.getJSON('https://bitcoinfees.21.co/api/v1/fees/recommended', function (data) {
        if (!data) {
            this.log("HDWalletPouchBitcoin.updateMiningFees :: error :: cannot access default fee");
        } else  {
            /*
             // blockcypher mining fee dict
            var newMiningFeeDict = {
                fastestFee: parseInt(data.high_fee_per_kb / 1000),
                halfHourFee: parseInt(data.medium_fee_per_kb / 1000),
                hourFee: parseInt(data.low_fee_per_kb / 1000)
            }*/
            var newMiningFeeDict = {
                fastestFee: parseInt(data.fastestFee),
                halfHourFee: parseInt(data.halfHourFee),
                hourFee: parseInt(data.hourFee) // * 0.8
            }
            self._pouchManager._miningFeeDict = newMiningFeeDict;
            //@note: @here: default to "average"
            self._pouchManager._defaultTXFee = parseInt(newMiningFeeDict.halfHourFee*1000);
            g_JaxxApp.getUI().pushBTCMiningFeeFromUIOptionsToPouch();
            g_JaxxApp.getUI().overrideMiningFeeRadioButton("MainMenu");
        }
    });
}

HDWalletPouchBitcoin.prototype.requestBlockNumber = function(callback) {
    callback(null);
}

HDWalletPouchBitcoin.prototype.getTransactions = function() {
    var res = [];

    /**
 *  Get all transactions for this wallet, sorted by date, earliest to latest.
 */
    for (var key in this._pouchManager._transactions) {
        res.push(this._pouchManager._transactions[key]);
    }

    res.sort(function (a, b) {
        var deltaConf = (a.confirmations - b.confirmations);
        if (deltaConf) { return deltaConf; }
        return (b.timestamp - a.timestamp);
    });

    return res;
}

HDWalletPouchBitcoin.prototype.calculateHistoryForTransaction = function(transaction) {
    //@note: @here: @dcl:
    var cryptoController = g_JaxxApp.getDataStoreController().getCryptoControllerById(this._pouchManager._coinType);

    var deltaBalance = 0;
    var miningFee = 0;

    var myInputAddresses = [];
    var externalInputAddresses = [];
    var externalOutputAddresses = [];

   //console.log("[bitcoin pouch] :: transaction :: " + transaction.txid);

    for (var i = 0; i < transaction.inputs.length; i++) {
        var input = transaction.inputs[i];

        miningFee += input.amount;
        // console.log("[bitcoin pouch] :: input transaction :: " + transaction.txid + " :: input.amount :: " + input.amount + " :: miningFee :: " + miningFee);

        // Our address, money sent (input values are always negative)
        if (cryptoController.isMyAddressDB(input.address)) {
            deltaBalance += input.amount;
            myInputAddresses.push(input.address);
        } else {
            externalInputAddresses.push(input.address);
        }
    }

    for (var i = 0; i < transaction.outputs.length; i++) {
        var output = transaction.outputs[i];

        miningFee += output.amount;
        // console.log("[bitcoin pouch] :: output transaction :: " + transaction.txid + " :: output.amount :: " + output.amount + " :: miningFee :: " + miningFee);

        // Our address, money received
        if (cryptoController.isMyAddressDB(output.address)) {
            deltaBalance += output.amount;
        } else {
            externalOutputAddresses.push(output.address);
        }
    }

    var toAddress = null;
    var toAddressFull = null;

    if (deltaBalance > 0) {
        if (externalInputAddresses.length > 0) {
            toAddress = externalInputAddresses[0];
            toAddressFull = externalInputAddresses[0];
        }
    } else {
        if (externalOutputAddresses.length > 0) {
            toAddress = externalOutputAddresses[0];
            toAddressFull = externalOutputAddresses[0];
        }
    }

    var newHistoryItem = {
        toAddress: toAddress,
        toAddressFull: toAddressFull,
        blockHeight: transaction.block,
        confirmations: transaction.confirmations,
        deltaBalance: deltaBalance,
        miningFee: miningFee,
        timestamp: transaction.time_utc * 1000,
        txid: transaction.txid
    };

    //            console.log("adding new history item :: " + newHistoryItem);
    
    return newHistoryItem;
}

HDWalletPouchBitcoin.prototype.getPouchFoldBalance = function() {
    //@note: @here: @dcl:
    var balance = this._pouchManager._dataStorageController.getBalanceTotalDB();
    
    return balance;
}

HDWalletPouchBitcoin.prototype._getUnspentOutputs = function() {
    //@note: @here: @dcl:

    var uxtoDict = this._pouchManager._dataStorageController.getUTXOs();

    return uxtoDict;
}


HDWalletPouchBitcoin.prototype.getAccountBalance = function(internal, index) {
    var accountBalance = 0;

    //@note: @here: @dcl:
    accountBalance = this._pouchManager._dataStorageController.getBalanceTotalDB();

    return accountBalance;
}


HDWalletPouchBitcoin.prototype.buildBitcoinTransactionWithUTXOs = function(toAddress, amount_smallUnit, transactionFee, doNotSign, utxos, coinNetwork, toSpendTotal) {
    // Implement this late to refactor _buildBitcoinTransaction into two parts.
}



HDWalletPouchBitcoin.prototype.updateTokenAddresses = function(addressMap) {
}

HDWalletPouchBitcoin.prototype.getAccountList = function(transactions) {
    var result = [];

    var lastIndexChange = 0;
    var lastIndexReceive = 0;

    for (var ti = 0; ti < transactions.length; ti++) { //iterate through txs
        var transaction = transactions[ti];

        //First we need to determine if this is an incoming tx. let see balance
        //            console.log("bitcoin :: tx :: " + JSON.stringify(transaction));

        //Iterate on Inputs
        for (var i = 0; i < transaction.inputs.length; i++) {
            var input = transaction.inputs[i];
            // Our address, money sent (input values are always negative)
            if (!input.addressInternal && input.addressIndex !== null) {
                if (input.addressIndex > lastIndexReceive) {
                    lastIndexReceive = input.addressIndex;
                }

                //                    var tempPair = [];
                //                    tempPair[0] = this.getPrivateKey(input.addressInternal, input.addressIndex).toWIF();
                //                    tempPair[1] = input.address;
                //                    result.push(tempPair);
                //
                //                    console.log("bitcoin :: input index :: " + input.addressIndex + " :: public address :: " + tempPair[1] + " :: private key :: " + tempPair[0]);
            }
            if (input.addressInternal && input.addressIndex !== null) {
                if (input.addressIndex > lastIndexChange) {
                    lastIndexChange = input.addressIndex;
                }
            }
        }

        for (var i = 0; i < transaction.outputs.length; i++) {
            var output = transaction.outputs[i];
            if (!output.addressInternal && output.addressIndex !== null) {
                if (output.addressIndex > lastIndexReceive) {
                    lastIndexReceive = output.addressIndex;
                }

                //                    var tempPair = [];
                //                    tempPair[0] = this.getPrivateKey(output.addressInternal, output.addressIndex).toWIF();
                //                    tempPair[1] = output.address;
                //                    result.push(tempPair);
                //                    
                //                    console.log("bitcoin :: output index :: " + output.addressIndex + " :: public address :: " + tempPair[1] + " :: private key :: " + tempPair[0]);
            } 
            if (output.addressInternal && output.addressIndex !== null) {
                if (output.addressIndex > lastIndexChange) {
                    lastIndexChange = output.addressIndex;
                }
            } 
        }
    }

    for (var i = lastIndexReceive + 1; i >= 0; i--) {
        var account = {};
        account.pvtKey = this._pouchManager.getPrivateKey(false, i).toWIF();
        account.pubAddr = this._pouchManager.getPublicAddress(false, i);
        account.balance = this.getAccountBalance(false, i);

        result.push(account);

        //            console.log("bitcoin :: receive node(i) :: " + i + " :: address :: " + tempPair[1] + " :: private :: " + tempPair[0]);
    }

    for (var i = lastIndexChange + 1; i >= 0; i--) {
        var account = {};
        account.pvtKey = this._pouchManager.getPrivateKey(true, i).toWIF();
        account.pubAddr = this._pouchManager.getPublicAddress(true, i);
        account.balance = this.getAccountBalance(true, i);
        result.push(account);

        //            console.log("bitcoin :: change node(i) :: " + i + " :: address :: " + tempPair[1] + " :: private :: " + tempPair[0]);
    }

    result.reverse();
    //        var tempPair = [];
    //        tempPair[0] = this.getPrivateKey(false, lastIndex + 1).toWIF();
    //        tempPair[1] = this.getPublicAddress(false, lastIndex + 1);
    //        result.push(tempPair);

    return result;
}

HDWalletPouchBitcoin.prototype.generateQRCode = function(largeFormat, coinAmountSmallType) {
    var curRecAddr = this._pouchManager.getCurrentReceiveAddress();

    var uri = "bitcoin:" + curRecAddr;

    if (coinAmountSmallType) {
        uri += "?amount=" + coinAmountSmallType;
    }

    if (largeFormat) {
        if (coinAmountSmallType || !this._pouchManager._largeQrCode) {
            //            this.log('Blocked to generate QR big Code');
            this._pouchManager._largeQrCode =  "data:image/png;base64," + thirdparty.qrImage.imageSync(uri, {type: "png", ec_level: "H", size: 7, margin: 1}).toString('base64');
        }

        return this._pouchManager._largeQrCode;
    } else {
        if (coinAmountSmallType || !this._pouchManager._smallQrCode) {
            //        this.log('Blocked to generate QR small Code');
            this._pouchManager._smallQrCode =  "data:image/png;base64," + thirdparty.qrImage.imageSync(uri, {type: "png", ec_level: "H", size: 5, margin: 1}).toString('base64');
        }

        return this._pouchManager._smallQrCode;
    }    
}

HDWalletPouchBitcoin.prototype.sendBitcoinTransaction = function(transaction, callback) {
    var mockTx = transaction._kkMockTx;
    var txid = mockTx.txid;

    //  console.log('Sending Transaction:', transaction);
     // console.log('Sending Transaction:', mockTx);

     // return;
    /*

    // "{"block":-1,"confirmations":0,"inputs":[{"address":"19Ewu2jwLfamqeAx2ePNQtYE74raq6QLqH","addressIndex":19,"addressInternal":0,"amount":-200000,"previousIndex":1,"previousTxId":"0b9d9548b330027b082fba398ceac61541ede1dd3bde1b861c00f903a20f6a7d","standard":true}],"outputs":[{"address":"14XKH2fJ356grnmzgEq3HcSVZQ13cF36ae","addressIndex":0,"addressInternal":1,"amount":10000,"confirmations":0,"index":0,"spent":false,"standard":true,"timestamp":1484587646721,"txid":"79eef87a930d086179fc5d0064c0b4307f6bfe31c83eb1a723e86f0d9b69be68"},{"address":"12yKhHZMNDjcEcvwbp471kKKgAKHxVBvU4","addressIndex":null,"addressInternal":null,"amount":100000,"confirmations":0,"index":1,"spent":false,"standard":true,"timestamp":1484587646721,"txid":"79eef87a930d086179fc5d0064c0b4307f6bfe31c83eb1a723e86f0d9b69be68"}],"timestamp":1484587646721,"txid":"79eef87a930d086179fc5d0064c0b4307f6bfe31c83eb1a723e86f0d9b69be68"}" // JSON.stringify(mockTx);
    // "79eef87a930d086179fc5d0064c0b4307f6bfe31c83eb1a723e86f0d9b69be68" // txid
    if (this._pouchManager._transactions[txid]) {
        throw new Error('What?!'); //TODO ask richard what is this
    }
    */

    this._pouchManager._transactions[txid] = mockTx;
    this._pouchManager._spendable = null;

    this._pouchManager.invalidateTransactionCache();

    this._pouchManager._notify();

    // Post the transaction
    var self = this;


    //@note: @here: @dcl:
    //vlaedit need this function for debugging
    //

   /// self._pouchManager._dataStorageController.registerSentTransaction({sent:transaction,result:'response'});

    ///vladedit  _____________________________________________________________

   // return


    var onFail1 = function(reason) {
        console.warn('onFail1',reason);
    }
    var onFail2 = function(reason) {
        console.warn('onFail2 ',reason);
    }
    var onFail3 = function(reason) {
        console.warn('onFail3  ',reason);
    }




    //@note: @here: @todo: @next: @relays:
    // @todo: startRelayTaskWithBestRelay
//    g_JaxxApp.getBitcoinRelays().startRelayTaskWithDefaultRelay('pushRawTx', [transaction.toHex(), function (response){



    g_JaxxApp.getBitcoinRelays().startRelayTaskWithBestRelay('pushRawTx', [transaction.toHex(), function (response){
        console.log(response);
        if ((response.status && response.status === 'success') || response === 'success') {
            self._pouchManager._transactions[txid].status = 'success';
            self._pouchManager._notify();
        }
        else if (self._pouchManager._transactions[txid].status !== 'success') {
            delete self._pouchManager._transactions[txid];
            self._pouchManager._notify();
        }
        //@note: @here: @dcl:
        self.getPouchManager().getDataStorageController().registerSentTransaction({sent:transaction,result:response});

        if (callback) {
            var returnVar = "";
            if (response.status) {
                returnVar = response.status;
            } else {
                returnVar = response;
            }
            callback(returnVar, transaction);
        }
    },onFail1,onFail2,onFail3], 1);
}

// HDWalletPouchBitcoin.prototype.afterWorkerCacheInvalidate = function() {
// }

HDWalletPouchBitcoin.prototype.prepareSweepTransaction = function(privateKey, callback) {
    var coinNetwork = null;
    var self = this;

    if (this._pouchManager._TESTNET) {
        coinNetwork = HDWalletPouch.getStaticCoinPouchImplementation(this._pouchManager._coinType).networkDefinitions.testNet;
    } else {
        coinNetwork = HDWalletPouch.getStaticCoinPouchImplementation(this._pouchManager._coinType).networkDefinitions.mainNet;
    }
    // Function is called when:
    // The user enters their private key from a paper wallet and presses the 'Next' button.
    // Returns:
    // true if the bitcoins from the wallet with the given 'privateKey' could be successfully imported.
    var keypair = null;
    try { // This fills the variable keypair with an ECPair
        keypair = thirdparty.bitcoin.ECPair.fromWIF(privateKey, coinNetwork);
        console.log("trying to fetch for address :: " + keypair.getAddress());
    } catch (err) {
        return false;
    }

    var prepareTransaction = function(error, data) {
        //        console.log("prepareTransaction :: " + status + " :: " + JSON.stringify(data));
        var result = {};
        var coinType = self._pouchManager._coinType;

        if ((error && error !== "success") || !data) {
            callback(new Error(JSON.stringify(data)), null);
            return;
        }

        var mockTx = {
            block: -1,
            confirmations: 0,
            inputs: [],
            outputs: [],
            timestamp: (new Date()).getTime(),
            txid: null,
        }

        var toSpend = [];
        var totalValue = 0;
        var utxoList = data[Object.keys(data)[0]];
        for (var i = 0; i < utxoList.length; i++) {
            var tx = utxoList[i];
            var value = HDWalletHelper.convertBitcoinsToSatoshis(tx.amount);

            toSpend.push({
              amount: value,
              confirmations: tx.confirmations,
              index: tx.index,
              txid: tx.txid,
              //Keys for BIP 0069 sorting library
              vout: tx.index,
              txId: tx.txid,
            });
            mockTx.inputs.push({
              address: "notmyaddress",
              addressIndex: null,
              addressInternal: null,
              amount: -value,
              previousIndex: tx.index,
              previousTxId: tx.txid,
              standard: true,
            })
            totalValue += value;
        }

        //

        toSpend = thirdparty.bip69.sortInputs(toSpend);

        var signedTransaction = null;

        var transactionFee = self.getTransactionCostForUTXOs(toSpend.length);

        //        console.log("sweep bitcoin :: totalValue :: " + totalValue + " :: transactionFee :: " + transactionFee);
        if (transactionFee >= totalValue) {
            console.log(JSON.stringify(callback));
            callback(null, null, coinType); // We want the insufficient balance message to show when sweeping a private key.
            return;
        }

        while ((totalValue - transactionFee) > 0) {
            var tx = new thirdparty.bitcoin.TransactionBuilder(coinNetwork);
            tx.addOutput(wallet.getPouchFold(coinType).getCurrentChangeAddress(), totalValue - transactionFee);

            for (var i = 0; i < toSpend.length; i++) {
                var utxo = toSpend[i];
                tx.addInput(utxo.txid, utxo.index);
            }

            var unsignedTransaction = tx.buildIncomplete();
            var size = unsignedTransaction.toHex().length / 2 + unsignedTransaction.ins.length * 107;
            var targetTransactionFee = Math.ceil(size / 1024) * wallet.getPouchFold(coinType).getDefaultTransactionFee();


            // Priority is no longer a factor when building transactions so there is no need to increase the transaction fee.
            // if (targetTransactionFee <= transactionFee) {
            for (var i = 0; i < toSpend.length; i++) {
                tx.sign(i, keypair);
            }

            signedTransaction = tx.build();
            break;
            //}

            // Add at least enough tx fee to cover our size thus far (adding tx may increase fee)
            while (targetTransactionFee > transactionFee) {
                transactionFee += wallet.getPouchFold(coinType).getDefaultTransactionFee();
            }
        }

        if (!signedTransaction) {
            callback(new Error("Unsigned Transaction"), null);
            return;
        }

        // We get the txid in big endian... *sigh*
        var txidBig = signedTransaction.getHash().toString('hex');
        var txid = '';
        for (var i = txidBig.length - 2; i >= 0; i-= 2) {
            txid += txidBig.substring(i, i + 2);
        }
        mockTx.txid = txid;

        mockTx.outputs.push({
            address: wallet.getPouchFold(coinType).getCurrentReceiveAddress(),
            addressIndex: self._pouchManager.getDataStorageController().getCurrentIndexReceive(),
            addressInternal: true,
            confirmations: 0,
            index: 0,
            spent: false,
            standard: true,
            timestamp: mockTx.timestamp,
            amount: (totalValue - transactionFee),
            txid: txid,
        });

        signedTransaction._kkMockTx = mockTx;
        signedTransaction.type ='sweepTransaction';

        callback(null, {
            signedTransaction: signedTransaction,
            totalValue: HDWalletHelper.convertSatoshisToBitcoins(totalValue),
            transactionFee: transactionFee,
        }, coinType);
    }

    // btcRelays.getCurrentRelay().getUTXO(keypair.getAddress(), prepareTransaction); // Code for legacy relay system
    // "1E4nwotKjhYpeA3xiMrMt9vxJD6FXm8poR" // console.log(keypair.getAddress());


    g_JaxxApp.getBitcoinRelays().getUTXO(keypair.getAddress(), prepareTransaction); // Code for new relay system

    console.log("bitcoin relay :: " + g_JaxxApp.getBitcoinRelays());

    return true;
}

HDWalletPouchBitcoin.prototype.fromChecksumAddress = function(address) {
    return address;
}

HDWalletPouchBitcoin.prototype.toChecksumAddress = function(address) {
    return address;
}

HDWalletPouchBitcoin.prototype.getBaseCoinAddressFormatType = function() {
    return this._baseFormatCoinType;
}

HDWalletPouchBitcoin.prototype.readyBitcoinTransaction = function(address, amount, batchId) {
    var txParams = {};
    txParams.address = address;
    txParams.amount = amount;
    txParams.batchId = batchId;
    this._readyTransactionDict = txParams;
}

HDWalletPouchBitcoin.prototype.setReadyTransactionDictIsPrepared = function(batchId) {
    // console.log(batchId);
    if (this._readyTransactionDict.batchId === batchId) {
        this._readyTransactionDict.isPrepared = true;
    }
}


HDWalletPouchBitcoin.prototype.processFinishedFinalBalanceUpdate = function() {
    
}

HDWalletPouchBitcoin.prototype.getPouchManager = function(){
    return this._pouchManager;
}

HDWalletPouchBitcoin.prototype.getCurrentOverrideMiningFee = function(){

}

/* BEGIN: MINING FEE CODE */

HDWalletPouchBitcoin.prototype.getCurrentMiningFee = function(transactionSizeInBytes){
    if (typeof(transactionSizeInBytes) === 'undefined' || transactionSizeInBytes === null) {
        return this._minimumMiningFee;
    }
    var miningFeeDefault = HDWalletHelper.getDefaultRegulatedTXFee(this._pouchManager._coinType);
    var miningFeeRate = this.getCurrentMiningFeeRate();
    if (typeof(miningFeeRate) !== 'undefined' && miningFeeRate !== null) {
        return Math.max(transactionSizeInBytes * miningFeeRate, this._minimumMiningFee);
    } else {
        return miningFeeDefault;
    }
}

HDWalletPouchBitcoin.prototype.getCurrentMiningFeeRate = function(){
    var miningFeeLevel = this._pouchManager.getMiningFeeLevel();
    var miningFeeDict = this._pouchManager._miningFeeDict;
    if (miningFeeLevel === HDWalletPouch.MiningFeeLevelSlow) {
        if (typeof(miningFeeDict) !== 'undefined' && typeof(miningFeeDict.hourFee) !== 'undefined' && miningFeeDict.hourFee > 0){
            return miningFeeDict.hourFee;
        }
    } else if (miningFeeLevel === HDWalletPouch.MiningFeeLevelAverage) {
        if (typeof(miningFeeDict) !== 'undefined' && typeof(miningFeeDict.hourFee) !== 'undefined' && miningFeeDict.hourFee > 0){
            return miningFeeDict.halfHourFee;
        }
    } else if (miningFeeLevel === HDWalletPouch.MiningFeeLevelFast) {
        if (typeof(miningFeeDict) !== 'undefined' && typeof(miningFeeDict.halfHourFee) !== 'undefined' && miningFeeDict.halfHourFee > 0){
            return miningFeeDict.fastestFee;
        }
    }
    return null;
}

/* END: MINING FEE CODE */

/* BEGIN: SPENDABLE FUNCTIONALITY */

HDWalletPouchBitcoin.prototype.getTransactionCostForUTXOs = function(numberOfUTXOs){
    return this._pouchManager.getCurrentMiningFee(this.getEstimatedTransactionSize(numberOfUTXOs));
}

HDWalletPouchBitcoin.prototype.getUTXOsForTransactionAmount = function(amount_smallUnit){
    var unspent = this.getUnspentOutputsSorted();
    var totalUnspentValue = 0;
    for (var i = 0; i < unspent.length; i++){
        totalUnspentValue += unspent[i].amount;
        if (totalUnspentValue - amount_smallUnit - this.getTransactionCostForUTXOs(i+1) >= 0) {
            return unspent.slice(0, i + 1);
        }
    }
    return null; // Returns here if all the UTXOs are not enough to cover the cost of the transaction.
}

HDWalletPouchBitcoin.prototype.getSpendableBalance = function(minimumValue) {
    var spendableDict = {spendableBalance: 0, numPotentialTX: 0};
    var spendableBalance = this.getSpendableFromUTXOs(this.getUnspentOutputsSorted());
    if (spendableBalance === 0){
        return {'spendableBalance': 0, 'numPotentialTX': 0};
    } else {
        return {'spendableBalance': spendableBalance, 'numPotentialTX': 1};
    }
}


HDWalletPouchBitcoin.prototype.getSpendableFromUTXOs = function(utxos){
    var utxoSum = 0;
    var utxosWithSufficientBalance = utxos;// this.getSpendableUTXOs(utxos); // Don't filter anymore
    utxosWithSufficientBalance.forEach(function(utxo){utxoSum += utxo.amount;});
    utxoSum -= this.getTransactionCostForUTXOs(utxosWithSufficientBalance.length);
    return Math.max(utxoSum, 0);
}

HDWalletPouchBitcoin.prototype.getSpendableUTXOs = function(utxos){
  var self = this;
  var miningFeeRate = self.getCurrentMiningFeeRate();
  miningFeeRate = miningFeeRate === null ? 0 : miningFeeRate;
  return utxos.filter(function(utxo){return utxo.amount - self._bytesPerInput * miningFeeRate > 0;});
}

HDWalletPouchBitcoin.prototype.getUnspentOutputsSorted = function() {
  var unspent = this._pouchManager._dataStorageController.getUTXOs();
  unspent.sort(function (a, b) {
    return (b.amount - a.amount);
  });
  return unspent;
}

HDWalletPouchBitcoin.prototype.getEstimatedTransactionSize = function(numberOfUTXOs){
    return 78 + this._bytesPerInput * numberOfUTXOs;
}

/* END: SPENDABLE FUNCTIONALITY */

/* BEGIN: SEND TX CODE */

HDWalletPouchBitcoin.prototype.createTransaction = function(address, amount) {
    // Is address the deposit address?
    //@note: @here: this should check for address, amount validity.
    //@note: @todo: maybe a transaction queue?

    var transaction = this.buildBitcoinTransaction(address, amount);
    var miningFee = transaction ? HDWalletHelper.convertSatoshisToBitcoins(transaction._kkTransactionFee) : HDWalletHelper.convertSatoshisToBitcoins(this._pouchManager.getDefaultTransactionFee());

    //                console.log("transaction._kkTransactionFee :: " + transaction._kkTransactionFee);
    //                console.log("computedFee :: " + computedFee);

    return {transaction: transaction, miningFee: miningFee};
}

HDWalletPouchBitcoin.prototype._buildBitcoinTransaction = function(toAddress, amount_smallUnit, transactionFee, doNotSign) {
    // It is considered ok to return null if the transaction cannot be built
    var coinNetwork = null;

    if (this._pouchManager._TESTNET) {
      coinNetwork = HDWalletPouch.getStaticCoinPouchImplementation(this._pouchManager._coinType).networkDefinitions.testNet;
    } else {
      coinNetwork = HDWalletPouch.getStaticCoinPouchImplementation(this._pouchManager._coinType).networkDefinitions.mainNet;
    }
    //    this._load();
    // Get all UTXOs, biggest to smallest)
    var unspent = this.getUTXOsForTransactionAmount(amount_smallUnit);
    if (unspent === null) {
      console.warn("Not enough");
      return null;
    }
    // @TODO: Build a better change picking algorithm; for now we select the largest first
    // Find a set of UTXOs that can afford the output amount
    var toSpend = [];
    var toSpendTotal = 0;

    if (wallet.getPouchFold(COIN_BITCOIN).getIsSendingFullMaxSpendable()){
        unspent = this.getUnspentOutputsSorted();
        for (var i = 0; i < unspent.length; i++){
            var utxo = unspent[i];
            utxo.vout = utxo.index;
            utxo.txId = utxo.txid;
            toSpend.push(utxo);
            toSpendTotal += utxo.amount;
        }
        //toSpend.forEach(function(utxo){toSpendTotal += utxo.amount});
    } else {
        while (toSpendTotal < amount_smallUnit + transactionFee) {
            if (unspent.length === 0) {
                //console.log( ' error built transaction utxos less than amount  toSpendTotal  ' + toSpendTotal + '  amount_smallUnit  ' +  amount_smallUnit);
                console.error('HDWalletPouchImplementation: ' + this.uiComponents['coinFullName'] + ': The send value is smaller than the sum of the transactions.');
                return null;
            }
            var utxo = unspent.pop();
            toSpend.push(utxo);
            toSpendTotal += utxo.amount;

            // Keys for bip69 to sort on
            utxo.vout = utxo.index;
            utxo.txId = utxo.txid;
        }
    }
    if(!toAddress) return null;

    var addressToScript = function(address) {
      return thirdparty.bitcoin.address.toOutputScript(toAddress, coinNetwork);
    }
    var outputs = this._buildBitcoinTransactionGetOutputs(toAddress, toSpendTotal, amount_smallUnit, transactionFee, addressToScript);
    return this._buildBitcoinTransactionWithInputsAndOutputs(toAddress, coinNetwork, toSpend, outputs, transactionFee, doNotSign)
}

HDWalletPouchBitcoin.prototype._buildBitcoinTransactionGetOutputs = function(toAddress, toSpendTotal, amount_smallUnit, transactionFee, addressToScript) {

  // Send the target their funds
  var outputs = [
    {
      address: toAddress,
      amount: amount_smallUnit,
      addressIndex: null,
      addressInternal: null,

      // Keys for bip69 to sort on
      value: amount_smallUnit,
      script: addressToScript(toAddress),
    }
  ];
  // Send the change back to us
  var change = toSpendTotal - amount_smallUnit - transactionFee;
  if (change < 0){
    console.error('HDWalletPouchImplementation: ' + this.uiComponents['coinFullName'] + ': Computed change for this pouch is negative.');
  }
  // Add an output for change if necessary. (It almost always is).
  if (change) {
    var changeAddress = this._pouchManager._currentChangeAddress;
    outputs.push({
      address: this._pouchManager._currentChangeAddress,
      addressIndex: this._pouchManager._currentChangeIndex,
      addressInternal: 1,
      amount: change,
      // Keys for bip69 to sort on
      value: change,
      script: addressToScript(this._pouchManager._currentChangeAddress),
    });
  }
  return outputs;
}

HDWalletPouchBitcoin.prototype._buildBitcoinTransactionWithInputsAndOutputs = function(toAddress, coinNetwork, toSpend, outputs, transactionFee, doNotSign) {
  // This mimicks the data structure we keep our transactions in so we can
  // simulate instantly fulfilling the transaction
  var mockTx = {
    block: -1,
    confirmations: 0,
    inputs: [],
    outputs: [],
    timestamp: (new Date()).getTime(),
  }
  // Sort the inputs and outputs according to bip 69
  var toSpend = thirdparty.bip69.sortInputs(toSpend);
  var outputs = thirdparty.bip69.sortOutputs(outputs);

  // Create the transaction
  var tx = new thirdparty.bitcoin.TransactionBuilder(coinNetwork);

  console.log("Bitcoin Transactions: Number of inputs: " + toSpend.length);
  console.log("Bitcoin Transactions: Number of outputs: " + outputs.length);

  // Add the outputs
  for (var i = 0; i < outputs.length; i++) {
    var output = outputs[i];
    //console.log(output.address,  output.amount);
    tx.addOutput(output.address, output.amount);

    mockTx.outputs.push({
      address: output.address,
      addressIndex: output.addressIndex,
      addressInternal: output.addressInternal,
      amount: output.amount,
      confirmations: 0,
      index: i,
      spent: false,
      standard: true,
      timestamp: mockTx.timestamp,
    });
  }

  // Add the input UTXOs
  for (var i = 0; i < toSpend.length; i++) {
    var utxo = toSpend[i];
    tx.addInput(utxo.txid, utxo.index);

    mockTx.inputs.push({
      address: utxo.address,
      addressIndex: utxo.addressIndex,
      addressInternal: utxo.addressInternal,
      amount: -utxo.amount,
      previousIndex: utxo.index,
      previousTxId: utxo.txid,
      standard: true,
    });
  }

  if (typeof(doNotSign) !== 'undefined' && doNotSign !== null && doNotSign === true) {
    //        console.log("building incomplete :: " + JSON.stringify(tx));
    return tx.buildIncomplete();
  }

  // Sign the transaction
  for (var i = 0; i < toSpend.length; i++) {
    var utxo = toSpend[i];
    //        console.log("signing with :: " + this.getPrivateKey(utxo.addressInternal, utxo.addressIndex).toWIF() + " :: " + utxo.addressInternal);
    tx.sign(i, this._pouchManager.getPrivateKey(utxo.addressInternal, utxo.addressIndex));
  }

  var transaction = tx.build();

  // We get the txid in big endian... *sigh*
  var txidBig = transaction.getHash().toString('hex');
  var txid = '';
  for (var i = txidBig.length - 2; i >= 0; i-= 2) {
    txid += txidBig.substring(i, i + 2)
  }

  // Fill in the txid for the mock transaction and its outputs
  mockTx.txid = txid;
  for (var i = 0; i < mockTx.outputs.length; i++) {
    var output = mockTx.outputs[i];
    output.txid = txid;
  }

  transaction._kkToSpend = toSpend;
  transaction._kkMockTx = mockTx;

  console.log("building complete :: ",transaction);

  return transaction;
}

HDWalletPouchBitcoin.prototype.buildBitcoinTransaction = function(toAddress, amount_smallUnit, doNotSign) {
  var tx = null;

  var unspentOutputsForTx = this.getUTXOsForTransactionAmount(amount_smallUnit);
  if (typeof(unspentOutputsForTx) === 'undefined' || unspentOutputsForTx === null){
      return null;
  }
  var totalTransactionFee = this.getTransactionCostForUTXOs(unspentOutputsForTx.length);

  // var currentBitcoinMiningFee = this._pouchManager.getCurrentMiningFee();

  //var totalTransactionFee = currentBitcoinMiningFee;
    console.warn(toAddress, amount_smallUnit, doNotSign);

  var tx = this._buildBitcoinTransaction(toAddress, amount_smallUnit, totalTransactionFee, doNotSign);

  tx._kkTransactionFee = totalTransactionFee;
  tx.getTransactionFee = function() { return this._kkTransactionFee; }

  return tx;
}

/* END: SEND TX CODE */

HDWalletPouchBitcoin.isValidPrivateKey = function(value){
    return isValidBTCPrivateKey(value);
}

HDWalletPouchBitcoin.prototype.sendTransaction = function(signedTransaction, callback, params, debugIdx){
    this.sendBitcoinTransaction(signedTransaction, callback);
}
