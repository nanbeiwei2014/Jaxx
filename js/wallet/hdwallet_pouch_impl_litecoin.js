var HDWalletPouchLitecoin = function() {
    this._doDebug = true;

    this._pouchManager = null;

    this._baseFormatCoinType = COIN_LITECOIN;
}


HDWalletPouchLitecoin.uiComponents = {
    coinFullName: 'Litecoin',
    coinFullDisplayName: 'Litecoin',
    coinWalletSelector3LetterSymbol: 'LTC',
    coinSymbol: '\u0141',
    coinButtonSVGName: 'litecoin-here',
    coinLargePngName: '.imgLTC',
    coinButtonName: '.imageLogoBannerLTC',
    coinSpinnerElementName: '.imageLitecoinWash',
    coinDisplayColor: '#6A6A6A',
    csvExportField: '.backupPrivateKeyListLTC',
    transactionsListElementName: '.transactionsLitecoin',
    transactionTemplateElementName: '.transactionLitecoin',
    accountsListElementName: '.accountDataTableLitecoin',
    accountTemplateElementName: '.accountDataLitecoin',
    pageDisplayPrivateKeysName: 'backupPrivateKeysLitecoin',
    displayNumDecimals: 8,
};

HDWalletPouchLitecoin.pouchParameters = {
    coinHDType: 2,
    coinIsTokenSubtype: false,
    coinAbbreviatedName: 'LTC',
    isSingleToken: false,
    isTestnet: false,
};

HDWalletPouchLitecoin.networkDefinitions = {
    mainNet: {
        messagePrefix: '\x19Litecoin Signed Message:\n',
        bip32: {
            public: 0x019da462,
            private: 0x019d9cfe
        },
        pubKeyHash: 0x30,
        scriptHash: 0x05,
        wif: 0xb0,
        dustThreshold: 0
    },
    //@note: @todo: @here: needs to update to have litecoin testnet definitions.
    testNet: {error: true},
}

HDWalletPouchLitecoin.networkDefinitionTestNet = {

};

HDWalletPouchLitecoin.networkDefinitionTestNet = null;

HDWalletPouchLitecoin.getCoinAddress = function(node) {
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

HDWalletPouchLitecoin.prototype.convertFiatToCoin = function(fiatAmount, coinUnitType, fiatUnit) {
    var coinAmount = 0;
    var satoshis = wallet.getHelper().convertFiatToBitcoinLikeSmallUnit(this._pouchManager._coinType, fiatAmount, fiatUnit);
    coinAmount = (coinUnitType === COIN_UNITLARGE) ? HDWalletHelper.convertSatoshisToBitcoins(satoshis) : satoshis;

    return coinAmount;
}

HDWalletPouchLitecoin.prototype.initialize = function(pouchManager) {
    this._pouchManager = pouchManager;
}

HDWalletPouchLitecoin.prototype.shutDown = function() {
}

HDWalletPouchLitecoin.prototype.setup = function() {
}

HDWalletPouchLitecoin.prototype.log = function(logString) {
    if (this._doDebug === false) {
        return;
    }
//
    var args = [].slice.call(arguments);
    args.unshift('LitecoinPouchLog:');
    console.log(args);
}

HDWalletPouchLitecoin.prototype.updateMiningFees = function() {
    var self = this;
    
    $.getJSON('https://api.blockcypher.com/v1/ltc/main', function (data) {
        if (!data || !data.medium_fee_per_kb) {
            this.log("HDWalletPouchLitecoin.updateMiningFees :: error :: cannot access default fee");
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

HDWalletPouchLitecoin.prototype.requestBlockNumber = function(callback) {
    callback(null);
}


HDWalletPouchLitecoin.prototype.updateTransactionsFromWorker = function(txid, transactions) {
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

HDWalletPouchLitecoin.prototype.getTransactions = function() {
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

HDWalletPouchLitecoin.prototype.calculateHistoryForTransaction = function(transaction) {
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

HDWalletPouchLitecoin.prototype.getPouchFoldBalance = function() {
    //@note: @here: @dcl:
    var balance = this._pouchManager._dataStorageController.getBalanceTotalDB();
    return balance;
}

HDWalletPouchLitecoin.prototype._getUnspentOutputs = function() {
    //@note: @here: @dcl:

    var uxtoDict = this._pouchManager._dataStorageController.getUTXOs();

    return uxtoDict;
}

HDWalletPouchLitecoin.prototype.getAccountBalance = function(internal, index) {
    var accountBalance = 0;

    //@note: @here: @dcl:
    accountBalance = this._pouchManager._dataStorageController.getBalanceTotalDB();

    return accountBalance;
}

HDWalletPouchLitecoin.prototype.getSpendableBalance = function(minimumValue) {
    var spendableDict = {spendableBalance: 0,
                         numPotentialTX: 0};

    var miningFee = this._pouchManager.getCurrentMiningFee();
    var utxos = this._pouchManager._dataStorageController.getUTXOs();

    var spendableBalance = utxos.reduce(function (a, b) {
        return a+=b.amount;
    },0);

   ///var spendableBalance = this.getPouchFoldBalance();

    //@note: @here: @dcl:

    var address = this._pouchManager._dataStorageController.getCurrentPublicAddresReceive();

    while (spendableBalance > 0) {

        var transaction = this.buildBitcoinTransaction(address, spendableBalance, true);
        //        console.log("transaction :: " + JSON.stringify(transaction));

        if (transaction) { break; }

        spendableBalance -= this._pouchManager.getCurrentMiningFee();
    }

    spendableDict.spendableBalance = spendableBalance;
    spendableDict.numPotentialTX = 1;

    return spendableDict;
}

HDWalletPouchLitecoin.prototype._buildBitcoinTransaction = function(toAddress, amount_smallUnit, transactionFee, doNotSign) {
    // It is considered ok to return null if the transaction cannot be built
    var coinNetwork = null;

    if (this._pouchManager._TESTNET) {
        coinNetwork = HDWalletPouch.getStaticCoinPouchImplementation(this._pouchManager._coinType).networkDefinitions.testNet;
    } else {
        coinNetwork = HDWalletPouch.getStaticCoinPouchImplementation(this._pouchManager._coinType).networkDefinitions.mainNet;
    }
    
    //    this._load();

    // Get all UTXOs, biggest to smallest)
    var unspent = this._getUnspentOutputs();




    unspent.sort(function (a, b) {
        return (a.amount - b.amount);
    });

    // @TODO: Build a better change picking algorithm; for now we select the largest first

    // Find a set of UTXOs that can afford the output amount
    var toSpend = [];
    var toSpendTotal = 0;

   // console.log('%c  transactionFee   ' + transactionFee,'color:green');


    while (toSpendTotal < amount_smallUnit + transactionFee) {
        if (unspent.length === 0) {
            return null;
        }
        var utxo = unspent.pop();

        toSpend.push(utxo);
        toSpendTotal += utxo.amount;

        // Keys for bip69 to sort on
        utxo.vout = utxo.index;
        utxo.txId = utxo.txid;
    }




    // Create the transaction
    var tx = new thirdparty.bitcoin.TransactionBuilder(coinNetwork);

    // This mimicks the data structure we keep our transactions in so we can
    // simulate instantly fulfilling the transaction
    var mockTx = {
        block: -1,
        confirmations: 0,
        inputs: [],
        outputs: [],
        timestamp: (new Date()).getTime(),
    }

    if(!toAddress) return null;

    var addressToScript = function(address) {
        return thirdparty.bitcoin.address.toOutputScript(toAddress, coinNetwork);
    }


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
    if (change) {

        ////////////////////////////////////////////////////


        var changeAddress = this._pouchManager._dataStorageController.getCurrentAddressChange();
        var changeIndex = this._pouchManager._dataStorageController.getCurrentIndexChange();


        outputs.push({
            address: changeAddress,
            addressIndex: changeIndex,
            addressInternal: 1,
            amount: change,

            // Keys for bip69 to sort on
            value: change,
            script: addressToScript(this._pouchManager._currentChangeAddress),
        });
    }

    // Sort the inputs and outputs according to bip 69
    toSpend = thirdparty.bip69.sortInputs(toSpend);
    outputs = thirdparty.bip69.sortOutputs(outputs);

    // Add the outputs
    for (var i = 0; i < outputs.length; i++) {

        var output = outputs[i];
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
        
      //  console.log("signing with :: " + this._pouchManager.getPrivateKey(utxo.addressInternal, utxo.addressIndex).toWIF() + " :: " + utxo.addressInternal);
        
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

    //    console.log("building complete :: " + JSON.stringify(transaction));

    return transaction;
}


HDWalletPouchLitecoin.prototype.buildBitcoinTransaction = function(toAddress, amount_smallUnit, doNotSign) {
    var tx = null;
    
    var currentLitecoinMiningFee = this._pouchManager.getCurrentMiningFee();
    
    var totalTransactionFee = currentLitecoinMiningFee;

    //    console.log("buildBitcoinTransaction :: address :: " + toAddress + " :: currentBitcoinMiningFee :: " + currentBitcoinMiningFee);
    while (true) {
        tx = this._buildBitcoinTransaction(toAddress, amount_smallUnit, totalTransactionFee, true);

        // Insufficient funds
        if (tx == null) {
            return null;
        }

        // How big is the transaction and what fee do we need? (we didn't sign so fill in 107 bytes for signatures)
        var size = tx.toHex().length / 2 + tx.ins.length * 107;
       // console.log(' tx.toHex().length   ' + tx.toHex().length);
      //  console.log( ' size  ' + size);
        var targetTransactionFee = Math.ceil(size / 1024) * (currentLitecoinMiningFee);

                   console.log("targetTransactionFee :: " + targetTransactionFee);
        //            break;//
        // We have enough tx fee (sign it)
        if (targetTransactionFee <= totalTransactionFee) {
            if (typeof(doNotSign) === 'undefined' || doNotSign === null || doNotSign === false) {
                tx = this._buildBitcoinTransaction(toAddress, amount_smallUnit, totalTransactionFee);
            }
            break;
        }

        // Add at least enough tx fee to cover our size thus far (adding tx may increase fee)
        while (targetTransactionFee > totalTransactionFee) {
            totalTransactionFee += currentLitecoinMiningFee;
        }
    }

    tx._kkTransactionFee = totalTransactionFee;
    tx.getTransactionFee = function() { return this._kkTransactionFee; }

    return tx;        
}

HDWalletPouchLitecoin.prototype.updateTokenAddresses = function(addressMap) {
}

HDWalletPouchLitecoin.prototype.getAccountList = function(transactions) {
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

HDWalletPouchLitecoin.prototype.generateQRCode = function(largeFormat, coinAmountSmallType) {
    var curRecAddr = this._pouchManager.getCurrentReceiveAddress();

    var uri = "litecoin:" + curRecAddr;

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

HDWalletPouchLitecoin.prototype.sendLitecoinTransaction = function(transaction, callback) {
    var mockTx = transaction._kkMockTx;
    var txid = mockTx.txid;
  //  this._pouchManager._dataStorageController.registerSentTransaction({sent:transaction,result:'response'});

   // console.log('Sending Transaction:', mockTx);

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
    g_JaxxApp.getLitecoinRelays().startRelayTaskWithBestRelay('pushRawTx', [transaction.toHex(), function (response){
        if ((response.status && response.status === 'success') || response === 'success') {
            self._pouchManager._transactions[txid].status = 'success';
            self._pouchManager._notify();
        }
        else if (self._pouchManager._transactions[txid].status !== 'success') {
            delete self._pouchManager._transactions[txid];
            self._pouchManager._notify();
        }

        self._pouchManager._dataStorageController.registerSentTransaction({sent:transaction,result:response});
       // self.log(response);
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

/*HDWalletPouchLitecoin.prototype.afterWorkerCacheInvalidate = function() {

}*/

HDWalletPouchLitecoin.prototype.prepareSweepTransaction = function(privateKey, callback) {
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

        if ((error && error !== "success") || !data) {
            callback(new Error(JSON.stringify(data)), null, self.getBaseFormatCoinType());
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
        var keysData = Object.keys(data);
        for (var i = 0; i < keysData.length; i++) { // Loop over each address (Only 1 should likely be defined)
            var keyAddress = keysData[i];
            var keyAddressData = data[keyAddress];
            for (var j = 0; j < keyAddressData.length; j++){ // Loop over all the unspent transaction outputs for the address
                var tx = keyAddressData[j];
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
        }

        //

        toSpend = thirdparty.bip69.sortInputs(toSpend);

        var signedTransaction = null;

        var transactionFee = wallet.getPouchFold(COIN_LITECOIN).getDefaultTransactionFee();

        //        console.log("sweep bitcoin :: totalValue :: " + totalValue + " :: transactionFee :: " + transactionFee);
        if (transactionFee >= totalValue) {
            console.log(JSON.stringify(callback));

            callback(new Error("the balance is lower than tx fee : " + HDWalletHelper.convertSatoshisToBitcoins(transactionFee)), null, self.getBaseFormatCoinType());
            return;
        }

        while ((totalValue - transactionFee) > 0) {
            var tx = new thirdparty.bitcoin.TransactionBuilder(coinNetwork);
            tx.addOutput(wallet.getPouchFold(COIN_LITECOIN).getCurrentChangeAddress(), totalValue - transactionFee);

            for (var i = 0; i < toSpend.length; i++) {
                var utxo = toSpend[i];
                tx.addInput(utxo.txid, utxo.index);
            }

            var unsignedTransaction = tx.buildIncomplete();
            var size = unsignedTransaction.toHex().length / 2 + unsignedTransaction.ins.length * 107;
            var targetTransactionFee = Math.ceil(size / 1024) * wallet.getPouchFold(COIN_LITECOIN).getDefaultTransactionFee();

            if (targetTransactionFee <= transactionFee) {
                for (var i = 0; i < toSpend.length; i++) {
                    tx.sign(i, keypair);
                }

                signedTransaction = tx.build();
                break;
            }

            // Add at least enough tx fee to cover our size thus far (adding tx may increase fee)
            while (targetTransactionFee > transactionFee) {
                transactionFee += wallet.getPouchFold(COIN_LITECOIN).getDefaultTransactionFee();
            }
        }

        if (!signedTransaction) {
            callback(new Error("Unsigned Transaction"), null, self.getBaseFormatCoinType());
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
            address: wallet.getPouchFold(COIN_LITECOIN).getCurrentChangeAddress(),
            addressIndex: wallet.getPouchFold(COIN_LITECOIN).getCurrentChangeIndex(),
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
        }, self.getBaseFormatCoinType());
    }

    // g_JaxxApp.getLitecoinRelays().getUTXO("LVDcQ2fHfq6mGUTX3k1Bse9jMwTTM2kMGw", function(){console.log(arguments);}); // Code for new relay system
    g_JaxxApp.getLitecoinRelays().getUTXO(keypair.getAddress(), prepareTransaction); // Code for new relay system

    console.log("bitcoin relay :: " + g_JaxxApp.getLitecoinRelays());

    return true;
}

HDWalletPouchLitecoin.prototype.fromChecksumAddress = function(address) {
    return address;
}

HDWalletPouchLitecoin.prototype.toChecksumAddress = function(address) {
    return address;
}

HDWalletPouchLitecoin.prototype.getBaseCoinAddressFormatType = function() {
    return this._baseFormatCoinType;
}

HDWalletPouchLitecoin.prototype.createTransaction = function(address, amount) {
    //@note: @here: this should check for address, amount validity.
    //@note: @todo: maybe a transaction queue?
    
    var transaction = this.buildBitcoinTransaction(address, amount);
    var miningFee = transaction ? HDWalletHelper.convertSatoshisToBitcoins(transaction._kkTransactionFee) : HDWalletHelper.convertSatoshisToBitcoins(this._pouchManager.getDefaultTransactionFee());

    //                console.log("transaction._kkTransactionFee :: " + transaction._kkTransactionFee);
    //                console.log("computedFee :: " + computedFee);

    return {transaction: transaction, miningFee: miningFee};
}

HDWalletPouchLitecoin.prototype.getBaseFormatCoinType = function() {
    return this._baseFormatCoinType;
}

HDWalletPouchLitecoin.isValidPrivateKey = function(value){
    return isValidBTCPrivateKey(value, HDWalletPouchLitecoin.networkDefinitions.mainNet);
}

HDWalletPouchLitecoin.prototype.sendTransaction = function(signedTransaction, callback, params, debugIdx){
    this.sendLitecoinTransaction(signedTransaction, callback);
}