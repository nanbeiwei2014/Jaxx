var coinTokenObj = {
    "REP": {
        "uiComponents" : {
            coinFullName: "AugurEthereum",
            coinFullDisplayName: 'Augur',
            coinWalletSelector3LetterSymbol: 'REP',
            coinSymbol: '\u024C',
            coinButtonSVGName: 'REPlogo',
            coinLargePngName: '.imgREP',
            coinButtonName: '.imageLogoBannerREP',
            coinSpinnerElementName: '.imageAugurEtherWash',
            coinDisplayColor: '#5f2b51',
            transactionsListElementName: '.transactionsAugurEthereum',
            transactionTemplateElementName: '.transactionTAugurEthereum',
            accountsListElementName: '.accountDataTableEthereum',
            accountTemplateElementName: '.accountDataAugurEthereum',
            displayNumDecimals: 8,
        },
        "pouchParameters" : {
            coinHDType: 60,
            coinIsTokenSubtype: true,
            coinAbbreviatedName: 'REP',
            tokenContractAddress: '0x48c80F1f4D53D5951e5D5438B54Cba84f29F32a5',
            tokenIsERC20: true,
            transferOpCode: '0xa9059cbb',
        },
        networkDefinitions : {
            mainNet: null,
            testNet: null,
        },
        "baseFormatCoinType": COIN_AUGUR_ETHEREM
    }
}
var CoinTokenEthereum = function(coinName) {
    this._foldManager = null;
    this._baseFormatCoinType = curTokenObj.coinName.baseFormatCoinType;
}
//@note: also accessible through:
//var tokenIsERC20 = HDWalletPouch.getStaticCoinPouchImplementation(coinType).pouchParameters['tokenIsERC20'];

CoinTokenEthereum.getDefaultGasLimit = function() {
    return thirdparty.web3.toBigNumber(150000);
}

CoinTokenEthereum.prototype.initialize = function(foldManager) {
    this._foldManager = foldManager;
}

CoinTokenEthereum.prototype.createTransaction = function(address, depositAddresses, amount) {
    if(!jaxx.Registry.tempStorage[coinTokenObj.coinName.uiComponents.coinFullName])jaxx.Registry.tempStorage[coinTokenObj.coinName.uiComponents.coinFullName] = {};
    jaxx.Registry.tempStorage[coinTokenObj.coinName.uiComponents.coinFullName]['amount'] = +amount;
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

    transactionDict.name = coinTokenObj.coinName.uiComponents.coinFullDisplayName;
    transactionDict.ethereumAddress = ethereumAddress;
    transactionDict.gasPrice = gasPrice;
    transactionDict.gasLimit = gasLimit;
    transactionDict.miningFee = HDWalletHelper.convertWeiToEther(transactionDict.totalTXCost);
    transactionDict.tokenAmount = amount;

    //console.warn(transactionDict);


    return transactionDict;
}

CoinTokenEthereum.prototype.getBaseCoinAddressFormatType = function() {
    return coinTokenObj.coinName.baseFormatCoinType;
}