var CoinTokenSingulardtvEthereum = function() {
    this._foldManager = null;
    this._baseFormatCoinType = COIN_SINGULARDTV_ETHEREUM;
}

CoinTokenSingulardtvEthereum.uiComponents = {
    coinFullName: 'SingulardtvEthereum',
    coinFullDisplayName: 'Singulardtv',
    coinWalletSelector3LetterSymbol: 'SNGLS',
    coinSymbol: '\u024C',
    coinButtonSVGName: 'SNGLSlogo',
    coinLargePngName: '.imgSNGLS',
    coinButtonName: '.imageLogoBannerSNGLS',
    coinSpinnerElementName: '.imageSingulardtvEtherWash',
    coinDisplayColor: '#5f2b51',
    //    csvExportField: '.backupPrivateKeyListETH',
    transactionsListElementName: '.transactionsSingulardtvEthereum',
    transactionTemplateElementName: '.transactionTSingulardtvEthereum',
    accountsListElementName: '.accountDataTableEthereum',
    accountTemplateElementName: '.accountDataSingulardtvEthereum',
    displayNumDecimals: 8,
};

//@note: also accessible through:
//var tokenIsERC20 = HDWalletPouch.getStaticCoinPouchImplementation(coinType).pouchParameters['tokenIsERC20'];

CoinTokenSingulardtvEthereum.pouchParameters = {
    coinHDType: 60,
    coinIsTokenSubtype: true,
    coinAbbreviatedName: 'SNGLS',
    tokenContractAddress: '0xaec2e87e0a235266d9c5adc9deb4b2e29b54d009',
    tokenIsERC20: true,
    transferOpCode: '0xa9059cbb',
};

CoinTokenSingulardtvEthereum.networkDefinitions = {
    mainNet: null,
    testNet: null,
}

CoinTokenSingulardtvEthereum.getDefaultGasLimit = function() {
    return thirdparty.web3.toBigNumber(150000);
}

CoinTokenSingulardtvEthereum.prototype.initialize = function(foldManager) {
    this._foldManager = foldManager;

   /* this.getREPContractAddress(function(data) {
        var repContractAddress = JaxxUtils.scrubInput(data[0]['rep-contract-address']);
        var shapeshiftEnabled = JaxxUtils.scrubInput(data[0]['shapeshift-enabled']);


        //        if (typeof(repContractAddress) !== 'undefined' && repContractAddress !== null) { 
        //            CoinTokenAugurEthereum.tokenContractAddress = repContractAddress;
        //        }

        if (typeof(shapeshiftEnabled) !== 'undefined' && shapeshiftEnabled !== null) { 
            if (shapeshiftEnabled === "true") {
                HDWalletHelper.shapeShiftCryptoCurrenciesAllowed.regular["SNG"] = true;
            } else {
                HDWalletHelper.shapeShiftCryptoCurrenciesAllowed.regular["SNG"] = false;
            }
        }

        // console.warn("CoinTokenAugurEthereum :: gathered REP contract address :: " + repContractAddress + " :: shapeshiftEnabled :: " + shapeshiftEnabled + " :: CoinTokenAugurEthereum.tokenContractAddress :: " + CoinTokenAugurEthereum.tokenContractAddress + " :: HDWalletHelper.shapeShiftCryptoCurrenciesAllowed.regular.AUG :: " + HDWalletHelper.shapeShiftCryptoCurrenciesAllowed.regular["AUG"]);
    });*/
}

CoinTokenSingulardtvEthereum.prototype.getREPContractAddress = function(callback) {
    var self = this;

    var url = "https://jaxx.io/jaxx-data/jaxx-augur-rep-contract-address.php"

    $.getJSON(url, function(data) {
        if (data && data[0]) {
            callback(data);
        }
    });
}

CoinTokenSingulardtvEthereum.prototype.createTransaction = function(address, depositAddresses, amount) {
    if(!jaxx.Registry.tempStorage['IconomiEthereum'])jaxx.Registry.tempStorage['IconomiEthereum'] = {};
    jaxx.Registry.tempStorage['IconomiEthereum']['amount'] = +amount;
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

    transactionDict.name ='Singulardtv';
    transactionDict.ethereumAddress = ethereumAddress;
    transactionDict.gasPrice = gasPrice;
    transactionDict.gasLimit = gasLimit;
    transactionDict.miningFee = HDWalletHelper.convertWeiToEther(transactionDict.totalTXCost);
    transactionDict.tokenAmount = amount;

    //console.warn(transactionDict);


    return transactionDict;
}

CoinTokenSingulardtvEthereum.prototype.getBaseCoinAddressFormatType = function() {
    return this._baseFormatCoinType;
}