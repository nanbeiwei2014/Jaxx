var HDWalletPouchDoge = function() {
    this._doDebug = true;
    this._pouchManager = null;
    this._baseFormatCoinType = COIN_DOGE;
    this._bytesPerInput = 148;
}


HDWalletPouchDoge.uiComponents = {
    coinFullName: 'Doge',
    coinFullDisplayName: 'Doge',
    coinWalletSelector3LetterSymbol: 'DGE',
    coinSymbol: '\u00d0',
    coinButtonSVGName: 'doge-here',
    coinLargePngName: '.imgDGE',
    coinButtonName: '.imageLogoBannerDOGE',
    coinSpinnerElementName: '.imageDogeWash',
    coinDisplayColor: '#6A6A6A',
    csvExportField: '.backupPrivateKeyListDGE',
    transactionsListElementName: '.transactionsDoge',
    transactionTemplateElementName: '.transactionDoge',
    accountsListElementName: '.accountDataTableDoge',
    accountTemplateElementName: '.accountDataDoge',
    pageDisplayPrivateKeysName: 'backupPrivateKeysDoge',
    displayNumDecimals: 8,
};

HDWalletPouchDoge.pouchParameters = {
    coinHDType: 3,
    coinIsTokenSubtype: false,
    coinAbbreviatedName: 'DOGE',
    isSingleToken: false,
    isTestnet: false,
};

//https://github.com/bitcoinjs/bitcoinjs-lib/commit/a956b8859fe73787b32f03b8bf4ba0d06cb01fa6
HDWalletPouchDoge.networkDefinitions = {
    mainNet: {
        messagePrefix: '\x19Dogecoin Signed Message:\n',
        bip32: {
            public: 0x02facafd,
            private: 0x02fac398
        },
        pubKeyHash: 0x1e,
        scriptHash: 0x16,
        wif: 0x9e,
        dustThreshold: 0
    },
    //@note: @todo: @here: needs to update to have doge testnet definitions.
    testNet: {error: true},
}

HDWalletPouchDoge.networkDefinitionTestNet = {

};

HDWalletPouchDoge.networkDefinitionTestNet = null;

HDWalletPouchDoge.getCoinAddress = function(node) {
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

HDWalletPouchDoge.prototype.convertFiatToCoin = function(fiatAmount, coinUnitType) {
    var coinAmount = 0;
    
    var satoshis = wallet.getHelper().convertFiatToSatoshis(fiatAmount);
    coinAmount = (coinUnitType === COIN_UNITLARGE) ? HDWalletHelper.convertSatoshisToBitcoins(satoshis) : satoshis;

    return coinAmount;
}

HDWalletPouchDoge.prototype.initialize = function(pouchManager) {
    this._pouchManager = pouchManager;
}

HDWalletPouchDoge.prototype.shutDown = function() {
}

HDWalletPouchDoge.prototype.setup = function() {
}

HDWalletPouchDoge.prototype.log = function(logString) {
    if (this._doDebug === false) {
        return;
    }
//
    var args = [].slice.call(arguments);
    args.unshift('DogePouchLog:');
    console.log(args);
}

HDWalletPouchDoge.prototype.updateMiningFees = function() {
    var self = this;
    
    $.getJSON('https://api.blockcypher.com/v1/doge/main', function (data) {
        if (!data || !data.medium_fee_per_kb) {
            this.log("HDWalletPouchDoge.updateMiningFees :: error :: cannot access default fee");
        } else  {
            var newMiningFeeDict = {
                fastestFee: data.high_fee_per_kb / 1000,
                halfHourFee: data.medium_fee_per_kb / 1000,
                hourFee: ((data.medium_fee_per_kb + data.low_fee_per_kb) / 2.0) / 1000
            }
            self._pouchManager._miningFeeDict = data;
            //@note: @here: default to "average"
            self._pouchManager._defaultTXFee = parseInt(data.medium_fee_per_kb);
        }
    });
}

HDWalletPouchDoge.prototype.requestBlockNumber = function(callback) {
    callback(null);
}


HDWalletPouchDoge.prototype.updateTransactionsFromWorker = function(txid, transactions) {
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

HDWalletPouchDoge.prototype.getTransactions = function() {
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

HDWalletPouchDoge.prototype.calculateHistoryForTransaction = function(transaction) {
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

HDWalletPouchDoge.prototype.getPouchFoldBalance = function() {
    //@note: @here: @dcl:
    var balance = this._pouchManager._dataStorageController.getBalanceTotalDB();

    ///console.warn(balance);
    return balance;
}

HDWalletPouchDoge.prototype._getUnspentOutputs = function() {
    //@note: @here: @dcl:

    var uxtoDict = this._pouchManager._dataStorageController.getUTXOs();

    return uxtoDict;
}

HDWalletPouchDoge.prototype.getAccountBalance = function(internal, index) {
    var accountBalance = 0;

    //@note: @here: @dcl:
    accountBalance = this._pouchManager._dataStorageController.getBalanceTotalDB();

    return accountBalance;
}

HDWalletPouchDoge.prototype.updateTokenAddresses = function(addressMap) {
}

HDWalletPouchDoge.prototype.getAccountList = function(transactions) {
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

HDWalletPouchDoge.prototype.generateQRCode = function(largeFormat, coinAmountSmallType) {
    var curRecAddr = this._pouchManager.getCurrentReceiveAddress();

    var uri = "dogecoin:" + curRecAddr; //Connects to services like shapeshift

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

HDWalletPouchDoge.prototype.sendDogeTransaction = function(transaction, callback) {
    var mockTx = transaction._kkMockTx;
    var txid = mockTx.txid;

   // console.log(' sendDogeTransaction :', txid,transaction, mockTx);
   // return;
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


    //@note: @here: @todo: @next: @relays:
    g_JaxxApp.getDogeRelays().startRelayTaskWithBestRelay('pushRawTx', [transaction.toHex(), function (response){
        if ((response.status && response.status === 'success') || response === 'success') {
            self._pouchManager._transactions[txid].status = 'success';
            self._pouchManager._notify();
        }
        else if (self._pouchManager._transactions[txid].status !== 'success') {
            delete self._pouchManager._transactions[txid];
            self._pouchManager._notify();
        }

        self._pouchManager._dataStorageController.registerSentTransaction({sent:transaction,result:response});

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

/*HDWalletPouchDoge.prototype.afterWorkerCacheInvalidate = function() {
}*/

HDWalletPouchDoge.prototype.prepareSweepTransaction = function(privateKey, callback) {
    var coinNetwork = null;

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
        
        // 
        var addressKey = Object.keys(data)[0]; // Should only have a length of 1
        var unspent = []
        for (var i = 0; i < data[addressKey].length; i++){
            unspent.push(data[addressKey][i]);
        }
        
        var toSpend = [];
        var totalValue = 0;
        for (var i = 0; i < unspent.length; i++) {
            var tx = unspent[i];
            var value = HDWalletHelper.convertBitcoinsToSatoshis(tx.amount);

            toSpend.push({
                amount: value,
                confirmations: tx.confirmations,
                index: tx.index,
                txid: tx.txid,

                //Keys for BIP 0069 sorting library
                vout: tx.n,
                txId: tx.txid,
            });
            mockTx.inputs.push({
                address: "notmyaddress",
                addressIndex: null,
                addressInternal: null,
                amount: -value,
                previousIndex: tx.n,
                previousTxId: tx.txid,
                standard: true,
            })
            totalValue += value;
        }

        //

        toSpend = thirdparty.bip69.sortInputs(toSpend);

        var signedTransaction = null;

        var transactionFee = wallet.getPouchFold(COIN_DOGE).getDefaultTransactionFee();

        //        console.log("sweep bitcoin :: totalValue :: " + totalValue + " :: transactionFee :: " + transactionFee);
        if (transactionFee >= totalValue) {
            console.log(JSON.stringify(callback));

            callback(new Error("the balance is lower than tx fee : " + HDWalletHelper.convertSatoshisToBitcoins(transactionFee)), null);
            return;
        }

        while ((totalValue - transactionFee) > 0) {
            var tx = new thirdparty.bitcoin.TransactionBuilder(coinNetwork);
            tx.addOutput(wallet.getPouchFold(COIN_DOGE).getCurrentChangeAddress(), totalValue - transactionFee);

            for (var i = 0; i < toSpend.length; i++) {
                var utxo = toSpend[i];
                tx.addInput(utxo.txid, utxo.index);
            }

            var unsignedTransaction = tx.buildIncomplete();
            var size = unsignedTransaction.toHex().length / 2 + unsignedTransaction.ins.length * 107;
            var targetTransactionFee = Math.ceil(size / 1024) * wallet.getPouchFold(COIN_DOGE).getDefaultTransactionFee();

            if (targetTransactionFee <= transactionFee) {
                for (var i = 0; i < toSpend.length; i++) {
                    tx.sign(i, keypair);
                }

                signedTransaction = tx.build();
                break;
            }

            // Add at least enough tx fee to cover our size thus far (adding tx may increase fee)
            while (targetTransactionFee > transactionFee) {
                transactionFee += wallet.getPouchFold(COIN_DOGE).getDefaultTransactionFee();
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
            address: wallet.getPouchFold(COIN_DOGE).getCurrentChangeAddress(),
            addressIndex: wallet.getPouchFold(COIN_DOGE).getCurrentChangeIndex(),
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

        callback(null, {
            signedTransaction: signedTransaction,
            totalValue: HDWalletHelper.convertSatoshisToBitcoins(totalValue),
            transactionFee: transactionFee,
        }, COIN_DOGE);
    }

    g_JaxxApp.getDogeRelays().getUTXO(keypair.getAddress(), prepareTransaction); // Code for new relay system

    console.log("doge relay :: " + g_JaxxApp.getDogeRelays());

    return true;
};

HDWalletPouchDoge.prototype.fromChecksumAddress = function(address) {
    return address;
};

HDWalletPouchDoge.prototype.toChecksumAddress = function(address) {
    return address;
};

HDWalletPouchDoge.prototype.getBaseCoinAddressFormatType = function() {
    return this._baseFormatCoinType;
};

HDWalletPouchDoge.isValidPrivateKey = function(value){
    return isValidBTCPrivateKey(value, HDWalletPouchDoge.networkDefinitions.mainNet);
}

HDWalletPouchDoge.prototype.sendTransaction = function(signedTransaction, callback, params, debugIdx){
    this.sendDogeTransaction(signedTransaction, callback);
}

/* BEGIN: MINING FEE CODE */

HDWalletPouchDoge.prototype.getCurrentMiningFee = function(transactionSizeInBytes){
    return 55000;
}

HDWalletPouchDoge.prototype.getCurrentMiningFeeRate = function(){
    return 0;
}

/* END: MINING FEE CODE */

/* BEGIN: SPENDABLE FUNCTIONALITY */

HDWalletPouchDoge.prototype.getTransactionCostForUTXOs = function(numberOfUTXOs){
  return this._pouchManager.getCurrentMiningFee(this.getEstimatedTransactionSize(numberOfUTXOs));
}

HDWalletPouchDoge.prototype.getUTXOsForTransactionAmount = function(amount_smallUnit){
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

HDWalletPouchDoge.prototype.getSpendableBalance = function(minimumValue) {
  var spendableDict = {spendableBalance: 0, numPotentialTX: 0};
  var spendableBalance = this.getSpendableFromUTXOs(this.getUnspentOutputsSorted());
  if (spendableBalance === 0){
    return {'spendableBalance': 0, 'numPotentialTX': 0};
  } else {
    return {'spendableBalance': spendableBalance, 'numPotentialTX': 1};
  }
}

HDWalletPouchDoge.prototype.getSpendableFromUTXOs = function(utxos){
  var utxoSum = 0;
  var utxosWithSufficientBalance = this.getSpendableUTXOs(utxos);
  utxosWithSufficientBalance.forEach(function(utxo){utxoSum += utxo.amount;});
  utxoSum -= this.getTransactionCostForUTXOs(utxosWithSufficientBalance.length);
  return Math.max(utxoSum, 0);
}

HDWalletPouchDoge.prototype.getSpendableUTXOs = function(utxos){
  var self = this;
  var miningFeeRate = self.getCurrentMiningFeeRate();
  miningFeeRate = miningFeeRate === null ? 0 : miningFeeRate;
  return utxos.filter(function(utxo){
      return utxo.amount - self._bytesPerInput * miningFeeRate > 0;
  });
}

HDWalletPouchDoge.prototype.getUnspentOutputsSorted = function() {
  var unspent = this._pouchManager._dataStorageController.getUTXOs();
  unspent.sort(function (a, b) {
    return (b.amount - a.amount);
  });
  return unspent;
}

HDWalletPouchDoge.prototype.getEstimatedTransactionSize = function(numberOfUTXOs){
    return 78 + this._bytesPerInput * numberOfUTXOs;
}

/* END: SPENDABLE FUNCTIONALITY */

/* BEGIN: SEND TX CODE */

HDWalletPouchDoge.prototype.createTransaction = function(address, amount) {
  // Is address the deposit address?
  //@note: @here: this should check for address, amount validity.
  //@note: @todo: maybe a transaction queue?

  var transaction = this.buildBitcoinTransaction(address, amount);
  var miningFee = transaction ? HDWalletHelper.convertSatoshisToBitcoins(transaction._kkTransactionFee) : HDWalletHelper.convertSatoshisToBitcoins(this._pouchManager.getDefaultTransactionFee());

  //                console.log("transaction._kkTransactionFee :: " + transaction._kkTransactionFee);
  //                console.log("computedFee :: " + computedFee);

  return {transaction: transaction, miningFee: miningFee};
}

HDWalletPouchDoge.prototype._buildBitcoinTransaction = function(toAddress, amount_smallUnit, transactionFee, doNotSign) {
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
  var addressToScript = function(address) {
    return thirdparty.bitcoin.address.toOutputScript(toAddress, coinNetwork);
  }
  var outputs = this._buildBitcoinTransactionGetOutputs(toAddress, toSpendTotal, amount_smallUnit, transactionFee, addressToScript);
  return this._buildBitcoinTransactionWithInputsAndOutputs(toAddress, coinNetwork, toSpend, outputs, transactionFee, doNotSign)
}

HDWalletPouchDoge.prototype._buildBitcoinTransactionGetOutputs = function(toAddress, toSpendTotal, amount_smallUnit, transactionFee, addressToScript) {

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

HDWalletPouchDoge.prototype._buildBitcoinTransactionWithInputsAndOutputs = function(toAddress, coinNetwork, toSpend, outputs, transactionFee, doNotSign) {
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

HDWalletPouchDoge.prototype.buildBitcoinTransaction = function(toAddress, amount_smallUnit, doNotSign) {
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