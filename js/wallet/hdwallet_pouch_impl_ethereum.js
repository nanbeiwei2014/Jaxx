var HDWalletPouchEthereum = function() {
    this._doDebug = true;

    this._pouchManager = null;

    this._tempTransactions ={};

    this._ethAddressTypeMap = {};
    
    this._overrideIgnoreEtcEthSplit = false;
    
    this._baseFormatCoinType = COIN_ETHEREUM;
    
    this.readyTxArray = null;
    this._readyTransactionList = null;
    this._unitOfEther = 1000000000000000000;
}

HDWalletPouchEthereum.uiComponents = {
    coinFullName: 'Ethereum',
    coinFullDisplayName: 'Ethereum',
    coinWalletSelector3LetterSymbol: 'ETH',
    coinSymbol: '\u039E',
    coinButtonSVGName: 'ether-new',
    coinLargePngName: '.imgETH',
    coinButtonName: '.imageLogoBannerETH',
    coinSpinnerElementName: '.imageEtherWash',
    coinDisplayColor: '#8890AF',
    csvExportField: '.backupPrivateKeyListETH',
    transactionsListElementName: '.transactionsEthereum',
    transactionTemplateElementName: '.transactionEthereum',
    accountsListElementName: '.accountDataTableEthereum',
    accountTemplateElementName: '.accountDataEthereum',
    pageDisplayPrivateKeysName: 'backupPrivateKeysEthereum',
    displayNumDecimals: 6,
};

HDWalletPouchEthereum.pouchParameters = {
    coinHDType: 60,
    coinIsTokenSubtype: false,
    coinAbbreviatedName: 'ETH',
    isSingleToken: false,
    isTestnet: false,
};

HDWalletPouchEthereum.networkDefinitions = {
    mainNet: null,
    testNet: null,
}

HDWalletPouchEthereum.getCoinAddress = function(node) {


   /* var ctr = jaxx.Registry.crypto_controllers['Ethereum']
    console.warn(ctr)
*/
 /* var address = HDWalletPouchEthereum.dataStorageController.getCurrentPublicAddresReceive();
  //console.log(address)
  HDWalletPouchEthereum.pouchManager._currentReceiveAddress = address;

 return  address;*/


    var ethKeyPair = node.keyPair;
    //        console.log("[ethereum] keyPair :: " + ethKeyPair.d + " :: " + ethKeyPair.__Q);

    var prevCompressed = ethKeyPair.compressed;
    ethKeyPair.compressed = false;

    var ethKeyPairPublicKey = ethKeyPair.getPublicKeyBuffer();

    var pubKeyHexEth = ethKeyPairPublicKey.toString('hex').slice(2);

    var pubKeyWordArrayEth = thirdparty.CryptoJS.enc.Hex.parse(pubKeyHexEth);

    var hashEth = thirdparty.CryptoJS.SHA3(pubKeyWordArrayEth, { outputLength: 256 });

    var addressEth = hashEth.toString(thirdparty.CryptoJS.enc.Hex).slice(24);

    ethKeyPair.compressed = prevCompressed;
    var address = "0x" + addressEth;
   /// console.warn("[ethereum] address :: " + address);
    return address;
}


HDWalletPouchEthereum.prototype.convertFiatToCoin = function(fiatAmount, coinUnitType) {
    var coinAmount = 0;

    var wei = wallet.getHelper().convertFiatToWei(fiatAmount);
    coinAmount = (coinUnitType === COIN_UNITLARGE) ? HDWalletHelper.convertWeiToEther(wei) : wei;

    return coinAmount;
}

HDWalletPouchEthereum.prototype.initialize = function(pouchManager) {
    this._pouchManager = pouchManager;
    this._dataStorageController = pouchManager._dataStorageController;
  HDWalletPouchEthereum.pouchManager = this._pouchManager;

    var self = this;
  /*  this._sendTransactionHelper.onSendClick = function () {
        console.l
    }*/

    // this.loadTempTransactions();
  console.log('HDWalletPouchEthereum.prototype.initialize  with  _dataStorageController  ',HDWalletPouchEthereum.dataStorageController)
/*
  MyRegistry.$emmiter.on(MyRegistry.ON_ADDRESSES,function(evt,name,data){
   // console.warn('DWalletPouchEthereum.prototype.initialize on data   '+name,data);
  });*/

}


HDWalletPouchEthereum.prototype.shutDown = function() {
    for (var i = 0; i < CoinToken.numCoinTokens; i++) {
        if (typeof(this._pouchManager._token[i]) === 'undefined' ||
            this._pouchManager._token[i] === null) {
            continue;
        }
        
        this._pouchManager._token[i].shutDown();
    }
}

HDWalletPouchEthereum.prototype.setup = function() {
    this.setupTokens();
}

HDWalletPouchEthereum.prototype.setupTokens = function() {

    for (var i = 0; i < CoinToken.numCoinTokens; i++) {
        this._pouchManager._token[i] = new CoinToken();
    }

    var baseReceiveAddress = HDWalletPouch.getCoinAddress(this._pouchManager._coinType, HDWalletPouch._derive(this._pouchManager._receiveNode, 0, false)).toString();

    var theDAODefaultGasLimit = HDWalletPouch.getStaticCoinPouchImplementation(COIN_THEDAO_ETHEREUM).getDefaultGasLimit();
    
    this._pouchManager._token[CoinToken.TheDAO].initialize("TheDAO", "DAO", CoinToken.TheDAO, baseReceiveAddress, this._pouchManager, HDWalletHelper.getDefaultEthereumGasPrice(), theDAODefaultGasLimit, this._pouchManager._storageKey);

    var augurDefaultGasLimit = HDWalletPouch.getStaticCoinPouchImplementation(COIN_AUGUR_ETHEREUM).getDefaultGasLimit();

    this._pouchManager._token[CoinToken.Augur].initialize("Augur", "AUG", CoinToken.Augur, baseReceiveAddress, this._pouchManager, HDWalletHelper.getDefaultEthereumGasPrice(), augurDefaultGasLimit, this._pouchManager._storageKey, '0x48c80F1f4D53D5951e5D5438B54Cba84f29F32a5');
    
    var iconomiDefaultGasLimit = HDWalletPouch.getStaticCoinPouchImplementation(COIN_ICONOMI_ETHEREUM).getDefaultGasLimit();

    this._pouchManager._token[CoinToken.Iconomi].initialize("Iconomi", "ICO", CoinToken.Iconomi, baseReceiveAddress, this._pouchManager, HDWalletHelper.getDefaultEthereumGasPrice(), iconomiDefaultGasLimit, this._pouchManager._storageKey, '0x888666CA69E0f178DED6D75b5726Cee99A87D698');
    
    var golemDefaultGasLimit = HDWalletPouch.getStaticCoinPouchImplementation(COIN_GOLEM_ETHEREUM).getDefaultGasLimit();

    this._pouchManager._token[CoinToken.Golem].initialize("Golem", "GNT", CoinToken.Golem, baseReceiveAddress, this._pouchManager, HDWalletHelper.getDefaultEthereumGasPrice(), golemDefaultGasLimit, this._pouchManager._storageKey, '0xa74476443119A942dE498590Fe1f2454d7D4aC0d');
    
    var gnosisDefaultGasLimit = HDWalletPouch.getStaticCoinPouchImplementation(COIN_GNOSIS_ETHEREUM).getDefaultGasLimit();

    this._pouchManager._token[CoinToken.Gnosis].initialize("Gnosis", "GNO", CoinToken.Gnosis, baseReceiveAddress, this._pouchManager, HDWalletHelper.getDefaultEthereumGasPrice(), gnosisDefaultGasLimit, this._pouchManager._storageKey, '0x6810e776880c02933d47db1b9fc05908e5386b96');
    
    var singulardtvDefaultGasLimit = HDWalletPouch.getStaticCoinPouchImplementation(COIN_SINGULARDTV_ETHEREUM).getDefaultGasLimit();

    this._pouchManager._token[CoinToken.Singulardtv].initialize("Singulardtv", "SNGLS", CoinToken.Singulardtv, baseReceiveAddress, this._pouchManager, HDWalletHelper.getDefaultEthereumGasPrice(), singulardtvDefaultGasLimit, this._pouchManager._storageKey, '0xaec2e87e0a235266d9c5adc9deb4b2e29b54d009');
    
    var digixDefaultGasLimit = HDWalletPouch.getStaticCoinPouchImplementation(COIN_DIGIX_ETHEREUM).getDefaultGasLimit();

    this._pouchManager._token[CoinToken.Digix].initialize("Digix", "DGD", CoinToken.Digix, baseReceiveAddress, this._pouchManager, HDWalletHelper.getDefaultEthereumGasPrice(), digixDefaultGasLimit, this._pouchManager._storageKey, '0xe0b7927c4af23765cb51314a0e0521a9645f0e2a');
    
    var blockchainCapitalDefaultGasLimit = HDWalletPouch.getStaticCoinPouchImplementation(COIN_BLOCKCHAINCAPITAL_ETHEREUM).getDefaultGasLimit();

    this._pouchManager._token[CoinToken.BlockchainCapital].initialize("BlockchainCapital", "BCAP", CoinToken.BlockchainCapital, baseReceiveAddress, this._pouchManager, HDWalletHelper.getDefaultEthereumGasPrice(), blockchainCapitalDefaultGasLimit, this._pouchManager._storageKey, '0xff3519eeeea3e76f1f699ccce5e23ee0bdda41ac');
    
    var civicDefaultGasLimit = HDWalletPouch.getStaticCoinPouchImplementation(COIN_CIVIC_ETHEREUM).getDefaultGasLimit();

    this._pouchManager._token[CoinToken.Civic].initialize("Civic", "CVC", CoinToken.Civic, baseReceiveAddress, this._pouchManager, HDWalletHelper.getDefaultEthereumGasPrice(), civicDefaultGasLimit, this._pouchManager._storageKey, '0x41e5560054824ea6b0732e656e3ad64e20e94e45');

    this.updateTokenAddresses(this._pouchManager._w_addressMap);

    g_JaxxApp.getDataStoreController().addCoinTypes(this._pouchManager._token);
}

HDWalletPouchEthereum.prototype.log = function(logString) {
    if (this._doDebug === false) {
        return;
    }

    var args = [].slice.call(arguments);
    args.unshift('EthereumPouchLog:');
    //console.log(args);
}

HDWalletPouchEthereum.prototype.updateMiningFees = function() {
}

HDWalletPouchEthereum.prototype.updateTransactionsFromWorker = function(txid, transactions) {
    //                                                        console.log("wallet worker update :: eth tx :: " + Object.keys(transactions).length);
    //                            console.log("incoming eth tx :: " + JSON.stringify(transaction) + " :: " + txid);
    
    this._pouchManager._largeQrCode = null;
    this._pouchManager._smallQrCode = null;
    
    return false;
}


HDWalletPouchEthereum.prototype.getTransactions = function() {
    var res = [];


  var temp = this._tempTransactions;
 //// console.log(temp);
    for (var txid in this._pouchManager._transactions) {
                    //console.log("adding tx :: " + txid)
      if(temp[txid]) this.deleteTempTransactiionById(txid);
        res.push(this._pouchManager._transactions[txid]);
    }


/*var temp =  this.getTempTransactionAsArray();
  if(temp.length) {
    console.warn(" got temp transactions    " ,temp);
    res = res.concat(temp);
  }*/

    res.sort(function (a, b) {
        var deltaTimeStamp = (b.timestamp - a.timestamp);
        if (deltaTimeStamp) { return deltaTimeStamp; }
        return (a.confirmations - b.confirmations);
    });


    return res;
}

HDWalletPouchEthereum.prototype.calculateHistoryForTransaction = function(transaction) {

        var toAddress = "";
        var toAddressFull = "";

        var valueDelta = transaction.value / this._unitOfEther;
        valueDelta = valueDelta.toString(10);
        if (this._dataStorageController.isMyAddressDB(transaction.to)) {
                toAddress = "Self";
                toAddressFull = "Self"
            } else {
                toAddress = transaction.to.substring(0, 7) + '...' + transaction.to.substring(transaction.to.length - 5);
                toAddressFull = transaction.to;
                if (transaction.from === 'GENESIS') {
                    toAddress = transaction.from;
                }

            }

        var gasCost = (transaction.gasUsed * transaction.gasPrice) / this._unitOfEther;
        //gasCost = gasCost.toString(10);

        var newHistoryItem = {
            toAddress: toAddress,
            toAddressFull: toAddressFull,
            blockNumber: transaction.blockNumber,
            confirmations: transaction.confirmations,
            deltaBalance: valueDelta,
           //deltaDAO: valueDAO,
            gasCost: gasCost.toFixed(6),
            timestamp: transaction.timestamp,
            txid: transaction.id
        };
        
        return newHistoryItem;
}



    HDWalletPouchEthereum.prototype._getArrayTotal =  function(ar){
          var total = 0;
          ar.forEach(function(item){  if(!isNaN(+item.valueDelta))   total+= +item.valueDelta; })
          return total;
    }

HDWalletPouchEthereum.prototype.getPouchFoldBalance = function() {
  var balance =  this._dataStorageController.getBalanceTotalDB();
/// console.warn('Ethereum  getPouchFoldBalance   ' + balance);
  return balance;


  //var all =  this.getTransactions();
    //var balance = this._getArrayTotal(all);
  //var ta = this.getTempTransactionAsArray();
  //var temp = this._getArrayTotal(ta);
//  console.log('balance: '+balance +'  temp: '+temp);

  //return balance + temp;
   /* var highestIndexToCheck = this._pouchManager.getHighestReceiveIndex();

    highestIndexToCheck++; //@note: @here: check for internal transaction balances on current receive account.

    if (highestIndexToCheck !== -1) {

        for (var i = 0; i < highestIndexToCheck + 1; i++) {

            var curBalance = this.getAccountBalance(false, i);
            balance += curBalance;
        }
    }

  console.log('HDWalletPouchEthereum.prototype.getPouchFoldBalance    '+balance);*/
    ///return balance;
}

HDWalletPouchEthereum.prototype.getAccountBalance = function(internal, index) {
    var accountBalance = 0;
 // console.log(' HDWalletPouchEthereum.prototype.getAccountBalance ')
  return this._dataStorageController.getBalanceTotalDB();
  /*
    //@note: @here: @todo: consider changing this to a class function
    var publicAddress = this._pouchManager.getPublicAddress(internal, index);

    //@note: for ethereum checksum addresses.
    publicAddress = publicAddress.toLowerCase();

    var addressInfo = this._pouchManager._w_addressMap[publicAddress];

    //        console.log("publicAddress :: " + publicAddress);
    //        if (publicAddress == "0x8e63e85adebcdb448bb93a2f3bd00215c1cbaec4") {
    //            console.log("internal :: " + internal + " :: index :: " + index + " :: publicAddress :: " + publicAddress + " :: info :: " + JSON.stringify(addressInfo) + " :: _w_addressMap :: " + JSON.stringify(this._w_addressMap));
    //
    //        }

    if (typeof(addressInfo) !== 'undefined' && addressInfo !== null) {
        //            console.log("publicAddress :: " + publicAddress + " :: balance :: " + addressInfo.accountBalance);
        accountBalance = addressInfo.accountBalance;
    }

  ////  console.log('accountBalance     '+index +'   '+accountBalance)
    return accountBalance;*/
}

HDWalletPouchEthereum.prototype.getSpendableBalance = function(minimumValue, customGasLimit) {

    var spendableDict = {spendableBalance: 0,
                         numPotentialTX: 0,
                         addressesSpendable: {},
                        };

    var spendableBalance = 0;
    var numPotentialTX = 0;
    
    //        console.log("types :: " + typeof(this._helper.getCustomEthereumGasLimit()) + " :: " + typeof(HDWalletHelper.getDefaultEthereumGasPrice()));
    //        console.log("spendable :: custom gas limit :: " + this._helper.getCustomEthereumGasLimit() + " :: default gas price :: " + HDWalletHelper.getDefaultEthereumGasPrice());

    var customEthereumGasLimit = -1;

    if (typeof(customGasLimit) === 'undefined' || customGasLimit === null) {
        customEthereumGasLimit = this._pouchManager._helper.getCustomEthereumGasLimit();
    } else {
        customEthereumGasLimit = customGasLimit;
    }

    var baseTXCost = customEthereumGasLimit.mul(HDWalletHelper.getDefaultEthereumGasPrice()).toNumber();


    var totalTXCost = 0;

    //@note: returns {index: x, balance: y} format.
    //@note: _sortedHighestAccountArray is valid for the lifetime of this function call.
    var highestAccountDict = this._pouchManager.getHighestAccountBalanceAndIndex();

    var balanceList = this._pouchManager.getDataStorageController().transactionController.getHighestAccountBalanceAndIndex();

   // console.log(balanceList);

    if (typeof(balanceList) === 'undefined' || balanceList === null){ // This actually ends up preventing the program from crashing
       console.warn('Cannot get balances from cryptocontroller');
        return 0;
    }
    
    if (highestAccountDict !== null) {
        for (var i = 0; i < balanceList.length; i++) {
            var accountBalance = balanceList[i].balance;

            //@note: check for account balance lower than the dust limit
            if (accountBalance <= minimumValue + baseTXCost) {

            } else {
                spendableBalance += accountBalance - baseTXCost;
                numPotentialTX++;
                totalTXCost += baseTXCost;

                var accountIndex = balanceList[i].index;

                var curAddress = this._pouchManager.getPublicAddress(false, accountIndex);
                spendableDict.addressesSpendable[curAddress.toLowerCase()] = accountBalance;
            }
        }
    }

    //        console.log("ethereum spendable :: " + spendableBalance + " :: totalTXCost :: " + totalTXCost + " :: " + numPotentialTX + " :: minimumValue :: " + minimumValue);

    spendableDict.spendableBalance = spendableBalance;
    spendableDict.numPotentialTX = numPotentialTX;
    ///console.log(spendableDict);

    return spendableDict;

}

HDWalletPouchEthereum.prototype.updateTokenAddresses = function(addressMap) {
///TODO integrate with new addresses

//console.warn('    HDWalletPouchEthereum.prototype.updateTokenAddresses   ', addressMap);
    var transferableMap = {};
    var votableMap = {};

    //    console.log("[" + this._coinFullName + "] :: updating token addresses");

    //@note: this tokenTransferableList is null right now, most likely to be extended with DGX tokens and so on.
    for (var publicAddress in addressMap) {
        var addressInfo = addressMap[publicAddress];

        //    console.log("internal :: " + internal + " :: index :: " + index + " :: publicAddress :: " + publicAddress + " :: info :: " + JSON.stringify(addressInfo) + " :: _w_addressMap :: " + JSON.stringify(this._w_addressMap));

        if (typeof(addressInfo) !== 'undefined' && addressInfo !== null) {
            //            console.log("adding :: " + publicAddress + " :: to :: " + addressInfo.tokenTransferableList + " :: " + addressInfo.tokenVotableList);
            transferableMap[publicAddress] = addressInfo.tokenTransferableList;
            votableMap[publicAddress] = addressInfo.tokenVotableList;
        }
    }

    //@note: update for getting the first dao address correctly updating.


    var firstPublicAddress = this._pouchManager.getPublicAddress(false, 0).toLowerCase();
    //    console.log("[The DAO] :: transfer list :: firstPublicAddress :: " + firstPublicAddress);

    if (typeof(transferableMap[firstPublicAddress]) === 'undefined' || transferableMap[firstPublicAddress] === null) {
        transferableMap[firstPublicAddress] = true;
    }

    for (var i = 0; i < CoinToken.numCoinTokens; i++) {
        if (typeof(this._pouchManager._token[i]) === 'undefined' ||
            this._pouchManager._token[i] === null) {
            continue;
        }
        
        var tokenTransferableArray = [];
        var tokenVotableArray = [];

        //@note: tokens are transferable by default. however, if they are explicitly marked as not transferable, respect that.
        for (publicAddress in transferableMap) {
            var curTransferableToken = transferableMap[publicAddress];
            if ((typeof(curTransferableToken) !== undefined && curTransferableToken !== null && curTransferableToken !== false) || (typeof(curTransferableToken) === undefined || curTransferableToken === null))  {
                //                console.log("adding :: " + publicAddress + " :: to transferableMap");
                tokenTransferableArray.push(publicAddress);
            }
        }

        //@note: tokens are not votable by default.
        for (publicAddress in votableMap) {
            var curVotableToken = votableMap[publicAddress];
            if (typeof(curVotableToken) !== undefined && curVotableToken !== null && curVotableToken === true) {
                tokenVotableArray.push(publicAddress);
            }
        }

        //        console.log("transferable :: " + JSON.stringify(tokenTransferableArray) + " :: " + JSON.stringify(tokenVotableArray));

        this._pouchManager._token[i].setIsTransferable(tokenTransferableArray);
        this._pouchManager._token[i].setIsVotable(tokenVotableArray);
    }
}


HDWalletPouchEthereum.prototype.getEthereumNonce = function(internal, index) {

    if (typeof(index) === 'undefined' || index === null) {
        console.log("error :: getEthereumNonce :: index undefined or null");
        return -1;
    }
    
//    var fromAddress = HDWalletPouch.getCoinAddress(this._pouchManager._coinType, this._pouchManager.getNode(internal, index));
//
//    var transactions = this.getTransactions(); //Get all transactions
//
//    var txDict = {};
//    var highestNonce = 0;
//    for (var ti = 0; ti < transactions.length; ti++) { //iterate through txs
//        var transaction = transactions[ti];
//        if (transaction.from === fromAddress) {
//            txDict[transaction.txid] = true;
//            //@note: @here: @bug: for address 0x5630a246f35996a1d605174d119ece78c8f5d94a,
//            //it appears that there are 8 tx when doing it the following way, which is wrong. getTransactions only has 6 identifiers.
////            console.log("fromAddress :: " + fromAddress + " :: found tx :: " + JSON.stringify(transaction.txid));
//            //            highestNonce++;
//        }
//    }

//    highestNonce = Object.keys(txDict).length;
    var cryptoController = g_JaxxApp.getDataStoreController().getCryptoControllerByCoinType(COIN_ETHEREUM);

    var address = cryptoController.getAddressReceive(index);

    var highestNonce = cryptoController.getNonceForAddress(address);

    return highestNonce;
}

HDWalletPouchEthereum.prototype._buildEthereumTransaction = function(fromNodeInternal, fromNodeIndex, toAddress, amount_smallUnit, ethGasPrice, ethGasLimit, ethData, doNotSign) {
    // It is considered ok to return null if the transaction cannot be built



    var gasPrice = HDWalletHelper.hexify(ethGasPrice);
    var gasLimit = HDWalletHelper.hexify(ethGasLimit);

    var fromAddress = HDWalletPouch.getCoinAddress(this._pouchManager._coinType, this._pouchManager.getNode(fromNodeInternal, fromNodeIndex));

    this.log("ethereum :: from address :: " + fromAddress);

    var nonce = this.getEthereumNonce(fromNodeInternal, fromNodeIndex);

    console.log("ethereum :: build tx nonce :: " + nonce + " :: gasPrice :: " + ethGasPrice + " :: gasLimit :: " + ethGasLimit);

   //nonce = 0;
    var rawTx = {
        nonce: HDWalletHelper.hexify(nonce),
        gasPrice: gasPrice,
        gasLimit: gasLimit,
        to: toAddress,
        value: HDWalletHelper.hexify(amount_smallUnit),
        //data: '',
        chainId: 1
    };

    if (ethData && typeof(ethData) !== 'undefined') {
        rawTx.data = ethData;
    }

    var transaction = new thirdparty.ethereum.tx(rawTx);
    //    console.log("ethereum buildTransaction :: " + JSON.stringify(transaction));

    //    var privateKeyB = new thirdparty.Buffer.Buffer('e331b6d69882b4cb4ea581d88e0b604039a3de5967688d3dcffdd2270c0fd109', 'hex')
    //    
    //    console.log("private key :: " + this._private + " :: " +  + this._private.length + " :: privateKeyB :: " + privateKeyB + " :: " + privateKeyB.length);

    if (typeof(doNotSign) !== 'undefined' || (doNotSign !== null && doNotSign !== false)) {
        var pvtKeyBuffer = new Buffer(this._pouchManager.getPrivateKey(fromNodeInternal, fromNodeIndex).d.toBuffer(32), 'hex');
        //        console.log(pvtKeyBuffer.length);
        //        console.log(this.getPrivateKey(fromNodeInternal, fromNodeIndex));
        transaction.sign(pvtKeyBuffer);
    }


    var txhash = ('0x' + transaction.hash().toString('hex'));

    var publicAddress = this._pouchManager.getPublicAddress(fromNodeInternal, fromNodeIndex);

    //@note: ethereum checksum addresses.
    publicAddress = publicAddress.toLowerCase();

    //if(curCoinType === COIN_DIGIX_ETHEREUM) {
    //    amount_smallUnit = amount_smallUnit / 1000000000;
    //}
    transaction._mockTx = {
        txid: txhash,
        addressInternal: fromNodeInternal,
        addressIndex: fromNodeIndex,
        blockNumber: null,
        //@note:@here:@todo:
        confirmations: 0,
        from: publicAddress,
        hash: txhash,
        timestamp: (new Date()).getTime() / 1000,
        to: toAddress,
        gasPrice: ethGasPrice,
        gasUsed: ethGasLimit,
        nonce: nonce,
        valueDelta: -Number(amount_smallUnit),
    };

    return transaction;
}

HDWalletPouchEthereum.prototype.readyEthereumTransactionList = function(toAddressArray, amount_smallUnit, gasPrice, gasLimit, ethData, doNotSign) {
    var amountWei = parseInt(amount_smallUnit);

    var readyTxArray = [];

    //@note: @here: @todo: add custom contract support when merging into the develop branch.
    var baseTXCost = gasPrice * gasLimit;

    var totalTXCost = 0;

    //@note: returns {index: x, balance: y} format.
    var highestAccountDict = this._pouchManager.getHighestAccountBalanceAndIndex();


    if (highestAccountDict !== null) {
        this.readyTransactionList(toAddressArray, amount_smallUnit, gasPrice, gasLimit, ethData);
        
        //@note: check to see whether this will result in the tx being able to be pushed through with this one account, or whether there will need to be more than one account involved in this transaction.
        if (amountWei + baseTXCost <= highestAccountDict.balance) {
            totalTXCost = baseTXCost;

            this.log("[ready] ethereum transaction :: account :: " + highestAccountDict.index + " :: " + highestAccountDict.balance + " :: can cover the entire balance + tx cost :: " + (amountWei + baseTXCost));
            
            var newReadyTX = {index: highestAccountDict.index,
                             to: toAddressArray[0],
                             amountWei: amountWei,
                             gasPrice: gasPrice,
                             gasLimit: gasLimit,
                             ethData: ethData};
            
            readyTxArray.push(newReadyTX);
            // 
            
//            var newTX = this._buildEthereumTransaction(false, highestAccountDict.index, toAddressArray[0], amountWei, gasPrice, gasLimit, ethData, doNotSign);
//
//            if (!newTX) {
//                this.log("error :: ethereum transaction :: account failed to build :: " + highestAccountDict.index);
//                return null;
//            } else {
//                txArray.push(newTX);
//            }
        } else {
            var txSuccess = true;

            var balanceRemaining = amountWei;
            var balanceList = this._pouchManager.getDataStorageController().transactionController.getHighestAccountBalanceAndIndex();
            //@note: this array is implicitly regenerated and sorted when the getHighestAccountBalanceAndIndex function is called.
            for (var i = 0; i < balanceList.length; i++) {
                this.log("[ready] ethereum transaction :: balanceRemaining (pre) :: " + balanceRemaining);
                //                console.log(typeof(this._sortedHighestAccountArray[i].balance));
                var accountBalance = balanceList[i].balance;

                //@note: if the account cannot support the base tx cost + 1 wei (which might be significantly higher in the case of a contract address target), this process cannot continue as list is already sorted, and this transaction cannot be completed.
                if (accountBalance <= baseTXCost) {
                    this.log("[ready] ethereum transaction :: account :: " + balanceList[i].index + " cannot cover current dust limit of :: " + baseTXCost);
                    txSuccess = false;
                    break;
                } else {
                    var amountToSendFromAccount = 0;

                    //debug amounts: 0.0609500024691356
                    //0.0518500024691356
                    //0.052 total

                    //@note: check if subtracting the balance of this account from the remaining target transaction balance will result in exactly zero or a positive balance for this account.
                    if (accountBalance - balanceRemaining - baseTXCost < 0) {
                        //@note: this account doesn't have enough of a balance to cover by itself.. keep combining.
                        this.log("[ready] ethereum transaction :: account :: " + balanceList[i].index + " :: does not have enough to cover balance + tx cost :: " + (balanceRemaining + baseTXCost) + " :: accountBalance - tx cost :: " + (accountBalance - baseTXCost));

                        amountToSendFromAccount = (accountBalance - baseTXCost);
                    } else {
                        var accountChange = accountBalance - balanceRemaining - baseTXCost;
                        //                        console.log("types :: " + typeof(balanceRemaining) + " :: " + typeof(baseTXCost));
                        amountToSendFromAccount = balanceRemaining;
                        this.log("[ready] ethereum transaction :: account :: " + balanceList[i].index + " :: accountBalance :: " + accountBalance + " :: account balance after (balance + tx cost) :: " + accountChange);

                        //@note: don't do things like bitcoin's change address system for now.
                    }

                    //@note: build this particular transaction, make sure it's constructed correctly.

                    var targetEthereumAddress = toAddressArray[0];

                    if (i >= toAddressArray.length) {

                    } else {
                        targetEthereumAddress = toAddressArray[i];
                    }

                    this.log("[ready] ethereum transaction :: account :: " + balanceList[i].index + " :: will send  :: " + amountToSendFromAccount + " :: to :: " + targetEthereumAddress);


//                    var newTX = this._buildEthereumTransaction(false, balanceList[i].index, targetEthereumAddress, amountToSendFromAccount, gasPrice, gasLimit, ethData, doNotSign);

                    var newReadyTX = {index: balanceList[i].index,
                                      to: targetEthereumAddress,
                                      amountWei: amountToSendFromAccount,
                                      gasPrice: gasPrice,
                                      gasLimit: gasLimit,
                                      ethData: ethData};

                    readyTxArray.push(newReadyTX);
                    
//                    if (!newTX) {
//                        this.log("[ready] error :: ethereum transaction :: account :: " + balanceList[i].index + " cannot build");
//
//                        txSuccess = false;
//                        break;
//                    } else {
//                        txArray.push(newTX);
//                    }

                    //@note: keep track of the total TX cost for user review on the UI side.
                    totalTXCost += baseTXCost;

                    this.log("[ready] ethereum transaction :: current total tx cost :: " + totalTXCost);

                    //note: subtract the amount sent from the balance remaining, and check whether there's zero remaining.
                    balanceRemaining -= amountToSendFromAccount;

                    this.log("[ready] ethereum transaction :: balanceRemaining (post) :: " + balanceRemaining);

                    if (balanceRemaining <= 0) {
                        this.log("[ready] ethereum transaction :: finished combining :: number of accounts involved :: " + readyTxArray.length + " :: total tx cost :: " + totalTXCost);
                        break;
                    } else {
                        //@note: otherwise, there's another transaction necessary so increase the balance remaining by the base tx cost.
                        //                        balanceRemaining += baseTXCost;
                    }
                }
            }

            if (txSuccess === false) {
                this.log("[ready] ethereum transaction :: txSuccess is false");
                return null;
            }
        }

        //@note: ethereum will calculate it's own transaction fee inside of _buildTransaction.
        if (readyTxArray.length > 0) {
            this._readyTxArray = readyTxArray;
            return {readyTxArray: readyTxArray, totalTXCost: totalTXCost};
        } else {
            this.log("[ready] ethereum transaction :: txArray.length is zero");
            return null;    
        }
    } else {
        this.log("[ready] ethereum transaction :: no accounts found");
        return null;
    }
}

HDWalletPouchEthereum.prototype.constructEthereumTransactionListFromReadyTransactionList = function(readyTxList) {
    var address
    var amount = 0;



   // console.log(readyTxList)
   /* readyTxList.forEach(function(item){

        console.log(item);
        var mocktx = item;
        console.log(mocktx);
        if(address && address!==mocktx.to) console.error(' sending to different addresses '+ taddress +'  ' + mocktx.to);

        address = mocktx.to;
        var v = mocktx.amountWei;
        if(v<0)v=-v;
        amount +=v
    })*/


   // this._dataStorageController.sendAmountToAddress(address,amount)


    //return null


   /// console.log(readyTxList);


    var txList = [];

var tttt = 0;
    for (var i = 0; i < readyTxList.length; i++) {
        var curReadyTx = readyTxList[i];
        
        var newTx = this._buildEthereumTransaction(false, curReadyTx.index, curReadyTx.to, curReadyTx.amountWei, curReadyTx.gasPrice, curReadyTx.gasLimit, curReadyTx.ethData);

        if (typeof(newTx) === 'undefined' || newTx === null) {
            console.log("[ construct ethereum txList from readyTxList ] :: error :: newTx undefined :: " + JSON.stringify(curReadyTx, null, 4));

            return null;
        } else {
            txList.push(newTx);
        }
    }
    
    return txList;
}


///////////////////////////////////////////////////////////////// BUILD TRANSACTION //////////////////////////////
HDWalletPouchEthereum.prototype.buildEthereumTransactionList = function(toAddressArray, amount_smallUnit, gasPrice, gasLimit, ethData, doNotSign) {
    var amountWei = parseInt(amount_smallUnit);

    var txArray = [];

    //@note: @here: @todo: add custom contract support when merging into the develop branch.
    var baseTXCost = gasPrice * gasLimit;

    var totalTXCost = 0;

    //@note: returns {index: x, balance: y} format.
    var highestAccountDict = this._pouchManager.getHighestAccountBalanceAndIndex();

    if (highestAccountDict !== null) {
        //@note: check to see whether this will result in the tx being able to be pushed through with this one account, or whether there will need to be more than one account involved in this transaction.
        if (amountWei + baseTXCost <= highestAccountDict.balance) {
            totalTXCost = baseTXCost;

            this.log("ethereum transaction :: account :: " + highestAccountDict.index + " :: " + highestAccountDict.balance + " :: can cover the entire balance + tx cost :: " + (amountWei + baseTXCost));
            var newTX = this._buildEthereumTransaction(false, highestAccountDict.index, toAddressArray[0], amountWei, gasPrice, gasLimit, ethData, doNotSign);

            if (!newTX) {
                this.log("error :: ethereum transaction :: account failed to build :: " + highestAccountDict.index);
                return null;
            } else {
                txArray.push(newTX);
            }
        } else {
            var txSuccess = true;
            var balanceList = this._pouchManager.getDataStorageController().transactionController.getHighestAccountBalanceAndIndex();
            var balanceRemaining = amountWei;

            if (typeof(balanceList) === 'undefined' || balanceList === null){ // This actually ends up preventing the program from crashing
                console.warn('Cannot get balances from cryptocontroller');
                return 0;
            }
            //@note: this array is implicitly regenerated and sorted when the getHighestAccountBalanceAndIndex function is called.
            for (var i = 0; i < balanceList.length; i++) {
                this.log("ethereum transaction :: balanceRemaining (pre) :: " + balanceRemaining);
                //                console.log(typeof(this._sortedHighestAccountArray[i].balance));
                var accountBalance = balanceList[i].balance;

                //@note: if the account cannot support the base tx cost + 1 wei (which might be significantly higher in the case of a contract address target), this process cannot continue as list is already sorted, and this transaction cannot be completed.
                if (accountBalance <= baseTXCost) {
                    this.log("ethereum transaction :: account :: " + balanceList[i].index + " cannot cover current dust limit of :: " + baseTXCost);
                    txSuccess = false;
                    break;
                } else {
                    var amountToSendFromAccount = 0;

                    //debug amounts: 0.0609500024691356
                    //0.0518500024691356
                    //0.052 total

                    //@note: check if subtracting the balance of this account from the remaining target transaction balance will result in exactly zero or a positive balance for this account.
                    if (accountBalance - balanceRemaining - baseTXCost < 0) {
                        //@note: this account doesn't have enough of a balance to cover by itself.. keep combining.
                        this.log("ethereum transaction :: account :: " + balanceList[i].index + " :: does not have enough to cover balance + tx cost :: " + (balanceRemaining + baseTXCost) + " :: accountBalance - tx cost :: " + (accountBalance - baseTXCost));

                        amountToSendFromAccount = (accountBalance - baseTXCost);
                    } else {
                        var accountChange = accountBalance - balanceRemaining - baseTXCost;
                        //                        console.log("types :: " + typeof(balanceRemaining) + " :: " + typeof(baseTXCost));
                        amountToSendFromAccount = balanceRemaining;
                        this.log("ethereum transaction :: account :: " + balanceList[i].index + " :: accountBalance :: " + accountBalance + " :: account balance after (balance + tx cost) :: " + accountChange);

                        //@note: don't do things like bitcoin's change address system for now.
                    }

                    //@note: build this particular transaction, make sure it's constructed correctly.

                    var targetEthereumAddress = toAddressArray[0];

                    if (i >= toAddressArray.length) {

                    } else {
                        targetEthereumAddress = toAddressArray[i];
                    }

                   // this.log("ethereum transaction :: account :: " + balanceList[i].index + " :: will send  :: " + amountToSendFromAccount + " :: to :: " + targetEthereumAddress);


                    var newTX = this._buildEthereumTransaction(false, balanceList[i].index, targetEthereumAddress, amountToSendFromAccount, gasPrice, gasLimit, ethData, doNotSign);

                    if (!newTX) {
                       // this.log("error :: ethereum transaction :: account :: " + balanceList[i].index + " cannot build");

                        txSuccess = false;
                        break;
                    } else {
                        txArray.push(newTX);
                    }

                    //@note: keep track of the total TX cost for user review on the UI side.
                    totalTXCost += baseTXCost;

                    this.log("ethereum transaction :: current total tx cost :: " + totalTXCost);

                    //note: subtract the amount sent from the balance remaining, and check whether there's zero remaining.
                    balanceRemaining -= amountToSendFromAccount;

                    this.log("ethereum transaction :: balanceRemaining (post) :: " + balanceRemaining);

                    if (balanceRemaining <= 0) {
                        this.log("ethereum transaction :: finished combining :: number of accounts involved :: " + txArray.length + " :: total tx cost :: " + totalTXCost);
                        break;
                    } else {
                        //@note: otherwise, there's another transaction necessary so increase the balance remaining by the base tx cost.
                        //                        balanceRemaining += baseTXCost;
                    }
                }
            }

            if (txSuccess === false) {
                this.log("ethereum transaction :: txSuccess is false");
                return null;
            }
        }

        //@note: ethereum will calculate it's own transaction fee inside of _buildTransaction.
        if (txArray.length > 0) {
            return {txArray: txArray, totalTXCost: totalTXCost};
        } else {
            this.log("ethereum transaction :: readyTxArray.length is zero");
            return null;    
        }
    } else {
        this.log("ethereum transaction :: no accounts found");
        return null;
    }
}

HDWalletPouchEthereum.prototype.getIsTheDAOAssociated = function(internal, index) {
    var publicAddress = this._pouchManager.getPublicAddress(internal, index);

    //@note: for ethereum checksum addresses.
    publicAddress = publicAddress.toLowerCase();

    var addressInfo = this._pouchManager._w_addressMap[publicAddress];

    if (typeof(addressInfo) !== 'undefined' && addressInfo !== null) {
        //        console.log("publicAddress :: " + publicAddress + " :: isTheDAOAssociated :: " + addressInfo.isTheDAOAssociated);
        if (addressInfo.isTheDAOAssociated === true) {
            return true;
        }
    }

    return false;
}

HDWalletPouchEthereum.prototype.getIsAugurAssociated = function(internal, index) {
    var publicAddress = this._pouchManager.getPublicAddress(internal, index);

    //@note: for ethereum checksum addresses.
    publicAddress = publicAddress.toLowerCase();

    var addressInfo = this._pouchManager._w_addressMap[publicAddress];

    if (typeof(addressInfo) !== 'undefined' && addressInfo !== null) {
        //        console.log("publicAddress :: " + publicAddress + " :: isTheDAOAssociated :: " + addressInfo.isTheDAOAssociated);
        if (addressInfo.isAugurAssociated === true) {
            return true;
        }
    }

    return false;
}

HDWalletPouchEthereum.prototype.getAccountList = function(transactions) {
    var result = [];
    
    var lastIndexChange = 0;
    var lastIndexReceive = 0;

    for (var ti = 0; ti < transactions.length; ti++) { //iterate through txs
        var transaction = transactions[ti];


        //            console.log("tx :: " + JSON.stringify(transaction));

        //@note: for ether, we're using a similar method, checking out the address map for a to: equivalence.
        if (transaction.addressIndex !== null) {
            if (!transaction.addressInternal) {
                if (transaction.addressIndex > lastIndexReceive) {
                    lastIndexReceive = transaction.addressIndex;
                }
                var account = {};
                account.pvtKey = this._pouchManager.getPrivateKey(false, transaction.addressIndex).d.toBuffer(32).toString('hex');
                account.pubAddr = this._pouchManager.getPublicAddress(false, transaction.addressIndex);
                account.balance = this.getAccountBalance(false, transaction.addressIndex);
                account.isTheDAOAssociated = this.getIsTheDAOAssociated(false, transaction.addressIndex);
                account.isAugurAssociated = this.getIsAugurAssociated(false, transaction.addressIndex);

                result.push(account);
            }
        }
    }


    var finalIndex = 0;

    if (result.length === 0) {
        finalIndex = 0;
    } else {
        finalIndex = lastIndexReceive + 1;
    }

    var account = {};
    account.pvtKey = this._pouchManager.getPrivateKey(false, finalIndex).d.toBuffer(32).toString('hex');
    account.pubAddr = this._pouchManager.getPublicAddress(false, finalIndex);
    account.balance = this.getAccountBalance(false, finalIndex);
    account.isTheDAOAssociated = this.getIsTheDAOAssociated(false, i);
    account.isAugurAssociated = this.getIsAugurAssociated(false, i);

    result.push(account);

    return result;
}

HDWalletPouchEthereum.prototype.getAllAccountBalancesDict = function(transactions) {
    var result = {};

    var lastIndexChange = 0;
    var lastIndexReceive = 0;

    for (var ti = 0; ti < transactions.length; ti++) { //iterate through txs
        var transaction = transactions[ti];


        //            console.log("tx :: " + JSON.stringify(transaction));

        //@note: for ether, we're using a similar method, checking out the address map for a to: equivalence.
        if (transaction.addressIndex !== null) {
            if (!transaction.addressInternal) {
                if (transaction.addressIndex > lastIndexReceive) {
                    lastIndexReceive = transaction.addressIndex;
                }
                
                var pubAddr = this._pouchManager.getPublicAddress(false, transaction.addressIndex);
                
                var newResult = {};
                newResult.balance = this.getAccountBalance(false, transaction.addressIndex);
                
                result[pubAddr] = newResult;
            }
        }
    }


    var finalIndex = 0;

    if (result.length === 0) {
        finalIndex = 0;
    } else {
        finalIndex = lastIndexReceive + 1;
    }
    
    var pubAddr = this._pouchManager.getPublicAddress(false, finalIndex);
    
    var newResult = {};
    newResult.balance = this.getAccountBalance(false, finalIndex);

    result[pubAddr] = newResult;

    return result;
}

HDWalletPouchEthereum.prototype.generateQRCode = function(largeFormat, coinAmountSmallType) {
    var curRecAddr = this._pouchManager.getCurrentReceiveAddress();

    var uri = "iban:" + HDWalletHelper.getICAPAddress(curRecAddr);

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

//@note: this function when passed in an expliisAddressFromSelfcit null to ignoreCached, will use cache. cached only in session.
HDWalletPouchEthereum.prototype.isAddressFromSelf = function(addressToCheck, ignoreCached) {
   // return this._dataStorageController.
    var isSelfAddress = false;

    //@note: for ethereum checksum addresses.
    addressToCheck = addressToCheck.toLowerCase();

    var key = addressToCheck;
    var isSelfAddress = this._pouchManager._checkAddressCache[key];

    if (typeof(isSelfAddress) === 'undefined' || isSelfAddress === null || typeof(ignoreCached) !== 'undefined') {
        var highestIndexToCheck = this._pouchManager.getHighestReceiveIndex();

        if (highestIndexToCheck !== -1) {
            for (var i = 0; i < highestIndexToCheck + 1; i++) {
                var curAddress = this._pouchManager.getPublicAddress(false, i);

                //@note: for ethereum checksum addresses.
                curAddress = curAddress.toLowerCase();

                //            console.log("addressToCheck :: " + addressToCheck + " :: curAddress :: " + curAddress);
                if (curAddress === addressToCheck) {
                    //                    console.log("addressToCheck :: " + addressToCheck + " :: curAddress :: " + curAddress);
                    isSelfAddress = true;
                    break;
                }
            }
        }

        //        console.log("addressToCheck :: " + addressToCheck + " :: curAddress :: " + curAddress + " :: " + isSelfAddress);

        if (typeof(ignoreCached) === 'undefined') {
            //            console.log("caching isAddressFromSelf :: " + addressToCheck + " :: " + key + " :: " + isSelfAddress);
            this._pouchManager._checkAddressCache[addressToCheck] = isSelfAddress;
            //            console.log("caching isAddressFromSelf :: " +  this._checkAddressCache[addressToCheck]);
        } else {
            self.log("uncached");
        }
    } else {
        //        console.log("fetching cached isAddressFromSelf :: " + addressToCheck + " :: key :: " + key + " :: " + isSelfAddress);
    }

    return isSelfAddress;    
}

HDWalletPouchEthereum.prototype.getTempTransactionAsArray = function(){
  var obj = this._tempTransactions;
  var out=[];
  for(var str in obj) out.push(obj[str]);
   return out;
}


HDWalletPouchEthereum.prototype.saveTempTransactions = function(){
  //console.warn (' saving    ')
  //localStorage.setItem('tempTransactions_ETHER',JSON.stringify(this._tempTransactions));
}

HDWalletPouchEthereum.prototype.loadTempTransactions = function(){
  var str = localStorage.getItem('tempTransactions_ETHER');
  if(str && str !=='undefined'){
    this._tempTransactions  =  JSON.parse(str);
   /// console.warn(' onload temp transactions ',str);
  }
  return str;
}


HDWalletPouchEthereum.prototype.addTempTransactiion = function(trx){
 /// console.warn('HDWalletPouchEthereum.prototype.addTempTransactiion');
  var id = trx.hash + "_" + trx.from;
  this._tempTransactions[id] = trx;
  this.saveTempTransactions();
};

HDWalletPouchEthereum.prototype.deleteTempTransactiionById = function(id){
  console.warn(' deleteTempTransactiionById       !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'+id);
  delete this._tempTransactions[id];
  this.saveTempTransactions();
};

/////////////////////////////////////Sending transaction here /////////////////////////////////

HDWalletPouchEthereum.prototype.sendEthereumTransaction = function(transaction, callback, params) {

    //@note:@todo:@next:

   // console.log('HDWalletPouchEthereum.prototype.sendEthereumTransaction   ',  transaction);
    //console.log('HDWalletPouchEthereum.prototype.sendEthereumTransaction   ',  params);


   // console.error(transaction);
    var name = transaction.name;

    var mockTx = transaction._mockTx;
  var hex = '0x' + transaction.serialize().toString('hex');

  //tr.hex = hex;
 // console.warn(hex);
    var transactionId  = transaction._mockTx.txid;
    console.warn(mockTx.valueDelta);;
   // return;


//jaxx.Registry.actions$.triggerHandler(jaxx.Registry.ON_SEND_TRANSACTION,tr)



    //    console.log("send transaction :: " + JSON.stringify(transaction));
    //    
    //    callback('success', null, params);
    //    
    //    return;
    //

    var self = this;

    var networkParams = HDWalletPouch.getStaticCoinWorkerImplementation(COIN_ETHEREUM).networkParams;

    var requestUrl = networkParams['static_relay_url'] + networkParams['send_tx'] + hex + networkParams['send_tx_append'];

   // console.warn(requestUrl);
  // requestUrl = 'http://api.jaxx.io/api/eth/rawTransaction/';

   // console.log(transaction);
   // return;

   /* $.ajax({
        url: requestUrl,
        'Cache-Control': "no-cache",
        Accept: "application/json",
        type: 'PUT',
        headers: {
            transaction: hex
        },
        complete: function(respond, successString) {
            var result = {
                result:respond.responseJSON['transactionHash']
            };


            self._dataStorageController.registerSentTransaction({sent:$.extend({}, transaction._mockTx), result:result});


            // self._pouchManager.invalidateTransactionCache();
            //  self._pouchManager.invalidateWorkerCache();
            var data = respond;

            if (!data ||
                !data.status
                || data.status !== 200
                || !data.responseJSON
                || !data.responseJSON.transactionHash
                || data.responseJSON.transactionHash.length !== 66) {
                //  self.log('ethereum classic :: Error sending', data, " :: " + debugIdx + " :: " + JSON.stringify(transaction) + " :: hex :: " + hex);

                if (callback) {
                    var message = 'An error occurred';
                    if (data && data.error && data.error.message) {
                        message = data.error.message;
                    }

                    callback(new Error(message), null, params);
                    delete self._pouchManager._transactions[transaction._mockTx.hash + "_" + transaction._mockTx.from];

                    //@note: reverse the mock transaction update.
                    var addressInfo = self._pouchManager._w_addressMap[transaction._mockTx.from];
                    if (typeof(addressInfo) !== 'undefined') {
                        var txCostPlusGas = transaction._mockTx.valueDelta - (transaction._mockTx.gasUsed * transaction._mockTx.gasPrice);

                        addressInfo.accountBalance -= txCostPlusGas;
                        addressInfo.nonce--;
                        addressInfo.newSendTx = null;
                        delete addressInfo.accountTXProcessed[transaction._mockTx.hash];
                    } else {
                        self.log("ethereum classic :: sendEthereumTransaction error :: addressInfo undefined")
                    }

                    if (self._pouchManager._worker) {
                        self._pouchManager._worker.postMessage({
                            action: 'updateAddressMap',
                            content: {
                                addressMap: self._pouchManager._w_addressMap
                            }
                        });
                    }
                }
            } else {

                if (callback) {

                    callback('success', data.result, params);
                }

                self._pouchManager._transactions[transaction._mockTx.hash + "_" + transaction._mockTx.from] = transaction._mockTx;

                var addressInfo = self._pouchManager._w_addressMap[transaction._mockTx.from];
                if (typeof(addressInfo) !== 'undefined' && addressInfo !== null) {
                    //@note: sending from and to self, total balance = 0
                    if (self.isAddressFromSelf(transaction._mockTx.to)) {
                    } else {
                    }

                    var txCostPlusGas = transaction._mockTx.valueDelta - (transaction._mockTx.gasUsed * transaction._mockTx.gasPrice);

                    addressInfo.accountBalance += txCostPlusGas;
                    addressInfo.nonce++;

                    addressInfo.accountTXProcessed[transaction._mockTx.hash] = true;
                    addressInfo.newSendTx = true;
                } else {
                    console.log("ethereum classic :: sendEthereumTransaction success :: addressInfo undefined")
                }

                if (self._pouchManager._worker) {
                    self._pouchManager._worker.postMessage({
                        action: 'updateAddressMap',
                        content: {
                            addressMap: self._w_addressMap
                        }
                    });
                }

                self._pouchManager._notify();
            }
        }
    }).fail(function (error) {

        error = {error:error.responseJSON};

        self._dataStorageController.registerSentTransaction({sent:$.extend({}, transaction._mockTx), result:error});
        callback(err);
    });
*/




    $.getJSON(requestUrl, function (data) {
        self._pouchManager.invalidateTransactionCache();
        self._pouchManager.invalidateWorkerCache();

        //transaction._mockTx.name = transaction.name;

        var myevent = {sent:$.extend({}, transaction._mockTx), result:data, name:name};

        jaxx.Registry.current_crypto_controller.registerSentTransaction(myevent);

       // self._dataStorageController.registerSentTransaction(myevent);
       // console.warn(data);

        if (!data || !data.result || data.result.length !== 66) {

           console.error('Error sending ', data, " :: :: " + JSON.stringify(transaction) + " :: hex :: " + hex);

            if (callback) {
                var message = 'An error occurred';
                if (data && data.error && data.error.message) {
                    message = data.error.message;
                }

                callback(new Error(message), mockTx, params);

                delete self._pouchManager._transactions[transactionId];


                //@note: reverse the mock transaction update.
                var addressInfo = self._pouchManager._w_addressMap[transaction._mockTx.from];
                if (typeof(addressInfo) !== 'undefined') {
                    var txCostPlusGas = transaction._mockTx.valueDelta - (transaction._mockTx.gasUsed * transaction._mockTx.gasPrice);

                    addressInfo.accountBalance -= txCostPlusGas;
                    addressInfo.nonce--;
                    addressInfo.newSendTx = null;
                    delete addressInfo.accountTXProcessed[transaction._mockTx.hash];
                } else {
                    self.log("sendEthereumTransaction error :: addressInfo undefined")
                }

                if (self._pouchManager._worker) {
                    self._pouchManager._worker.postMessage({
                        action: 'updateAddressMap',
                        content: {
                            addressMap: self._pouchManager._w_addressMap
                        }
                    });
                }
            }
        } else {
            self.log('Success sending', data, " ::  :: " + JSON.stringify(transaction) + " :: hex :: " + hex);

            if (callback) {
                callback('success', data.result, params);
            }

//

            ///self._pouchManager._transactions[transactionId] = transaction._mockTx;






            var addressInfo = self._pouchManager._w_addressMap[transaction._mockTx.from];
            if (typeof(addressInfo) !== 'undefined' && addressInfo !== null) {
                //@note: sending from and to self, total balance = 0
                if (self.isAddressFromSelf(transaction._mockTx.to)) {
                } else {
                }

                var txCostPlusGas = transaction._mockTx.valueDelta - (transaction._mockTx.gasUsed * transaction._mockTx.gasPrice);

                addressInfo.accountBalance += txCostPlusGas;
                addressInfo.nonce++;

                addressInfo.accountTXProcessed[transaction._mockTx.hash] = true;
                addressInfo.newSendTx = true;
            } else {
              //  console.log("sendEthereumTransaction success :: addressInfo undefined")
            }

            if (self._pouchManager._worker) {
                self._pouchManager._worker.postMessage({
                    action: 'updateAddressMap',
                    content: {
                        addressMap: self._w_addressMap
                    }
                });
            }


           // self.addTempTransactiion(mockTx);
            self._pouchManager._notify();
        }
    }).fail(function (err) {
        callback(err);
    });



}

/*HDWalletPouchEthereum.prototype.afterWorkerCacheInvalidate = function() {
    this._pouchManager.sortHighestAccounts();
}*/

HDWalletPouchEthereum.prototype.requestBlockNumber = function(callback) {

    var self = this;
    return //TODO remove-it

    var networkParams = HDWalletPouch.getStaticCoinWorkerImplementation(COIN_ETHEREUM).networkParams;

    var requestUrl = networkParams['static_relay_url'] + networkParams['block_number'];
    
    $.getJSON(requestUrl, function (data) {
        if (!data || !data.result) {
            if (self._pouchManager._currentBlock === -1) {
                self._pouchManager._currentBlock = 0;
            };

            var errStr = "HDWalletPouchEthereum :: requestBlockNumber :: no data from api server";
            callback(errStr);
            return;
        }

        self._pouchManager._currentBlock = parseInt(data.result, 16);

        callback(null);
    });
}

HDWalletPouchEthereum.prototype.prepareSweepTransaction = function(privateKey, callback) {
    var signedTransaction;
    var totalValue;

    //Make buffer of privatekey
    var privateKeyToSweep = new thirdparty.Buffer.Buffer(privateKey, 'hex');

    //Derive address from private key -----
    var ethAddressToSweep = HDWalletHelper.getEthereumAddressFromKey(privateKeyToSweep);

    //Query etherscan for balance ---------
    var weiBalance = 0;
    
    //@note: @todo: @here: @relay: relays for ethereum
    // 'https://api.etherscan.io/api?module=account&action=balance&address=0x96fa8429eb16c3164f31e663ac966300e05a2b44&tag=latest' // try this in console
    RequestSerializer.getJSON('https://api.etherscan.io/api?module=account&action=balance&address=' + ethAddressToSweep + '&tag=latest', function (dataBalance) {
        if (!dataBalance || dataBalance.status != 1 ) {
            console.log('Failed to get balance for '+ethAddressToSweep+ ' ; dataBalance:'+dataBalance);
            callback(new Error('Error: while getting balance'), null);
        }
        weiBalance = dataBalance.result;
        var gasPrice = HDWalletHelper.getDefaultEthereumGasPrice();
        var gasLimit = HDWalletHelper.getDefaultEthereumGasLimit();
        var spendableWei = weiBalance - gasPrice.mul(gasLimit).toNumber();

        //        console.log("weiBalance :: " + weiBalance + " :: gasPrice :: " + gasPrice + " + :: gasLimit :: " + gasLimit + " :: spendableWei :: " + spendableWei);

        if(spendableWei <= 0){
            console.log('Nothing to sweep');
            callback(null, null);
            return;
        }

        //Get all tx associated to account ---
        var txHist =  {};

        RequestSerializer.getJSON('https://api.etherscan.io/api?module=account&action=txlist&address=' + ethAddressToSweep + '&sort=asc', function (dataTx) {
            // "{"status":"1","message":"OK","result":[{"blockNumber":"1675681","timeStamp":"1465521633","hash":"0x901c0cbb0d385e46b15ac3f7fc1cf7169809c1ccdb329497ab19af2b976672f7","nonce":"24377","blockHash":"0xa177975b9da778a90bada898771d516cbb5238b7f28b86ad0a3d6d01b9272e5e","transactionIndex":"6","from":"0x9e6316f44baeeee5d41a1070516cc5fa47baf227","to":"0x6f8ae37895cb2ad4922d5f49fdbc40beb8d51c3e","value":"3995741130000000000","gas":"250000","gasPrice":"20000000000","isError":"0","input":"0x","contractAddress":"","cumulativeGasUsed":"147000","gasUsed":"21000","confirmations":"1556745"},{"blockNumber":"1680557","timeStamp":"1465593197","hash":"0x11145ec3a341277d808fdf4c051d96241eb8c5f46ece664f4c228a57169be46e","nonce":"0","blockHash":"0x233f2d5792b0c7e6ffa05c728c707bddcbefba06cdce02818daf637555f16e5a","transactionIndex":"2","from":"0x6f8ae37895cb2ad4922d5f49fdbc40beb8d51c3e","to":"0xee9bce8ba3b8e06be3154256456c9c7a35ec3b01","value":"881999999926272","gas":"21000","gasPrice":"21000000000","isError":"0","input":"0x","contractAddress":"","cumulativeGasUsed":"63000","gasUsed":"21000","confirmations":"1551869"}]}" // JSON.stringify(dataTx)
            if (!dataTx || dataTx.status != 1 ) {
                console.log('Failed to get txList for '+ethAddressToSweep+ ' ; dataTx:'+dataTx);
                callback(new Error('Error: while getting txlist'), null);
            }

            for (var i = 0; i < dataTx.result.length; i++) {
                var tx = dataTx.result[i];
                txHist[tx.hash] = tx;
            }

            //Compute nonce -----------------------
            //As an alternative we could use this entry point https://etherchain.org/api/account/<address>/nonce

            var nonce = 0;
            for (var txid in txHist) {
                var tx = txHist[txid];
                if (tx.from === ethAddressToSweep) {
                    nonce++;
                }
            }

            //create a signed tx ------------------
           var address =  wallet.getPouchFold(COIN_ETHEREUM).getCurrentReceiveAddress();

            //console.warn(address);
            var rawSweepTx = {
                nonce: HDWalletHelper.hexify(nonce),
                gasPrice: HDWalletHelper.hexify(gasPrice),
                gasLimit: HDWalletHelper.hexify(gasLimit),
                to: address,
                value: HDWalletHelper.hexify(spendableWei),
            };

            //@note:@todo:@here:
            var sweepTransaction = new thirdparty.ethereum.tx(rawSweepTx);

            sweepTransaction.sign(privateKeyToSweep);

            sweepTransaction._mockTx = {
                blockNumber: null,
                confirmations: 0,
                from: ethAddressToSweep,
                hash: ('0x' + sweepTransaction.hash().toString('hex')),
                timestamp: (new Date()).getTime() / 1000,
                to:address,
                nonce: nonce,
                value: spendableWei,
            };

            totalValue = HDWalletHelper.convertWeiToEther(spendableWei);

            var hex = '0x' + sweepTransaction.serialize().toString('hex');

            //callback correct ------------------------
            // JSON.stringify({signedTransaction: sweepTransaction,totalValue: totalValue,transactionFee: gasPrice})
            // "{"signedTransaction":{"nonce":"0x01","gasPrice":"0x04e3b29200","gasLimit":"0x5208","to":"0x4ceb6e14c0a879774ac98561ab00ccd474971194","value":"0x03a28b6656cb5000","data":"0x","v":"0x1c","r":"0x79ba12fa8675531720a389d301aa7772f18e23307a6f23cd282773695bab61b6","s":"0x4be2117acf7616fff7f1a356aecee3f8245588473762c5d4a1e2924259855d17","_mockTx":"0x[object Object]"},"totalValue":"0.261925","transactionFee":"21000000000"}"
            callback(null, {
                signedTransaction: sweepTransaction,
                totalValue: totalValue,
                transactionFee: gasPrice,
            }, COIN_ETHEREUM);

            return true;
        }); //End JSON call for TX list
    }); //End JSON call for balance
}

HDWalletPouchEthereum.prototype.fromChecksumAddress = function(address) {
    //@note: for ethereum checksum addresses.
    return address.toLowerCase();
}

HDWalletPouchEthereum.prototype.toChecksumAddress = function(address) {
    //@note: for ethereum checksum addresses.
    return HDWalletHelper.toEthereumChecksumAddress(address);
}

HDWalletPouchEthereum.prototype.hasCachedAddressAsContract = function(address) {
    if (this._ethAddressTypeMap[address]) {
        if (this._ethAddressTypeMap[address] === true) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

HDWalletPouchEthereum.prototype.checkIsSmartContractQuery = function(address, callback)
{
    if (this._ethAddressTypeMap[address]) {
        callback(null, this._ethAddressTypeMap[address]);
    }

    var self = this;

    var networkParams = HDWalletPouch.getStaticCoinWorkerImplementation(COIN_ETHEREUM).networkParams;

    var requestUrl = networkParams['static_relay_url'] + networkParams['smart_contract_code'] + address + networkParams['smart_contract_code_append'];

    RequestSerializer.getJSON(requestUrl, function (data) {
        if (!data) {
            var errStr = "failed to get address info from :: " + url + " :: " + data;
            callback(errStr, null);
        } else {
            //@note: contractCode here results in *only* "0x" if it's not a contract, and the full code if it is.
            var contractCode = data.result;
            if (contractCode === '0x') {
                self._ethAddressTypeMap[address] = false;
                callback(null, false);
            } else {
                self._ethAddressTypeMap[address] = true;
                callback(null, true);
            }            
        }
    });
}

HDWalletPouchEthereum.prototype.processFinishedFinalBalanceUpdate = function() {    
    if (g_JaxxApp.getSettings().getIgnoreEtcEthSplit() === true && this._overrideIgnoreEtcEthSplit === false) {
        return;
    } else {
        $(".etcEthMenuOption").removeClass("cssStartHidden"); ///
        this.checkForEtcEthSplit();
    }
}

HDWalletPouchEthereum.prototype.setupCheckForEtcEthSplit = function() {
    if (this._pouchManager._hasFinishedFinalBalanceUpdate !== true) {
        this._overrideIgnoreEtcEthSplit = true;
    } else {
        this.checkForEtcEthSplit();
    }
}

HDWalletPouchEthereum.prototype.checkForEtcEthSplit = function() {
    var self = this;

    var transactions = this.getTransactions(); //Get all transactions
    //@note: requires at least 1 wei over the custom gas limit for contracts.
    var ethSpendableDict = this.getSpendableBalance(1, requiredSplitContractCustomGasLimit);

    var requiredSplitContractCustomGasLimit = thirdparty.web3.toBigNumber(100000);


    var accounts = this.getAllAccountBalancesDict(transactions);

    var allAddresses = Object.keys(accounts);


    var batchSizeGatherEtc = allAddresses.length;


    var networkParams = HDWalletPouch.getStaticCoinWorkerImplementation(COIN_ETHEREUM_CLASSIC).networkParams;

    var etcAccounts = {numAccountsTotal: 0, numAccountsProcessed: 0, accounts: {}};

    //@note: this is the gas price * gas limit, such that the split contract can be run.

    var baseTXCost = requiredSplitContractCustomGasLimit.mul(HDWalletHelper.getDefaultEthereumGasPrice()).toNumber();

    var batch = [];
    while (allAddresses.length) {
        batch.push(allAddresses.shift());
        if (batch.length === this.batchSizeGatherEtc || allAddresses.length === 0) {

            var addressParam = batch.join(networkParams['joinParameters']);

            //            this.log("ethereum classic :: requesting :: " + addressParam);

            var requestURL = networkParams['static_relay_url'] + networkParams['multi_balance'] + addressParam + networkParams['multi_balance_append'];


            var passthroughParams = {batch: batch, etcAccounts: etcAccounts};

            etcAccounts.numAccountsTotal += batch.length;

            //@note: @here: @todo: sending batch is only necessary since we can only associate one
            //account at the moment.
            RequestSerializer.getJSON(requestURL, function(processorData, success, passthroughParams) {
                //                self.log("ethereum classic :: processorData :: " + JSON.stringify(data));

                if (!processorData) {
                    this.log("HDWalletPouchEthereum.checkForEtcEthSplit :: error :: processorData is incorrect :: " + JSON.stringify(processorData) + " :: passthroughParams :: " + JSON.stringify(passthroughParams));
                    return;
                }

                var keysProcessed = Object.keys(processorData);

                passthroughParams.etcAccounts.numAccountsProcessed += keysProcessed.length;

                for (var curAddr in processorData) {
                    passthroughParams.etcAccounts.accounts[curAddr] = processorData[curAddr];
                }

                if (passthroughParams.etcAccounts.numAccountsTotal ===  passthroughParams.etcAccounts.numAccountsProcessed) {
                    self.determineEtcSplit(baseTXCost, passthroughParams.etcAccounts.accounts, ethSpendableDict.addressesSpendable);
                }
            }, null, passthroughParams);

            // Clear the batch
            batch = [];
        }
    }
}


HDWalletPouchEthereum.prototype.determineEtcSplit = function(baseTXCost, etcAccounts, ethSpendableAccounts) {
    var minimumEtcBalance = baseTXCost + 1;
//    console.log("baseTXCost :: " + baseTXCost);
//    console.log("etc balances :: " + JSON.stringify(etcAccounts));
//    console.log("eth balances :: " + JSON.stringify(ethSpendableAccounts));
    
    var balancesTransferrable = {};

    for (var curAddr in etcAccounts) {
        var etcBalance = etcAccounts[curAddr];
        var etcBalanceLarge = HDWalletHelper.convertWeiToEther(etcBalance);
            
        if (etcBalance >= minimumEtcBalance) {
//            console.log("etc/eth split :: etc address :: " + curAddr + " has a splittable balance :: " + etcBalanceLarge);
            if (typeof(ethSpendableAccounts[curAddr]) !== 'undefined' && ethSpendableAccounts[curAddr] !== null) {
                var ethBalance = ethSpendableAccounts[curAddr];
                
                if (ethBalance >= etcBalance) {
                    var ethBalanceLarge = HDWalletHelper.convertWeiToEther(ethBalance);

//                    console.log("[etc/eth split :: eth address :: " + curAddr + " has a splittable balance :: " + ethBalanceLarge + "]");

                    balancesTransferrable[curAddr] = {small: etcBalance, large: etcBalanceLarge, ethRequiredLarge: 0};
                } else {
                    var requiredEth = thirdparty.web3.toBigNumber(etcBalance).minus(thirdparty.web3.toBigNumber(ethBalance)).plus(thirdparty.web3.toBigNumber(baseTXCost)).toNumber();
                    
                    var requiredEthLarge = HDWalletHelper.convertWeiToEther(requiredEth);
                    
//                    console.log("[etc/eth split :: eth address :: " + curAddr + " :: requires more eth :: " + requiredEthLarge + " ]");

                    balancesTransferrable[curAddr] = {small: etcBalance, large: etcBalanceLarge, ethRequiredLarge: requiredEthLarge};
                }
            } else {
//                console.log("[etc/eth split :: eth address :: " + curAddr + " does not have a splittable balance]");
                
                var requiredEth = thirdparty.web3.toBigNumber(etcBalance).plus(thirdparty.web3.toBigNumber(baseTXCost)).toNumber();
                var requiredEthLarge = HDWalletHelper.convertWeiToEther(requiredEth);
                
                balancesTransferrable[curAddr] = {small: etcBalance, large: etcBalanceLarge, ethRequiredLarge: requiredEthLarge};
            }
        } else {
//            console.log("etc/eth split :: etc address :: " + curAddr + " does not have a splittable balance :: " + etcBalanceLarge);
        }
    }
    
    g_JaxxApp.getUI().showEtcEthSplitModal(baseTXCost, balancesTransferrable);
    
//    console.log("eth/etc split :: balancesTransferrable :: " + JSON.stringify(balancesTransferrable, null, 4));
}

HDWalletPouchEthereum.prototype.getBaseCoinAddressFormatType = function() {
    return this._baseFormatCoinType;
}

HDWalletPouchEthereum.prototype.readyTransactionList = function(depositAddresses, amount, gasPrice, gasLimit, ethereumTXData, batchId) {
    var txParams = {};
    
    txParams.depositAddresses = depositAddresses;
    txParams.amount = amount;
    txParams.gasPrice = gasPrice;
    txParams.gasLimit = gasLimit;
    txParams.ethereumTXData = ethereumTXData;
    txParams.batchId = batchId;
    txParams.isPrepared = false;

    this._readyTransactionList = txParams;
    //@note: @here: @todo: from jaxx.js, gather custom data and such.
    //@note: @here: this should check for address, amount validity.
    //@note: @todo: maybe a transaction queue?
}

HDWalletPouchEthereum.prototype.setReadyTransactionListIsPrepared = function(batchId) {
   // console.log(batchId);
    if (this._readyTransactionList.batchId === batchId) {
        this._readyTransactionList.isPrepared = true;
    }
}

HDWalletPouchEthereum.prototype.createTransaction = function(address, amount) {
    //@note: @here: @todo: from jaxx.js, gather custom data and such.
    //@note: @here: this should check for address, amount validity.
    //@note: @todo: maybe a transaction queue?
}

HDWalletPouchEthereum.prototype.getPrivateKeyFromAddress = function(address){
    return this._pouchManager.getDataStorageController().getKeyPair(address).d.toBuffer(32).toString('hex');
}
HDWalletPouchEthereum.prototype.setShapeShiftDepositAddress = function(address) {
    //This function is only meant to check if shapeshift deposit address is same as previous deposit address
    //WARNING: PLEASE DO NOT USE THIS FUNCTION FOR GETTING ADDRESS. IT IS ONLY MEANT TO CHECK ADDRESS
    // console.error(address);
    this._pouchManager.setShapeShiftDepositAddress(address);
}

HDWalletPouchEthereum.prototype.sendTransaction = function(signedTransaction, callback, params, debugIdx){
    this.sendEthereumTransaction(signedTransaction, callback, null, -1);
}

HDWalletPouchEthereum.isValidPrivateKey = function(value){
    return isValidETHPrivateKey(value);
}

HDWalletPouchEthereum.prototype.getConfirmationMaxForUI = function(){
    return 12;
}