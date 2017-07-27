var HDWalletPouchZCash = function() {
    this._doDebug = true;
    this._pouchManager = null;
    this._baseFormatCoinType = COIN_ZCASH;
    this._bytesPerInput = 148;
    this._minimumMiningFee = 10000;
}


HDWalletPouchZCash.uiComponents = {
    coinFullName: 'ZCash',
    coinFullDisplayName: 'ZCash',
    coinWalletSelector3LetterSymbol: 'ZEC',
    coinSymbol: '\u24E9',
    coinButtonSVGName: 'zcash-here',
    coinLargePngName: '.imgZEC',
    coinButtonName: '.imageLogoBannerZEC',
    coinSpinnerElementName: '.imageZCashWash',
    coinDisplayColor: '#4094CC',
    csvExportField: '.backupPrivateKeyListZEC',
    transactionsListElementName: '.transactionsZCash',
    transactionTemplateElementName: '.transactionZCash',
    accountsListElementName: '.accountDataTableZCash',
    accountTemplateElementName: '.accountDataZCash',
    pageDisplayPrivateKeysName: 'backupPrivateKeysZCash',
    displayNumDecimals: 8,
};

HDWalletPouchZCash.pouchParameters = {
    coinHDType: 133,
    coinIsTokenSubtype: false,
    coinAbbreviatedName: 'ZEC',
    isSingleToken: false,
    isTestnet: false,
};

//@note: mainnet definitions from https://github.com/zcash/zcash/blob/90c116ac5400da94a0329d5af441f8f2c24d0e27/src/chainparams.cpp

//base58Prefixes[EXT_PUBLIC_KEY]     = {0x04,0x88,0xB2,0x1E};
//base58Prefixes[EXT_SECRET_KEY]     = {0x04,0x88,0xAD,0xE4};

//@note: testnet definitions from https://github.com/zcash/zcash/blob/90c116ac5400da94a0329d5af441f8f2c24d0e27/src/chainparams.cppn 

//base58Prefixes[EXT_PUBLIC_KEY]     = {0x04,0x35,0x87,0xCF};
//base58Prefixes[EXT_SECRET_KEY]     = {0x04,0x35,0x83,0x94};
HDWalletPouchZCash.networkDefinitions = {
    mainNet: {
        messagePrefix: '\x19ZCash Signed Message:\n',
        bip32: {
            public: 0x0488b21e,
            private: 0x0488ade4
        },
            pubKeyHash: 0x1cb8,
            scriptHash: 0x1cbd,
        wif: 0x80,
        dustThreshold: 0
    },
    testNet: {
        messagePrefix: '\x19ZCash Signed Message:\n',
        bip32: {
            public: 0x043587cf,
            private: 0x04358394
        },
        pubKeyHash: 0x1d25,
        scriptHash: 0x1cba,
        wif: 0xef,
        dustThreshold: 0
    },
    testNet: {error: true}
}

HDWalletPouchZCash.networkDefinitionTestNet = {

};

HDWalletPouchZCash.networkDefinitionTestNet = null;

HDWalletPouchZCash.getCoinAddress = function(node) {
    var pubKey = node.keyPair.getPublicKeyBuffer();

    var pubKeyHash = thirdparty.bitcoin.crypto.hash160(pubKey);

    var payload = new thirdparty.Buffer.Buffer(22);
//    console.log("bitcoin :: pubkeyhash :: " + node.keyPair.network.pubKeyHash);
    payload.writeUInt16BE(node.keyPair.network.pubKeyHash, 0);
    pubKeyHash.copy(payload, 2);

    var address = thirdparty.bs58check.encode(payload);

    //        console.log("[bitcoin] address :: " + address);
    return address;
}

HDWalletPouchZCash.prototype.convertFiatToCoin = function(fiatAmount, coinUnitType) {
    var coinAmount = 0;
    
    var satoshis = wallet.getHelper().convertFiatToSatoshis(fiatAmount);
    coinAmount = (coinUnitType === COIN_UNITLARGE) ? HDWalletHelper.convertSatoshisToBitcoins(satoshis) : satoshis;

    return coinAmount;
}

HDWalletPouchZCash.prototype.initialize = function(pouchManager) {
    this._pouchManager = pouchManager;
}

HDWalletPouchZCash.prototype.shutDown = function() {
}

HDWalletPouchZCash.prototype.setup = function() {
}

HDWalletPouchZCash.prototype.log = function(logString) {
    if (this._doDebug === false) {
        return;
    }

    var args = [].slice.call(arguments);
    args.unshift('ZCashPouchLog:');
    console.log(args);
}

HDWalletPouchZCash.prototype.updateMiningFees = function() {
    var self = this;
    
//    $.getJSON('https://api.blockcypher.com/v1/ltc/main', function (data) {
//        if (!data || !data.medium_fee_per_kb) {
//            this.log("HDWalletPouchZCash.updateMiningFees :: error :: cannot access default fee");
//        } else  {
//            var newMiningFeeDict = {
//                fastestFee: data.high_fee_per_kb / 1000,
//                halfHourFee: data.medium_fee_per_kb / 1000,
//                hourFee: ((data.medium_fee_per_kb + data.low_fee_per_kb) / 2.0) / 1000
//            }
//            self._pouchManager._miningFeeDict = data;
//            //@note: @here: default to "average"
//            self._pouchManager._defaultTXFee = parseInt(data.medium_fee_per_kb);
//        }
//    });
}

HDWalletPouchZCash.prototype.requestBlockNumber = function(callback) {
    callback(null);
}


HDWalletPouchZCash.prototype.updateTransactionsFromWorker = function(txid, transactions) {
    var isTXUpdated = false;
    
    var existingTransaction = this._pouchManager._transactions[txid];
    if (typeof(existingTransaction) === 'undefined') {
        existingTransaction = null;
    }
    
    var transaction = transactions[txid];
    //@note: @here: @next:
    //                            if (typeof(existingTransaction) !== 'undefined' && existingTransaction !== null && existingTransaction.inputs && existingTransaction.outputs) {
    //                                if (transaction.inputs.length !== existingTransaction.inputs.length) {
    //                                    console.log("tx inputs different length");
    //                                    didModifyTX = true;
    //                                }
    //                                
    //                                if (transaction.outputs.length !== existingTransaction.outputs.length) {
    //                                    console.log("tx outputs different length");
    //                                    didModifyTX = true;
    //                                }
    //                            }

    // We need to convert all the amounts from BTC to satoshis (cannot do this inside the worker easily)
    for (var i = 0; i < transaction.inputs.length; i++) {
        var input = transaction.inputs[i];
        input.amount = HDWalletHelper.convertBitcoinsToSatoshis(input.amountBtc);

        if (existingTransaction && (existingTransaction.inputs[i].addressIndex !== input.addressIndex || existingTransaction.inputs[i].addressInternal !== input.addressInternal)) {
            //                                    console.log("[inputs] :: " + i + " :: [existingTransaction] :: addressIndex :: " + existingTransaction.inputs[i].addressIndex + " :: addressInternal :: " + existingTransaction.inputs[i].addressInternal + " :: [incomingTransaction] : addressIndex :: " + input.addressIndex + " :: addressInternal :: " + input.addressInternal);
            isTXUpdated = true;
        }
        //                                console.log("input.amountBtc :: " + input.amountBtc + " :: input.amount :: " + input.amount)
    }
    for (var i = 0; i < transaction.outputs.length; i++) {
        var output = transaction.outputs[i];
        output.amount = HDWalletHelper.convertBitcoinsToSatoshis(output.amountBtc);

        if (existingTransaction && (existingTransaction.outputs[i].addressIndex !== output.addressIndex || existingTransaction.outputs[i].addressInternal !== output.addressInternal)) {
            //                                    console.log("[outputs] :: " + i + " :: [existingTransaction] :: addressIndex :: " + existingTransaction.outputs[i].addressIndex + " :: addressInternal :: " + existingTransaction.outputs[i].addressInternal + " :: [incomingTransaction] : addressIndex :: " + output.addressIndex + " :: addressInternal :: " + output.addressInternal);

            isTXUpdated = true;
        }

        //                                console.log("output.amountBtc :: " + output.amountBtc + " :: output.amount :: " + output.amount)
    }
    
    return isTXUpdated;
}

HDWalletPouchZCash.prototype.getTransactions = function() {
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

HDWalletPouchZCash.prototype.calculateHistoryForTransaction = function(transaction) {
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

HDWalletPouchZCash.prototype.getPouchFoldBalance = function() {
    //@note: @here: @dcl:
    var balance = this._pouchManager._dataStorageController.getBalanceTotalDB();

    return balance;
}

HDWalletPouchZCash.prototype._getUnspentOutputs = function() {
    //@note: @here: @dcl:

    var uxtoDict = this._pouchManager._dataStorageController.getUTXOs();

    return uxtoDict;
}

HDWalletPouchZCash.prototype.getAccountBalance = function(internal, index) {
    var accountBalance = 0;

    //@note: @here: @dcl:
    accountBalance = this._pouchManager._dataStorageController.getBalanceTotalDB();

    return accountBalance;
}

HDWalletPouchZCash.prototype.updateTokenAddresses = function(addressMap) {
}

HDWalletPouchZCash.prototype.getAccountList = function(transactions) {
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

HDWalletPouchZCash.prototype.generateQRCode = function(largeFormat, coinAmountSmallType) {
    var curRecAddr = this._pouchManager.getCurrentReceiveAddress();

    var uri = "zcash:" + curRecAddr;

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

HDWalletPouchZCash.prototype.sendZCashTransaction = function(transaction, callback) {
    var mockTx = transaction._kkMockTx;
    var txid = mockTx.txid;

    this.log('Sending Transaction:', txid, transaction, transaction.toHex(), mockTx);

    /*
    if (this._pouchManager._transactions[txid]) {
        throw new Error('What?!'); //TODO ask richard what is this
    }*/

    this._pouchManager._transactions[txid] = mockTx;
    this._pouchManager._spendable = null;

    this._pouchManager.invalidateTransactionCache();

    this._pouchManager._notify();

    // Post the transaction
    var self = this;


    transaction.type = 'Bitcoin';
    //@note: @here: @todo: @next: @relays:
    g_JaxxApp.getZCashRelays().startRelayTaskWithBestRelay('pushRawTx', [transaction.toHex(), function (response){

        self._pouchManager._dataStorageController.registerSentTransaction({sent:transaction,result:response});
        if ((response.status && response.status === 'success') || response === 'success') {
            self._pouchManager._transactions[txid].status = 'success';
            self._pouchManager._notify();
        }
        else if (self._pouchManager._transactions[txid].status !== 'success') {
            delete self._pouchManager._transactions[txid];
            self._pouchManager._notify();
        }
        
        self.log(response);
        if (callback) {
            var returnVar = "";
            if (response.status) {
                returnVar = response.status;
            } else {
                returnVar = response;
            }
            callback(returnVar, transaction);
        }
    }], 1);
}

/*HDWalletPouchZCash.prototype.afterWorkerCacheInvalidate = function() {
}*/

HDWalletPouchZCash.prototype.prepareSweepTransaction = function(privateKey, callback) {
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

    // In refactor we need to move the relays into pouches so that this whole thing can be refactored.
    g_JaxxApp.getZCashRelays().getUTXO(keypair.getAddress(), prepareTransaction); // Code for new relay system

    console.log("zcash relay :: " + g_JaxxApp.getZCashRelays());

    return true;
}

HDWalletPouchZCash.prototype.fromChecksumAddress = function(address) {
    return address;
}

HDWalletPouchZCash.prototype.toChecksumAddress = function(address) {
    return address;
}

HDWalletPouchZCash.prototype.getBaseCoinAddressFormatType = function() {
    return this._baseFormatCoinType;
}

/************************************************/

/* BEGIN: MINING FEE CODE */

HDWalletPouchZCash.prototype.getCurrentMiningFee = function(transactionSizeInBytes){
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

HDWalletPouchZCash.prototype.getCurrentMiningFeeRate = function(){
  /*
  var miningFeeLevel = this._pouchManager.getMiningFeeLevel();
  var miningFeeDict = this._pouchManager._miningFeeDict;
  if (miningFeeLevel === HDWalletPouch.MiningFeeLevelSlow) {
    return 40;
  } else if (miningFeeLevel === HDWalletPouch.MiningFeeLevelAverage) {
    if (typeof(miningFeeDict) !== 'undefined' && typeof(miningFeeDict.hourFee) !== 'undefined' && miningFeeDict.hourFee > 0){
      return miningFeeDict.hourFee;
    }
  } else if (miningFeeLevel === HDWalletPouch.MiningFeeLevelFast) {
    if (typeof(miningFeeDict) !== 'undefined' && typeof(miningFeeDict.halfHourFee) !== 'undefined' && miningFeeDict.halfHourFee > 0){
      return miningFeeDict.halfHourFee;
    }
  }*/
  return null;
}

/* END: MINING FEE CODE */

/* BEGIN: SPENDABLE FUNCTIONALITY */

HDWalletPouchZCash.prototype.getTransactionCostForUTXOs = function(numberOfUTXOs){
  return this.getCurrentMiningFee(this.getEstimatedTransactionSize(numberOfUTXOs));
}

HDWalletPouchZCash.prototype.getUTXOsForTransactionAmount = function(amount_smallUnit){
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

HDWalletPouchZCash.prototype.getSpendableBalance = function(minimumValue) {
  var spendableDict = {spendableBalance: 0, numPotentialTX: 0};
  var spendableBalance = this.getSpendableFromUTXOs(this.getUnspentOutputsSorted());
  if (spendableBalance === 0){
    return {'spendableBalance': 0, 'numPotentialTX': 0};
  } else {
    return {'spendableBalance': spendableBalance, 'numPotentialTX': 1};
  }
}


HDWalletPouchZCash.prototype.getSpendableFromUTXOs = function(utxos){
  var utxoSum = 0;
  var utxosWithSufficientBalance = this.getSpendableUTXOs(utxos);
  utxosWithSufficientBalance.forEach(function(utxo){utxoSum += utxo.amount;});
  utxoSum -= this.getTransactionCostForUTXOs(utxosWithSufficientBalance.length); // -10000 about
  return Math.max(utxoSum, 0);
}

HDWalletPouchZCash.prototype.getSpendableUTXOs = function(utxos){
  var self = this;
  var miningFeeRate = self.getCurrentMiningFeeRate();
  miningFeeRate = miningFeeRate === null ? 0 : miningFeeRate;
  return utxos.filter(function(utxo){return utxo.amount - self._bytesPerInput * miningFeeRate > 0;});
}

HDWalletPouchZCash.prototype.getUnspentOutputsSorted = function() {
  var unspent = this._pouchManager._dataStorageController.getUTXOs();
  unspent.sort(function (a, b) {
    return (b.amount - a.amount);
  });
  return unspent;
}

HDWalletPouchZCash.prototype.getEstimatedTransactionSize = function(numberOfUTXOs){
  return 78 + this._bytesPerInput * numberOfUTXOs;
}
/* END: SPENDABLE FUNCTIONALITY */

/* BEGIN: SEND TX CODE */

HDWalletPouchZCash.prototype.createTransaction = function(address, amount) {
  // Is address the deposit address?
  //@note: @here: this should check for address, amount validity.
  //@note: @todo: maybe a transaction queue?

  var transaction = this.buildBitcoinTransaction(address, amount);
  var miningFee = transaction ? HDWalletHelper.convertSatoshisToBitcoins(transaction._kkTransactionFee) : HDWalletHelper.convertSatoshisToBitcoins(this._pouchManager.getDefaultTransactionFee());

  //                console.log("transaction._kkTransactionFee :: " + transaction._kkTransactionFee);
  //                console.log("computedFee :: " + computedFee);

  return {transaction: transaction, miningFee: miningFee};
}


HDWalletPouchZCash.prototype._buildBitcoinTransaction = function(toAddress, amount_smallUnit, transactionFee, doNotSign) {
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

  if(!toAddress) return null;

  var addressToScript = function(address) {
    return thirdparty.bitcoin.address.toOutputScript(toAddress, coinNetwork);
  }
  var outputs = this._buildBitcoinTransactionGetOutputs(toAddress, toSpendTotal, amount_smallUnit, transactionFee, addressToScript);
  return this._buildBitcoinTransactionWithInputsAndOutputs(toAddress, coinNetwork, toSpend, outputs, transactionFee, doNotSign)
}

HDWalletPouchZCash.prototype._buildBitcoinTransactionGetOutputs = function(toAddress, toSpendTotal, amount_smallUnit, transactionFee, addressToScript) {

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

HDWalletPouchZCash.prototype._buildBitcoinTransactionWithInputsAndOutputs = function(toAddress, coinNetwork, toSpend, outputs, transactionFee, doNotSign) {
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

HDWalletPouchZCash.prototype.buildBitcoinTransaction = function(toAddress, amount_smallUnit, doNotSign) {
  var tx = null;

  var unspentOutputsForTx = this.getUTXOsForTransactionAmount(amount_smallUnit);
  if (typeof(unspentOutputsForTx) === 'undefined' || unspentOutputsForTx === null){
    return null;
  }
  var totalTransactionFee = this.getTransactionCostForUTXOs(unspentOutputsForTx.length);

  // var currentBitcoinMiningFee = this._pouchManager.getCurrentMiningFee();

  //var totalTransactionFee = currentBitcoinMiningFee;

  var tx = this._buildBitcoinTransaction(toAddress, amount_smallUnit, totalTransactionFee, doNotSign);

  tx._kkTransactionFee = totalTransactionFee;
  tx.getTransactionFee = function() { return this._kkTransactionFee; }

  return tx;
}

/* END: SEND TX CODE */

HDWalletPouchZCash.isValidPrivateKey = function(value){
    return isValidBTCPrivateKey(value, HDWalletPouchZCash.networkDefinitions.mainNet);
}

HDWalletPouchZCash.prototype.sendTransaction = function(signedTransaction, callback, params, debugIdx){
    this.sendZCashTransaction(signedTransaction, callback);
}