var CoinTokenCivicEthereum = function() {
    this._foldManager = null;
    this._baseFormatCoinType = COIN_CIVIC_ETHEREUM;
}

CoinTokenCivicEthereum.uiComponents = {
    coinFullName: 'CivicEthereum',
    coinFullDisplayName: 'Civic',
    coinWalletSelector3LetterSymbol: 'CVC',
    coinSymbol: '\u024C',
    coinButtonSVGName: 'CVClogo',
    coinLargePngName: '.imgCVC',
    coinButtonName: '.imageLogoBannerCVC',
    coinSpinnerElementName: '.imageCivicEtherWash',
    coinDisplayColor: '#5f2b51',
    //    csvExportField: '.backupPrivateKeyListETH',
    transactionsListElementName: '.transactionsCivicEthereum',
    transactionTemplateElementName: '.transactionTCivicEthereum',
    accountsListElementName: '.accountDataTableEthereum',
    accountTemplateElementName: '.accountDataCivicEthereum',
    displayNumDecimals: 8,
};

//@note: also accessible through:
//var tokenIsERC20 = HDWalletPouch.getStaticCoinPouchImplementation(coinType).pouchParameters['tokenIsERC20'];

CoinTokenCivicEthereum.pouchParameters = {
    coinHDType: 60,
    coinIsTokenSubtype: true,
    coinAbbreviatedName: 'CVC',
    tokenContractAddress: '0x41e5560054824ea6b0732e656e3ad64e20e94e45',
    tokenIsERC20: true,
    transferOpCode: '0xa9059cbb',
};

CoinTokenCivicEthereum.networkDefinitions = {
    mainNet: null,
    testNet: null,
}

CoinTokenCivicEthereum.getDefaultGasLimit = function() {
    return thirdparty.web3.toBigNumber(150000);
}

CoinTokenCivicEthereum.prototype.initialize = function(foldManager) {
    this._foldManager = foldManager;
}

CoinTokenCivicEthereum.prototype.getREPContractAddress = function(callback) {
    var self = this;
    
    var url = "https://jaxx.io/jaxx-data/jaxx-augur-rep-contract-address.php"

    $.getJSON(url, function(data) {
        if (data && data[0]) {
            callback(data);
        }
    });
}

CoinTokenCivicEthereum.prototype.createTransaction = function(address, depositAddresses, amount) {
    if(!jaxx.Registry.tempStorage['CivivEthereum'])jaxx.Registry.tempStorage['CivicEthereum'] = {};
    jaxx.Registry.tempStorage['CivicEthereum']['amount'] = +amount;
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

    transactionDict.name ='Augur';
    transactionDict.ethereumAddress = ethereumAddress;
    transactionDict.gasPrice = gasPrice;
    transactionDict.gasLimit = gasLimit;
    transactionDict.miningFee = HDWalletHelper.convertWeiToEther(transactionDict.totalTXCost);
    transactionDict.tokenAmount = amount;

    //console.warn(transactionDict);


    return transactionDict;
}

CoinTokenCivicEthereum.prototype.getBaseCoinAddressFormatType = function() {
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
