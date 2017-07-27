var CoinTokenBlockchainCapitalEthereum = function() {
    this._foldManager = null;
    this._baseFormatCoinType = COIN_BLOCKCHAINCAPITAL_ETHEREUM;
}

CoinTokenBlockchainCapitalEthereum.uiComponents = {
    coinFullName: 'BlockchainCapitalEthereum',
    coinFullDisplayName: 'BlockchainCapital',
    coinWalletSelector3LetterSymbol: 'BCAP',
    coinSymbol: '\u024C',
    coinButtonSVGName: 'BCAPlogo',
    coinLargePngName: '.imgBCAP',
    coinButtonName: '.imageLogoBannerBCAP',
    coinSpinnerElementName: '.imageBlockchainCapitalWash',
    coinDisplayColor: '#5f2b51',
    //    csvExportField: '.backupPrivateKeyListETH',
    transactionsListElementName: '.transactionsBlockchainCapitalEthereum',
    transactionTemplateElementName: '.transactionTBlockchainCapitalEthereum',
    accountsListElementName: '.accountDataTableEthereum',
    accountTemplateElementName: '.accountDataBlockchainCapitalEthereum',
    displayNumDecimals: 8,
};

//@note: also accessible through:
//var tokenIsERC20 = HDWalletPouch.getStaticCoinPouchImplementation(coinType).pouchParameters['tokenIsERC20'];

CoinTokenBlockchainCapitalEthereum.pouchParameters = {
    coinHDType: 60,
    coinIsTokenSubtype: true,
    coinAbbreviatedName: 'BCAP',
    tokenContractAddress: '0xff3519eeeea3e76f1f699ccce5e23ee0bdda41ac',
    tokenIsERC20: true,
    transferOpCode: '0xa9059cbb',
};

CoinTokenBlockchainCapitalEthereum.networkDefinitions = {
    mainNet: null,
    testNet: null,
}

CoinTokenBlockchainCapitalEthereum.getDefaultGasLimit = function() {
    return thirdparty.web3.toBigNumber(150000);
}

CoinTokenBlockchainCapitalEthereum.prototype.initialize = function(foldManager) {
    this._foldManager = foldManager;
    
   /* this.getREPContractAddress(function(data) {
        var repContractAddress = JaxxUtils.scrubInput(data[0]['rep-contract-address']);
        var shapeshiftEnabled = JaxxUtils.scrubInput(data[0]['shapeshift-enabled']);
        
//        if (typeof(repContractAddress) !== 'undefined' && repContractAddress !== null) { 
//            CoinTokenAugurEthereum.tokenContractAddress = repContractAddress;
//        }
        
        if (typeof(shapeshiftEnabled) !== 'undefined' && shapeshiftEnabled !== null) { 
            if (shapeshiftEnabled === "true") {
                HDWalletHelper.shapeShiftCryptoCurrenciesAllowed.regular["AUG"] = true;
            } else {
                HDWalletHelper.shapeShiftCryptoCurrenciesAllowed.regular["AUG"] = false;
            }
        }

       // console.warn("CoinTokenAugurEthereum :: gathered REP contract address :: " + repContractAddress + " :: shapeshiftEnabled :: " + shapeshiftEnabled + " :: CoinTokenAugurEthereum.tokenContractAddress :: " + CoinTokenAugurEthereum.tokenContractAddress + " :: HDWalletHelper.shapeShiftCryptoCurrenciesAllowed.regular.AUG :: " + HDWalletHelper.shapeShiftCryptoCurrenciesAllowed.regular["AUG"]);
    });*/
}

CoinTokenBlockchainCapitalEthereum.prototype.getREPContractAddress = function(callback) {
    var self = this;
    
    var url = "https://jaxx.io/jaxx-data/jaxx-augur-rep-contract-address.php"

    $.getJSON(url, function(data) {
        if (data && data[0]) {
            callback(data);
        }
    });
}

CoinTokenBlockchainCapitalEthereum.prototype.createTransaction = function(address, depositAddresses, amount) {
    if(!jaxx.Registry.tempStorage['BlockchainCapitalEthereum'])jaxx.Registry.tempStorage['BlockchainCapitalEthereum'] = {};
    jaxx.Registry.tempStorage['BlockchainCapitalEthereum']['amount'] = +amount;
    //console.warn(address);
    //@note: @here: this should check for address, amount validity.
    //@note: @todo: maybe a transaction queue?
    

    var ethereumAddress = HDWalletHelper.parseEthereumAddress(address);

    var computedFee = "";

    var gasPrice = HDWalletHelper.getDefaultEthereumGasPrice();
    var gasLimit = CoinToken.getStaticTokenImplementation(this._foldManager._tokenCoinType).getDefaultGasLimit();

    //@note: construct the abi here.

    var transferOpCode = this._foldManager.getTransferOpCode();

    //@note: if not shapeshift, use basic address.

    if (depositAddresses.length === 0) {
        depositAddresses = [ethereumAddress];
    }

    var ethereumTXDataPrePendArray = [];

    for (var i = 0; i < depositAddresses.length; i++) {
        var ABIAddressTarget = HDWalletHelper.zeroPadLeft(HDWalletHelper.toEthereumNakedAddress(depositAddresses[i]), 64);

        var ethereumTXDataPrePend = transferOpCode + ABIAddressTarget;
        ethereumTXDataPrePendArray.push(ethereumTXDataPrePend);
    }

    //                console.log("ethereumTXDataPrePend :: " + ethereumTXDataPrePend);
    //@note: @here: due to the ethereum tx structure, we may need multiple individual transactions.

    var coinHolderType = CoinToken.getTokenCoinHolderType(this._foldManager._tokenCoinType);

    var foldMainPouch = wallet.getPouchFold(coinHolderType);

    var targetTokenContractAddress = CoinToken.getStaticTokenImplementation(this._foldManager._tokenCoinType).pouchParameters['tokenContractAddress'];

    //@note: getPouchFoldImplementation()
    var transactionDict = this._foldManager.buildERC20EthereumTransactionList(foldMainPouch, targetTokenContractAddress, amount, gasPrice, gasLimit, ethereumTXDataPrePendArray, null);

    transactionDict.name ='BlockchainCapital';
    transactionDict.ethereumAddress = ethereumAddress;
    transactionDict.gasPrice = gasPrice;
    transactionDict.gasLimit = gasLimit;
    transactionDict.miningFee = HDWalletHelper.convertWeiToEther(transactionDict.totalTXCost);
    transactionDict.tokenAmount = amount;

    //console.warn(transactionDict);


    return transactionDict;
}

CoinTokenBlockchainCapitalEthereum.prototype.getBaseCoinAddressFormatType = function() {
  return this._baseFormatCoinType;
}

/*
CoinTokenAugurEthereum.getCoinAddress = function(node) {
   /!* var ctr = jaxx.Registry.crypto_controllers['Ethereum']
    console.warn(ctr)
    *!/
    /!* var address = HDWalletPouchEthereum.dataStorageController.getCurrentPublicAddresReceive();
    //console.log(address)
    HDWalletPouchEthereum.pouchManager._currentReceiveAddress = address;

    return  address;*!/

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
}*/
