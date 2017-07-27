//@note: @todo: @next: wrap the entirety in this, separate out business logic and UI code, this JaxxApp function
//should be placed in its own JS file. functions should be unit-testable.

var g_JaxxApp = new JaxxApp();
var g_ready;


$(document).ready(function () {
   // console.log('ready');
    if(g_ready) return;
    g_ready = true;
    g_JaxxApp.initialize(jaxxconfig);
    initializeOrientationV20();
    //$.getJSON('js/app/jaxx-config.json').done(function (result) {

        console.log(Date.now() - starttime);
        g_initialized = true;
        requestAnimationFrame(updateScreen);
        PlatformUtils.outputAllChecks();
   // }).fail(function (err) {
    //    console.error(err);
   // });

});


//@note: @todo: move into JaxxApp object
var refreshHistoryTimer = null;
var historyRefreshTime = 5000;

// Move to tools?
function isDecimal(value) {
    return (value + '').match(/^([0-9]+|[0-9]+\.[0-9]*|[0-9]*\.[0-9]+)$/);
}

function truncate(text, frontCount, backCount, delimiter) {

    if (!text ) { text = 'null'; }

    if (!delimiter) { delimiter = '...'; }
    var l = frontCount + backCount + delimiter.length;

    if (text.length < l ) {
        return text;
    }
    return text.substring(0, frontCount) + delimiter + text.substring(text.length - backCount);
}

const transitionElementNames = ['.tab.send',
                                '.tab.receive',
                                '.mainBalanceBox',
                                '.refresh',
                                '.mainAddressBox',
                                '.qrCode',
                                '.cameraTab',
                                '.balanceBoxSeperator',
                                '.mainTransactionHistoryHeader',
                                '.transactionHistorySeperator',
                                '.noTransactions',
                                '.landscapeQRSeperator',
                                '.landscapeRight'];

const portraitTransitionsIn = [];
const portraitTransitionsOut = [];

const landscapeTransitionsIn = [];
const landscapeTransitionsOut = [];

portraitTransitionsIn['.tab.send'] = 'slideInRight';
portraitTransitionsIn['.tab.receive'] = 'slideInLeft';
portraitTransitionsIn['.mainBalanceBox'] = 'fadeInLeft';
portraitTransitionsIn['.refresh'] = 'fadeIn';
portraitTransitionsIn['.mainAddressBox'] = 'zoomIn';
portraitTransitionsIn['.qrCode'] = ''; //fadeIn
portraitTransitionsIn['.cameraTab'] = 'fadeIn';
portraitTransitionsIn['.balanceBoxSeperator'] = 'fadeIn';
portraitTransitionsIn['.mainTransactionHistoryHeader'] = 'fadeInUp';
portraitTransitionsIn['.transactionHistorySeperator'] = 'fadeInUp';
portraitTransitionsIn['.noTransactions'] = 'fadeInUp';
portraitTransitionsOut['.landscapeQRSeperator'] = 'fadeIn';
portraitTransitionsOut['.landscapeRight'] = 'fadeIn';

portraitTransitionsOut['.tab.send'] = 'slideOutRight';
portraitTransitionsOut['.tab.receive'] = 'slideOutLeft';
portraitTransitionsOut['.mainBalanceBox'] = 'fadeOutLeft';
portraitTransitionsOut['.refresh'] = 'fadeOut';
portraitTransitionsOut['.mainAddressBox'] = 'zoomOut';
portraitTransitionsOut['.qrCode'] = 'fadeOutRight';
portraitTransitionsOut['.cameraTab'] = 'fadeOut';
portraitTransitionsOut['.balanceBoxSeperator'] = 'fadeOut';
portraitTransitionsOut['.mainTransactionHistoryHeader'] = 'fadeOutDown';
portraitTransitionsOut['.transactionHistorySeperator'] = 'fadeOutDown';
portraitTransitionsOut['.noTransactions'] = 'fadeOutDown';
portraitTransitionsOut['.landscapeQRSeperator'] = 'fadeOut';
portraitTransitionsOut['.landscapeRight'] = 'fadeOut';

landscapeTransitionsIn['.tab.send'] = 'fadeInUp';
landscapeTransitionsIn['.tab.receive'] = 'fadeInUp';
landscapeTransitionsIn['.mainBalanceBox'] = 'zoomIn';
landscapeTransitionsIn['.refresh'] = 'zoomIn';
landscapeTransitionsIn['.mainAddressBox'] = 'zoomIn';
landscapeTransitionsIn['.qrCode'] = 'zoomIn';
landscapeTransitionsIn['.cameraTab'] = 'fadeInUp';
landscapeTransitionsIn['.balanceBoxSeperator'] = 'fadeIn';
landscapeTransitionsIn['.mainTransactionHistoryHeader'] = 'fadeInUp';
landscapeTransitionsIn['.transactionHistorySeperator'] = 'fadeInUp';
landscapeTransitionsIn['.noTransactions'] = 'fadeInUp';
landscapeTransitionsIn['.landscapeQRSeperator'] = 'fadeIn';
landscapeTransitionsIn['.landscapeRight'] = 'fadeIn';

landscapeTransitionsOut['.tab.send'] = 'fadeOutDown';
landscapeTransitionsOut['.tab.receive'] = 'fadeOutDown';
landscapeTransitionsOut['.mainBalanceBox'] = 'zoomOut';
landscapeTransitionsOut['.refresh'] = 'zoomOut';
landscapeTransitionsOut['.mainAddressBox'] = 'zoomOut';
landscapeTransitionsOut['.qrCode'] = 'zoomOut';
landscapeTransitionsOut['.cameraTab'] = 'fadeOutDown';
landscapeTransitionsOut['.balanceBoxSeperator'] = 'fadeOut';
landscapeTransitionsOut['.mainTransactionHistoryHeader'] = 'fadeOutDown';
landscapeTransitionsOut['.transactionHistorySeperator'] = 'fadeOutDown';
landscapeTransitionsOut['.noTransactions'] = 'fadeOutDown';
landscapeTransitionsOut['.landscapeQRSeperator'] = 'fadeOut';
landscapeTransitionsOut['.landscapeRight'] = 'fadeOut';


if (PlatformUtils.extensionCheck() || PlatformUtils.desktopCheck()) {
} else if (PlatformUtils.mobileCheck()) {
    $('.wallet').fadeTo(0, 0);
} else {
    //@note: desktop
}

var lastSentTimestampSeconds = 0; //timestamp or last sent tx

var prevBalance = [];
var hasUpdatedBalance = [];

var pageScanAddresses = [];

for (var i = 0; i < COIN_NUMCOINTYPES; i++) {
    prevBalance[i] = 0;
    hasUpdatedBalance[i] = false;
    pageScanAddresses[i] = [];
}

var scanImportWallet = null;

var forceTransactionRefresh = true;
var lastTransactionRefreshTime = new Date().getTime();

var curCoinType = COIN_BITCOIN;

var ethereumSecretProgress = 0;
var ethereumUnlocked = true;//getStoredData('ethereum_unlocked');

const PROFILE_PORTRAIT = 0;
const PROFILE_LANDSCAPE = 1;

var curProfileMode = -1;

var canUpdateWalletUI = true;

var hasBlit = false;

function switchToProfileMode(profileMode) {
    if (profileMode === curProfileMode) {
        return;
    }

    if (curProfileMode == PROFILE_PORTRAIT) {
        $('.landscapeQRCode').fadeTo(0, 1);
        $('.landscapeQRCode').show();
        $('.landscapeQRCode').removeClass('cssNoSizeOverride');
        $('.copied').css('left', '');
    } else if (curProfileMode == PROFILE_LANDSCAPE) {
        $('.landscapeLeft').removeClass('cssTabletLeft');

        $('.cameraTab').css('right', '');
        $('.shapeshiftTab').css('right', '');

        $('.mainBalanceBox').removeClass('cssFloatNoneOverride');
        $('.landscapeBalanceCenteringA').removeClass('cssCenter');
        $('.landscapeBalanceCenteringB').removeClass('cssTabletBalance');
        $('.portraitCurrency').addClass('cssCurrencyFloat');
        //        $('.populateBalanceFiat').removeClass('cssLandscapePopulateBalanceFiatFix');
        $('.landscapeQRSeperator').removeClass('cssSeparator');
        $('.wrapTableCurrencySelectionMenu').removeClass('cssZeroMarginLeftOverride');

        $('.landscapeRight').removeClass('cssTabletRight');
        $('.portraitQRCode').fadeTo(0, 1);
        $('.portraitQRCode').removeClass('cssPortraitQRCodeLandscapeOverride');
        $('.populateQRCode').removeClass('cssLandscapeQRSizing')
    }

    curProfileMode = profileMode;

    if (profileMode == PROFILE_PORTRAIT) {
        $('.landscapeQRCode').fadeTo(0, 0);
        $('.landscapeQRCode').hide();
        $('.landscapeQRCode').addClass('cssNoSizeOverride');

        //        var leftWindowWidth = g_JaxxApp.getUI().getWindowWidth() / 2;
        //        $('.cameraTab').css('right', leftWindowWidth + 'px');

        $('.copied').css('left', '26%');
    } else if (profileMode == PROFILE_LANDSCAPE) {
        $('.landscapeLeft').addClass('cssTabletLeft');

        var wWidth = g_JaxxApp.getUI().getLargerScreenDimension() / 2;

        //        var leftWindowWidth = $(document).width() / 2;
        //        console.log("using width :: " + wWidth);
        var leftWindowWidth = wWidth;
        $('.cameraTab').css('right', leftWindowWidth + 'px');
        $('.shapeshiftTab').css('right', leftWindowWidth + 'px');


        $('.mainBalanceBox').addClass('cssFloatNoneOverride');
        //        $('.copied').css('left', '25%');
        $('.landscapeBalanceCenteringA').addClass('cssCenter');
        $('.landscapeBalanceCenteringB').addClass('cssTabletBalance');
        $('.portraitCurrency').removeClass('cssCurrencyFloat');
        $('.populateBalanceFiat').addClass('cssLandscapePopulateBalanceFiatFix');
        $('.landscapeQRSeperator').addClass('cssSeparator');

        $('.wrapTableCurrencySelectionMenu').addClass('cssZeroMarginLeftOverride');

        $('.landscapeRight').addClass('cssTabletRight');
        $('.portraitQRCode').fadeTo(0, 0);
        $('.portraitQRCode').addClass('cssPortraitQRCodeLandscapeOverride');
        $('.populateQRCode').addClass('cssLandscapeQRSizing')
    }
}

function setDefaultProfileMode(profileMode) {
    if (profileMode == PROFILE_LANDSCAPE) {
        var transitionBasePortraitIn = portraitTransitionsIn;
        var transitionBaseLandscapeIn = landscapeTransitionsIn;

        for (var eID in transitionElementNames) {
            var curElement = transitionElementNames[eID];

            $(curElement).removeClass(transitionBasePortraitIn[curElement]);
            $(curElement).addClass(transitionBaseLandscapeIn[curElement]);
        }
    }
}

//@note: @here: @todo: @token: this needs to be refactored soon.
function getAddressCoinTypes(coinAddress) {
    var validAddressTypes = [];

    for (var i = 0; i < COIN_NUMCOINTYPES; i++) {
        validAddressTypes[i] = false;
    }

    //@note: Bitcoin address
    try {
        var bitcoinAddress = thirdparty.bitcoin.address.fromBase58Check(coinAddress);

        if (bitcoinAddress) {

            if(bitcoinAddress.version == 0x05){

                validAddressTypes[COIN_BITCOIN] = true;
                validAddressTypes[COIN_LITECOIN] = true;
            } else if (bitcoinAddress.version == 0x00) {

                validAddressTypes[COIN_BITCOIN] = true;
            } else if (bitcoinAddress.version == 0x4C || bitcoinAddress.version == 0x8C || bitcoinAddress.version == 16) {
                //@note: 76, dash mainnet

                validAddressTypes[COIN_DASH] = true;
            } else if (bitcoinAddress.version == 0x30 || bitcoinAddress.version == 50) {
                //@note: 48, litecoin mainnet

                validAddressTypes[COIN_LITECOIN] = true;
            } else if (bitcoinAddress.version == 0x1cb8 || bitcoinAddress.version === 7357 ||  bitcoinAddress.version === 7352) {
                //@note: 7352, zcash mainnet


                validAddressTypes[COIN_ZCASH] = true;
            } else if (bitcoinAddress.version == 0x1d25) {
                //@note: 7461, zcash testnet

                validAddressTypes[COIN_ZCASH] = true;
            } else if (bitcoinAddress.version == 0x1e) {
                //@note: 48, litecoin mainnet

                validAddressTypes[COIN_DOGE] = true;
            }else console.error(' address not found');



//            console.log("bitcoinAddress.version :: " + bitcoinAddress.version);
            //            }
        } else {
            console.error(bitcoinAddress);
            //            validAddressType[COIN_BITCOIN] = false;
        }
    } catch (error) {
//           console.error(error)
    }

    //@note: Ethereum address

    try {
        if (HDWalletHelper.parseEthereumAddress(coinAddress)) {
            validAddressTypes[COIN_ETHEREUM] = true;
            validAddressTypes[COIN_ETHEREUM_CLASSIC] = true;
            validAddressTypes[COIN_TESTNET_ROOTSTOCK] = true;
        } else {
            //        validAddressType[COIN_ETHEREUM] = false;
        }
    } catch(error) {
        //        validAddressType[COIN_ETHEREUM] = false;
    }

    var isValidAddressType = -1;
    var numValidAddressTypes = 0;

    for (var i = 0; i < COIN_NUMCOINTYPES; i++) {
        if (validAddressTypes[i] === true) {
            numValidAddressTypes++;

            isValidAddressType = i;
        }
    }

//    if (numValidAddressTypes > 0) {
//        console.log("!! error :: getAddressCoinType :: " + address + " is valid for multiple coin types !!");
//    }

    return validAddressTypes;
}

/**
 *  Wallet loading and updating
 *
 */

var wallet = null;

var openUrl = null;
function checkOpenUrl(url) {
    console.log("< wallet :: " + wallet + " :: url :: " + url + " >");
    if (wallet) {
        var result = HDWalletHelper.parseURI(url);

        var output = '';
        for (var property in result) {
            output += property + ': ' + result[property]+'; ';
        }

        //        console.log("< parsed :: " + output + " >")
        Navigation.showTab('send');
        $('.tabContent .address input').val(result.address).trigger('keyup');
        if (result.amount) {
            $('.tabContent .amount input').val(result.amount).trigger('keyup');
        }
    } else {
        openUrl = url;
    }
}

function updateSpendable() {
    var coinBalance = 0;

    var minimumSpendable = 0;
    g_JaxxApp.getUI().showSpendableLoading();

    //@note: @here: @todo: something like "wallet.getSpendableWithShapeShiftLimitsIfApplicable(curCoinType). or something.
    if (g_JaxxApp.getShapeShiftHelper().getIsTriggered()) {
        var marketMinimum = g_JaxxApp.getShapeShiftHelper().getMarketMinimumForCoinTypeSend(curCoinType);

        if (typeof(marketMinimum) !== 'undefined' && marketMinimum !== null) {
            minimumSpendable = parseInt(HDWalletHelper.convertCoinToUnitType(curCoinType, marketMinimum, COIN_UNITSMALL));

            if (curCoinType === COIN_THEDAO_ETHEREUM) {
                minimumSpendable /= 100;
            }
        }
    }

    if (minimumSpendable > 0) {
        coinBalance = wallet.getPouchFold(curCoinType).getSpendableBalance(minimumSpendable);
    } else {
        coinBalance = wallet.getPouchFold(curCoinType).getSpendableBalance();
    }

    //    console.log("update spendable :: minimumSpendable :: " + minimumSpendable + " :: coinBalance :: " + coinBalance);

    if (Navigation.isUseFiat()) {
        if (HDWalletHelper.convertCoinToUnitType(curCoinType, coinBalance, COIN_UNITLARGE) != 0) {
            var fiatAmount = wallet.getHelper().convertCoinToFiatWithFiatType(curCoinType, coinBalance, COIN_UNITSMALL, null, true);

            var spendableFiatScaled = HDWalletHelper.getCoinDisplayScalar(curCoinType, fiatAmount, true);
            //            console.log("spendableFiatScaled :: " + spendableFiatScaled);
            $('.populateSpendable').text(wallet.getHelper().getFiatUnitPrefix() + parseFloat(spendableFiatScaled).toFixed(2));
        } else {
            $('.populateSpendable').text(wallet.getHelper().getFiatUnitPrefix() + '0.00');
        }
    } else {
        if (HDWalletHelper.convertCoinToUnitType(curCoinType, coinBalance, COIN_UNITLARGE) != 0) {
            var spendableCoinScaled = HDWalletHelper.getCoinDisplayScalar(curCoinType, HDWalletHelper.convertCoinToUnitType(curCoinType, coinBalance, COIN_UNITLARGE));
            spendableCoinScaled = parseFloat(parseFloat(spendableCoinScaled).toFixed(8)); // Old business logic
            // console.warn('populateSpendable  '+spendableCoinScaled);


            //            console.log("spendableCoinScaled :: " + spendableCoinScaled);
            var coinAbbreviatedName = HDWalletPouch.getStaticCoinPouchImplementation(curCoinType).pouchParameters['coinAbbreviatedName'];

            $('.populateSpendable').html(spendableCoinScaled + ' ' +  coinAbbreviatedName);
        } else {
            $('.populateSpendable').text('0');
        }
    }
    $('.processSpendable').hide(); // Do not move this line of code

    if ($('.tab.send').hasClass('selected')) {
        if (wallet.getPouchFold(curCoinType).isTokenType() === true) {
            var gasRequiredList = wallet.getPouchFold(curCoinType).hasInsufficientGasForSpendable();

            //            console.log("gasRequiredList :: " + gasRequiredList);

            if (gasRequiredList.length > 0) {
                var coinAbbreviatedName = HDWalletPouch.getStaticCoinPouchImplementation(curCoinType).pouchParameters['coinAbbreviatedName'];

                $('.ethereumTokenInsufficientGasForSpendableWarningText').slideDown();

                //            gasRequiredList.push("0x051Da87c3679Be285DC22E2fbA5E833052375ced");
                //            gasRequiredList.push("0x051Da87c3679Be285DC22E2fbA5E833052375ced");
                //            gasRequiredList.push("0x051Da87c3679Be285DC22E2fbA5E833052375ced");
                var addressList = [];
                for (var i = 0; i < gasRequiredList.length; i++){
                    addressList.push(gasRequiredList[i].address);
                }
                $('.ethereumTokenInsufficientGasForSpendableWarningText').html("<p> Some of your accounts require more ETH to be able to transfer:<br><span class='cssRepWarningAddress'>" + addressList.join('</span><br>') + "</p>");
            } else {
                $('.ethereumTokenInsufficientGasForSpendableWarningText').slideUp();
            }
        }
    } else {
        $('.ethereumTokenInsufficientGasForSpendableWarningText').slideUp();
    }

}



function populateSpendMax(max) {
    if (curCoinType === COIN_BITCOIN) {

    } else if (curCoinType === COIN_ETHEREUM) {
        var floatMax = parseFloat(max);
        //        console.log("" +floatMax.toString().split('.')[1]);
        try {
            if (floatMax.toString().split('.')[1].length > 14) {
                max = parseFloat(floatMax.toString().split('.')[0] + "." + floatMax.toString().split('.')[1].substring(0, 14));
            }
        } catch(err) {

        }
    } else if (curCoinType === COIN_THEDAO_ETHEREUM) {
        var floatMax = parseFloat(max);
        //        console.log("" +floatMax.toString().split('.')[1]);
        try {
            if (floatMax.toString().split('.')[1].length > 14) {
                max = parseFloat(floatMax.toString().split('.')[0] + "." + floatMax.toString().split('.')[1].substring(0, 14));
            }
        } catch(err) {
        }
    } else if (curCoinType === COIN_DASH) {

    }

    $('#amountSendInput').val(max);
}

function switchToCoinType(targetCoinType, firstUnlock, callback) {
    $('.initializingLoading').hide();
    if (targetCoinType >= 0 && targetCoinType < COIN_NUMCOINTYPES) {
        g_JaxxApp.getUI().resetShapeShift();
        g_JaxxApp.getUI().resetTXHistory(curCoinType);
        g_JaxxApp.getUI().beginSwitchToCoinType(curCoinType, targetCoinType);
        g_JaxxApp.getUI().showHideFoxOnFrontEndOfWallet(targetCoinType);


        wallet.switchToCoinType(targetCoinType);

        if (curCoinType != targetCoinType) {

            for (var i = 0; i < COIN_NUMCOINTYPES; i++) {
                if (i !== targetCoinType) {
                    //                    $(coinHelpMenuNames[i]).hide();
                    //                    $(coinMenuHeaderNames[i]).hide();
                } else {
                    //                    $(coinHelpMenuNames[i]).show();
                    //                    $(coinMenuHeaderNames[i]).show();
                }
            }
            g_JaxxApp.getUI().switchToSolidCoinButton(targetCoinType);

            for (var i = 0; i < COIN_NUMCOINTYPES; i++) {
                if (i !== targetCoinType) {
                    g_JaxxApp.getUI().resetCoinButton(i);
                }
            }

            Navigation.showSpinner(targetCoinType, firstUnlock);

            canUpdateWalletUI = false;

            if (firstUnlock === true) {
                setTimeout(function() {
                    //Navigation.hideSpinner(targetCoinType);
                }, 1000);
            }

            var tCoinType = targetCoinType;

            Navigation.hideUI(curProfileMode, curProfileMode, function () {
                completeSwitchToCoin(targetCoinType, callback);
            }, firstUnlock, curCoinType);

            curCoinType = targetCoinType;
            wallet.getPouchFold(curCoinType).activateCoinPouchIfInactive();
            g_JaxxApp.getUI().updateTransactionListWithCurrentCoin();
        } else {
            callback();
        }
    } else {
        console.log("!! error :: coin type :: " + targetCoinType + " is invalid !!");
        callback();
    }
    // console.log("test pass 5");
    g_JaxxApp.getUI().setTransferPaperWalletHeader(curCoinType);
    // console.log("test pass 6");
}

function completeSwitchToCoin(targetCoinType, callback) {
    Navigation.setUseFiat(Navigation.isUseFiat());

    Navigation.setupCoinUI(targetCoinType);

    wallet.completeSwitchToCoinType(targetCoinType);

    g_JaxxApp.getUI().completeSwitchToCoinType(curCoinType, targetCoinType);

    canUpdateWalletUI = true;
    forceUpdateWalletUI();

    Navigation.hideSpinner(targetCoinType);

    //@note: eventually have all the ui stuff go through here.
    g_JaxxApp.getUI().setupShapeShiftCoinUI(targetCoinType);

    g_JaxxApp.getUI().populateCurrencyList(targetCoinType);

    wallet.getPouchFold(targetCoinType).getSpendableBalance(); // This populates the spendable balance cache.

    Navigation.showUI(curProfileMode, curProfileMode, function() {
        callback();
        showPageScanAddresses(targetCoinType);
    });
}


//function Rate(coinType) {
//    //    console.log("updateExchangeRate :: " + coinType);
//    if (coinType === curCoinType) {
//        //        console.log("updateExchangeRate");
//        updateWalletUI();
//    }
//}

function forceUpdateWalletUI(coinType) {
    forceTransactionRefresh = true;
    updateWalletUI(coinType);
}

function updateWalletUI(coinType) {
    //@note: for landscape/portrait rotation
    if (!wallet) {
        return;
    }
    if (!canUpdateWalletUI) {
        return;
    }
    if (coinType == null || typeof(coinType) === "undefined") {
        coinType = COIN_BITCOIN;
    }
    g_JaxxApp.getUI().updateAddressElementsInUI();
    g_JaxxApp.getUI().updateQRCodeInUI();
    g_JaxxApp.getUI().applyChangesInTheUIForTestnetUpdateWalletUI();
    g_JaxxApp.getUI().applyTriggersForAmountSendInputUpdateWalletUI();
    g_JaxxApp.getUI().updateFullDisplayBalanceInWallet(coinType);
    updateSpendable();
    g_JaxxApp.getUI().updateWalletUISetCurrency();
    g_JaxxApp.getUI().updateMainMenuConversionAmount();
    //$('.settings.setCurrency .cssList').scrollTop(selectedTop);
    g_JaxxApp.getUI().updateTransactionHistoryOnUIUpdate();
    g_JaxxApp.getUI().updateCoinToFiatExchangeRates(); // Here we update the exchange rates in the table.
}

function ethereumAddressInputCheck() {
    var addressInput = $('.tabContent .address input');
    var addressValue = addressInput.val();

    if (addressInput.data('address')) {
        addressValue = addressInput.data('address');
    }

    var isValidEthereumLikeAddress = false;

    var validAddressTypes = getAddressCoinTypes(addressValue);

    if (validAddressTypes[COIN_ETHEREUM] === true ||
        validAddressTypes[COIN_ETHEREUM_CLASSIC] === true ||
        validAddressTypes[COIN_TESTNET_ROOTSTOCK] === true) {
        isValidEthereumLikeAddress = true;
    }

    if (addressValue !== "" && isValidEthereumLikeAddress === true) {
        if (addressValue.match(/[A-Z]/)) {
            if (HDWalletHelper.isEthereumChecksumAddress(addressValue)) {
                //                console.log("is valid checksum address");
                $('.ethereumChecksumAddressWarningText').slideUp();
            } else {
                $('.ethereumChecksumAddressWarningText').slideDown();
                return false;
            }
        } else {
            $('.ethereumChecksumAddressWarningText').slideUp();
        }
        if (curCoinType === COIN_ETHEREUM || curCoinType === COIN_ETHEREUM_CLASSIC || curCoinType === COIN_TESTNET_ROOTSTOCK) {
            wallet.getPouchFold(curCoinType).getPouchFoldImplementation().checkIsSmartContractQuery(addressValue, function(err, res) {
                if (err) {
                    console.log("updateFromInputFieldEntry :: error :: " + err);
                } else {
                    //                    console.log("checkIsSmartContractQuery :: " + res + " :: ethereumAdvancedModeHidden :: " + Navigation.ethereumAdvancedModeHidden());
                    if (res === true) {
                        //@note: 100000 recommended from Fabien.
                        var customGasLimit = 1200000;
                        wallet.getHelper().setRecommendedEthereumCustomGasLimit(customGasLimit);

                        //                                                console.log("Navigation.ethereumAdvancedModeHidden() :: " + Navigation.ethereumAdvancedModeHidden());
                        if (Navigation.ethereumAdvancedModeHidden()) {
                            //                                                        console.log("existing customGasLimit :: " + wallet.getHelper().getCustomEthereumGasLimit());

                            Navigation.showEthereumAdvancedMode();

                            $('.advancedTabContentEthereum .customGasLimit input').val(customGasLimit);
                            wallet.getHelper().setCustomEthereumGasLimit(customGasLimit);
                        } else {

                            //@note: if the custom gas limit is the same as the default gas limit, up it.
                            if (wallet.getHelper().getCustomEthereumGasLimit().toNumber() === HDWalletHelper.getDefaultEthereumGasLimit().toNumber()) {
                                $('.advancedTabContentEthereum .customGasLimit input').val(customGasLimit);
                                wallet.getHelper().setCustomEthereumGasLimit(customGasLimit);
                            }
                        }

                        Navigation.setEthereumAdvancedModeCustomGasLimitSuggestion(customGasLimit, "Contract");

                        //                        console.log("is smart contract");
                    } else {
                        wallet.getHelper().setRecommendedEthereumCustomGasLimit(HDWalletHelper.getDefaultEthereumGasLimit());

                        $('.advancedTabContentEthereum .customGasLimit input').val(HDWalletHelper.getDefaultEthereumGasLimit());

                        if (Navigation.ethereumAdvancedModeHidden()) {
                            //                            $('.advancedTabContentEthereum .customGasLimit input').val(customGasLimit);
                            //                            wallet.getHelper().setCustomEthereumGasLimit(customGasLimit);
                        } else {
                            Navigation.hideEthereumAdvancedMode();
                        }

                        Navigation.setEthereumAdvancedModeCustomGasLimitSuggestion(HDWalletHelper.getDefaultEthereumGasLimit(), "Account");
                        wallet.getHelper().setCustomEthereumGasLimit(HDWalletHelper.getDefaultEthereumGasLimit());

                        //                        console.log("is regular address");
                    }

                    wallet.getPouchFold(COIN_ETHEREUM).clearSpendableBalanceCache();

                    updateSpendable();
                    updateFromInputFieldEntry();
                }
            });
        }
    } else {
        Navigation.setEthereumAdvancedModeCustomGasLimitSuggestion(0, null);
        $('.ethereumChecksumAddressWarningText').slideUp();
    }

    return true;
}

function updateFromInputFieldEntry(isSendingFullMaxSpendable) {

    //console.error('updateFromInputFieldEntry');

    //@note: to guard against reentrancy in cases where the ui is cleared and closed.
    if (Navigation.ignoreUpdateFromInputFieldEntry === true) {
        return;
    }

    var addressInput = $('.tabContent .address input');
    var addressValue = addressInput.val();

    var amountValueString = $('.tabContent .amount input').val();

   /*
   var isCryto = !Navigation.isUseFiat();



    if(Navigation.isUseFiat()){

    }else {
        var amountETH = +amountValueString;
    }



    if(!jaxx.Registry.application.isValidInput(amountETH, curCoinType)){

        if(jaxx.Registry.application.currentSendState !=='more than 1000')
            Navigation.flashBanner("Jaxx does not support sending more than 1000. Please send less than 1000 per transaction", 3, 'error');

        jaxx.Registry.application.currentSendState = 'more than 1000';
        jaxx.Registry.application.setSendButtonState('disabled');
        return;
    }

    jaxx.Registry.application.currentSendState='OK';
*/

    if (addressInput.data('address')) {
        addressValue = addressInput.data('address');
    }

    //@note: no idea why this doesn't source the right amount. 11 seems to be the right number.
    var fontSize = 11;//parseInt($('.cssAmount').css('font-size'));

    var textAreaMaxChars = Math.floor($('.tabContent .amount input').width() / fontSize);

    //    console.log("amountValueString :: " + amountValueString + " :: str length :: " + amountValueString.length);

    var precisionCropLength = textAreaMaxChars - 5;

    if (precisionCropLength > 20) {
        precisionCropLength = 20;
    }

    if (amountValueString.length > precisionCropLength) {
        //        console.log("truncating entry");
        amountValueString = amountValueString.substr(0, precisionCropLength);
        $('.tabContent .amount input').val(amountValueString);
    }

    var amountLength = amountValueString.length;

    var amountValue = amountValueString;

    var validDecimal = isDecimal(amountValue);

    var coinAmountLargeAndScaled = amountValue;


    // Update the converted amount details
    var converted = '';
    var amountCrypto = 0;
    if (validDecimal) {
        //        console.log("< valid decimal amount :: " + amountValue + " >");
        if (Navigation.isUseFiat()) {
            var fiatUnit = wallet.getHelper().getFiatUnit();
            coinAmountLargeAndScaled = wallet.getPouchFold(curCoinType).convertFiatToCoin(amountValue, COIN_UNITLARGE, fiatUnit);

            var coinSymbol = HDWalletPouch.getStaticCoinPouchImplementation(curCoinType).uiComponents['coinSymbol'];

            amountCrypto = coinAmountLargeAndScaled;

            converted = "(" + coinSymbol + coinAmountLargeAndScaled + ")";
        } else {
            // If coin is being used instead of fiat.
            var fiatAmount = wallet.getHelper().convertCoinToFiatWithFiatType(curCoinType, amountValue, COIN_UNITLARGE, null, null);

            converted = "(" + fiatAmount + ")";

            amountCrypto = amountValue;
        }
    }


    //////////////////////////////////////////////////////////////////////////////////////////


    if(!jaxx.Registry.application.isValidInput(amountCrypto, curCoinType)){

        if(jaxx.Registry.application.currentSendState !=='more than 1000')
            Navigation.flashBanner("Jaxx does not support sending more than 1000. Please send less than 1000 per transaction", 3, 'error');

        jaxx.Registry.application.currentSendState = 'more than 1000';
        jaxx.Registry.application.setSendButtonState('disabled');
        return;
    }

    jaxx.Registry.application.currentSendState='OK';

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



    var lengthOfConvertedText = converted.length;

    var lengthAvailableForConvertedText = (lengthOfConvertedText > textAreaMaxChars - amountLength) ? textAreaMaxChars - amountLength : lengthOfConvertedText;

//    console.log("textAreaMaxChars :: " + textAreaMaxChars + " :: amountLength :: " + amountLength + " :: lengthOfConvertedText :: " + lengthOfConvertedText + " :: lengthAvailableForConvertedText :: " + lengthAvailableForConvertedText);
    if (amountLength > 11) { // New business logic
        converted = "";
    } else if (lengthAvailableForConvertedText + 4 < lengthOfConvertedText) {
        converted = converted.substr(0, lengthAvailableForConvertedText) + "...)";
    }

    $('.tabContent .amountDetails').text(converted);

    // Check the amount is valid
    var data = null;

    if (validDecimal) {
        var validAddressTypes = [];
        for (var i = 0; i < COIN_NUMCOINTYPES; i++) {
            validAddressTypes[i] = false;
        }

        if (addressValue !== "") {
            validAddressTypes = getAddressCoinTypes(addressValue);
        }

        if (g_JaxxApp.getShapeShiftHelper().getIsTriggered()) {
            validAddressTypes[curCoinType] = true;
        }

        var tab = Navigation.getTab();

        var coinAmountSmallType = 0;

        if (isSendingFullMaxSpendable) {
            coinAmountSmallType = wallet.getPouchFold(curCoinType).getSpendableBalance();
        } else {
            if (Navigation.isUseFiat()) {
                //            console.log("fiat");
                var fiatUnit = wallet.getHelper().getFiatUnit();
                coinAmountSmallType = wallet.getPouchFold(curCoinType).convertFiatToCoin(amountValue, COIN_UNITSMALL, fiatUnit);
            } else {
                //            console.log("not fiat");
                coinAmountSmallType = HDWalletHelper.convertCoinToUnitType(curCoinType, amountValue, COIN_UNITSMALL);
            }
        }

        var minimumToSpend = 0;
        var numShiftsRequired = 1;

        if (g_JaxxApp.getShapeShiftHelper().getIsTriggered()) {
            //get latest market object
            var curMarketData = g_JaxxApp.getShapeShiftHelper().getMarketForCoinTypeSend(curCoinType);

            minimumToSpend = curMarketData.depositMin;

            if (minimumToSpend) {

                //            console.log("minimumToSpend (large units) :: " + minimumToSpend);

                minimumToSpend = parseInt(HDWalletHelper.convertCoinToUnitType(curCoinType, minimumToSpend, COIN_UNITSMALL));

                var numShiftsRequired = wallet.getPouchFold(curCoinType).getShiftsNecessary(minimumToSpend);

                if (g_JaxxApp.getShapeShiftHelper().isMultiShiftValid(curCoinType, numShiftsRequired)) {
//                    console.log("updateFromInputFieldEntry :: multiShift is valid");

                    var shiftResults = g_JaxxApp.getShapeShiftHelper().getMultiShiftResults(curCoinType, numShiftsRequired);

                    if (shiftResults !== null) {

                    } else {
                        return;
                    }
                } else {

                    console.log("updateFromInputFieldEntry :: multiShift is invalid.. requesting");

                    g_JaxxApp.getUI().triggerShapeShift(curCoinType, numShiftsRequired);

                    $('.tabContent .amount .button').removeClass('cssEnabled').removeClass('enabled');

                    return;
                }
//                g_JaxxApp.getShapeShiftHelper().setupMultiShift(curCoinType, numShiftsRequired);
            } else {
                console.log("minimumToSpend unavailable :: curMarketData :: " + JSON.stringify(curMarketData, null, 4));

                $('.tabContent .amount .button').removeClass('cssEnabled').removeClass('enabled');

                return;
            }
        }


        var withinLimits = true;

        // Stops 'Send' button from lighting up when value entered isn't valid.
        if (coinAmountSmallType <= 0 || coinAmountSmallType < minimumToSpend || coinAmountSmallType > wallet.getPouchFold(curCoinType).getSpendableBalance(minimumToSpend)) {
            withinLimits = false;
        }

        if (curCoinType === COIN_BITCOIN) {
            //            console.log("bitcoin :: trying to spend :: " + coinAmountSmallType + " :: total spendable balance :: " + wallet.getPouchFold(curCoinType).getSpendableBalance());
        } else if (curCoinType === COIN_ETHEREUM) {
            //            console.log("ethereum :: trying to spend :: " + coinAmountSmallType + " :: total spendable balance :: " + wallet.getPouchFold(curCoinType).getSpendableBalance(minimumToSpend));

            //@note: for a zero wei transfer, this is valid for a contract address w/ data.

            if (wallet.getPouchFold(curCoinType).getPouchFoldImplementation().hasCachedAddressAsContract(HDWalletHelper.parseEthereumAddress(addressValue))) {
                if (coinAmountSmallType >= 0) {
                    if (coinAmountSmallType > wallet.getPouchFold(curCoinType).getSpendableBalance(minimumToSpend)) {
                        withinLimits = false;
                    } else {
                        withinLimits = true;
                    }
                }
            }
        } else if (curCoinType === COIN_ETHEREUM_CLASSIC) {
            //            console.log("ethereum :: trying to spend :: " + coinAmountSmallType + " :: total spendable balance :: " + wallet.getPouchFold(curCoinType).getSpendableBalance(minimumToSpend));

            //@note: for a zero wei transfer, this is valid for a contract address w/ data.

            if (wallet.getPouchFold(curCoinType).getPouchFoldImplementation().hasCachedAddressAsContract(HDWalletHelper.parseEthereumAddress(addressValue))) {
                if (coinAmountSmallType >= 0) {
                    if (coinAmountSmallType > wallet.getPouchFold(curCoinType).getSpendableBalance(minimumToSpend)) {
                        withinLimits = false;
                    } else {
                        withinLimits = true;
                    }
                }
            }
        } else if (curCoinType === COIN_TESTNET_ROOTSTOCK) {
            //            console.log("roostock :: trying to spend :: " + coinAmountSmallType + " :: total spendable balance :: " + wallet.getPouchFold(curCoinType).getSpendableBalance(minimumToSpend));

            //@note: for a zero wei transfer, this is valid for a contract address w/ data.

            if (wallet.getPouchFold(curCoinType).getPouchFoldImplementation().hasCachedAddressAsContract(HDWalletHelper.parseEthereumAddress(addressValue))) {
                if (coinAmountSmallType >= 0) {
                    if (coinAmountSmallType > wallet.getPouchFold(curCoinType).getSpendableBalance(minimumToSpend)) {
                        withinLimits = false;
                    } else {
                        withinLimits = true;
                    }
                }
            }
        } else if (curCoinType === COIN_THEDAO_ETHEREUM) {
            //            console.log("TheDAO Ethereum :: trying to spend :: " + coinAmountSmallType + " :: total spendable balance :: " + wallet.getPouchFold(curCoinType).getSpendableBalance(minimumToSpend));
        } else if (curCoinType === COIN_DASH) {
            console.log("dash :: trying to spend :: " + coinAmountSmallType + " :: total spendable balance :: " + wallet.getPouchFold(curCoinType).getSpendableBalance());
        }

        var hasValidAddress = false;

        if (validAddressTypes[curCoinType] === true) {
            hasValidAddress = true;
        } else {
            if (wallet.getPouchFold(curCoinType).isTokenType()) {
                var coinHolderType = CoinToken.getMainTypeToTokenCoinHolderTypeMap(curCoinType);

                if (validAddressTypes[coinHolderType] === true) {
                    hasValidAddress = true;
                }
            }
        }
        //        console.log("curCoinType :: " + coinAbbreviatedName[curCoinType] + " :: fiat :: " + Navigation.isUseFiat() + " :: amountValue :: " + amountValue + " :: coinAmountSmallType :: " + coinAmountSmallType + " :: withinLimits :: " + withinLimits + " :: hasValidAddress :: " + hasValidAddress);

        //@note: for sending, make sure the address matches a coin type, and there's some value set on the html input field.
        if (tab === 'send' && hasValidAddress === true && withinLimits === true) {

            //Detect if shapeshift, make additional checks and change addressValue
            var depositAddresses = [];

            if (g_JaxxApp.getShapeShiftHelper().getIsTriggered()) {
                //get latest market object

                var curMarketData = g_JaxxApp.getShapeShiftHelper().getMarketForCoinTypeSend(curCoinType);
                var depositAddress = wallet.getPouchFold(curCoinType).setShapeShiftDepositAddress(curMarketData.depositAddress);
                if(!curMarketData.depositAddress) {
                    g_JaxxApp.getUI().triggerShapeShift(curCoinType, numShiftsRequired);
                }

               // console.log(" shapeSift txs: " + numShiftsRequired , curMarketData);

                var foundIssue = false;

                for (var i = 0; i < numShiftsRequired; i++) {
                    if (curMarketData.multiShift !== null && typeof(curMarketData.multiShift[i]) !== 'undefined' && curMarketData.multiShift[i] !== null && curMarketData.multiShift[i].depositAddress !== null) {
                        console.log("shapeShift " + i + " :: with deposit :: " + curMarketData.multiShift[i].depositAddress);
                        depositAddresses[i] = curMarketData.multiShift[i].depositAddress;

                    } else {
                        console.log("shapeShift :: issue with deposit :: " + i + " :: curMarketData :: " + JSON.stringify(curMarketData, null, 4));
                        foundIssue = true;
                    }
                }


                //@note: @here: @next:

                //check if updated
                if (foundIssue === false) {

                    if (numShiftsRequired === 1) {

                        addressValue = curMarketData.multiShift[0].depositAddress;
                        //Check if within shapeshift limits

                        //@note:@todo:@here: this withinSSLimits variable isn't actually used anywhere.

                        if (!Navigation.isUseFiat() && curCoinType === COIN_THEDAO_ETHEREUM) {
                            coinAmountLargeAndScaled *= 100;
                        }


                        console.log("shifting to :: " + addressValue + " :: coinAmountLargeAndScaled :: " + coinAmountLargeAndScaled + " :: depositMin :: " + curMarketData.depositMin + " :: depositMax :: " + curMarketData.depositMax);

                        var withinSSLimits = true;
                        if (coinAmountLargeAndScaled > curMarketData.depositMax || coinAmountLargeAndScaled < curMarketData.depositMin) {
                            withinSSLimits = false;
                            console.log("Shapeshift : amount out of shapeshift limit boundary!");

                            $('.tabContent .amount input').addClass('validShapeshiftAmount').addClass('cssValidShapeshiftAmount'); //Change color
                            $('.tabContent .amount .button').removeClass('cssEnabled').removeClass('enabled');    //disable shift button
                            $('.tabContent .amount .button').removeClass('cssEnabled').removeClass('enabled');

                            return;
                        } else {
                            console.log("within limits :: " + addressValue);
                            $('.tabContent .amount input').removeClass('validShapeshiftAmount').removeClass('cssValidShapeshiftAmount ');
                        }
                    } else {
                        console.log("multiShifting to :: " + JSON.stringify(depositAddresses));
                    }
                } else {
                    $('.tabContent .amount .button').removeClass('cssEnabled').removeClass('enabled');

                    console.log("Invalid ss market object. not ready");
                    return;
                }
            }

            //@note: @here: @todo: @tokens: this should be refactored eventually.
            // @TODO: Send this code to the pouches // Refactor step
            // function must return 'data'
            // REFACTOR STEPS:
            // Remove steps from the following branching to some pouch based functions
            // Create a function that computes 'data'
            if (curCoinType === COIN_BITCOIN) {
//                wallet.getPouchFold(curCoinType).getPouchFoldImplementation().readyTransaction(addressValue, coinAmountSmallType);

                // Change the text here indicating the speed we expect for the transaction.


                //@note: @here: @next:
                var transactionDict = wallet.getPouchFold(curCoinType).getPouchFoldImplementation().createTransaction(addressValue, coinAmountSmallType);

               // console.log(transactionDict);

                $('.computedFeeText').html(transactionDict.miningFee);
                if (transactionDict) {
                    data = {
                        address: addressValue,
                        coinAmount_unitLarge: amountValue,
                        transaction: transactionDict.transaction,
                    };
                } else {
                    console.log("COIN_BITCOIN :: no transaction dictionary created");
                }
            } else if (curCoinType === COIN_ETHEREUM) {

                //                console.log("check ether");

             //// console.error('   transaction satrt here    ');
                var ethereumAddress = HDWalletHelper.parseEthereumAddress(addressValue);
                var computedFee = "";
                var ethereumTXData = $('.advancedTabContentEthereum .customData input').val();
                if (ethereumTXData === "") {
                    ethereumTXData = null;
                }

                var gasPrice = HDWalletHelper.getDefaultEthereumGasPrice().toNumber();
                var gasLimit = wallet.getHelper().getCustomEthereumGasLimit().toNumber();

                //@note: @here: due to the ethereum tx structure, we may need multiple individual
                //transactions.

                //@note: if not shapeshift, use basic address.

                if (depositAddresses.length === 0) {
                    depositAddresses = [ethereumAddress];
                }



               // console.log('depositAddresses, coinAmountSmallType, gasPrice, gasLimit, ethereumTXData   ' + depositAddresses, coinAmountSmallType, gasPrice, gasLimit, ethereumTXData);

                //just build a random int for this id.
                var batchId = Math.random() * 123413378080;

                var readyDict = wallet.getPouchFold(curCoinType).getPouchFoldImplementation()
                    .readyEthereumTransactionList(depositAddresses, coinAmountSmallType, gasPrice, gasLimit, ethereumTXData, null, batchId);

                if (readyDict) {
                    var computedFee = HDWalletHelper.convertWeiToEther(readyDict.totalTXCost);

                    $('.computedFeeText').html(computedFee);

                    var cryptoController = g_JaxxApp.getDataStoreController().getCryptoControllerByCoinType(COIN_ETHEREUM);

                    var readyAddresses = [];

                    for (var i = 0; i < readyDict.readyTxArray.length; i++) {
                        var curAddress = cryptoController.getAddressReceive(readyDict.readyTxArray[i].index);
                        readyAddresses.push(curAddress);
                    }


                    cryptoController.prepareAddresses(readyAddresses).done(function(res) {
                      //  console.log("[ ethereum :: prepareAddresses ] :: done :: ", res);

                        wallet.getPouchFold(curCoinType).getPouchFoldImplementation()
                            .setReadyTransactionListIsPrepared(batchId);
                    });

                    //                var ctr = jaxx.Registry.crypto_controllers['Ethereum'];

                    data = {
                        timestamp:Date.now(),
                        address: ethereumAddress,
                        coinAmount_unitLarge: amountValue,
                        gasPrice: gasPrice,
                        gasLimit: gasLimit,
                        readyTxArray: readyDict.readyTxArray
                    }
                }
            } else if (curCoinType === COIN_ETHEREUM_CLASSIC) {
                console.log("check ethereum classic");

                var ethereumAddress = HDWalletHelper.parseEthereumAddress(addressValue);

                var computedFee = "";

                var ethereumTXData = $('.advancedTabContentEthereum .customData input').val();
                if (ethereumTXData === "") {
                    ethereumTXData = null;
                }

                var gasPrice = HDWalletHelper.getDefaultEthereumGasPrice().toNumber();
                var gasLimit = wallet.getHelper().getCustomEthereumGasLimit().toNumber();

                //@note: @here: due to the ethereum tx structure, we may need multiple individual
                //transactions.

                //@note: if not shapeshift, use basic address.

                if (depositAddresses.length === 0) {
                    depositAddresses = [ethereumAddress];
                }



                var transactionDict = wallet.getPouchFold(curCoinType).getPouchFoldImplementation().buildEthereumTransactionList(depositAddresses, coinAmountSmallType, gasPrice, gasLimit, ethereumTXData, null);

                if (transactionDict) {
                    var computedFee = HDWalletHelper.convertWeiToEther(transactionDict.totalTXCost);
                    $('.computedFeeText').html(computedFee);

                    wallet.getPouchFold(curCoinType).getPouchFoldImplementation().checkIsSmartContractQuery(ethereumAddress, function(err, res) {
                        if (!err) {
                            if (res === true) {
                                console.log("advanced data :: " + ethereumTXData + " :: ethereumCustomGasLimit :: " + gasLimit);
                            }
                        }
                    });

                    data = {
                        address: ethereumAddress,
                        coinAmount_unitLarge: amountValue,
                        gasPrice: gasPrice,
                        gasLimit: gasLimit,
                        txArray: transactionDict.txArray,
                    };
                } else {
                    //                    console.log("no transaction dictionary created");
                }
            } else if (curCoinType === COIN_DASH) {
                var transactionDict = wallet.getPouchFold(curCoinType).getPouchFoldImplementation().createTransaction(addressValue, coinAmountSmallType);

                $('.computedFeeText').html(transactionDict.miningFee);
                if (transactionDict) {
                    data = {
                        address: addressValue,
                        coinAmount_unitLarge: amountValue,
                        transaction: transactionDict.transaction,
                    };
                } else {
                    console.log("COIN_DASH :: no transaction dictionary created");
                }
            } else if (curCoinType === COIN_THEDAO_ETHEREUM ||
                       curCoinType === COIN_AUGUR_ETHEREUM ||
                       curCoinType === COIN_GOLEM_ETHEREUM ||
                       curCoinType === COIN_GNOSIS_ETHEREUM ||
                       curCoinType === COIN_ICONOMI_ETHEREUM ||
                       curCoinType === COIN_SINGULARDTV_ETHEREUM ||
                       curCoinType === COIN_DIGIX_ETHEREUM ||
                       curCoinType === COIN_BLOCKCHAINCAPITAL_ETHEREUM ||
                       curCoinType === COIN_CIVIC_ETHEREUM) {
                //@note: @todo: @here: combine these into a more generic erc20 token type.
                var transactionDict = wallet.getPouchFold(curCoinType).getPouchFoldImplementation().createTransaction(addressValue, depositAddresses, coinAmountSmallType);

                if (transactionDict) {
                    $('.computedFeeText').html(transactionDict.miningFee);

                    data = {
                        address: transactionDict.ethereumAddress,
                        coinAmount_unitLarge: amountValue,
                        gasPrice: transactionDict.gasPrice.toNumber(),
                        gasLimit: transactionDict.gasLimit.toNumber(),
                        txArray: transactionDict.txArray,
                    };
                } else {
                    console.log("[ token: " + curCoinType + " ] :: no transaction dictionary created");
                }
            } else if (curCoinType === COIN_LITECOIN) {
                var transactionDict = wallet.getPouchFold(curCoinType).getPouchFoldImplementation().createTransaction(addressValue, coinAmountSmallType);

                $('.computedFeeText').html(transactionDict.miningFee);
                if (transactionDict) {
                    data = {
                        address: addressValue,
                        coinAmount_unitLarge: amountValue,
                        transaction: transactionDict.transaction,
                    };
                } else {
                    console.log("COIN_LITECOIN :: no transaction dictionary created");
                }
            } else if (curCoinType === COIN_LISK) {
                //@note: @todo: @lisk:
//                var transactionDict = wallet.getPouchFold(curCoinType).getPouchFoldImplementation().createTransaction(addressValue, coinAmountSmallType);
//
//                $('.computedFeeText').html(transactionDict.miningFee);
//                if (transactionDict) {
//                    data = {
//                        address: addressValue,
//                        coinAmount_unitLarge: amountValue,
//                        transaction: transactionDict.transaction,
//                    };
//                } else {
//                    console.log("COIN_LISK :: no transaction dictionary created");
//                }
            } else if (curCoinType === COIN_ZCASH) {
                var transactionDict = wallet.getPouchFold(curCoinType).getPouchFoldImplementation().createTransaction(addressValue, coinAmountSmallType);

                $('.computedFeeText').html(transactionDict.miningFee);
                if (transactionDict) {
                    data = {
                        address: addressValue,
                        coinAmount_unitLarge: amountValue,
                        transaction: transactionDict.transaction,
                    };
                } else {
                    console.log("COIN_ZCASH :: no transaction dictionary created");
                }
            } else if (curCoinType === COIN_TESTNET_ROOTSTOCK) {
                console.log("check rootstock testnet");

                var ethereumAddress = HDWalletHelper.parseEthereumAddress(addressValue);

                var computedFee = "";

                var ethereumTXData = $('.advancedTabContentEthereum .customData input').val();
                if (ethereumTXData === "") {
                    ethereumTXData = null;
                }

                var gasPrice = HDWalletHelper.getDefaultEthereumGasPrice().toNumber();
                var gasLimit = wallet.getHelper().getCustomEthereumGasLimit().toNumber();

                //@note: @here: due to the ethereum tx structure, we may need multiple individual
                //transactions.

                //@note: if not shapeshift, use basic address.

                if (depositAddresses.length === 0) {
                    depositAddresses = [ethereumAddress];
                }

                var transactionDict = wallet.getPouchFold(curCoinType).getPouchFoldImplementation().buildEthereumTransactionList(depositAddresses, coinAmountSmallType, gasPrice, gasLimit, ethereumTXData, null);

                if (transactionDict) {
                    var computedFee = HDWalletHelper.convertWeiToEther(transactionDict.totalTXCost);
                    $('.computedFeeText').html(computedFee);

                    wallet.getPouchFold(curCoinType).getPouchFoldImplementation().checkIsSmartContractQuery(ethereumAddress, function(err, res) {
                        if (!err) {
                            if (res === true) {
                                console.log("advanced data :: " + ethereumTXData + " :: ethereumCustomGasLimit :: " + gasLimit);
                            }
                        }
                    });

                    data = {
                        address: ethereumAddress,
                        coinAmount_unitLarge: amountValue,
                        gasPrice: gasPrice,
                        gasLimit: gasLimit,
                        txArray: transactionDict.txArray,
                    };
                } else {
                    //                    console.log("no transaction dictionary created");
                }
            } else if (curCoinType === COIN_DOGE) {
                var transactionDict = wallet.getPouchFold(curCoinType).getPouchFoldImplementation().createTransaction(addressValue, coinAmountSmallType);

                $('.computedFeeText').html(transactionDict.miningFee);
                if (transactionDict) {
                    data = {
                        address: addressValue,
                        coinAmount_unitLarge: amountValue,
                        transaction: transactionDict.transaction,
                    };
                } else {
                    console.log("COIN_DOGE :: no transaction dictionary created");
                }
            }

            var coinAbbreviatedName = HDWalletPouch.getStaticCoinPouchImplementation(curCoinType).pouchParameters['coinAbbreviatedName'];

            var miningAbbreviatedName = coinAbbreviatedName;

            if (wallet.getPouchFold(curCoinType).isTokenType() === true) {
                miningAbbreviatedName = HDWalletPouch.getStaticCoinPouchImplementation(CoinToken.getMainTypeToTokenCoinHolderTypeMap(curCoinType)).pouchParameters['coinAbbreviatedName'];
            }

            $('.modal.send .amountAbbreviatedName').text(miningAbbreviatedName);
        } else if (tab === 'receive') {
            data = {
                coinAmount_unitLarge: amountValue,
            }
        }
    } else if (tab === 'receive' && amountValeplace(' ', '') === '') {
        data = {
            coinAmount_unitLarge: amountValue,
        }
    } else {
        //        console.log("curCoinType :: " + coinAbbreviatedName[curCoinType] + " :: not valid :: " + amountValue);
    }

    // Update the state of the button
    if (data) {
        $('.tabContent .amount .button').addClass('cssEnabled').addClass('enabled');
    } else {
        $('.tabContent .amount .button').removeClass('cssEnabled').removeClass('enabled');
    }



   // console.log(data);
    if (wallet && wallet.getPouchFold(curCoinType) && wallet.getPouchFold(curCoinType).setTransactionDataTemp){
        wallet.getPouchFold(curCoinType).setTransactionDataTemp(data);
    } else {
        console.log("The setTransactionDataTemp function is not defined for the target token.");
    }

    jaxx.Registry.currentTransactionTemp = data;
    jaxx.Registry.currentCoinType = curCoinType;
  //  jaxx.Registry.sendTransaction$.triggerHandler('TRANS_SEND_BEFORE',[curCoinType,data]);
   // jaxx.Registry.sendTransaction$.triggerHandler('TRANS_SEND_BEFORE_' + curCoinType,data);
    if ($("#amountSendInput").val() !== wallet.getPouchFold(curCoinType).getMaxSpendableCachedAmount()) { // When there is a change
        wallet.getPouchFold(curCoinType).setIsSendingFullMaxSpendable(false); // Added to accomodate Anthony's business logic request: Spendable balance must empty wallet
    }

    //$('.modal.send').data('transaction', data);


}

function checkForAllAddresses(docBody) {
    var allResults = [];

    for (var i = 0; i < COIN_NUMCOINTYPES; i++) {
        allResults[i] = checkForAddresses(docBody, i);
    }

    return allResults;
}

function checkForAddresses(docBody, targetCoinType) {
    //    console.log(docBody);
    //var addresses = str.match(/[\s>&"\:\;][13][1-9A-HJ-NP-Za-km-z]{26,33}[\s<&"\?\.]/g);
    //var uris = str.match(/bitcoin:[13][1-9A-HJ-NP-Za-km-z]{26,33}\?&?amount=[0-9\.]+/g);

    var results = {};

    if (targetCoinType == COIN_BITCOIN) {
        var bitcoinAddresses = docBody.match(/(^|[^A-Za-z0-9])[13mn][1-9A-HJ-NP-Za-km-z]{26,33}($|[^A-Z-z0-9])/g);
        if (!bitcoinAddresses) { bitcoinAddresses = []; }
        for (var i = 0; i < bitcoinAddresses.length; i++) {
            var bitcoinAddress = bitcoinAddresses[i].match(/[13mn][1-9A-HJ-NP-Za-km-z]{26,33}/);
            if (bitcoinAddress) {
                results[bitcoinAddress] = 0;
            }
        }

        //@note: @details: https://regex101.com/
        var uris = docBody.match(/bitcoin:(\/\/)?[13mn][1-9A-HJ-NP-Za-km-z]{26,33}(\?[A-Za-z0-9._&=-]*&amount=|\?amount=)[0-9\.]+/g);

        if (!uris) { uris = []; }
        for (var i = 0; i < uris.length; i++) {
            var uri = uris[i];

            var comps = uri.split('?');

            var address = comps[0].match(/[13mn][1-9A-HJ-NP-Za-km-z]{26,33}/);

            var amount = null;
            var amountError = false;

            var pairs = comps[1].split('&');
            for (var pairIndex = 0; pairIndex < pairs.length; pairIndex++) {
                var pair = pairs[pairIndex];
                if (amount !== null) {
                    amountError = true;
                } else if (pair.substring(0, 7) === 'amount=') {
                    amount = pair.substring(7);
                }
            }

            if (amountError) { amount = null; }

            results[address] = (amount !== null) ? amount: "";
        }
    } else if (targetCoinType == COIN_ETHEREUM) {
        var ethereumAddresses = docBody.match(/(0x[0-9a-fA-F]{40})/g);
        console.log("check :: " + ethereumAddresses);

        if (!ethereumAddresses) { ethereumAddresses = []; }
        for (var i = 0; i < ethereumAddresses.length; i++) {
            var isValidEthereumLikeAddress = false;

            var validAddressTypes = getAddressCoinTypes(ethereumAddresses[i]);

            if (validAddressTypes[COIN_ETHEREUM] === true ||
                validAddressTypes[COIN_ETHEREUM_CLASSIC] === true ||
                validAddressTypes[COIN_TESTNET_ROOTSTOCK] === true) {
                isValidEthereumLikeAddress = true;
            }


            console.log("found :: " + ethereumAddresses[i] + " :: " + JSON.stringify(validAddressTypes));

            var ethereumAddress = ethereumAddresses[i];

            if (isValidEthereumLikeAddress) {
                //            console.log("found ethereum address :: " + ethereumAddresses[i] + " :: " + getAddressCoinType(ethereumAddresses[i]))
                results[ethereumAddress] = 0;
            }
        }
        //@note: @todo: ethereum uri support.
    }

    for (resultAddress in results) {
        //        console.log("found :: resultAddress :: " + resultAddress + " :: " + getAddressCoinType(resultAddress) + " :: targetCoinType :: " + targetCoinType);
        var validAddressTypes = getAddressCoinTypes(resultAddress);

        if (validAddressTypes[targetCoinType] !== true) {
            delete results[resultAddress];
        }
    }

    return results;
}

function populateScanAddresses(coinScanAddresses) {
    $('.populatePageAddresses').empty();

    var template = $('.pageAddressTemplate > .pageAddress');

    var foundValidAddresses = 0;
    var foundAddressCoinType = -1;

    for (var address in coinScanAddresses) {
        console.log("found address :: " + address);

        var link = template.clone(true);
        var amount = coinScanAddresses[address];

        $('.address', link).text(address);
        $('.amount', link).text(amount);

        link.click((function(address, amount) {
            return function() {
                Navigation.showTab('send');
                if (amount) {
                    $('.tabContent .amount input').val(amount)
                }
                $('.tabContent .address input').val(address).trigger('keyup');
            };
        })(address, amount));

        console.log("populating to :: " + $('.populatePageAddresses') + " :: " + link);
        $('.populatePageAddresses').append(link);
    }

    if (Object.keys(coinScanAddresses).length < 3) {
        $('.pageAddressScrollContainer').css('overflow-y', 'hidden');
        $('.pageAddressScrollContainer').css('display', 'hidden');
    } else {
        $('.pageAddressScrollContainer').css('overflow-y', 'scroll');
    }

    $('.pageAddresses').data('addresses', Object.keys(coinScanAddresses).length);
}

function showPageScanAddresses(targetCoinType) {
    populateScanAddresses(pageScanAddresses[targetCoinType]);

    //    console.log("pageScanAddresses[targetCoinType].length :: " + Object.keys(pageScanAddresses[targetCoinType]).length);
    if (Object.keys(pageScanAddresses[targetCoinType]).length > 0) {
        $('.pageAddressesHeader').show();
        $('.pageAddresses').show();

        Navigation.showTab('send');
    }
}

function countdownButtonUpdate(element, prefixText, timeRemaining, onUpdateCallback, onFinishCallback) {
    if (onUpdateCallback) {
        onUpdateCallback(timeRemaining - 1);
    }
    var strTimerName = $(element).selector;
    clearTimeout(g_JaxxApp.getUI().UITimer(strTimerName));
    // @NOTE: clear timeout here
    var objTimer = setTimeout(function() {
        if (timeRemaining > 1) {
            countdownButtonUpdate(element, prefixText, timeRemaining - 1, onUpdateCallback, onFinishCallback);
        } else {
            onFinishCallback();
        }
    }, 1000);
    g_JaxxApp.getUI().UITimer(strTimerName, objTimer);
}

//this is only called when wallet is restored or created
function _loadWallet(loadedWallet) {
    console.log("loadedWallet :: " + loadedWallet + " :: loadedWallet.getPouchFold(COIN_BITCOIN) :: " + loadedWallet.getPouchFold(COIN_BITCOIN));

    var mnemonic = getStoredData('mnemonic', true);
    jaxx.Utils2.setMnemonic(mnemonic);

    if (wallet) {
        if ($(window).unload) {
            $(window).trigger('unload');
        }
    } else {
        if (window.native && window.native.preloadEthereum) {
            //            native.preloadEthereum();
        }
    }

    if (g_JaxxApp.getSettings().getListOfEnabledCryptoCurrencies().length > 0) {
        curCoinType = HDWalletHelper.dictCryptoCurrency[g_JaxxApp.getSettings().getListOfEnabledCryptoCurrencies()[0]].index;
    } else {
        console.log("_loadWallet :: Warning :: The App started without loading any coin types being selected.");
        curCoinType = COIN_BITCOIN;
    }

    g_JaxxApp.getUI().completeSwitchToCoinType(curCoinType, curCoinType);

    g_JaxxApp.getUI().resetTransactionList(curCoinType);

    //for (var i = 0; i < COIN_NUMCOINTYPES; i++) {
        //g_JaxxApp.getUI().setupTransactionList(curCoinType, 10);
    //}

    wallet = loadedWallet;
    g_JaxxApp.getUI().initializeBTCMiningOptions()

    //g_JaxxApp.setupWithWallet(wallet);
    wallet.getPouchFold(curCoinType).activateCoinPouchIfInactive();
    wallet.switchToCoinType(curCoinType);

    Navigation.setUseFiat(false);

    $('.settings').hide();
    $('.modal').hide();
    $('.wallet').show();

    forceUpdateWalletUI();

    for (var i = 0; i < COIN_NUMCOINTYPES; i++) {
        wallet.getPouchFold(i).addListener(updateWalletUI);
        wallet.getHelper().addExchangeRateListener(i, function(coinType) {
            if (curCoinType === coinType){
                updateWalletUI();
            }
        });
    }

    //@note: @next: @here: @todo:
//    $(window).unload(function() {
//        wallet.shutDown(updateWalletUI);
//    });

    if (openUrl) {
        checkOpenUrl(openUrl);
        openUrl = null;
    }

    resize();

    // Jaxx bulletin should trigger after tips notification footer is closed on express mode. See hideNotificationFooter function
    if(g_JaxxApp.getUI()._jaxxUIIntro._setOptionSelected !== "Express") {
        g_JaxxApp.getUI().getJaxxNews(function() {
            g_JaxxApp.getUI().displayJaxxNewsIfCritical();
        });
    }

    if (window.chrome && window.chrome.windows) {
        chrome.windows.getCurrent(function (currentWindow) {
            chrome.tabs.query({active: true, windowId: currentWindow.id}, function (activeTabs) {
                chrome.tabs.executeScript({allFrames: true, file: './js/extension_getdocbody.js'});
            });
        });

        //        console.log("setting up page scanner");

        chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
            //            console.log("received message :: " + JSON.stringify(message) + " :: " + JSON.stringify(sender) + " :: " + sendResponse);

            if (message['action'] === "getDocBody") {
                //                console.log("jaxx page scanner :: got document body");
                var pageResults = checkForAllAddresses(message.results);

                //                console.log("jaxx page scanner :: results :: " + JSON.stringify(pageResults));
                pageScanAddresses = pageResults;

                //@note: for UI class
                showPageScanAddresses(curCoinType);
            }
        });
    }

	// getStoredData('mnemonic', false);
	// Restore the currencies into the program:

    g_JaxxApp.getUI().generateProgrammaticElementsInUI();

	// ----- Currency business logic here -------
  //var default_currency = getStoredData('fiat', false); // This needs to be set because toggleCurrency changes the default currency.
	var currencyListArray = JSON.parse(getStoredData('currencies_selected', false)); //Example "["AUD","BRL","CAD"]"
  Navigation.disableAllCurrencies();
	// var currenciesPositionOrder = getStoredData('currencies_position_order', false); // Do something with this?
	if (typeof(currencyListArray) === 'undefined' || currencyListArray === null){
		  currencyListArray = []; //
	}
	if (currencyListArray.length === 0){
	     currencyListArray.push('USD');
  }
	//if (!(currencyListArray.indexOf(default_currency) > -1)) {
	//	  Navigation.toggleCurrency(default_currency);
	//}
	console.log('currencies_selected resource data is ', currencyListArray);
	for (var i = 0; i < currencyListArray.length; i++){
		  Navigation.toggleCurrency(currencyListArray[i]);
	}
	// @Note: Set wallet unit
    var default_currency = g_JaxxApp.getSettings().getListOfEnabledCurrencies()[0];
    wallet.getHelper().setFiatUnit(default_currency);

	g_JaxxApp.getUI().showHamburgerMenu();


	//currency = wallet.getHelper().getFiatUnit();
	//Navigation.toggleCurrency(currency, true);

    g_JaxxApp.getUI().updateCoinBannerCarousel();
    var getUIIntro = g_JaxxApp.getUI()._jaxxUIIntro;
    if(getUIIntro._setWalletType === "newWallet" && getUIIntro._setOptionSelected === "Express")
        g_JaxxApp.getUI().showNotificationFooter();
    g_JaxxApp.getUI().setTransferPaperWalletHeader(curCoinType); // Just sets the text for transfer paper wallet to give more specific instructions.
    g_JaxxApp.getUI().updateTransactionListWithCurrentCoin();


    return wallet;
}

function loadFromEncryptedMnemonic(mnemonicEncrypted, callback) {
    var wallet = new HDWalletMain();
    wallet.initialize();

    //    var mnemonicEncrypted = getStoredData('mnemonic', false);

    wallet.setupWithEncryptedMnemonic(mnemonicEncrypted, function(err) {
        if (err) {
            console.log("loadFromEncryptedMnemonic :: error :: " + err);
            callback(err, null);
        } else {
            callback(null, _loadWallet(wallet));
        }
    });
}

/**
 *  User Interface - Tabs
 *
 */

var Navigation = (function () {
    this.ignoreUpdateFromInputFieldEntry = false;
    var _currenciesEnabled = []; // This keeps a record of all currencies the user has enabled

    var closeModal = function(callback) {
        var visible = $('.modal.visible');
        visible.removeClass('visible').animate({ opacity: 0}, 300, function () {
            visible.hide();
            if(callback)callback();
        });
        if (window.native && window.native.setIsModalOpenStatus) {
            window.native.setIsModalOpenStatus(false);
        }
    }

    var openModal = function(modalName) {
        $('.modal.visible').hide(); // replaces closeModal();
        var modal = $('.modal.' + modalName);
        modal.css({opacity: 0}).show().animate({opacity: 1}).addClass('visible');
        modal.click(function (e) {
           if ($(e.target).hasClass('modal')) {
               closeModal();
           }
        });
        if (window.native && window.native.setIsModalOpenStatus) {
            window.native.setIsModalOpenStatus(true);
        }
    };

    var openNotificationBanner = function(bannerName){
        // TODO: Find if any notification banner is open
        var bannerHeight = (JaxxUI._sUI._wHeight - $('.landscapeRight').position().top) + 5;
        var banner = $('.cssNotificationFooter' + bannerName);
        //var miningHeight = bannerHeight - 60;
        banner.parent().removeClass("hideNotificationFooter").addClass('visibleNotificationFooter');
        banner.slideDown(400, "swing").animate({height: bannerHeight});
        if(window.native && !!window.native.getAndroidSoftNavbarHeight()) {
            $('.modal-bottom').addClass('softKeys');
        }
    }
    var closeNotificationBanner = function(bannerName){
        var banner = $('.cssNotificationFooter' + bannerName);
        setTimeout(function () {
            banner.slideUp(400, 'swing' , function () {
                banner.parent().removeClass('visibleNotificationFooter');
                banner.parent().addClass('hideNotificationFooter');
            }).animate({height: 0});
        },500);
    }

    var futureResize = function() {
        setTimeout(resize, 10);
    }


    // Show a tab
    // @TODO: add an "amiated" parameter
    var showTab = function(tabName) {
        JaxxUI.runAfterNextFrame(function() {
            $('.tab').removeClass('cssSelected').removeClass('selected');
            $('.tab.' + tabName).addClass('cssSelected').addClass('selected');

            if (tabName === 'send') {
                g_JaxxApp.getUI().updateHighlightingInSendTransactionButton();
                if ($('.tabContent').hasClass('selected')) {
                    //                console.log("path A1");
                    $('.tabContent .address').slideDown();
                    $('.tabContent .spendable').slideDown();
                    if ($('.tabContent .pageAddresses').data('addresses')) {
                        //                    console.log("path A");
                        $('.tabContent .pageAddressesHeader').slideDown();
                        $('.tabContent .pageAddresses').slideDown();
                    }

                    if (curCoinType === COIN_BITCOIN) {
                    } else if (curCoinType === COIN_ETHEREUM) {
                        if (g_JaxxApp.getShapeShiftHelper().getIsTriggered()) {

                        } else {
                            $('.tabContent .advancedTabButton').slideDown();
                            //                    $('.tabContent .advancedTabContentEthereum').slideDown(futureResize);
                        }
                    }
                } else {
                    //                console.log("path B1");
                    $('.tabContent .address').show();
                    $('.tabContent .spendable').show();
                    if ($('.tabContent .pageAddresses').data('addresses')) {
                        //                    console.log("path B");
                        $('.tabContent .pageAddressesHeader').show();
                        $('.tabContent .pageAddresses').show();
                    }
                    if (curCoinType === COIN_BITCOIN) {
                    } else if (curCoinType === COIN_ETHEREUM) {
                        if (g_JaxxApp.getShapeShiftHelper().getIsTriggered()) {

                        } else {
                            $('.tabContent .advancedTabButton').show();
                        }
                        //                    $('.tabContent .advancedTabContentEthereum').show();
                    }
                    updateSpendable();
                }
                $('.tabContent .amount .button span.send').css({opacity: 1});
                $('.tabContent .amount .button span.receive').css({opacity: 0});
                $('.tabs .tab.send .icon').fadeTo(0, 1);
                $('.tabs .tab.receive .icon').fadeTo(0, 0.5);
            } else {
                if ($('.tabContent').hasClass('selected')) {
                    $('.tabContent .address').slideUp();
                    $('.tabContent .pageAddressesHeader').slideUp();
                    $('.tabContent .pageAddresses').slideUp();
                    $('.tabContent .spendable').slideUp();
                    if (curCoinType === COIN_BITCOIN) {
                    } else if (curCoinType === COIN_ETHEREUM) {
                        $('.tabContent .advancedTabButton').slideUp();
                        Navigation.hideEthereumAdvancedMode();
                        //                    $('.tabContent .advancedTabContentEthereum').slideUp(futureResize);
                    }
                } else {
                    $('.tabContent .address').hide();
                    $('.tabContent .pageAddressesHeader').hide();
                    $('.tabContent .pageAddresses').hide();
                    $('.tabContent .spendable').hide();
                    if (curCoinType === COIN_BITCOIN) {
                    } else if (curCoinType === COIN_ETHEREUM) {
                        $('.tabContent .advancedTabButton').hide();
                        $('.tabContent .advancedTabContentEthereum').hide();
                    }
                }
                $('.tabContent .amount .button span.receive').css({opacity: 1});
                $('.tabContent .amount .button span.send').css({opacity: 0});
                $('.tabs .tab.send .icon').fadeTo(0, 0.5);
                $('.tabs .tab.receive .icon').fadeTo(0, 1);

                ethereumAdvancedModeHidden = true;
            }

            if ($('.tabContent').hasClass('selected')) {
                $('.tabContent .amount').slideDown();
            } else {
                $('.tabContent .amount').show();
            }

            $('.tabContent').slideDown(futureResize).addClass('cssSelected').addClass('selected');
            //
            //        $('.tabContent .amount input').trigger('keyup');

            // @Todo: Refactor this.
            if (window.native && window.native.setTabName) {
                window.native.setTabName(Navigation.getTab()); // Push data to Android app.
            }
        });
    };

    var getTab = function() {
        var tab = $('.tab.selected');
        if (tab.hasClass('receive')) {
            return 'receive';
        } else if (tab.hasClass('send')) {
            return 'send';
        }
        return null;
    }

    // Collapse the tabs
    var collapseTabs = function() {
        JaxxUI.runAfterNextFrame(function() {
            $('.tabs .tab').removeClass('cssSelected');
            $('.tabs .tab').removeClass('selected');

            $('.tabs .icon').fadeTo(500, 1);
            $('.tabContent').removeClass('cssSelected');
            $('.tabContent').removeClass('selected');
            $('.tabContent').slideUp(futureResize);

            ethereumAdvancedModeHidden = true;

            // @Todo: Refactor this.
            if (window.native && window.native.setTabName) {
                window.native.setTabName(Navigation.getTab()); // Push data to Android app.
            }
        });
    };


    // If the tab is already selected, collapse the tabs; otherwise open it
    var toggleTab = function(tabName) {
        JaxxUI.runAfterNextFrame(function() {
            //        console.log(tabName);
            if (g_JaxxApp.getShapeShiftHelper().getIsTriggered()) {
                if (tabName === 'send') {
                    updateSpendable();
                    $('.spendable').slideDown(); // Hide Spendable line
                }

                g_JaxxApp.getUI().resetShapeShift();
            }

            var tab = $('.tab.' + tabName);
            if (tab.hasClass('selected')) {
                collapseTabs();
            } else {
                showTab(tabName);
            }

            //@note: also hide the transaction history.

            Navigation.clearInputFields();

            Navigation.hideTransactionHistoryDetails();

            g_JaxxApp.getUI().closeShapeshiftCoinList();
            g_JaxxApp.getUI().closeQuickFiatCurrencySelector();
        });
    }


    var isUseFiat = function () {
        return ($('.unitToggle').data('fiat') === true);
    };

    var setUseFiat = function(useFiat) {

        $('.tabContent .amount input').val('');
        $('.unitToggle').data('fiat', (useFiat === true));
        $('.tabContent .amount input').trigger('keyup');

       // var oldAmountValue = parseFloat($('.tabContent .amount input').val());
       // if (isNaN(oldAmountValue)){ // This was added when Jaxx started crashing after selecting send fiat and then switching coins
        //    oldAmountValue = 0;
      //  }
       // var newAmountValue = 0;
        if (useFiat) {
            var multiplier = (COIN_THEDAO_ETHEREUM === curCoinType) ? 100 : 1;
            $('.unitToggle .symbol').text(wallet.getHelper().getFiatUnitPrefix());
           // newAmountValue = wallet.getHelper().convertCoinToFiatWithFiatType(curCoinType, oldAmountValue, COIN_UNITLARGE, null, true) / multiplier;
        } else {
            // Set the symbol.
            var coinSymbol = HDWalletPouch.getStaticCoinPouchImplementation(curCoinType).uiComponents['coinSymbol'];
            $('.unitToggle .symbol').text(coinSymbol);
            // Set the amount value.
          //  var fiatUnit = wallet.getHelper().getFiatUnit();
           // newAmountValue = wallet.getPouchFold(curCoinType).convertFiatToCoin(oldAmountValue, COIN_UNITLARGE, fiatUnit);
        }

        updateSpendable();

        //$('.tabContent .amount input').val(newAmountValue).trigger('keyup');
    };

    var toggleUseFiat = function() {
        setUseFiat(!isUseFiat());
    };

    var settingsStack = [];

    var getSettingsStack = function(){
        return settingsStack;
        // @Todo: Refactor this.
        if (window.native && window.native.setSettingsStackStatusSize) {
            window.native.setSettingsStackStatusSize(settingsStack.length);
        }

        // Log message to Android Studio:
        if (window.native && window.native.createLogMessage) {
            window.native.createLogMessage("The settings stack size is " + settingsStack.length);
        }
    };

    var clearSettings = function(callback) {
        $('#privateKeySweep').val('').trigger('keyup');
        settingsStack = [];
        $('.settings').removeClass('cssHideUsingSettingsFramework'); // Related to optimizations framework.
        $('.wallet').removeClass('cssHideUsingSettingsFramework'); // Related to optimizations framework.
        $('.menu').removeClass('cssHideUsingSettingsFramework'); // Related to optimizations framework.
        //@note: @here: @todo: @next: maybe also close the slideout menu here.
        // @Todo: Refactor this.
        if (window.native && window.native.setSettingsStackStatusSize) {
            window.native.setSettingsStackStatusSize(settingsStack.length);
        }
        // Log message to Android Studio:
        if (window.native && window.native.createLogMessage) {
            window.native.createLogMessage("The settings stack size is " + settingsStack.length);
        }
        //$('.settings').hide(400, 'swing', function(){});
        $('.settings').hide();
        setTimeout(function() {
            if(callback) callback();
        }, 500)
    }

    var pushSettings = function(settingsName, callback) {
        if (settingsName === 'backupMnemonic') {
            var lastBackUpTimeStamp = parseInt(getStoredData('lastBackupTimestamp'));
            if(lastBackUpTimeStamp) {
                var dateTime = new Date(lastBackUpTimeStamp);
                var hours = dateTime.getHours();
                var minutes = dateTime.getMinutes();
                hours = hours % 12;
                hours = hours ? hours : 12;
                minutes = minutes < 10 ? '0' + minutes : minutes;
                var ampm = (dateTime.getHours() >= 12) ? "PM" : "AM";
                var $el = $('.cssBackup .cssOptionHeading label');
                var backUpNote = "Note: Backing up your wallet entails writing down your Backup Phrase. You will not be creating a “backup” copy of your wallet on this device.";
                $el.text('Would you like to backup your wallet again?');
                dateTime = dateTime.format('DD/MM/YY');
                $('.cssBackup .cssLastBackUpDate').text('Previous Backup: ' + dateTime + ' ' + hours + ':' + minutes +  ' ' + ampm);
                $('.cssBackup .cssBackUpNote').text(backUpNote);
            }
            var element = $('.settings.backupMnemonic .proceedToBackupMnemonicButton');
            element.hide();
            countdownButtonUpdate(element, 'Proceed to Backup', 1000, null, function() {
                element.show();
            });

            var elementTwo = $('.settings.backupMnemonic .proceedToBackupMnemonicCount');
            elementTwo.fadeIn();

            countdownButtonUpdate(elementTwo, '', 1000, function(timeRemaining) {
                elementTwo.text(timeRemaining);
            }, function() {
                elementTwo.fadeOut();
            });

            $(".checkboxSettingsBackupMnemonicPage").removeClass("cssChecked");
            $(".checkboxSettingsBackupMnemonicPage").removeClass("checked");
        }

        if (settingsName === 'pairToDevice') {
            var element = $('.settings.pairToDevice .pairDeviceShowMnemonicButton');
            //element.removeClass('cssBlueButtonWide');
            //element.addClass('cssGreyButtonWide');
            //element.css('cursor', 'default');
            //element.attr('pushSettings', null);
            element.hide();

            countdownButtonUpdate(element, 'I Understand: ', 6, null, function() {
                element.show();
                //element.removeClass('cssGreyButtonWide');
                //element.addClass('cssBlueButtonWide');
                //element.text('I Understand');
                //element.css('cursor', 'pointer');
                //element.attr('pushSettings', 'viewJaxxToken');
            });

            var elementTwo = $('.settings.pairToDevice .pairDeviceShowMnemonicCount');
            elementTwo.fadeIn();

            countdownButtonUpdate(elementTwo, '', 5, function(timeRemaining) {
                elementTwo.text(timeRemaining);
            }, function() {
                elementTwo.fadeOut();
            });
        }

        if (settingsName === 'pairFromDevice') {
            var element = $('.settings.pairFromDevice .cssBtnIntroRight');
            //element.removeClass('cssBlueButtonWide');
            //element.addClass('cssGreyButtonWide');
            //element.css('cursor', 'default');
            //element.attr('pushSettings', null);
            element.hide();

            countdownButtonUpdate(element, 'I Understand: ', 6, null, function() {
                element.show();
                //element.removeClass('cssGreyButtonWide');
                //element.addClass('cssBlueButtonWide');
                //element.text('I Understand');
                //element.css('cursor', 'pointer');
                //element.attr('pushSettings', 'viewJaxxToken');
            });

            var elementTwo = $('.settings.pairFromDevice .pairDeviceShowMnemonicCount');
            elementTwo.fadeIn();

            countdownButtonUpdate(elementTwo, '', 5, function(timeRemaining) {
                elementTwo.text(timeRemaining);
            }, function() {
                elementTwo.fadeOut();
            });
        }
        /*
         * Handles call to SetBitcoinMiningFee view (Settings view)
         */
        if (settingsName === 'pageSetBitcoinMiningFee') {
            var miningFeeOptionChosen = wallet.getPouchFold(curCoinType).getMiningFeeLevel();

            console.log('MINING FEES | specialAction :: ' + miningFeeOptionChosen);

            changeMiningViewSelector(miningFeeOptionChosen);
        }
        if (settingsName === 'viewBackupPhrase') {
            var element = $('.settings.viewBackupPhrase .pairDeviceShowMnemonicButton');
            //element.removeClass('cssBlueButtonWide');
            //element.addClass('cssGreyButtonWide');
            //element.css('cursor', 'default');
            //element.attr('pushSettings', null);
            element.hide();

            countdownButtonUpdate(element, 'I Understand: ', 6, null, function() {
                element.show();
                //element.removeClass('cssGreyButtonWide');
                //element.addClass('cssBlueButtonWide');
                //element.text('I Understand');
                //element.css('cursor', 'pointer');
                //element.attr('pushSettings', 'viewJaxxToken');
            });

            var elementTwo = $('.settings.viewBackupPhrase .pairDeviceShowMnemonicCount');
            elementTwo.fadeIn();

            countdownButtonUpdate(elementTwo, '', 5, function(timeRemaining) {
                elementTwo.text(timeRemaining);
            }, function() {
                elementTwo.fadeOut();
            });
        }



        console.log("push settingsName :: " + settingsName);

        if (settingsName === 'displayPrivateKeysWarning') {
            var element = $('.settings.cssDisplayPrivateKeysWarning .pairDeviceShowMnemonicButton');
            //element.removeClass('cssBlueButtonWide');
            //element.addClass('cssGreyButtonWide');
            //element.css('cursor', 'default');
            //element.attr('pushSettings', null);
            element.hide();

            countdownButtonUpdate(element, 'I Understand: ', 6, null, function() {
                element.show();
                //element.removeClass('cssGreyButtonWide');
                //element.addClass('cssBlueButtonWide');
                //element.text('I Understand');
                //element.css('cursor', 'pointer');
                //element.attr('pushSettings', 'viewJaxxToken');
            });

            var elementTwo = $('.settings.cssDisplayPrivateKeysWarning .pairDeviceShowMnemonicCount');
            elementTwo.fadeIn();

            countdownButtonUpdate(elementTwo, '', 5, function(timeRemaining) {
                elementTwo.text(timeRemaining);
            }, function() {
                elementTwo.fadeOut();
            });
        }


        if (settingsName === 'exportPrivateKeysBitcoin') {
            setupExportPrivateKeys(COIN_BITCOIN);
        }

        if (settingsName === 'exportPrivateKeysEthereum') {
            setupExportPrivateKeys(COIN_ETHEREUM);
        }

        if (settingsName === 'exportPrivateKeysEthereumClassic') {
            setupExportPrivateKeys(COIN_ETHEREUM_CLASSIC);
        }

        if (settingsName === 'exportPrivateKeysDash') {
            setupExportPrivateKeys(COIN_DASH);
        }

        if (settingsName === 'exportPrivateKeysLitecoin') {
            setupExportPrivateKeys(COIN_LITECOIN);
        }

        if (settingsName === 'exportPrivateKeysLisk') {
            setupExportPrivateKeys(COIN_LISK);
        }

        if (settingsName === 'exportPrivateKeysZCash') {
            setupExportPrivateKeys(COIN_ZCASH);
        }

        if (settingsName === 'exportPrivateKeysTestnetRootstock') {
            setupExportPrivateKeys(COIN_TESTNET_ROOTSTOCK);
        }

        if (settingsName === 'exportPrivateKeysDoge') {
            setupExportPrivateKeys(COIN_DOGE);
        }

        if (settingsName === 'viewMnemonic') {
            if (g_JaxxApp.getUser().hasPin()) {
                settingsName = 'viewMnemonicConfirmPin';
                JaxxUI._sUI.showSettingsMnemonicConfirmPin('.settingsViewMnemonicConfirmPinPad', function() {
                    Navigation.pushSettings('viewMnemonicConfirmed');
                });
            } else {
            }
        } else if (settingsName === 'viewMnemonicConfirmed') {
            settingsName = 'viewMnemonic';
        }

        if (settingsName === 'viewJaxxToken') {
            if (g_JaxxApp.getUser().hasPin()) {
                settingsName = 'pairToDeviceConfirmPin';
            } else {
            }
        } else if (settingsName === 'pairToDeviceConfirmed') {
            settingsName = 'viewJaxxToken';
        }

        if (settingsName === 'viewJaxxBackupPhrase') {
            if (g_JaxxApp.getUser().hasPin()) {
                settingsName = 'pairToDeviceConfirmPin';
            } else {
            }
        } else if (settingsName === 'pairToDeviceConfirmed') {
            settingsName = 'viewJaxxBackupPhrase';
        }

        if (settingsName === 'setupPINCode') {
            if (g_JaxxApp.getUser().hasPin()) {
            } else {
                settingsName = 'changePinCode';
            }
        }

        if (settingsName === 'backupPrivateKeys') {
            if (g_JaxxApp.getUser().hasPin()) {
                settingsName = 'backupPrivateKeysConfirmPin';
            } else {
            }
        } else if (settingsName === 'backupPrivateKeysConfirmed') {
            settingsName = 'backupPrivateKeys';
        }

        //
        //@note: @todo: android back button support for submenus.
        if (settingsStack.length) {
            // $('.settings.' + Navigation.getSettingsStack()[Navigation.getSettingsStack().length - 1]).animate({left: "-50%"}); // Try this
            var topSettings = $('.settings.' + settingsStack[settingsStack.length - 1]);
            topSettings.animate({left: "-50%"});
            //
        }
        var settings = $('.settings.' + settingsName);
        settingsStack.push(settingsName);
        settings.css({left: '100%'}).show().animate({left: 0}, 400, 'swing', function(){
            // Optimization stuff.
            // Explicitly remove the hide class from the top page and add it to the previous page.
            var localSettingsStack = Navigation.getSettingsStack();
            $('.settings.' + localSettingsStack[localSettingsStack.length - 1]).removeClass('cssHideUsingSettingsFramework');
            if (localSettingsStack.length > 1){
                $('.settings.' + localSettingsStack[localSettingsStack.length - 2]).addClass('cssHideUsingSettingsFramework');
            } else {
                $('.wallet').addClass('cssHideUsingSettingsFramework');
                $('.menu').addClass('cssHideUsingSettingsFramework');
            }
            if (typeof(callback) !== 'undefined' && callback !== null){
                callback();
            }
        }); // Hide previous setting screen in callback.


//        if (settingsName === 'viewMnemonicConfirmPin') {
//            JaxxUI._sUI.showSettingsMnemonicConfirmPin('.settings.ViewMnemonicConfirmPin', function() {
//                Navigation.pushSettings('viewMnemonicConfirmed');
//            });
//        }

        if (settingsName === 'pairToDeviceConfirmPin') {
            JaxxUI._sUI.showPairDeviceConfirmPin('.settingsPairToDeviceConfirmPinPad', function() {
                Navigation.pushSettings('pairToDeviceConfirmed');
            });
        }

        if (settingsName === 'backupPrivateKeysConfirmPin') {
            JaxxUI._sUI.showPrivateKeysConfirmPin('.settingsBackupPrivateKeysConfirmPinPad', function() {
                Navigation.pushSettings('backupPrivateKeysConfirmed');
            });
        }
        if (settingsName === 'changePinCode') {
            g_JaxxApp.getUI().showEnterPinSettings();
        }

        if (settingsName === 'removePinCode') {
            g_JaxxApp.getUI().showRemovePinSettings();
        }

        // @Todo: Refactor this.
        if (window.native && window.native.setSettingsStackStatusSize) {
            window.native.setSettingsStackStatusSize(settingsStack.length);
        }

        // Log message to Android Studio:
        if (window.native && window.native.createLogMessage) {
            window.native.createLogMessage("The settings stack is " + settingsStack.join(','));
        }

        Navigation.clearFlashBanner()
    }

    var popSettings = function() {
//        console.log(['splash'].indexOf(settingsStack[settingsStack.length - 1]));

        //@note: don't pop if the splash or terms of service are on the top of the stack.
        if (['splash', 'pageTermsOfService'].indexOf(settingsStack[settingsStack.length - 1]) === -1){
            var settingsName = settingsStack.pop();

            if (settingsStack.length) {
                // This code block runs if popSettings stack IS NOT returning to the wallet itself.
                var nextSettings = $('.settings.' + settingsStack[settingsStack.length - 1]);
                nextSettings.removeClass('cssHideUsingSettingsFramework');
                nextSettings.animate({left: 0});/*, 400, 'swing', function(){
                    var localSettingsStack = Navigation.getSettingsStack();
                    $('.settings.' + localSettingsStack[localSettingsStack.length - 1]).removeClass('cssHideUsingSettingsFramework');
                }); */
            } else {
                // This code block runs if popSettings stack IS returning to the wallet itself.
                $('.wallet').removeClass('cssHideUsingSettingsFramework');
                $('.menu').removeClass('cssHideUsingSettingsFramework');
            }

            var settings = $('.settings.' + settingsName);
            // Optimization related: Make sure that the top element is not hidden anymore.

            settings.animate({left: '100%'}, function () {
                settings.hide();
            });

            console.log("pop settingsName :: " + settingsName);

            if (settingsName === 'viewMnemonic') {
                if (g_JaxxApp.getUser().hasPin()) {
                    JaxxUI._sUI.showSettingsMnemonicConfirmPin('.settingsViewMnemonicConfirmPinPad', function() {
                        Navigation.pushSettings('viewMnemonicConfirmed');
                    });
                } else {

                }
            }

            if (settingsName === 'viewJaxxToken' || settingsName === 'viewJaxxBackupPhrase') {
                if (g_JaxxApp.getUser().hasPin()) {
                    JaxxUI._sUI.showSettingsMnemonicConfirmPin('.settingsPairToDeviceConfirmPinPad', function() {
                        Navigation.pushSettings('pairToDeviceConfirmed');
                    });
                } else {

                }
            }

            if (settingsName === 'backupPrivateKeys') {
                if (g_JaxxApp.getUser().hasPin()) {
                    JaxxUI._sUI.showSettingsMnemonicConfirmPin('.settingsBackupPrivateKeysConfirmPinPad', function() {
                        Navigation.pushSettings('backupPrivateKeysConfirmed');
                    });
                } else {

                }
            }

            // @Todo: Refactor this.
            // @NOTE: This might be refactored now.
            if (window.native && window.native.setSettingsStackStatusSize) {
                window.native.setSettingsStackStatusSize(settingsStack.length);
            }

            // Log message to Android Studio:
            if (window.native && window.native.createLogMessage) {
                window.native.createLogMessage("The settings stack size is " + settingsStack.length);
            }




            Navigation.clearFlashBanner();
        }
    }

    /*
     * switch the inputs selector for MiningFeeMainMenu
     */
    var changeMiningViewSelector = function(miningFeeOption) {
      if (miningFeeOption === HDWalletPouch.MiningFeeLevelSlow) {
        // $('input#slowMiningFeePopup').prop('checked', true);
        $('input#slowMiningFeeMainMenu').prop('checked', true);
      }
      if (miningFeeOption === HDWalletPouch.MiningFeeLevelFast) {
        // $('input#slowMiningFeePopup').prop('checked', true);
        $('input#fastMiningFeeMainMenu').prop('checked', true);
      }
      if (miningFeeOption === HDWalletPouch.MiningFeeLevelAverage) {
        // $('input#averageMiningFeePopup').prop('checked', true);
        $('input#averageMiningFeeMainMenu').prop('checked', true);
      }
    }
    
    //@rohit - display notifications
    
    var displayNotification = function(text, type){
    
        var notify = $('.desktopNotifications');
        if(type === "success"){
            //notify.addClass('cssDisplayNotification cssnotificationSucess');
            notify.slideDown(400, "swing").animate({height:'25px'}).addClass('cssDisplayNotification cssnotificationSucess');
            $('.cssDisplayNotification').text(text);
            
            setTimeout(function(){
             //$('.cssDisplayNotification').hide(); 
                notify.slideUp(0, "swing").animate({height:'0px'}).removeClass('cssDisplayNotification cssnotificationSucess');
                
            },3000);
        }
        else if(type === "warning"){
            //notify.addClass('cssDisplayNotification cssnotificationWarning');
            notify.slideDown(400, "swing").animate({height:'25px'}).addClass('cssDisplayNotification cssnotificationWarning');
            $('.cssDisplayNotification').text(text);
            
            setTimeout(function(){
             notify.slideUp(0, "swing").animate({height:'0px'}).removeClass('cssDisplayNotification cssnotificationWarning');   
            },3000);
        }
        else if(type === "error"){
            //notify.addClass('cssDisplayNotification cssnotificationError');
            notify.slideDown(400, "swing").animate({height:'25px'}).addClass('cssDisplayNotification cssnotificationError');
            $('.cssDisplayNotification').text(text); 
            
            setTimeout(function(){
             notify.slideUp(0, "swing").animate({height:'0px'}).removeClass('cssDisplayNotification cssnotificationError'); 
            },3000);
        }
        else {
            //notify.addClass('cssDisplayNotification cssnotificationError');
            notify.slideDown(400, "swing").animate({height:'25px'}).addClass('cssDisplayNotification cssnotificationDefault');
            $('.cssDisplayNotification').text(text); 
            
            setTimeout(function(){
             notify.slideUp(0, "swing").animate({height:'0px'}).removeClass('cssDisplayNotification cssnotificationDefault'); 
            },3000);
        }
                          
    }
    
    var displayNotificationLargeCopy = function(text, type, disPlayType){
        var notify = $('.desktopNotifications');
        if(type === "success" && disPlayType === "extendPopUpDisplay"){
            //notify.addClass('cssDisplayNotification cssnotificationSucess');
            notify.slideDown(400, "swing").animate({height:'25px'}).addClass('cssDisplayNotification cssDisplayLargeCopyPopUp cssnotificationSucess');
            $('.cssDisplayNotification').text(text);
            
            setTimeout(function(){
             //$('.cssDisplayNotification').hide(); 
                notify.slideUp(0, "swing").animate({height:'0px'}).removeClass('cssDisplayNotification cssDisplayLargeCopyPopUp cssnotificationSucess');
                
            },3000);
        }
    }
    
    var flashBanner = function(text, timeout, messageType, options, disPlayType) {
        //flashes an orange banner on the bottom of the screen
        var options = (!!options) ? options : {};
        var getTimeout = timeout * 1000;
        var closeButton = (!!options && options.close === false) ? false : true;
        getTimeout.toString();
        /*
        toastr.options = {
            "closeButton": closeButton,
            "debug": false,
            "newestOnTop": false,
            "progressBar": true,
            "positionClass": "toast-bottom",
            "preventDuplicates": true,
            "onclick": null,
            "showDuration": "400",
            "hideDuration": "400",
            "timeOut": getTimeout,
            "showEasing": "swing",
            "hideEasing": "linear",
            "showMethod": "slideDown",
            "hideMethod": "slideUp",
            "closeOnHover": false
        }
        */
        
        switch(messageType) {
            case "success":
                //call function displayNotification
                // params : text and type
                displayNotification(text, "success");
                displayNotificationLargeCopy(text, "success", disPlayType)
                //toastr.success(text);
                break;
            case "warning":
                displayNotification(text, "warning");
                //toastr.warning(text);
                break;
            case "error":
                displayNotification(text, "error");
                //toastr.error(text);
                break;
            default:
                displayNotification(text);
                //toastr.info(text);
                break;
        }
        if(!!$('#toast-container').length) {
            var getHeight, el = document.getElementById('transactionHistoryStart');
            getHeight =  (window.innerHeight - el.offsetTop) / 2;
            getHeight = (getHeight < 300) ? getHeight : 185;
            //textHeight = $('.toast-message').height();

            //This line of code checks if description is one line or two lines
            //setPadding = (textHeight < 40) ? ( getHeight / 2 ) - textHeight : ( getHeight / 2 ) - ( textHeight - 13 );
        //    $('.toast.toast-info').css("max-height", getHeight);
            //$('.toast.toast-info').css("height", getHeight);
            //$('#toast-container .toast').slideDown().animate({height: getHeight});
            //$('.toast-message').css("padding-top", setPadding);
        }
        /*
        var banner = $('<div>').addClass("flex-container").addClass('scriptAction').text(text).attr('specialAction', 'jaxx_ui.removeElement').css({display: 'flex'}).css({"flex-direction": 'column'}).css({"min-height":'0vh'});

        $('.flashBannerNotificationFooter').append(banner);
        g_JaxxApp.getUI().attachClickEventForScriptAction(banner);
        banner.hide();
        setTimeout(function () {
            banner.slideDown(500, 'linear');
        }, 400);
        if (timeout) {
            setTimeout(function () {
                banner.slideUp(function() {
                    banner.remove();
                });
            }, parseInt(timeout) * 1000);
        }
        */
    }

    var flashBannerMultipleMessages = function(textArray, timeout) {
        //calls Navigation.flashBanner at an interval, to flash multiple messages one after another
        //intervalTime is slightly longer than timeout so that messages aren't on the screen at once
        //if calling this at a place in the app where Navigation.flashBanner is used, I recommend using the same timeout
        var intervalTime = (parseInt(timeout) * 1000) + 600
        var i = 0;
        var interval = setInterval(function() {
            Navigation.flashBanner(textArray[i], timeout);
            i++;
            if(i >= textArray.length) clearInterval(interval);
        }, intervalTime);
    }

    var clearFlashBanner = function(){
        $('.flashBannerNotificationFooter').empty();
    }

    var hideUI = function(fromProfileMode, toProfileMode, callbackFunc, firstUnlock, coinType) {
        JaxxUI.runAfterNextFrame(function(coinType) {
//            console.log("coinType :: " + coinType);
            var animSpeed = 250;//parseFloat($('.tab.send').attr('data-wow-duration')) * 1000;
            var completionOffset = 750;
            if (firstUnlock === true) {
                completionOffset = 1250;
            }

            //        for (idx in elementNames) {
            //            $(elementNames[idx]).attr({'data-wow-duration': animSpeed})// = animSpeed;
            //        }

            //        console.log("animSpeed :: " + animSpeed + " :: " + (animSpeed + completionOffset));

            var transactionsListElement = HDWalletPouch.getStaticCoinPouchImplementation(coinType).uiComponents['transactionsListElementName'];

            var curTransactionTable = '.table.transactions' + transactionsListElement;

            console.log("hiding :: " + curTransactionTable);

            $(curTransactionTable).slideUp(function() {
                //            console.log("hidden :: " + curCoinType);
            });
            //        var tableElements = $(curTransactionTable).get();

            //        var tableElements = $('.table.transactions .tableRow').get();
            //        for (rowID in tableElements) {
            //            var curElement = $(tableElements[rowID]);//[0];
            //
            //            curElement.fadeTo(animSpeed, 0);
            //        }

            Navigation.hideTransactionHistoryDetails();
            Navigation.clearInputFields();
            Navigation.returnToDefaultView();

            //@note: @here: @todo: put this in a better spot.
            $('.theDaoInsufficientGasForSpendableWarningText').slideUp();

        //@note: @here: @todo: put this in a better spot.
        $('.ethereumTokenInsufficientGasForSpendableWarningText').slideUp();

            var transitionBaseIn;
            var transitionBaseOut;

            //@note: @todo: consider switching from landscape to portrait and vise-versa.
            //would need to have a flag on hide to use portrait/landscape in/out selectively.

            transitionBaseIn = (fromProfileMode === PROFILE_PORTRAIT) ? portraitTransitionsIn : landscapeTransitionsIn;

            transitionBaseOut = (toProfileMode === PROFILE_PORTRAIT) ? portraitTransitionsOut : landscapeTransitionsOut;

            for (var eID in transitionElementNames) {
                var curElement = transitionElementNames[eID];

                $(curElement).removeClass(transitionBaseIn[curElement]);
                $(curElement).addClass(transitionBaseOut[curElement]);
            }

            setTimeout(callbackFunc, animSpeed + completionOffset);
        }, coinType);
    }

    var showUI = function(fromProfileMode, toProfileMode, callback) {
        JaxxUI.runAfterNextFrame(function() {
            var animSpeed = 250;

            //@note: @todo: consider switching from landscape to portrait and vise-versa.
            //would need to have a flag on hide to use portrait/landscape in/out selectively.

            var transitionBaseIn;
            var transitionBaseOut;

            transitionBaseIn = (fromProfileMode === PROFILE_PORTRAIT) ? portraitTransitionsIn : landscapeTransitionsIn;

            transitionBaseOut = (toProfileMode === PROFILE_PORTRAIT) ? portraitTransitionsOut : landscapeTransitionsOut;

            for (var eID in transitionElementNames) {
                var curElement = transitionElementNames[eID];

                $(curElement).removeClass(transitionBaseOut[curElement]);
                $(curElement).addClass(transitionBaseIn[curElement]);
            }

            var transactionsListElement = HDWalletPouch.getStaticCoinPouchImplementation(curCoinType).uiComponents['transactionsListElementName'];

            var curTransactionTable = '.table.transactions' + transactionsListElement;

            console.log("showing :: " + curTransactionTable);

            resize();

            if (callback) {
                $(curTransactionTable).slideDown({complete: callback});
            } else {
                $(curTransactionTable).slideDown();
            }
        });
    }

    var returnToDefaultView = function() {
        var sendTab = $('.tab.' + 'send');
        var receiveTab = $('.tab.' + 'receive');

        if (g_JaxxApp.getShapeShiftHelper().getIsTriggered()) {
            $('.spendableShapeshift').slideUp(); // Show ShapeShift logo and Info icon

            g_JaxxApp.getUI().resetShapeShift();
        }

        if (sendTab.hasClass('selected') || receiveTab.hasClass('selected')) {
            Navigation.collapseTabs();
        }

        g_JaxxApp.getUI().closeQuickFiatCurrencySelector();
		g_JaxxApp.getUI().closeShapeshiftCoinList();
    }

    var hideTransactionHistoryDetails = function(excludeElement) {
        var coinFullName = HDWalletPouch.getStaticCoinPouchImplementation(curCoinType).uiComponents['coinFullName'];

        if (excludeElement) {
            var curTransactionTable = '.table.transactions.transactions' + coinFullName;

            var tableElements = $('.table.transactions.transactions' + coinFullName + ' .tableRow').get();

            //@note: most likely there is a more succinct way to do this comparison, but there's no global table object
            //available, and none of this stuff is classed so this is the way it's going to be until there's a proper
            //refactoring.
            for (var rowID in tableElements) {

                var curElement = $(tableElements[rowID])[0];
                if (excludeElement && curElement == excludeElement) {
                    //                console.log("found row");
                } else {
                    //                console.log("other row");
                    if ($('.verbose', curElement).is(':visible')) {
                        $('.glance', curElement).removeClass("cssTransactionRowSelected");

                        $('.verbose', curElement).slideToggle();
                    }
                }
            }
        } else {
            var tableGlanceElements = $('.table.transactions.transactions' + coinFullName + ' .tableRow').children('.glance').filter(':visible');

            tableGlanceElements.removeClass("cssTransactionRowSelected");


            var tableVerboseElements = $('.table.transactions.transactions' + coinFullName + ' .tableRow').children('.verbose').filter(':visible');

            //            console.log("num elements :: " + tableVerboseElements.length);
            tableVerboseElements.slideToggle();
        }
    }

    var clearInputFields = function() {
        //@note: @todo: @here: @next: @optimization: this should check for no value before resetting values.
        Navigation.ignoreUpdateFromInputFieldEntry = true;

        clearAndTriggerIfNotEmpty = function(inputFieldName) {
//            console.log("clearing :: inputFieldName :: " + inputFieldName);
            if ($(inputFieldName).val() != '') {
                $(inputFieldName).val('').trigger('keyup');
            }
        }

        clearAndTriggerIfNotEmpty('.settings.sweepPrivateKey input');
        clearAndTriggerIfNotEmpty('.settings.sweepPrivateKeyPasswordEntry input');
        clearAndTriggerIfNotEmpty('.tabContent .address input');
        clearAndTriggerIfNotEmpty('.tabContent .amount input');
        clearAndTriggerIfNotEmpty('.advancedTabContentEthereum .customGasLimit input');
        clearAndTriggerIfNotEmpty('.advancedTabContentEthereum .customData input');

        $('.ethereumChecksumAddressWarningText').slideUp();

        Navigation.ignoreUpdateFromInputFieldEntry = false;

        updateFromInputFieldEntry();
    }

    var setupCoinUI = function(targetCoinType) {
        Navigation.hideEthereumAdvancedMode();

        //@note: @here: @token: this seems necessary.
        if (targetCoinType === COIN_BITCOIN ||
            targetCoinType === COIN_THEDAO_ETHEREUM ||
            targetCoinType === COIN_DASH ||
            targetCoinType === COIN_AUGUR_ETHEREUM ||
            targetCoinType === COIN_AUGUR_ETHEREUM ||
            targetCoinType === COIN_GOLEM_ETHEREUM ||
            targetCoinType === COIN_GNOSIS_ETHEREUM ||
            targetCoinType === COIN_ICONOMI_ETHEREUM ||
            targetCoinType === COIN_SINGULARDTV_ETHEREUM ||
            targetCoinType === COIN_DIGIX_ETHEREUM ||
            targetCoinType === COIN_BLOCKCHAINCAPITAL_ETHEREUM ||
            targetCoinType === COIN_CIVIC_ETHEREUM ||
            targetCoinType === COIN_LITECOIN ||
            targetCoinType === COIN_LISK ||
            targetCoinType === COIN_ZCASH ||
            targetCoinType === COIN_DOGE) {
            $('.tabContent .advancedTabButton').slideUp();
            $('.tabContent .advancedTabButton').hide();
        } else if (targetCoinType === COIN_ETHEREUM ||
                   targetCoinType === COIN_ETHEREUM_CLASSIC ||
                   targetCoinType === COIN_TESTNET_ROOTSTOCK) {

            Navigation.setEthereumAdvancedModeCustomGasLimitSuggestion(0, null);

            $('.advancedTabButton').unbind();
            $('.advancedTabButton').bind('click', null, function() {
                if (Navigation.ethereumAdvancedModeHidden()) {
                    Navigation.showEthereumAdvancedMode();
                } else {
                    Navigation.hideEthereumAdvancedMode();
                }

                console.log("toggle advanced tab");
            });

            if (g_JaxxApp.getShapeShiftHelper().getIsTriggered()) {

            } else {
                $('.tabContent .advancedTabButton').show();
            }
        }
    }

    var ethereumSecretSelectorActivate = function() {
        if(!PlatformUtils.mobileCheck() && !PlatformUtils.extensionCheck() && !PlatformUtils.desktopCheck() ){
            var newProfileMode = (curProfileMode === PROFILE_PORTRAIT) ? PROFILE_LANDSCAPE : PROFILE_PORTRAIT;

            Navigation.setProfileMode(newProfileMode);
        }

        if (typeof(ethereumUnlocked) === 'undefined' || ethereumUnlocked === null || ethereumUnlocked === false) {
            if (ethereumSecretProgress > 1 && ethereumSecretProgress < 4) {
                ethereumSecretProgress++;

                //                console.log("ethereumSecretProgress :: " + ethereumSecretProgress);
                if (ethereumSecretProgress === 4) {
                    console.log("[Unlock Ethereum]");

                    ethereumUnlocked = true;
                    storeData('ethereum_unlocked', ethereumUnlocked);

g_JaxxApp.getUI().resetCoinButton(COIN_ETHEREUM);
                    $('.imageLogoBannerETH').fadeTo(0, 1);
                    Navigation.switchToEthereum(true);
                }
            } else {
                ethereumSecretProgress = 0;
            }
        }
    }

    var showSpinner = function(targetCoinType) {
        var coinSpinnerElementName = HDWalletPouch.getStaticCoinPouchImplementation(targetCoinType).uiComponents['coinSpinnerElementName'];

        $(coinSpinnerElementName).show();
        $(coinSpinnerElementName).fadeTo(100, 1);
        $(coinSpinnerElementName).css('z-index', '1100');
    }

    var hideSpinner = function(targetCoinType) {
        var coinSpinnerElementName = HDWalletPouch.getStaticCoinPouchImplementation(targetCoinType).uiComponents['coinSpinnerElementName'];

        $(coinSpinnerElementName).fadeTo(500, 0);
        $(coinSpinnerElementName).css('z-index', '-1');

        setTimeout(function() {
            $(coinSpinnerElementName).hide();
        }, 500);
    }

    var startBlit = function() {
        //        console.log("resize :: " + resize);
        resize();
        setTimeout(function() {
            resize();
        }, 50);

        if (hasBlit === false) {
            hasBlit = true;

            Navigation.clearInputFields();

            if (PlatformUtils.extensionCheck() || PlatformUtils.desktopCheck()) {
            } else if (PlatformUtils.mobileCheck()) {
                console.log("< mobile mode >");
                function stopAllAnimations() {
                    for (cName in transitionElementNames) {
                        var element = $(transitionElementNames[cName]);
                        element.removeClass('animated');
                        element.addClass('animatedInstant');
                    }
                }

                stopAllAnimations();
                Navigation.hideUI(curProfileMode, curProfileMode, function() {

                }, false, curCoinType);

                setTimeout(function() {

                    function playAllAnimations() {
                        for (cName in transitionElementNames) {
                            var element = $(transitionElementNames[cName]);
                            element.removeClass('animatedInstant');
                            element.addClass('animated');
                        }
                    }

                    playAllAnimations();

                    $('.wallet').fadeTo(0, 1);

                    Navigation.showUI(curProfileMode, curProfileMode);
                }, 10);
            } else {
                //@note: desktop
            }
        }
        //g_JaxxApp.getUI().hideApplicationLoadingScreen();
    }

    //@note: @here: this function will only set it to closed properly, and doesn't
    //take into account the submenus.
    var setMainMenuOpen = function(isMainMenuOpenStatus) {
        if (isMainMenuOpenStatus === false) {
            //$('.wallet .menu,.wallet .dismiss').fadeOut();
			g_JaxxApp.getUI().closeMainMenu();
        }

        specialAction('toggleMainMenuOff', null);
    }

    var tryToOpenExternalLink = function(url)
    {
        console.log('open external link '+ url);
        if(PlatformUtils.desktopCheck()){ //Desktop
            require('electron').remote.shell.openExternal(url);
        }
        else if(PlatformUtils.extensionChromeCheck()){ //Chrome extension
            chrome.tabs.create({ url: url });
        }
        else if(PlatformUtils.mobileAndroidCheck() || PlatformUtils.mobileiOSCheck()){ //Android
            if (window.native && window.native.openExternalURL) {
                native.openExternalURL(url);
            }
        }
        else{//@TODO
            console.log("Not supported yet for this platform");
        }
    }


    var tryToOpenExternalLinkMobile = function(event){
        var urlToOpen = event.data.param1;
        Navigation.tryToOpenExternalLink(urlToOpen);
    }

    var setProfileMode = function(newProfileMode) {
        console.log("switch to profile mode :: " + newProfileMode);
        canUpdateWalletUI = false;

        //        Navigation.hideUI(curProfileMode, newProfileMode, function () {
        Navigation.hideUI(curProfileMode, newProfileMode, function () {
            completeSwitchToProfileMode(newProfileMode)
        }, false);
    }

    var showEthereumAdvancedMode = function() {
        ethereumAdvancedModeHidden = false;

        // when advancedmode is showing...
        $('.advancedBtnImage').hover(mouseEnterAdvancedBtnImageShowing,mouseLeaveEnterAdvancedBtnImageShowing);
        $('.tabContent .advancedTabContentEthereum').slideDown();
    }

    var mouseEnterAdvancedBtnImageShowing = function() {
        $('.advancedBtnImage').attr('src', 'img/Icon_up_hover.svg');
        $('.cssAdvancedTabButton').css('background-color','transparent');
    }

    var mouseLeaveEnterAdvancedBtnImageShowing = function() {
        $('.advancedBtnImage').attr('src', 'img/Icon_up.svg');
    }

    var hideEthereumAdvancedMode = function() {
        ethereumAdvancedModeHidden = true;

        // When advancedmode is not showing...
        $('.advancedBtnImage').hover(mouseEnterAdvancedBtnImageHiding,mouseLeaveEnterAdvancedBtnImageHiding);
        $('.tabContent .advancedTabContentEthereum').slideUp();
    }

    var mouseEnterAdvancedBtnImageHiding = function() {
        $('.advancedBtnImage').attr('src', 'img/Icon_down_hover.svg');
        $('.cssAdvancedTabButton').css('background-color','transparent');
    }

    var mouseLeaveEnterAdvancedBtnImageHiding = function() {
        $('.advancedBtnImage').attr('src', 'img/Icon_down.svg');
    }

    var ethereumAdvancedModeHidden = function() {
        return ethereumAdvancedModeHidden;
    }

    var setEthereumAdvancedModeCustomGasLimitSuggestion = function(customGasLimit, addressTypeName) {
        if (customGasLimit > 0) {
            $('.gasLimitSuggestion').text("Suggested for this " + addressTypeName + ": " + customGasLimit);
        } else {
            $('.gasLimitSuggestion').text("(No valid address entered)");
        }
    }

    var showEthereumLegacySweep = function(legacyEthereumBalance) {
        console.log("[ethereum] :: loaded legacy wallet support :: hasGlitchedLegacyEthereumWallet :: " + wallet.hasGlitchedLegacyEthereumWallet());

        $('.ethereumLegacySweepEtherAmount').text(HDWalletHelper.convertWeiToEther(legacyEthereumBalance) + " ETH");

        $('.ethereumLegacySweepTXCost').text(HDWalletHelper.convertWeiToEther(HDWalletHelper.getDefaultEthereumGasLimit().mul(HDWalletHelper.getDefaultEthereumGasPrice()).toString()) + " ETH");

        $('.ethereumLegacySweepConfirmButton').off('click');

        $('.ethereumLegacySweepConfirmButton').on('click', function() {
            wallet.transferLegacyEthereumAccountToHDNode();
            Navigation.closeModal();
        });

        Navigation.openModal('ethereumLegacySweepModal');
    }

    var toggleCurrency = function(pCurrency, pEnabled){
        //Parameters: pEnabled is optional.
        console.log("Toggling currency Currency: " + pCurrency + " Enabled: " + pEnabled);
        if (typeof pEnabled === 'undefined') {
            // In this case we remove the currency if it is in the list and add it to the list if it is not there.
            if ($.inArray(pCurrency, _currenciesEnabled) > -1) {
                pEnabled = false;
            } else {
                pEnabled = true;
            }
        }
        if (pEnabled && (!$.inArray(pCurrency, _currenciesEnabled) > -1)){
            // Run this if block if the user ticked the box.
            console.log("Adding currency " + pCurrency);
            Navigation.enableCurrencyInData(pCurrency);
            wallet.getHelper().setFiatUnit(pCurrency);
            $(".exchangeRateList").find('[value='+pCurrency+']').addClass('cssCurrencyHighlightText'); // Set currency block to orange F27221.

            $(".exchangeRateList").find('[value='+pCurrency+']').find('.cssSelectedCurrency').find('.cssCircleUnchecked').css('border', 'none');
            $(".exchangeRateList").find('[value='+pCurrency+']').find('.cssSelectedCurrency').find('.cssCircleUnchecked').addClass('cssCurrencyisChecked');
            //            $(".exchangeRateList").find('[value='+pCurrency+']').find('.cssSelectedCurrency').find('.circle-checked').css('border', 'none');

            _currenciesEnabled.sort();
        } else if (!pEnabled && ($.inArray(pCurrency , _currenciesEnabled) > -1)){
            if (_currenciesEnabled.length > 1){
                // Now set the default currency to the most recent element pushed to _currenciesEnabled.

                // Run this if block if the user unticked the box.
                Navigation.disableCurrencyInData(pCurrency);

                $(".exchangeRateList").find('[value='+pCurrency+']').removeClass('cssCurrencyHighlightText'); // Set currency block to orange F27221.

                $(".exchangeRateList").find('[value='+pCurrency+']').find('.cssSelectedCurrency').find('.cssCircleUnchecked').css('border', '1px solid white');
                $(".exchangeRateList").find('[value='+pCurrency+']').find('.cssSelectedCurrency').find('.cssCircleUnchecked').removeClass('cssCurrencyisChecked');

            } else { // The user has tried to deselect the only selected currency.
                // Navigation.flashBanner("You must have at least one currency selected.", 5)
            }
        }

        if (Navigation.isUseFiat()) {
            $('.unitToggle .symbol').text(wallet.getHelper().getFiatUnitPrefix());
        }

        if (_currenciesEnabled.length <= 1) {
            $(".displayCurrenciesSelectedArrow").hide();
        } else {
            $(".displayCurrenciesSelectedArrow").show();
        }

        // Set currencies menu element here
        g_JaxxApp.getUI().updateSettingsUI();
        updateWalletUI();

        // @Note: Navigation.getCurrencies()

        storeData('currencies_selected', JSON.stringify(_currenciesEnabled));

    }

    var isCurrencyEnabled = function(pCurrency){
        if ($.inArray(pCurrency, _currenciesEnabled) > -1){
            return true;
        }
        return false;
    }

    var getEnabledCurrencies = function(){
        return _currenciesEnabled;
    }

    var enableCurrencyInData = function(fiatUnit){
        _currenciesEnabled.push(fiatUnit);
        storeData('currencies_selected', JSON.stringify(_currenciesEnabled));
    }

    var disableCurrencyInData = function(fiatUnit){
        var index = _currenciesEnabled.indexOf(fiatUnit);
        if (index > -1) {
            _currenciesEnabled.splice(index, 1);
            if (fiatUnit === wallet.getHelper().getFiatUnit()){
                wallet.getHelper().setFiatUnit(_currenciesEnabled[0]); // Set fiat currency to most recently chosen currency.
            }
        }
        storeData('currencies_selected', JSON.stringify(_currenciesEnabled));
    }

    var disableAllCurrencies = function() {
        while (_currenciesEnabled.length > 0) {
            _currenciesEnabled.pop();
        }
        storeData('currencies_selected', JSON.stringify(_currenciesEnabled));
    }
    var getTopOfSettingsStack = function(){
        if (settingsStack.length > 0){
            return settingsStack[settingsStack.length - 1];
        } else {
            return null;
        }
    }

    return {

        // Modal
        openModal: openModal,
        closeModal: closeModal,

        // Notification banner
        openNotificationBanner: openNotificationBanner,
        closeNotificationBanner: closeNotificationBanner,

        // @note: Switching coins
        clearInputFields: clearInputFields,

        // Using Fiat vs. Bitcoin for units
        isUseFiat: isUseFiat,
        setUseFiat: setUseFiat,
        toggleUseFiat: toggleUseFiat,

        // Tabs
        getTab: getTab,
        collapseTabs: collapseTabs,
        showTab: showTab,
        toggleTab: toggleTab,

        // Settings
        clearSettings: clearSettings,
        pushSettings: pushSettings,
        popSettings: popSettings,
        getTopOfSettingsStack: getTopOfSettingsStack,

        // Banner
        flashBanner: flashBanner,
        flashBannerMultipleMessages: flashBannerMultipleMessages,
        clearFlashBanner: clearFlashBanner,

        // @note: ui stuff;
        hideUI: hideUI,
        showUI: showUI,

        // @note: Returning to default view
        returnToDefaultView: returnToDefaultView,
        hideTransactionHistoryDetails: hideTransactionHistoryDetails,

        // @note: clearing input fields
        clearInputFields: clearInputFields,

        //@note: for setting up coin-specific ui elements.
        setupCoinUI: setupCoinUI,

        // @note: ethereum secret selector
        ethereumSecretSelectorActivate: ethereumSecretSelectorActivate,

        // @note: currency spinners
        showSpinner: showSpinner,
        hideSpinner: hideSpinner,

        // @note: show animations
        startBlit: startBlit,

        // @note: main menu navigation from mobile (Android)
        //setMainMenuOpen: setMainMenuOpen,

        // @note: opening external link support for various platforms
        tryToOpenExternalLink: tryToOpenExternalLink,
        tryToOpenExternalLinkMobile: tryToOpenExternalLinkMobile,

        // @note: profile mode portrait/landscape transition;
        setProfileMode: setProfileMode,

        // @note: ethereum specific features:
        showEthereumAdvancedMode: showEthereumAdvancedMode,
        hideEthereumAdvancedMode: hideEthereumAdvancedMode,
        ethereumAdvancedModeHidden: ethereumAdvancedModeHidden,
        setEthereumAdvancedModeCustomGasLimitSuggestion: setEthereumAdvancedModeCustomGasLimitSuggestion,

        // @note: ethereum legacy sweeping of funds:
        showEthereumLegacySweep: showEthereumLegacySweep,

        // @note: getSettingsStack for getting the stack settings variable when debugging.
        getSettingsStack: getSettingsStack,

        // @note: quick fiat currency selection
        toggleCurrency: toggleCurrency,
        isCurrencyEnabled: isCurrencyEnabled,
        getEnabledCurrencies: getEnabledCurrencies,
        enableCurrencyInData: enableCurrencyInData,
        disableCurrencyInData: disableCurrencyInData,
        disableAllCurrencies: disableAllCurrencies
    };
})()


function completeSwitchToProfileMode(newProfileMode) {
    switchToProfileMode(newProfileMode);
    Navigation.showUI(curProfileMode, newProfileMode);

    canUpdateWalletUI = true;
    forceUpdateWalletUI();
    resize();
}

function parseJaxxToken(jaxxToken, callback) {
    var comps = HDWalletMain.getCompsFromJaxxToken(jaxxToken);
    var mnemonicEncrypted = g_Vault.encryptSimple(thirdparty.bip39.entropyToMnemonic(comps[0]));

    // @TODO: A refactor here.
    var newWallet = new HDWalletMain();
    newWallet.initialize();
    //    var mnemonicEncrypted = getStoredData('mnemonic', false);

    newWallet.setupWithEncryptedMnemonic(mnemonicEncrypted, function(err) {
        if (err) {
            console.log("parseJaxxToken :: error :: " + err);
            callback(err, null);
        } else {
            //            console.log("parseJaxxToken :: wallet :: " + wallet + " :: " + wallet.getMnemonic() + " :: getRootNodeAddress :: " + wallet.getPouchFold(COIN_BITCOIN).getRootNodeAddress() + " :: comps[1] :: " + comps[1]);
            if (newWallet.getPouchFold(COIN_BITCOIN).getRootNodeAddress() !== comps[1]) {
                var errStr = "root node doesn't match";
                console.log("parseJaxxToken :: error :: " + errStr);
                callback(err, null);
            } else {
                callback(null, newWallet);
            }
        }

    });
}

function setupBackupPrivateKeys(coinType) {
    g_JaxxApp.getUI().updateAndLoadPrivateKeyList(coinType);
    if (coinType === COIN_ETHEREUM) {
        setupEthereumLegacyLightwalletKeypairDisplay();
    }
}

function setupEthereumLegacyLightwalletKeypairDisplay() {
    //    console.log("setupEthereumLegacyLightwalletKeypairDisplay");
    var ethereumLegacyLightwalletAccount = wallet.getEthereumLegacyLightwalletAccount();
    //            var ethereumLegacyStableKeypair = wallet.getEthereumLegacyStableKeypair();

    if (ethereumLegacyLightwalletAccount !== null) {
        g_JaxxApp.getUI().setupEthereumLegacyKeypairDisplay(ethereumLegacyLightwalletAccount);

        $('.backupPrivateKeyListETHLegacyLightwallet').text(ethereumLegacyLightwalletAccount.pubAddr + ", " + ethereumLegacyLightwalletAccount.pvtKey);
        if (wallet.hasGlitchedLegacyEthereumWallet()) {
            //$('.backupPrivateKeyListETHLegacyWarning').show();
        } else {
            // $('.backupPrivateKeyListETHLegacyWarning').hide();
        }
    } else {
        if (wallet.getHasSetupLegacyEthereumSweep()) {
            $('.backupPrivateKeyListETHLegacyLightwallet').text("We're having trouble detecting your non-HD keypair. Please attempt a Cache Reset (see Tools).");
            // $('.backupPrivateKeyListETHLegacyWarning').hide();
        } else {
            //            console.log("force lightwallet load");
            $('.accountDataEthereumLegacyKeypair .accountPublicAddress').text("Please wait a moment while we load the previous wallet path.");
            $('.accountDataEthereumLegacyKeypair .accountPrivateKey').text("");
            $('.accountDataEthereumLegacyKeypair .accountBalance').text("");

            wallet.setShouldSetUpLegacyEthereumSweep(setupEthereumLegacyLightwalletKeypairDisplay, setupEthereumLegacyLightwalletKeypairDisplay);
            $('.backupPrivateKeyListETHLegacyLightwallet').text("Please wait a moment while we load the previous wallet path.");
            // $('.backupPrivateKeyListETHLegacyWarning').hide();
        }
    }
}

function setupExportPrivateKeys(coinType) {
    var csvExportField = HDWalletPouch.getStaticCoinPouchImplementation(coinType).uiComponents["csvExportField"];

    var printStr = g_JaxxApp.getUI()._strKeyPair;
    //wallet.getPouchFold(coinType).getPrivateKeyCSVList();
    //wallet.getAddressesAndKeysCSVForCoinType(coinType);
    $('.backupPrivateKeyListcopy').attr('copy', printStr);
    $(csvExportField).text(printStr);
}


//@note: returns the detected coin type.
function checkAndSetupSendScan(uri, targetCoinType) {
    var parsed = HDWalletHelper.parseURI(uri);

    // Invalid
    if (!parsed) { return -1; }

    // Are we the type of coin we expect?
    var baseCoinFormatAddressType = {bitcoin: COIN_BITCOIN, 'ether': COIN_ETHEREUM, 'dash': COIN_DASH, 'litecoin': COIN_LITECOIN, 'lisk': COIN_LISK, 'zcash': COIN_ZCASH, 'dogecoin': COIN_DOGE}[parsed.coin];

    console.log("checkAndSetupSendScan :: " + JSON.stringify(parsed) + " :: baseCoinFormatAddressType :: " + baseCoinFormatAddressType + " :: targetCoinType :: " + targetCoinType);

    if (typeof(targetCoinType) !== 'undefined') {
        if (wallet.getPouchFold(targetCoinType).getBaseCoinAddressFormatType() !== baseCoinFormatAddressType) {
            return -1;
        }
    }

    // Fill in the UI
    $('.tabContent .address input').val(parsed.address).trigger('keyup');
    if (parsed.amount) {
        $('.tabContent .amount input').val(parsed.amount).trigger('keyup');
    }

    return baseCoinType;
}

function checkSendScan(uri) {
    var parsed = HDWalletHelper.parseURI(uri);

    // Invalid
    if (!parsed) { return -1; }

    return {bitcoin: COIN_BITCOIN, 'ether': COIN_ETHEREUM, 'dash': COIN_DASH, 'litecoin': COIN_LITECOIN, 'lisk': COIN_LISK, 'zcash': COIN_ZCASH, 'doge': COIN_DOGE}[parsed.coin];
}

function prepareSweepTxCallbackForPrivateKeyImport(error, info, coinType) {
    // This is called when:
    // The user enters their private key and then hits 'Next'.
    var feedbackMessage = "";
    if (error) {
        // Error.
        // This code runs when the private key specified is simply invalid.
        console.log('Sweep error: ' + error.message);
        $('.settings.confirmSweepPrivateKey .button').hide();
        feedbackMessage = "Error Scanning Private Key";
    } else if (info) {
        // Plenty of funds.
        // This code runs when the private key specified has plenty of funds available for a transaction.
        var coinAbbreviatedName = HDWalletPouch.getStaticCoinPouchImplementation(coinType).pouchParameters['coinAbbreviatedName'];
        // $('.settings.confirmSweepPrivateKey .button').data('transaction', info.signedTransaction);
        wallet.setPreparedTransactionPrivateKeyInput(info.signedTransaction);
        $('.settings.confirmSweepPrivateKey .button').addClass('enabled').addClass('cssEnabled');
        $('.settings.confirmSweepPrivateKey .button').show();
        feedbackMessage = "The Balance for this Private Key is " + info.totalValue + " " + coinAbbreviatedName;
        //g_JaxxApp.getUI().switchToCoin(coinType);
    } else {
        // Not enough funds.
        // This code runs when the private key specified does have enough funds for a transaction.
        // Navigation.flashBanner('Insufficient Balance', 5);
        $('.settings.confirmSweepPrivateKey .button').hide();
        feedbackMessage = "Insufficient Balance";
    }
    $('.settings.confirmSweepPrivateKey .spinner').text(feedbackMessage);
}

function prepareSweepTxCallbackForPrivateKeyScansWithCamera(error, info) {
    // This is called when:
    // The user enters their private key and then hits 'Next'.
    var feedbackMessage = "";
    if (error) {
        // Error.
        // This code runs when the private key specified is simply invalid.
        console.log('Sweep error: ' + error.message);
        g_JaxxApp.getUI().closeMainMenu();
        //Navigation.flashBanner('Error', 5);
        feedbackMessage = "Error Scanning Private Key";
    } else if (info) {
        // Plenty of funds.
        // This code runs when the private key specified has plenty of funds available for a transaction.
        var coinAbbreviatedName = HDWalletPouch.getStaticCoinPouchImplementation(curCoinType).pouchParameters['coinAbbreviatedName'];
        // $('.settings.confirmSweepPrivateKey .button').data('transaction', info.signedTransaction);
        wallet.setPreparedTransactionPrivateKeyInput(info.signedTransaction);
        $('.settings.confirmSweepPrivateKey .button').addClass('enabled').addClass('cssEnabled');
        $('.settings.confirmSweepPrivateKey .button').show();
        feedbackMessage = "The Balance for this Private Key is " + info.totalValue + coinAbbreviatedName;
    } else {
        // Not enough funds.
        // This code runs when the private key specified does have enough funds for a transaction.
        // Navigation.flashBanner('Insufficient Balance', 5);
        $('.settings.confirmSweepPrivateKey .amount').text('Insufficient Balance'); // User feeback message when the balance is insufficient for the given Private Key.
        $('.settings.confirmSweepPrivateKey .button').hide();
        feedbackMessage = "Insufficient Balance";
    }
    $('.settings.confirmSweepPrivateKey .amount').text(feedbackMessage);

    $('.settings.confirmSweepPrivateKey .spinner').hide();
}

function sendTransaction() {
    var now = Math.floor(new Date().getTime()/1000);
    if (Math.abs(now-lastSentTimestampSeconds) > 2){ //force two seconds before sending next tx
        lastSentTimestampSeconds = Math.floor(new Date().getTime()/1000);

        //        if (data.transaction) {
        //            console.log("data.transaction :: " + JSON.stringify(data.transaction));
        //        } else if (data.txArray) {
        //            for (var i = 0; i < data.txArray.length; i++) {
        //                console.log("data.txArray[" + i + "] :: " + JSON.stringify(data.txArray[i].hash));
        //            }
        //        }


        //        return;
/////////////////////////////////////////////////////////////////////////// SEND TRANSACTION ////////////////////////////////////////////////////
        //var data = $('.modal.send').data('transaction');
        var data = wallet.getPouchFold(curCoinType).getTransactionData();

        //console.log(jaxx.Registry.currentTransaction);

        //console.log(data);

        g_JaxxApp._dataStoreController.onSendTransactionStart(data);

    // console.warn(data);
     // jaxx.Registry.sendTransaction$.triggerHandler('ON_CONFIRMED_TRANSACTION_' + curCoinType,data);

        if (data) {

            if (curCoinType === COIN_BITCOIN) {

              //  console.log(data);




                wallet.getPouchFold(curCoinType).getPouchFoldImplementation().sendBitcoinTransaction(data.transaction, function(response, tx) {
                    if (response.status == 'success' || response == 'success') {
                        $('.tabContent .address input').val('');
                        $('.tabContent .amount input').val('').trigger('keyup');
                        setTimeout(function() {
                            playSound("snd/balance.wav", null, null);
                            Navigation.flashBanner('Transaction Sent', 3, 'success');
                        },1500);

                        //                        g_JaxxApp.getTXManager().addTXOfType(g_JaxxApp.getTXManager().getCurrentTXType(), COIN_BITCOIN, data.transaction.hash);
                        Navigation.returnToDefaultView();
                        Navigation.hideTransactionHistoryDetails();
                    } else {
                        Navigation.flashBanner('Error: ' + response.message, 5);
                        console.log('Error', response.message);
                    }

                    //@note: @here: always update the tx history for sends.
                    forceUpdateWalletUI();
                });
            } else if (curCoinType === COIN_ETHEREUM) {

                var txArray = wallet.getPouchFold(curCoinType).getPouchFoldImplementation().constructEthereumTransactionListFromReadyTransactionList(data.readyTxArray);


               // console.warn(txArray);
               // return;



                if (typeof(txArray) !== 'undefined' && txArray !== null) {

                    g_JaxxApp.getTXManager().sendEthereumLikeTXList(COIN_ETHEREUM, {txArray: txArray}, function(result) {
                      console.log("sendTransaction :: result :: " + result);
                      if (result === 'success') {
                          $('.tabContent .address input').val('');
                          $('.tabContent .amount input').val('').trigger('keyup');

                          setTimeout(function() {
                              playSound("snd/balance.wav", null, null);
                              Navigation.flashBanner('Transaction Sent', 3, 'success');
                          },1500);


                        //  for (var i = 0; i < data.txArray.length; i++) {
                              //@note: @here: @next: tx members.
                              //                                    g_JaxxApp.getTXManager().addTXOfType(g_JaxxApp.getTXManager().getCurrentTXType(), COIN_ETHEREUM, data.txArray[i].hash);
                         // }

                          Navigation.returnToDefaultView();
                          Navigation.hideTransactionHistoryDetails();
                      } else if (result === 'failure') {
                          //@note: all of the batch failed:
                          Navigation.flashBanner('Transaction Failed', 5, 'error');
                          console.log('Error', status);
                      } else { //@note: partial failure.
                          //@note: some of the batch succeeded, some failed:

                          $('.tabContent .address input').val('');
                          $('.tabContent .amount input').val('').trigger('keyup');

                          playSound("snd/balance.wav", null, null);
                          Navigation.flashBanner('Batch Transaction Failed', 5);

                          Navigation.returnToDefaultView();
                          Navigation.hideTransactionHistoryDetails();
                      }

                      //@note: @here: always update the tx history for sends.
                      forceUpdateWalletUI();
                  });
                } else {
                    console.prepareAddresseslog("[ sendTransaction ] :: ethereum :: error :: cannot build txList for send :: " + txArray);
                }
            } else if (curCoinType === COIN_ETHEREUM_CLASSIC) {
                g_JaxxApp.getTXManager().sendEthereumLikeTXList(COIN_ETHEREUM_CLASSIC, data, function(result) {
                    console.log("sendTransaction :: result :: " + result);
                    if (result === 'success') {
                        $('.tabContent .address input').val('');
                        $('.tabContent .amount input').val('').trigger('keyup');

                        setTimeout(function() {
                            playSound("snd/balance.wav", null, null);
                            Navigation.flashBanner('Transaction Sent', 3, 'success');
                        },1500);

//                        for (var i = 0; i < data.txArray.length; i++) {
                            //@note: @here: @next: tx members.
                            //                                    g_JaxxApp.getTXManager().addTXOfType(g_JaxxApp.getTXManager().getCurrentTXType(), COIN_ETHEREUM, data.txArray[i].hash);
//                        }

                        Navigation.returnToDefaultView();
                        Navigation.hideTransactionHistoryDetails();
                    } else if (result === 'failure') {
                        //@note: all of the batch failed:
                        Navigation.flashBanner('Transaction Failed', 5, 'error');
                        console.log('Error', status);
                    } else { //@note: partial failure.
                        //@note: some of the batch succeeded, some failed:

                        $('.tabContent .address input').val('');
                        $('.tabContent .amount input').val('').trigger('keyup');

                        playSound("snd/balance.wav", null, null);
                        Navigation.flashBanner('Batch Transaction Failed', 5);

                        Navigation.returnToDefaultView();
                        Navigation.hideTransactionHistoryDetails();
                    }

                    //@note: @here: always update the tx history for sends.
                    forceUpdateWalletUI();
                });
            } else if (curCoinType === COIN_THEDAO_ETHEREUM ||
                       curCoinType === COIN_AUGUR_ETHEREUM ||
                       curCoinType === COIN_GOLEM_ETHEREUM ||
                       curCoinType === COIN_GNOSIS_ETHEREUM ||
                       curCoinType === COIN_ICONOMI_ETHEREUM ||
                       curCoinType === COIN_SINGULARDTV_ETHEREUM ||
                       curCoinType === COIN_DIGIX_ETHEREUM ||
                       curCoinType === COIN_BLOCKCHAINCAPITAL_ETHEREUM ||
                       curCoinType === COIN_CIVIC_ETHEREUM) {

                g_JaxxApp.getTXManager().sendEthereumLikeTXList(COIN_ETHEREUM, data, function(result) {
                    console.log("sendTransaction :: result :: " + result);
                    if (result === 'success') {
                        $('.tabContent .address input').val('');
                        $('.tabContent .amount input').val('').trigger('keyup');

                        setTimeout(function() {
                            playSound("snd/balance.wav", null, null);
                            Navigation.flashBanner('Transaction Sent', 3, 'success');
                        },1500);

//                        for (var i = 0; i < data.txArray.length; i++) {
                            //@note: @here: @next: tx members.
                            //                                    g_JaxxApp.getTXManager().addTXOfType(g_JaxxApp.getTXManager().getCurrentTXType(), COIN_THEDAO_ETHEREUM, data.txArray[i].hash);
//                        }

                        Navigation.returnToDefaultView();
                        Navigation.hideTransactionHistoryDetails();
                    } else if (result === 'failure') {
                        //@note: all of the batch failed:
                        Navigation.flashBanner('Error: Please check to ensure you have enough ether on this address', 15, 'error');
                        console.log('Error', status);
                    } else { //@note: partial failure.
                        //@note: some of the batch succeeded, some failed:
                        $('.tabContent .address input').val('');
                        $('.tabContent .amount input').val('').trigger('keyup');

                        playSound("snd/balance.wav", null, null);
                        Navigation.flashBanner('Batch Transaction: Some Failed', 5);

                        Navigation.returnToDefaultView();
                        Navigation.hideTransactionHistoryDetails();
                    }

                    //@note: @here: always update the tx history for sends.
                    forceUpdateWalletUI();
                });
            } else if (curCoinType === COIN_DASH) {
                //@note: @todo: @here: @next:
                wallet.getPouchFold(curCoinType).getPouchFoldImplementation().sendDashTransaction(data.transaction, function(response, tx) {

                    if (response.status == 'success' || response == 'success') {
                        $('.tabContent .address input').val('');
                        $('.tabContent .amount input').val('').trigger('keyup');

                        setTimeout(function() {
                            playSound("snd/balance.wav", null, null);
                            Navigation.flashBanner('Transaction Sent', 3, 'success');
                        },1500);

                        //                        g_JaxxApp.getTXManager().addTXOfType(g_JaxxApp.getTXManager().getCurrentTXType(), COIN_BITCOIN, data.transaction.hash);
                        Navigation.returnToDefaultView();
                        Navigation.hideTransactionHistoryDetails();
                    } else {
                        Navigation.flashBanner('Transaction Failed', 3, 'error');
                        console.log('Error', response.message);
                    }

                    //@note: @here: always update the tx history for sends.
                    forceUpdateWalletUI();
                });
            } else if (curCoinType === COIN_LITECOIN) {
                //@note: @todo: @here: @next:
                wallet.getPouchFold(curCoinType).getPouchFoldImplementation().sendLitecoinTransaction(data.transaction, function(response, tx) {

                    if (response.status == 'success' || response == 'success') {
                        $('.tabContent .address input').val('');
                        $('.tabContent .amount input').val('').trigger('keyup');

                        setTimeout(function() {
                            playSound("snd/balance.wav", null, null);
                            Navigation.flashBanner('Transaction Sent', 3, 'success');
                        },1500);

                        //                        g_JaxxApp.getTXManager().addTXOfType(g_JaxxApp.getTXManager().getCurrentTXType(), COIN_BITCOIN, data.transaction.hash);
                        Navigation.returnToDefaultView();
                        Navigation.hideTransactionHistoryDetails();
                    } else {
                        Navigation.flashBanner('Transaction Failed', 3, 'error');
                        console.log('Error', response.message);
                    }

                    //@note: @here: always update the tx history for sends.
                    forceUpdateWalletUI();
                });
            } else if (curCoinType === COIN_LISK) {
                //@note: @todo: @lisk:
//                wallet.getPouchFold(curCoinType).getPouchFoldImplementation().sendLitecoinTransaction(data.transaction, function(response, tx) {
//
//                    if (response.status == 'success' || response == 'success') {
//                        $('.tabContent .address input').val('');
//                        $('.tabContent .amount input').val('').trigger('keyup');
//
//                        playSound("snd/balance.wav", null, null);
//                        Navigation.flashBanner('Successfully Sent', 5);
//
//                        //                        g_JaxxApp.getTXManager().addTXOfType(g_JaxxApp.getTXManager().getCurrentTXType(), COIN_BITCOIN, data.transaction.hash);
//                        Navigation.returnToDefaultView();
//                        Navigation.hideTransactionHistoryDetails();
//                    } else {
//                        Navigation.flashBanner('Error: ' + response.message, 5);
//                        console.log('Error', response.message);
//                    }
//
//                    //@note: @here: always update the tx history for sends.
//                    forceUpdateWalletUI();
//                });
            } else if (curCoinType === COIN_ZCASH) {
                //@note: @todo: @here: @next:
                wallet.getPouchFold(curCoinType).getPouchFoldImplementation().sendZCashTransaction(data.transaction, function(response, tx) {

                    if (response.status == 'success' || response == 'success') {
                        $('.tabContent .address input').val('');
                        $('.tabContent .amount input').val('').trigger('keyup');

                        setTimeout(function() {
                            playSound("snd/balance.wav", null, null);
                            Navigation.flashBanner('Transaction Sent', 3, 'success');
                        },1500);

                        //                        g_JaxxApp.getTXManager().addTXOfType(g_JaxxApp.getTXManager().getCurrentTXType(), COIN_BITCOIN, data.transaction.hash);
                        Navigation.returnToDefaultView();
                        Navigation.hideTransactionHistoryDetails();
                    } else {
                        Navigation.flashBanner('Transaction Failed', 3, 'error');
                        console.log('Error', response.message);
                    }

                    //@note: @here: always update the tx history for sends.
                    forceUpdateWalletUI();
                });
            } else if (curCoinType === COIN_TESTNET_ROOTSTOCK) {
                g_JaxxApp.getTXManager().sendEthereumLikeTXList(COIN_TESTNET_ROOTSTOCK, data, function(result) {
                    console.log("sendTransaction :: result :: " + result);
                    if (result === 'success') {
                        $('.tabContent .address input').val('');
                        $('.tabContent .amount input').val('').trigger('keyup');

                        setTimeout(function() {
                            playSound("snd/balance.wav", null, null);
                            Navigation.flashBanner('Transaction Sent', 3, 'success');
                        },1500);

//                        for (var i = 0; i < data.txArray.length; i++) {
                            //@note: @here: @next: tx members.
                            //                                    g_JaxxApp.getTXManager().addTXOfType(g_JaxxApp.getTXManager().getCurrentTXType(), COIN_ETHEREUM, data.txArray[i].hash);
//                        }

                        Navigation.returnToDefaultView();
                        Navigation.hideTransactionHistoryDetails();
                    } else if (result === 'failure') {
                        //@note: all of the batch failed:
                        Navigation.flashBanner('Transaction Failed', 3, 'error');
                        console.log('Error', status);
                    } else { //@note: partial failure.
                        //@note: some of the batch succeeded, some failed:

                        $('.tabContent .address input').val('');
                        $('.tabContent .amount input').val('').trigger('keyup');

                        playSound("snd/balance.wav", null, null);
                        Navigation.flashBanner('Batch Transaction: Some Failed', 3);

                        Navigation.returnToDefaultView();
                        Navigation.hideTransactionHistoryDetails();
                    }

                    //@note: @here: always update the tx history for sends.
                    forceUpdateWalletUI();
                });
            } else if (curCoinType === COIN_DOGE) {
                //@note: @todo: @here: @next:
                wallet.getPouchFold(curCoinType).getPouchFoldImplementation().sendDogeTransaction(data.transaction, function(response, tx) {

                    if (response.status == 'success' || response == 'success') {
                        $('.tabContent .address input').val('');
                        $('.tabContent .amount input').val('').trigger('keyup');

                        setTimeout(function() {
                            playSound("snd/balance.wav", null, null);
                            Navigation.flashBanner('Transaction Sent', 3, 'success');
                        },1500);

                        //                        g_JaxxApp.getTXManager().addTXOfType(g_JaxxApp.getTXManager().getCurrentTXType(), COIN_BITCOIN, data.transaction.hash);
                        Navigation.returnToDefaultView();
                        Navigation.hideTransactionHistoryDetails();
                    } else {
                        console.log('Error', response.message);
                    }

                    //@note: @here: always update the tx history for sends.
                    forceUpdateWalletUI();
                });
            }
        }
    }
    else{
        console.log("Already sending another tx. Please wait a few seconds");
    }
}

function specialAction(actionName, element) {
  // console.warn(actionName, curCoinType);

    if (actionName.indexOf(',') > - 1){ // For multiple actions
        specialAction(actionName.slice(0, actionName.lastIndexOf(',')), element);
        actionName = actionName.slice(actionName.lastIndexOf(',') + 1, actionName.length);
    }
    //  console.log(element);
    if (typeof(element) !== 'undefined' && element !== null) {
        console.log('%c specialAction ' + actionName + ' classes: '+ element.attr("class"),'color:green');
    } else {
        console.log('%c specialAction ' + actionName,'color:green');
    }

    if (typeof(ethereumUnlocked) === 'undefined' || ethereumUnlocked === null || ethereumUnlocked === false) {
        if (actionName !== 'refresh' && ethereumSecretProgress !== 4) {
            ethereumSecretProgress = 0;
        }
    }

    if (actionName.substr(0, actionName.indexOf('.')) === 'jaxx_ui'){
        if (actionName.indexOf('.') < actionName.length - 1){
            var strFunctionToCallInModule = actionName.substr(actionName.indexOf('.') + 1);
            g_JaxxApp.getUI()[strFunctionToCallInModule](element);
        }
    }
    if (actionName.substr(0, actionName.indexOf('.')) === 'jaxx_ui_intro'){
        if (actionName.indexOf('.') < actionName.length - 1){
            var strFunctionToCallInModule = actionName.substr(actionName.indexOf('.') + 1);
            g_JaxxApp.getUI().getIntro()[strFunctionToCallInModule](element);
        }
    }
    if (actionName.substr(0, actionName.indexOf('.')) === 'jaxx_controller'){
        if (actionName.indexOf('.') < actionName.length - 1){
            var strFunctionToCallInModule = actionName.substr(actionName.indexOf('.') + 1);
            g_JaxxApp.getController()[strFunctionToCallInModule](element);
        }
    }
    if (actionName === 'testActionopen') {
        g_JaxxApp.getUI().openSendModal();
    }
    if (actionName === 'testActionclose') {
        g_JaxxApp.getUI().closeSendModal();
    }


    if (actionName === 'walletSendPreConfirmation') {


        if(curCoinType == 0){
            var miningFeeOptionChosen = wallet.getPouchFold(curCoinType).getMiningFeeLevel();


            console.log('MINING FEES | specialAction :: ' + miningFeeOptionChosen);

            if (miningFeeOptionChosen === HDWalletPouch.MiningFeeLevelSlow) {
                // $('input#slowMiningFeePopup').prop('checked', true);
                $('input#slowMiningFeeMainMenu').prop('checked', true);
            }
            if (miningFeeOptionChosen === HDWalletPouch.MiningFeeLevelFast) {
                // $('input#slowMiningFeePopup').prop('checked', true);
                $('input#fastMiningFeeMainMenu').prop('checked', true);
            }
            if (miningFeeOptionChosen === HDWalletPouch.MiningFeeLevelAverage) {
                // $('input#averageMiningFeePopup').prop('checked', true);
                $('input#averageMiningFeeMainMenu').prop('checked', true);
            }

            if (miningFeeOptionChosen === HDWalletPouch.MiningFeeLevelSlow) {
                Navigation.openModal('miningFeesModal');
            } else {
                specialAction('walletSendReceive', element);
            }

        }else   specialAction('walletSendReceive', element);



    }
    if (actionName === 'walletSendReceive') {

        wallet.getPouchFold(curCoinType).setTransactionData(wallet.getPouchFold(curCoinType).getTransactionDataTemp());
        jaxx.Registry.currentTransaction =  jaxx.Registry.currentTransactionTemp;


        if ($('.tabContent .amount .button').hasClass('enabled')) {

            var coinAbbreviatedNameCur = HDWalletPouch.getStaticCoinPouchImplementation(curCoinType).pouchParameters['coinAbbreviatedName'];

            var tab = Navigation.getTab();
            //var data = $('.modal.send').data('transaction');

            var data = wallet.getPouchFold(curCoinType).getTransactionData();

            if (tab === 'send' && data) {
                if (g_JaxxApp.getShapeShiftHelper().getIsTriggered()) {
                    // @TODO: add fiat converted amount
                    //                    $('.modal.send .address').text(data.address);

                    var receiveCoinType = g_JaxxApp.getShapeShiftHelper().getReceivePairForCoinType(curCoinType);

                    if (Navigation.isUseFiat()) {
                        $('.modal.shift .amountAbbreviatedNameSend').text(wallet.getHelper().getFiatUnit());
                        $('.modal-bottom .cssShapShiftConfirmation .amountAbbreviatedNameSend').text(wallet.getHelper().getFiatUnit());
                    } else {
                        $('.modal.shift .amountAbbreviatedNameSend').text(coinAbbreviatedNameCur);
                        $('.modal-bottom .cssShapShiftConfirmation .amountAbbreviatedNameSend').text(coinAbbreviatedNameCur);
                    }

                    var coinAbbreviatedNameReceive = HDWalletPouch.getStaticCoinPouchImplementation(receiveCoinType).pouchParameters['coinAbbreviatedName'];

                    $('.modal.shift .amountAbbreviatedNameReceive').text(coinAbbreviatedNameReceive);
                    $('.modal-bottom .cssShapShiftConfirmation .amountAbbreviatedNameReceive').text(coinAbbreviatedNameReceive);

                    var miningAbbreviatedName = coinAbbreviatedNameCur;

                    if (wallet.getPouchFold(curCoinType).isTokenType() === true) {
                        miningAbbreviatedName = HDWalletPouch.getStaticCoinPouchImplementation(CoinToken.getMainTypeToTokenCoinHolderTypeMap(curCoinType)).pouchParameters['coinAbbreviatedName'];
                    }

                    $('.modal.shift .miningFeeAbbreviatedName').text(miningAbbreviatedName);
                    $('.modal-bottom .cssShapShiftConfirmation .miningFeeAbbreviatedName').text(miningAbbreviatedName);


                    var scaledAmountSend = HDWalletHelper.getCoinDisplayScalar(curCoinType, data.coinAmount_unitLarge, Navigation.isUseFiat());

                    var marketData = g_JaxxApp.getShapeShiftHelper().getMarketForCoinTypeSend(curCoinType);

                    var receiveScalar = 1.0;
                    if (curCoinType === COIN_THEDAO_ETHEREUM) {
                        receiveScalar = 100;
                    }

                    var scaledAmountReceive = receiveScalar * marketData.exchangeRate * data.coinAmount_unitLarge;

                    if (Navigation.isUseFiat()){
                        var fiatUnit = wallet.getHelper().getFiatUnit();
                        scaledAmountReceive = parseFloat(wallet.getPouchFold(curCoinType).convertFiatToCoin(scaledAmountReceive, COIN_UNITLARGE, fiatUnit));
                    }
                    //                    HDWalletHelper.getCoinDisplayScalar(receiveCoinType, marketData.exchangeRate * data.coinAmount_unitLarge, false);
                    scaledAmountReceive = scaledAmountReceive.toFixed(8);
                    $('.modal.shift .amountSend').text(scaledAmountSend);
                    $('.modal.shift .amountReceive').text(scaledAmountReceive);
                    $('.modal-bottom .cssShapShiftConfirmation .amountSend').text(scaledAmountSend);
                    $('.modal-bottom .cssShapShiftConfirmation .amountReceive').text(scaledAmountReceive);

                    g_JaxxApp.getTXManager().setCurrentTXType(TX_SHAPESHIFT);
                    g_JaxxApp.getUI().showShiftModal();

                    if (curCoinType === COIN_BITCOIN){ // Is the current coin bitcoin?
                        // Change the text in the send modal for the mining fee type (ie. Slow/Average/Fast).
                        //$(".modal-bottom .miningFeeDescription").html(HDWalletPouch.dictMiningOptionText[HDWalletPouch.MiningFeeLevelSlow]);
                        //$(".modal-bottom .cssShapShiftConfirmation .miningFeeDescription").html(HDWalletPouch.dictMiningOptionText[HDWalletPouch.MiningFeeLevelSlow]);
                        g_JaxxApp.getUI().pushBTCMiningFeeFromPouchToModal();
                    } else {
                        // Set the text to empty which describes the mining fee type.
                        $(".modal-bottom .cssShapShiftConfirmation .miningFeeDescription").html('');
                    }

                } else {
                    // @TODO: add fiat converted amount
                    var coinAbbreviatedName = HDWalletPouch.getStaticCoinPouchImplementation(curCoinType).pouchParameters['coinAbbreviatedName'];

                    $('.modal.send .address').text(data.address);
                    $('.modal-bottom .cssSendConfirmation .address').text(data.address);

                    if (Navigation.isUseFiat()) {
                        $('.modal.send .amountAbbreviatedName').text(wallet.getHelper().getFiatUnit());
                        $('.modal-bottom .cssSendConfirmation .amountAbbreviatedName').text(wallet.getHelper().getFiatUnit());
                    } else {
                        $('.modal.send .amountAbbreviatedName').text(coinAbbreviatedName);
                        $('.modal-bottom .cssSendConfirmation .amountAbbreviatedName').text(coinAbbreviatedName);
                    }

                    var miningAbbreviatedName = coinAbbreviatedName;

                    if (wallet.getPouchFold(curCoinType).isTokenType() === true) {
                        miningAbbreviatedName = HDWalletPouch.getStaticCoinPouchImplementation(CoinToken.getMainTypeToTokenCoinHolderTypeMap(curCoinType)).pouchParameters['coinAbbreviatedName'];
                    }

                    $('.modal.send .miningFeeAbbreviatedName').text(miningAbbreviatedName);
                    $('.modal-bottom .cssSendConfirmation .miningFeeAbbreviatedName').text(miningAbbreviatedName);


                    var scaledAmount = HDWalletHelper.getCoinDisplayScalar(curCoinType, data.coinAmount_unitLarge, Navigation.isUseFiat());

                    if (Navigation.isUseFiat() && curCoinType === COIN_THEDAO_ETHEREUM) {
                        scaledAmount *= 100;
                    }


                    $('.modal.send .amount').text(scaledAmount);
                    $('.modal-bottom .cssSendConfirmation .amount').text(scaledAmount);

                    g_JaxxApp.getTXManager().setCurrentTXType(TX_GENERIC);
                    g_JaxxApp.getUI().showSendModal();

                    if (curCoinType === COIN_BITCOIN){ // Is the current coin bitcoin?
                        // Change the text in the send modal for the mining fee type (ie. Slow/Average/Fast).
                        //$(".modal-bottom .miningFeeDescription").html(HDWalletPouch.dictMiningOptionText[HDWalletPouch.MiningFeeLevelSlow]);
                        // $(".modal-bottom .cssSendConfirmation .miningFeeDescription").html(HDWalletPouch.dictMiningOptionText[HDWalletPouch.MiningFeeLevelSlow]);
                        g_JaxxApp.getUI().pushBTCMiningFeeFromPouchToModal();
                    } else {
                        // Set the text to empty which describes the mining fee type.
                        $(".modal-bottom .cssSendConfirmation .miningFeeDescription").html('');
                    }
                }
            } else if (tab === 'receive' && data) {
                var qrCodeImage = null;

                var coinAmountSmallType = 0;

                if (Navigation.isUseFiat()) {
                    //            console.log("fiat");
                    var fiatUnit = wallet.getHelper().getFiatUnit();
                    coinAmountSmallType = wallet.getPouchFold(curCoinType).convertFiatToCoin(data.coinAmount_unitLarge, COIN_UNITLARGE, fiatUnit);
                } else {
                    //            console.log("not fiat");
                    coinAmountSmallType = data.coinAmount_unitLarge;
                }

                var scaledAmount = HDWalletHelper.getCoinDisplayScalar(curCoinType, coinAmountSmallType, Navigation.isUseFiat());

                qrCodeImage = wallet.getPouchFold(curCoinType).generateQRCode(true, scaledAmount);

                if (qrCodeImage != null) {
                    if (Navigation.isUseFiat()) {
                        $('.modal.receive .amountAbbreviatedName').text(wallet.getHelper().getFiatUnit());
                    } else {
                        $('.modal.receive .amountAbbreviatedName').text(coinAbbreviatedNameCur);
                    }

                    var scaledAmount = HDWalletHelper.getCoinDisplayScalar(curCoinType, data.coinAmount_unitLarge, Navigation.isUseFiat());

                    $('.modal.receive .amount').text(scaledAmount);

                    $(".modal.receive .qrCode img").attr("src", qrCodeImage);

                    Navigation.openModal('receive');
                } else {
                    console.log("!! error :: could not create qr code for :: " + coinAbbreviatedNameCur + " !!");
                }
            }
        }

    } else if (actionName === 'refresh') {
        if (typeof(ethereumUnlocked) === 'undefined' || ethereumUnlocked === null || ethereumUnlocked === false) {
            if (ethereumSecretProgress < 2) {
                ethereumSecretProgress++;
            }
        }

        var coinFullName = HDWalletPouch.getStaticCoinPouchImplementation(curCoinType).uiComponents['coinFullName'];

        console.log("[ Wallet Update :: " + coinFullName + " ]");

        wallet.getPouchFold(curCoinType).refresh();
        //wallet.getPouchFold(curCoinType).getDataStorageController().getBalanceTotalDB()

        $('.refresh').addClass('cssActive');
        setTimeout(function () {
            $('.refresh').removeClass('cssActive');
        }, 400);

    } else if (actionName === 'spendableMaxButtonPressed') {
        var coinBalance = 0;
        var minimumSpendable = 0;

        if (g_JaxxApp.getShapeShiftHelper().getIsTriggered()) {
            var marketMinimum = g_JaxxApp.getShapeShiftHelper().getMarketMinimumForCoinTypeSend(curCoinType);

            if (typeof(marketMinimum) !== 'undefined' && marketMinimum !== null) {
                minimumSpendable = parseInt(HDWalletHelper.convertCoinToUnitType(curCoinType, marketMinimum, COIN_UNITSMALL));

                if (curCoinType === COIN_THEDAO_ETHEREUM) {
                    minimumSpendable /= 100;
                }
            }
        }

        if (minimumSpendable > 0) {
            coinBalance = wallet.getPouchFold(curCoinType).getSpendableBalance(minimumSpendable);
        } else {
            coinBalance = wallet.getPouchFold(curCoinType).getSpendableBalance();
        }

        if (Navigation.isUseFiat()) {
            //            console.log("convertCoinToFiat(coinBalance, COIN_UNITSMALL) :: " + convertCoinToFiat(coinBalance, COIN_UNITSMALL, true).substr(1));
            if (HDWalletHelper.convertCoinToUnitType(curCoinType, coinBalance, COIN_UNITLARGE) != 0) {
                var fiatAmount = wallet.getHelper().convertCoinToFiatWithFiatType(curCoinType, coinBalance, COIN_UNITSMALL, null, true);

                var spendableFiatScaled = fiatAmount;

                //                console.log("spendableFiatScaled :: " + spendableFiatScaled);
                populateSpendMax(HDWalletHelper.getCoinDisplayScalar(curCoinType, spendableFiatScaled, true));
            }
        } else {
            if (HDWalletHelper.convertCoinToUnitType(curCoinType, coinBalance, COIN_UNITLARGE) != 0) {
                var spendableCoinScaled = HDWalletHelper.getCoinDisplayScalar(curCoinType, HDWalletHelper.convertCoinToUnitType(curCoinType, coinBalance, COIN_UNITLARGE));

                //spendableCoinScaled = parseFloat(parseFloat(spendableCoinScaled).toFixed(8));

                populateSpendMax(spendableCoinScaled);
            }
        }
        wallet.getPouchFold(curCoinType).setIsSendingFullMaxSpendable(true); // Added to accomodate Anthony's business logic request: Spendable balance must empty wallet
        wallet.getPouchFold(curCoinType).setMaxSpendableCachedAmount($("#amountSendInput").val()); // Always couple with previous call.
        $('.tabContent .amount input').trigger('keyup'); // Must be just after setIsSendingFullMaxSpendable
    } else if (actionName === 'sendConfirm') {
        Navigation.closeModal();
        Navigation.closeNotificationBanner('.cssSendConfirmation');
        Navigation.closeNotificationBanner('.cssShapShiftConfirmation');

        if (g_JaxxApp.getUser().hasPin()) {
            g_JaxxApp.getUI().showEnterPinModal(function(error) {
                if (error) {
                    console.log("enter pin error :: " + error);
                } else {
                    sendTransaction();
                }
            });
        } else {
            sendTransaction();
        }
    } else if (actionName === "createWallet") {
        HDWalletMain.createWallet(null, function(err, wallet){
            if (err) {
                console.log("createWallet :: error :: " + err);
                console.log('Failed To Create HD Wallet');
            } else {
                storeData('mnemonic', wallet.getMnemonic(),true);
                setTimeout(function() {
                    Navigation.flashBanner("Interface Successfully Created", 3, 'success');
                }, 2000);
                //Navigation.flashBannerMultipleMessages(['Back up your wallet', 'Go to Tools > Display Backup Phrase'], 10);

                Navigation.startBlit();

                setTimeout(function() {
                    if (PlatformUtils.extensionChromeCheck()) {

                    } else if (PlatformUtils.extensionFirefoxCheck()) {
                        Navigation.openModal('firefoxWarningPopupFirstFrame');
                    }
                }, 500);
                removeStoredData('fiat');
            }
        });
    } else if (actionName === 'scanPayment') {
        if (window.native && window.native.scanCode) {
            var processScan = function(uri) {
                console.log("scanPayment :: found uri :: " + uri);

                var foldMainCoinType = curCoinType;

                if (wallet.getPouchFold(curCoinType).isTokenType() === true) {
                    foldMainCoinType = CoinToken.getMainTypeToTokenCoinHolderTypeMap(curCoinType);
                }

                foundCoinType = checkAndSetupSendScan(uri, foldMainCoinType);

                if (foundCoinType === foldMainCoinType) {
                    console.log("scanPayment :: found coin type :: " + foundCoinType);
                }
            };

            Navigation.clearInputFields();
            native.scanCode(processScan);
        }
    } else if (actionName === 'scanPrivateKey') {
        if (window.native && window.native.scanCode) {
            var processScan = function(uri) {
                console.log("scanPrivateKey :: found qr :: " + uri);
                $('#privateKeySweep').val(uri).trigger('keyup');
            };

            $('#privateKeySweep').val('').trigger('keyup');

            Navigation.clearInputFields();

            native.scanCode(processScan);
        }
    } else if (actionName === 'quickVerifyMnemonic.prepare') {
        var words = wallet.getMnemonic().split(' ');
        var index = parseInt(Math.random() * words.length);
        var ordinalIndex = [
            'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth',
            'ninth', 'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth',
            'seventeenth', 'eighteenth','nineteenth', 'twentieth', ' twenty-first', 'twenty-second',
            'twenty-third', 'twenty-fourth'
        ][index];

        var input = $('.settings.quickVerifyMnemonic input');

        input.data('word', words[index]);
        input.attr('placeholder', input.attr('placeholderFormat').replace('%s', ordinalIndex));
        input.val('');

    } else if (actionName === 'viewJaxxToken.prepare') {
        //@note:@todo:@here:
        var uri = "jaxx:" + thirdparty.bip39.mnemonicToEntropy(wallet.getMnemonic()) + '/' + wallet.getPouchFold(COIN_BITCOIN).getRootNodeAddress();
        var qrCodeImage = thirdparty.qrImage.imageSync(uri, {
            type: "png",
            ec_level: "H"
        }).toString('base64');
        $(".settings.viewJaxxToken .jaxxToken img").attr("src", "data:image/png;base64," + qrCodeImage)
    } else if (actionName === 'viewJaxxBackupPhrase.prepare') {
        //@note:@todo:@here:
        var uri = "jaxx:" + thirdparty.bip39.mnemonicToEntropy(wallet.getMnemonic()) + '/' + wallet.getPouchFold(COIN_BITCOIN).getRootNodeAddress();
        var qrCodeImage = thirdparty.qrImage.imageSync(uri, {
            type: "png",
            ec_level: "H"
        }).toString('base64');
        $(".settings.viewJaxxBackupPhrase .jaxxToken img").attr("src", "data:image/png;base64," + qrCodeImage)
    } else if (actionName === 'importMnemonic.import') {

        //Navigation.openModal('loading');
        /*
        $('.btnRespondToMnemonicInput').removeClass('enabled').removeClass('cssEnabled');
        g_JaxxApp.getUI().closeMainMenu();
        var mnemonicEncrypted = g_Vault.encryptSimple($(element.attr('targetInput')).val());
        jaxx.Utils2.setMnemonic($(element.attr('targetInput')).val());
        //storeData('mnemonic', mnemonicEncrypted,true);
        var saveAndRestoreData = {
//            "mnemonic": {data: null, isEncrypted: false},
//            "crypto_currency_position_data": {data: null, isEncrypted: false},
//            "crypto_currency_enabled_data": {data: null, isEncrypted: false},
//            "currencies_position_order": {data: null, isEncrypted: false},
//            "currencies_selected": {data: null, isEncrypted: false},
            "hasShownTermsOfService": {data: null, isEncrypted: false},
        };

        for (var curValKey in saveAndRestoreData) {
            var isEncrypted = saveAndRestoreData[curValKey].isEncrypted;
            saveAndRestoreData[curValKey].data = getStoredData(curValKey, isEncrypted);
        }

        clearAllData(); //Clear local storage

        for (var curValKey in saveAndRestoreData) {
            var curData = saveAndRestoreData[curValKey].data;
            var isEncrypted = saveAndRestoreData[curValKey].isEncrypted;

            if (typeof(curData) !== 'undefined' && curData !== null) {
                storeData(curValKey, curData, isEncrypted);
            }
        }


        $(element.attr('targetInput')).val('') ; //Clear HTML field or it stays there
        setTimeout(function() {
            loadFromEncryptedMnemonic(mnemonicEncrypted, function(err, wallet) {
                if (err) {
                    console.log("importMnemonic.import :: error :: " + err);

                    Navigation.flashBanner("Error on Import Attempt", 5);
                    Navigation.closeModal();
                    Navigation.startBlit();
                } else {

                    ///////////////////////////////________________________________________________________________

                   // window.localStorage.clear();

                    storeData('mnemonic', wallet.getMnemonic(),true);

                    //showCreateWalletNotifications() should be called for notifications at appropriate time
                    //Navigation.flashBanner("Successfully Imported!", 5, 'success');

                    Navigation.closeModal();
                    Navigation.startBlit();
                    // g_JaxxApp.getUI().initializeBTCMiningOptions(wallet);
                    forceUpdateWalletUI();

                }
            });
        }, 1000);*/

        g_JaxxApp.getController().clickContinuePairFromDevice(element);

        // Navigation.clearSettings();
        // storeData("tipAndTricksShown", true);
    } else if  (actionName === 'confirmBackup') {
        //@note:@todo:@here:
        g_JaxxApp.getUI().closeMainMenu();
        console.log("confirmed backup");
        wallet.confirmBackup();
        updateWalletUI();
        var $elTextbox = $('.verifyMnemonic .validateMnemonic');
        ///$elTextbox.text('');
        $elTextbox.val('');
        setTimeout(function() {
            Navigation.flashBanner("Your wallet is now backed up", 5);
        },1000);
    } else if (actionName === 'sweepPrivateKey.prepare') {
        g_JaxxApp.getUI().setStandardMessageForTransferPaperWallet();
        var privateKey = $('#privateKeySweep').val();
        var coinType = g_JaxxApp.getUI().getTransferPaperWalletCoinType();
        wallet.getPouchFold(coinType).prepareSweepTransaction(privateKey, prepareSweepTxCallbackForPrivateKeyImport);

        var privateKey = $('#privateKeySweep').val('').trigger('keyup');

    } else if (actionName === 'sweepPrivateKey.showDecrypt') {
        if (curCoinType === COIN_BITCOIN ||
            curCoinType === COIN_DASH ||
            curCoinType === COIN_LITECOIN ||
            curCoinType === COIN_ZCASH ||
            curCoinType === COIN_DOGE) {
            loadScript('js/thirdparty/bip38-dist.js', callBackOnLoadBIP38Internal, callBackOnErrLoadBIP38);
        }
    }
    else if (actionName === 'sweepPrivateKey.tryToDecrypt') {
        $('#bip38ProgressDiv').show();
        var pass = $('.settings.sweepPrivateKeyPasswordEntry input').val();
        var pvtkey = $('#privateKeySweep').val();

        var nextSweepPassBehaviours = buttonBehaviours['nextSweepPass'];
        nextSweepPassBehaviours.disableButton();

        setTimeout(function() {
            var unencrypted = "";
            var validResult = false;
            if (curCoinType === COIN_BITCOIN) {
                unencrypted = tryToDecryptBIP38KeySync(pvtkey,pass);
                //currently there is no way to tell if the pass is wrong
                if(isValidBTCPrivateKey(unencrypted)){
                    validResult = true;
                }
            } else if (curCoinType === COIN_ETHEREUM) {
                unencrypted = decryptETHKey(pvtkey,pass);
                if(isValidETHPrivateKey(unencrypted)){
                    validResult= true;
                }
            } else if (curCoinType === COIN_DASH) {
                unencrypted = tryToDecryptBIP38KeySync(pvtkey,pass);
                //currently there is no way to tell if the pass is wrong
                //@note: this should work properly.
                if(isValidBTCPrivateKey(unencrypted, HDWalletPouchDash.networkDefinitions.mainNet)){
                    validResult = true;
                }
            }

            $('#bip38ProgressDiv').hide();
            if (validResult === true) {
                //                console.log("valid password :: " + unencrypted);
                $('#privateKeySweep').val(unencrypted);
                specialAction('sweepPrivateKey.prepare');
                Navigation.pushSettings('confirmSweepPrivateKey');
                $('.settings.sweepPrivateKeyPasswordEntry input').val('').trigger('keyup');
            }
            else {
                console.log("invalid password");
                shake($('.nextSweepPass'));
            }

            var nextSweepPassBehaviours = buttonBehaviours['nextSweepPass'];
            nextSweepPassBehaviours.enableButton();

        }, 500); //@@
    }
    else if (actionName === 'sweepPrivateKey.execute') {
        // Paper wallet replace
        // var signedTransaction = $('.settings.confirmSweepPrivateKey .button').data('transaction');
        var signedTransaction = wallet.getPreparedTransactionPrivateKeyInput();
        var coinType = g_JaxxApp.getUI().getTransferPaperWalletCoinType();
        var callback = g_JaxxApp.getUI().sweepPrivateKeyExecuteCallback;
        wallet.getPouchFold(coinType).getPouchFoldImplementation().sendTransaction(signedTransaction, callback, null, -1);
    }
    else if (actionName === 'onename.register') {
        var onename = $(element).data('onename');
        Onename.registerUsername(onename, wallet.getOnenameAddress(), function (error, success) {
            console.log(success, error);
            if (error) {
                console.log('Onename error', error);

            } else {
                wallet.setOnename(onename);

                Navigation.flashBanner('Onename request sent', 5);
                Navigation.clearSettings();
            }
        });

    } else if (actionName === 'scan') {
        //@note: middle camera button functionality
        var processScan = function(uri) {
            console.log("scan :: found uri :: " + uri);
            //@note: check for sending uri
            //@note: @todo: @next

            var foundScanSendCoinType = checkSendScan(uri);

            if (foundScanSendCoinType != -1) {
                console.log("scan send :: found coin type :: " + foundScanSendCoinType);

                switchToCoinType(foundScanSendCoinType, null, function() {
                    Navigation.showTab('send');
                    checkAndSetupSendScan(uri);
                });
            } else if(isValidBTCPrivateKey(uri)){
                //@note: @todo: @next: check this out for dash & other bitcoin-like coins.
                console.log("scan ::  valid private key for BTC :: ");
                wallet.getPouchFold(COIN_BITCOIN).prepareSweepTransaction(uri,prepareSweepTxCallbackForPrivateKeyScansWithCamera);

                if(curCoinType!=COIN_BITCOIN){
                    switchToCoinType(COIN_BITCOIN, null, function() {
                        //$('.confirmSweepPrivateKey').show(); //wait before showing import
                        Navigation.pushSettings('confirmSweepPrivateKey');
                    });
                } else {
                    Navigation.pushSettings('confirmSweepPrivateKey');
                    //$('.confirmSweepPrivateKey').show();  //update UI right away
                }
            } else if (isValidBTCPrivateKey(uri, HDWalletPouchDash.networkDefinitions.mainNet)) {
                console.log("scan ::  valid private key for DASH :: ");
                wallet.getPouchFold(COIN_DASH).prepareSweepTransaction(uri,prepareSweepTxCallbackForPrivateKeyScansWithCamera);

                if(curCoinType != COIN_DASH){
                    switchToCoinType(COIN_DASH, null, function() {
                        //$('.confirmSweepPrivateKey').show(); //wait before showing import
                        Navigation.pushSettings('confirmSweepPrivateKey');
                    });
                } else {
                    Navigation.pushSettings('confirmSweepPrivateKey');
                    //$('.confirmSweepPrivateKey').show();  //update UI right away
                }
            } else if (isValidBTCPrivateKey(uri, HDWalletPouchLitecoin.networkDefinitions.mainNet)) {
                console.log("scan ::  valid private key for LITECOIN :: ");
                wallet.getPouchFold(COIN_LITECOIN).prepareSweepTransaction(uri,prepareSweepTxCallbackForPrivateKeyScansWithCamera);

                if(curCoinType != COIN_LITECOIN){
                    switchToCoinType(COIN_LITECOIN, null, function() {
                        //$('.confirmSweepPrivateKey').show(); //wait before showing import
                        Navigation.pushSettings('confirmSweepPrivateKey');
                    });
                } else {
                    Navigation.pushSettings('confirmSweepPrivateKey');
                    //$('.confirmSweepPrivateKey').show();  //update UI right away
                }

                //@note: @here: @lisk:
            } else if (isValidBTCPrivateKey(uri, HDWalletPouchZCash.networkDefinitions.mainNet)) {
                console.log("scan ::  valid private key for ZCASH :: ");
                wallet.getPouchFold(COIN_ZCASH).prepareSweepTransaction(uri,prepareSweepTxCallbackForPrivateKeyScansWithCamera);

                if(curCoinType != COIN_ZCASH){
                    switchToCoinType(COIN_ZCASH, null, function() {
                        //$('.confirmSweepPrivateKey').show(); //wait before showing import
                        Navigation.pushSettings('confirmSweepPrivateKey');
                    });
                } else {
                    Navigation.pushSettings('confirmSweepPrivateKey');
                    //$('.confirmSweepPrivateKey').show();  //update UI right away
                }
            } else if (isValidETHPrivateKey(uri)){
                console.log("scan ::  valid private key for ETH :: ");
                wallet.getPouchFold(COIN_ETHEREUM).prepareSweepTransaction(uri,prepareSweepTxCallbackForPrivateKeyScansWithCamera);

                if(curCoinType!=COIN_ETHEREUM){
                    switchToCoinType(COIN_ETHEREUM, null, function() {
                        //$('.confirmSweepPrivateKey').show(); //wait before showing import
                        Navigation.pushSettings('confirmSweepPrivateKey');
                    });
                } else {
                    Navigation.pushSettings('confirmSweepPrivateKey');
                }

            } else if(isValidETHAESkey(uri)){
                console.log("scan ::  valid encrypted private key for ETH :: ");
                if(curCoinType!=COIN_ETHEREUM){
                    switchToCoinType(COIN_ETHEREUM, null, function() {
                        $('#privateKeySweep').val(uri).trigger('keyup');
                        Navigation.pushSettings('sweepPrivateKeyPasswordEntry');
                    });
                } else {
                    $('#privateKeySweep').val(uri).trigger('keyup');
                    Navigation.pushSettings('sweepPrivateKeyPasswordEntry');
                }
            } else if(isValidBIP38key(uri)){
                console.log("scan ::  valid encrypted BIP38 private key for BTC :: ");
                loadScript('js/thirdparty/bip38-dist.js', callBackOnLoadBIP38Internal, callBackOnErrLoadBIP38);
                if (curCoinType!=COIN_BITCOIN){
                    switchToCoinType(COIN_BITCOIN, null, function() {
                        $('#privateKeySweep').val(uri).trigger('keyup');
                        Navigation.pushSettings('sweepPrivateKeyPasswordEntry');
                    });
                } else {
                    $('#privateKeySweep').val(uri).trigger('keyup');
                    Navigation.pushSettings('sweepPrivateKeyPasswordEntry');
                }
            } else if (isValidBTCPrivateKey(uri, HDWalletPouchDoge.networkDefinitions.mainNet)) {
                console.log("scan ::  valid private key for DOGE :: ");
                wallet.getPouchFold(COIN_DOGE).prepareSweepTransaction(uri,prepareSweepTxCallbackForPrivateKeyScansWithCamera);

                if(curCoinType != COIN_DOGE){
                    switchToCoinType(COIN_DOGE, null, function() {
                        //$('.confirmSweepPrivateKey').show(); //wait before showing import
                        Navigation.pushSettings('confirmSweepPrivateKey');
                    });
                } else {
                    Navigation.pushSettings('confirmSweepPrivateKey');
                    //$('.confirmSweepPrivateKey').show();  //update UI right away
                }

                //@note: @here: @lisk:
            } else {
                var jaxxToken = uri;

                parseJaxxToken(jaxxToken, function(err, newWallet) {
                    if (err) {
                        console.log("scan for Jaxx token :: error :: " + err);
                    } else {
                        scanImportWallet = newWallet;
                        Navigation.openModal('scanPrivate');
                    }
                });
            }
        }

        Navigation.clearInputFields();

        native.scanCode(processScan);
    } else if (actionName === 'confirmImportPrivateKey') {
        //        console.log("confirmImportPrivateKey");
        if (typeof(scanImportWallet) !== 'undefined' && scanImportWallet != null) {
            setTimeout(function() {
                setTimeout(function() {

                    //@note: @here: @todo: @next:
                    _loadWallet(scanImportWallet);

                    scanImportWallet = null;

                    storeData('mnemonic', wallet.getMnemonic(),true);
                    //showCreateWalletNotifications() should be called for notifications at appropriate time
                    //Navigation.flashBanner("Successfully Imported!", 5, 'success');
                    Navigation.closeModal();
                }, 1000);

                Navigation.clearSettings();
                Navigation.openModal('loading');
            }, 500);
        } else {
            console.log("no private key code to import");
        }
    } else if (actionName === 'cancelImportPrivateKey') {
        //        console.log("cancelImportPrivateKey");
        scanImportWallet = null;
//    } else if (actionName === 'toggleMainMenuOn') {
//		g_JaxxApp.getUI().openMainMenu();
//    } else if (actionName === 'toggleMainMenuOff') {
//        console.log("toggle menu off");
//		g_JaxxApp.getUI().closeMainMenu();
//	} else if (actionName === 'toggleMainMenuOffAndAnimate') {
//		g_JaxxApp.getUI().animateHamburgerMenu();
//		g_JaxxApp.getUI().closeMainMenu();
    } else if (actionName === 'chooseDefaultCurrency') {
	//} else if (actionName === 'promptUserForCacheReset') {
		// This is where we write code to open the modal when the user selects 'Reset Jaxx Cache'
		//Navigation.openModal('resetJaxxCache');
    } else if (actionName === 'resetCache') {
        g_JaxxApp._settings.resetJaxxCache();
        location.reload();
    } else if (actionName === 'showJaxxNews') {
        //Navigation.setMainMenuOpen(false);
		    g_JaxxApp.getUI().closeMainMenu();
        g_JaxxApp.getUI().displayJaxxNews();
    } else if (actionName === "toggleQuickFiatCurrencySelector") {
        g_JaxxApp.getUI().toggleQuickFiatCurrencySelector();
    } else if (actionName === "setDefaultCurrencyFromMenu") {
        g_JaxxApp.getUI().setDefaultCurrencyFromMenu(element);
    } else if (actionName === 'quickFiatCurrencySwitch') {
        g_JaxxApp.getUI().quickFiatCurrencySwitch(element);
    } else if (actionName === 'showDAORefund') {
        g_JaxxApp.getUI().showDAORefund(element);
    } else if (actionName === 'confirmDAORefund') {
        g_JaxxApp.getUI().confirmDAORefund(element);
    } else if (actionName === 'toggleShapeshiftCoinSelector') {
		g_JaxxApp.getUI().toggleShapeshiftCoinList();
    } else if (actionName === 'toggleMainMenu') {
		g_JaxxApp.getUI().toggleMainMenu();
	} else if (actionName === 'enableOptionTab') {
		if (element.attr('value') === 'menu'){
			g_JaxxApp.getUI().mainMenuShowMenu();
		} else if (element.attr('value') === 'wallets') {
			g_JaxxApp.getUI().mainMenuShowWallets();
		} else if (element.attr('value') === 'currencies') {
			g_JaxxApp.getUI().mainMenuShowCurrencies();
		}
	} else if (actionName === 'toggleCurrency') {
		Navigation.toggleCurrency(element.attr("value"));
	} else if (actionName === 'toggleCryptoCurrency') {
		//console.log(element);
		g_JaxxApp.getUI().toggleCryptoCurrencyIsEnabled(element.attr("value"));
	} else if (actionName === 'slideBannerLeft') {
		g_JaxxApp.getUI().slideBannerLeft();
	} else if (actionName === 'slideBannerRight') {
		g_JaxxApp.getUI().slideBannerRight();
	} else if (actionName === 'leftCoinBannerClicked') {
		g_JaxxApp.getUI().leftCoinBannerClicked(element.attr('value'));
	} else if (actionName === 'centerCoinBannerClicked') {
		g_JaxxApp.getUI().centerCoinBannerClicked(element.attr('value'));
	} else if (actionName === 'rightCoinBannerClicked') {
		g_JaxxApp.getUI().rightCoinBannerClicked(element.attr('value'));
	/* } else if (actionName === 'rightBannerArrowClicked') {
		g_JaxxApp.getUI().rightBannerArrowClicked();
	} else if (actionName === 'leftBannerArrowClicked') {
		g_JaxxApp.getUI().leftBannerArrowClicked(); */
	} else if (actionName === 'selectShapeshiftCoin') {
		g_JaxxApp.getUI().selectShapeshiftCoin(element.attr('value'));
	} else if (actionName === 'changeShapeshiftCoinToNextCoinType') {
        g_JaxxApp.getUI().changeShapeshiftCoinToNextCoinType(element.attr('value'));
    } else if (actionName === 'toggleIgnoreEtcEthSplit') {
        g_JaxxApp.getUI().toggleIgnoreEtcEthSplit();
    } else if (actionName === 'checkForEtcEthSplit') {
        g_JaxxApp.getUI().checkForEtcEthSplit();
    } else if (actionName === 'confirmEtcEthSplit') {
        g_JaxxApp.getUI().confirmEtcEthSplit();
	} else if (actionName === 'selectWalletsSetupOption') {
        g_JaxxApp.getUI().getIntro().selectWalletsSetupOption($(element).find('.radioBtnExpressCustom').attr('value'));
    } else if (actionName === 'pairDevicesWalletsSetupOption') {
        g_JaxxApp.getUI().getIntro().pairDevicesWalletsSetupOption ($(element).find('.radioBtnPDExpressCustom').attr('value'));
    } else if (actionName === 'pressContinueSetupOption') {
        g_JaxxApp.getUI().getIntro().pressContinueSetupOption();
    } else if (actionName === 'toggleExpandSetupOption') {
        g_JaxxApp.getUI().getIntro().toggleExpandSetupOption($(element).attr('value'));
    } else if (actionName === 'toggleExpandPDOption') {
        g_JaxxApp.getUI().getIntro().toggleExpandPDOption($(element).attr('value'));
    } else if (actionName === 'pressContinueExpressWallets') {
        g_JaxxApp.getUI().getIntro().pressContinueExpressWallets();
    } else if (actionName === 'pressContinueCustomWallets') {
        g_JaxxApp.getUI().getIntro().pressContinueCustomWallets();
    } else if (actionName === 'pressContinueCustomCurrencies') {
        g_JaxxApp.getUI().getIntro().pressContinueCustomCurrencies();
    } else if (actionName === 'toggleCoinIsEnabledCustom') {     g_JaxxApp.getUI().getIntro().toggleCoinIsEnabledCustom(HDWalletHelper.dictCryptoCurrency[$(element).attr('value')].index);
    } else if (actionName === 'toggleFiatUnitCustom') {
        g_JaxxApp.getUI().getIntro().toggleFiatUnitCustom($(element).attr('value'));
    } else if (actionName === 'selectCoinOptionExpress') {
        g_JaxxApp.getUI().getIntro().selectCoinOptionExpress(HDWalletHelper.dictCryptoCurrency[$(element).attr('value')].index);
    } else if (actionName === 'pressNextButtonAtVerifyMnemonic') {
        g_JaxxApp.getUI().getIntro().pressNextAtVerifyMnemonic();
    } else if (actionName === 'skipPINSetup'){
        g_JaxxApp.getUI().getIntro().skipPINSetup();
    } else if (actionName === 'clickCheckboxTermsOfService'){
        g_JaxxApp.getUI().getIntro().clickCheckboxTermsOfService($(element).prop('checked'));
    } else if (actionName === 'showTermsOfService'){
        g_JaxxApp.getUI().getIntro().showTermsOfService();
    } else if (actionName === 'hideTermsOfService'){
        g_JaxxApp.getUI().getIntro().hideTermsOfService();
    } else if (actionName === 'btnContinueTermsOfService'){
        g_JaxxApp.getUI().getIntro().btnContinueTermsOfService();
    } else if (actionName === 'clickCancelTermsOfService'){
        g_JaxxApp.getUI().getIntro().clickCancelTermsOfService();
    } else if (actionName === 'toggleCheckboxTermsOfService'){
        g_JaxxApp.getUI().getIntro().toggleCheckboxTermsOfService();
    } else if (actionName === 'clickContinueSetupPIN') {
        g_JaxxApp.getUI().getIntro().clickContinueSetupPIN();
    } else if (actionName === 'clickContinueConfirmPIN') {
        g_JaxxApp.getUI().getIntro().clickContinueConfirmPIN();
    } else if (actionName === 'clickBackConfirmPinScreen') {
        g_JaxxApp.getUI().getIntro().clickBackConfirmPinScreen();
    } else if (actionName === 'enterPinCodeCustomIntroOption'){
        g_JaxxApp.getUI().getIntro().enterPinCodeCustomIntroOption();
    } else if (actionName === 'toggleExpandSetupSecurityPinDescription'){
        g_JaxxApp.getUI().getIntro().toggleExpandSetupSecurityPinDescription();
    } else if (actionName === 'toggleExpandBackupMnemonicDescription'){
        g_JaxxApp.getUI().getIntro().toggleExpandBackupMnemonicDescription();
    } else if (actionName === 'populateAllUserKeys') {
        g_JaxxApp.getUI().getIntro().populateAllUserKeys();
    } else if (actionName === 'toggleExpandSplashOption'){
        g_JaxxApp.getUI().getIntro().toggleExpandSplashOption($(element).attr('value'));
    } else if (actionName === 'selectSplashSetupOption'){

        g_JaxxApp.getUI().getIntro().selectSplashSetupOption($(element).find('.radioBtnSplashOption').attr('value'));
    } else if (actionName === 'splashOptionClicked'){
        g_JaxxApp.getUI().getIntro().splashOptionClicked($(element).attr('value'));
    } else if (actionName === 'pressContinueSplashOption'){

        g_JaxxApp.getUI().getIntro().pressContinueSplashOption();

    } else if (actionName === 'clickViewKeysButton'){
        g_JaxxApp.getUI().getIntro().clickViewKeysButton();
    } else if (actionName === 'toggleHeightForCurrenciesListCustomIntroOption'){
        g_JaxxApp.getUI().getIntro().toggleHeightForCurrenciesListCustomIntroOption();
        g_JaxxApp.getUI().toggleClosestAncestorExpandableText(element);
    } else if (actionName === 'toggleClosestAncestorExpandableText'){
        g_JaxxApp.getUI().toggleClosestAncestorExpandableText(element);
    } else if (actionName === 'jaxxClearAppDataIfAuthenticated') {
        g_JaxxApp.getUI().jaxxClearAppDataIfAuthenticated();
    } else if (actionName === 'hideVerifyMnemonicButton') {
        // Hides the target button.
        $($(".settings.verifyMnemonic .validateMnemonic").attr('targetButton')).hide();
        // Hides the success text
        $('.verifyMnemonic .backupPhraseConfirmText').hide();
    } else if (actionName === 'clickProceedToBackupToShowMnemonic'){
        g_JaxxApp.getUI().getIntro().clickProceedToBackupToShowMnemonic();
    } else if (actionName === 'checkClosestAncestorCheckable'){
        g_JaxxApp.getUI().checkClosestAncestorCheckable(element);
    } else if (actionName === 'clickCheckboxSecurityPinSetup'){
        g_JaxxApp.getUI().getIntro().clickCheckboxSecurityPinSetup();
    } else if (actionName === 'clickCheckboxDisplayBackupPhraseInIntro'){
        g_JaxxApp.getUI().getIntro().clickCheckboxDisplayBackupPhraseInIntro();
    } else if (actionName === 'clickCheckboxSettingsBackupMnemonicPage') {
        g_JaxxApp.getUI().clickCheckboxSettingsBackupMnemonicPage();
    } else if (actionName === 'clickCustomCurrencies'){
        g_JaxxApp.getUI().getIntro().clickCustomCurrencies();
    } else if (actionName === 'clearAllData') {
        localStorage.clear();
    } else if (actionName === 'clickContinueConfirmPINSettings'){
        Navigation.clearSettings();
        g_JaxxApp.getUI().toggleMainMenu();
    }
}
// End of special action div.

function scrollIntoView(tableElement, tableContainer, scrollContainer) {
    var scrollAmount = $(tableElement).position().top - $(tableContainer).position().top;
    $(scrollContainer).scrollTop(scrollAmount);

    // var containerTop = $(container).scrollTop();
    // console.log('containerTop: ' + containerTop);
    //var containerBottom = containerTop + containerHeight;
    //console.log('Container height: ' + containerHeight);
    //console.log('container bottom: ' + containerBottom);
    //var elemTop = $(element).position().top;
    //console.log('offsetTop: ' + elemTop);
    //var elemBottom = elemTop + $(element).height();
    //console.log('elemBottom: ' + elemBottom);
    //if (elemTop < containerTop) {
    //	$(container).scrollTop(elemTop);
    //} else if (elemBottom > containerBottom) {
    //	$(container).scrollTop(elemBottom - containerHeight);
    //}
}

// Called when a settings page comes on screen to handle special events
function specialOnEnter(page) {
    if (page === 'onenameComplete') {
        $('.settings.onenameComplete .populateOnename').text(wallet.getOnename());

    } else if (page === 'oennameTwitter') {
        $('.settings.onenameTwitter input').val('').trigger('keyup');
    }
}

function scriptAction(event) {
    //    console.log(event)
    var e = $(event.currentTarget);

    var effect = e.attr('effect');

    if (e.hasClass('stopPropagation')){
        event.stopPropagation();
    }

    if (e.hasClass('disabled')) { return; }
    if (e.hasClass('button') && !e.hasClass('enabled')) { return; }

    if (e.hasClass('toggleClosestAncestorExpandableText')) {
        g_JaxxApp.getUI().toggleClosestAncestorExpandableText(event);
    }

    var pushSettings = e.attr('pushSettings');
    if (pushSettings) {
//        specialAction('toggleMainMenuOff', null);
//        //$('.wallet .menu,.wallet .dismiss').fadeOut();
//        g_JaxxApp.getUI().closeMainMenu();


        Navigation.pushSettings(pushSettings);
        specialOnEnter(pushSettings);
    }

    if (e.attr('popSettings') == 'true') {
        Navigation.popSettings();
    }

    if (e.attr('clearSettings') == 'true') {
        Navigation.clearSettings();
    }

    var enable = (e.attr('enable') || '').split(',');
    for (var i = 0; i < enable.length; i++) {
        $(enable[i]).removeClass('disabled');
    }

    var disable = (e.attr('disable') || '').split(',');
    for (var i = 0; i < disable.length; i++) {
        $(disable[i]).addClass('disabled');
    }

    var hide = (e.attr('hide') || '').split(',');
    for (var i = 0; i < hide.length; i++) {
        //        console.log("hide :: " + i + " :: " + hide[i]);
        if (effect === 'fade') {
            $(hide[i]).fadeOut();
        } else if (effect === 'slide') {
            $(hide[i]).slideUp();
        } else {
            $(hide[i]).hide();
        }
    }

    var show = (e.attr('show') || '').split(',');
    for (var i = 0; i < show.length; i++) {
        if (effect === 'fade') {
            $(show[i]).fadeIn();
        } else if (effect === 'slide') {
            $(show[i]).slideDown();
        } else {
            $(show[i]).show();
        }
    }

    var toggle = (e.attr('toggle') || '').split(',');
    for (var i = 0; i < toggle.length; i++) {
        //        console.log("toggle :: " + toggle[i] + " :: " + $(toggle[i]) + " :: effect :: " + effect);

        if (effect === 'fade') {
            $(toggle[i]).fadeToggle();
        } else if (effect === 'slide') {
            $(toggle[i]).slideToggle();
        } else {
            $(toggle[i]).toggle();
        }
    }

    // Clear the input/textarea value in the attribute "clearValue"
    var clear = (e.attr('clearValue') || '').split(',');
    for (var i = 0; i < clear.length; i++) {
        $(clear[i]).val('').trigger('keyup');
    }

    // Copy to the clipboard the value in the attribute "copy"
    var copy = e.attr('copy');
    //    console.log("copy :: " + copy)
    if (copy) {
        var sandbox = $('#clipboard');
        sandbox.val(copy).select();
        document.execCommand('copy');
        sandbox.val('').blur();

        if (window.native && window.native.copyToClipboard) {
            window.native.copyToClipboard(copy);
        }

        Navigation.flashBanner('Copied to clipboard', 2, 'success', {close: false});
        /*
        $('.copied').slideDown();

        setTimeout(function() {
            $('.copied').slideUp();
        }, 1500);
        */
    }

    var copyLarge = e.attr('copyLarge');
    if (copyLarge) {
        var sandbox = $('#clipboard').val(copyLarge).select();
        document.execCommand('copy');
        sandbox.val('').blur();

        if (window.native && window.native.copyToClipboard) {
            window.native.copyToClipboard(copyLarge);
        }

        Navigation.flashBanner('Copied to clipboard', 2, 'success', {close: false}, 'extendPopUpDisplay');
        /*
        $('.copiedLarge').fadeTo(1000, 1);
        setTimeout(function() {
            $('.copiedLarge').fadeTo(1000, 0);
        }, 1000);
        */
    }

    var showTab = e.attr('showTab');
    if (showTab) {
        Navigation.showTab(showTab);
    }

    var toggleTab = e.attr('toggleTab');
    if (toggleTab) {
        Navigation.toggleTab(toggleTab);
    }

    var collapseTabs = e.attr('collapseTabs');
    if (collapseTabs === 'true') {
        Navigation.toggleTab();
    }

    var openModal = e.attr('openModal');
    if (openModal) {
        Navigation.openModal(openModal);
    }

    var closeModal = e.attr('closeModal');
    if (closeModal === 'true') {
        Navigation.closeModal();
    }

	var switchToCoin = e.attr('switchToCoin');
	if (switchToCoin) {
		g_JaxxApp.getUI().switchToCoin(switchToCoin);
	}

    var flashBanner = e.attr('flashBanner');
    if (flashBanner) {
        var timeout = e.attr('timeout');
        Navigation.flashBanner(flashBanner, timeout);
    }

    var special = e.attr('specialAction');
    if (special) {
        specialAction(special, e);
    }

    var specialActions = e.attr('specialActionMultipleActions');
    if (specialActions) {
        specialActionMultipleActions(specialActions, e);
    }

    var ethereumSecretSelector = e.attr('ethereumSecretSelector');
    if (typeof(ethereumUnlocked) === 'undefined' || ethereumUnlocked === null || ethereumUnlocked === false) {
        if (ethereumSecretSelector !== 'true' && !special) {
            ethereumSecretProgress = 0;
        }
    }
}




// @TODO: Move to "special"
$('.tabContent .unitToggle').click(function () {
    // Open menu here.
    Navigation.toggleUseFiat();

    // Update the state of the button
    //$('.tabContent .amount input').val('').trigger('keyup');
});

$('.pageSetBitcoinMiningFee .enterCustomMiningFee').keyup((function(event){
    g_JaxxApp.getController().keyupCustomMiningOption($(event.currentTarget));
}));

$('.tabContent .address input').keyup((function() {
    //@note: onename lookup functionality.

    g_JaxxApp.getUI().updateHighlightingInSendTransactionButton();

    var input = $('.tabContent .address input');

    var onenameCache = {};

    return function () {

        if (input.val() !== "" && curCoinType === COIN_ETHEREUM) {
            var isValidAddress = ethereumAddressInputCheck();

            if (isValidAddress === false) {
                //                $('.ethereumChecksumAddressWarningText').slideDown();
                return;
            }
        } else {
            $('.ethereumChecksumAddressWarningText').slideUp();
        }

        var processData = function(data) {
            if (data.jaxxValue != input.val()) {
                return;
            }

            if (!data.v) {
                input.css({backgroundImage: 'none'}).removeClass('validOnename').removeClass('cssValidOnename');
                input.data('onename', false).data('address', false).data('showAddress', false);
                return;
            }

            var avatarImage = 'img/default-profile_360.png';
            if (data.avatar && data.avatar.url) {
                avatarImage = sanitizeOneNameAvatar(data.avatar.url);
            }

            input.css({ backgroundImage: 'url(' + avatarImage + ')'});

            var name = 'unknown';
            if (data.name && data.name.formatted) {
                name = data.name.formatted;
            }

            var bitcoinAddress = null, truncatedBitcoinAddress = null;
            if (data.bitcoin && data.bitcoin.address) {
                bitcoinAddress = data.bitcoin.address;
                truncatedBitcoinAddress = bitcoinAddress.substring(0, 6) + '\u2026' + bitcoinAddress.substring(bitcoinAddress.length - 5);
            }

            var onenameData = {
                avatarImage: avatarImage,
                bitcoinAddress: bitcoinAddress,
                data: data,
                onename: data.jaxxValue,
                name: name,
                success: true,
                truncatedBitcoinAddress: truncatedBitcoinAddress
            };

            input.addClass('validOnename').addClass('cssValidOnename');
            input.data('onename', data.jaxxValue).data('address', bitcoinAddress).data('showAddress', truncatedBitcoinAddress);

            // Update the state of the button
            $('.tabContent .amount input').trigger('keyup');
        }

        input.data('onename', false).data('address', false);


        var continueOneNameCheck = true;

        var value = input.val()

        //Check if equals to shapeshift, avoid doing anything else
        if(value.toUpperCase() === "SHAPESHIFT") {
            if (g_JaxxApp.getShapeShiftHelper().getIsTriggered() !== true) {
                g_JaxxApp.getUI().showShapeShift();
            }

            //Display HTML box TODO


            //@note: setup shapeshift helper update interval if necessary.

            g_JaxxApp.getShapeShiftHelper().setupUpdateIntervalIfNecessary(curCoinType);

            continueOneNameCheck = false;
        } else {
            if (g_JaxxApp.getShapeShiftHelper().getIsTriggered()) {
                $('.spendable').slideDown(); // Hide Spendable line

                g_JaxxApp.getUI().resetShapeShift();
            }
        }

        var data = onenameCache[value];
        if (continueOneNameCheck === true && data) {
            processData(data);

        } else {
            RequestSerializer.getJSON('https://glacial-plains-9083.herokuapp.com/lookup.php?id=' + value, function (data) {
                data.jaxxValue = value;
                onenameCache[value] = data;
                processData(data);
            });
        }

        // Update the state of the button
        $('.tabContent .amount input').trigger('keyup');
    };

})()).change(function() {
    var input = $('.tabContent .address input');
    input.trigger('keyup');
}).focus(function () {
    var input = $('.tabContent .address input');
    if (input.data('onename') && input.data('address')) {
        input.val(input.data('onename'));
    }

}).blur(function () {
    var input = $('.tabContent .address input');
    if (input.data('onename') && input.data('address')) {
        var value = input.data('onename') + ' (' + truncate(input.data('address'), 5, 5) + ')';
        input.val(value);
    }
});

/* Limit input to 8 decimals (bitcoin) or 16 decimals (ethereum) */
function checkForDecimalLimits(inputField) {
    var returnString = "";
    var didModify = false;

    var numDecimals = 8;

    if (Navigation.isUseFiat()) {
        numDecimals = 2;
    } else {
        var displayNumDecimals = HDWalletPouch.getStaticCoinPouchImplementation(curCoinType).uiComponents['displayNumDecimals'];

        numDecimals = displayNumDecimals;
    }

    if (inputField.val().indexOf('.') != -1) {
        //        console.log("numDecimals :: " + numDecimals + " :: inputField :: " + inputField.val());
        var inputFieldComponents = inputField.val().split(".");

        if (inputFieldComponents[1].length > numDecimals) {
            if (isNaN(parseFloat(inputField.val()))) {
                console.log("nan");
                return null;
            }

            //            console.log("returning float :: " + parseFloat(inputField.val()));
            didModify = true;
            returnString = parseFloat(inputFieldComponents[0] + "." + inputFieldComponents[1].substring(0, numDecimals));
        } else {
            //            console.log("returning :: " + parseFloat(inputField.val()).toFixed(numDecimals));
            didModify = false;
            returnString = inputField.val();
        }
    } else {
        //        console.log("no decimal");
        didModify = true;
        returnString = null;
    }

    g_JaxxApp.getUI().updateHighlightingInSendTransactionButton();

    return JSON.stringify([didModify, returnString]);
}

$('.tabContent .amount input').keyup(function () {
   // console.error(this);
    if ($('.tabContent .amount input').val() !== "") {
        var returnArray = JSON.parse(checkForDecimalLimits($('.tabContent .amount input')));
        var didModify = returnArray[0];
        var valueString = returnArray[1];

        if (didModify && valueString !== null) {
            $('.tabContent .amount input').val(valueString);
        }
    }
    var isSendingFullMaxSpendable = wallet.getPouchFold(curCoinType).getIsSendingFullMaxSpendable(); // Added to accomodate Anthony's business logic request: Spendable balance must empty wallet
    updateFromInputFieldEntry(isSendingFullMaxSpendable);
});

$('.tabContent .amount input').bind('paste', function(e) {
    setTimeout(function() {
        $('.tabContent .amount input').trigger('keyup');
    }, 10);
});


$('.advancedTabContentEthereum .customGasLimit input').keyup(function () {
    var didModify = false;
    var valueInt = parseInt($('.advancedTabContentEthereum .customGasLimit input').val());

    if (valueInt !== wallet.getHelper().getCustomEthereumGasLimit().toNumber()) {
        didModify = true;
        //        console.log("valueInt :: " + valueInt + " :: ethereumWallet.getCustomEthereumGasLimit() :: " + ethereumWallet.getCustomEthereumGasLimit());
    }

    if (didModify && valueInt !== null) {
        if (isNaN(valueInt)) {
            //            $('.advancedTabContentEthereum .customGasLimit input').val(ethereumWallet.getRecommendedEthereumCustomGasLimit());
            wallet.getHelper().setCustomEthereumGasLimit(wallet.getHelper().getRecommendedEthereumCustomGasLimit());
        } else {
            $('.advancedTabContentEthereum .customGasLimit input').val(valueInt);
            wallet.getHelper().setCustomEthereumGasLimit(valueInt);
        }

        wallet.getPouchFold(COIN_ETHEREUM).clearSpendableBalanceCache();

        updateSpendable();
        updateFromInputFieldEntry();
    }
});

$('.advancedTabContentEthereum .customData input').keyup(function () {
    updateFromInputFieldEntry();
});


var g_attachKeyupToValidateMnemonic = function(affectedMnemonic, callbackOnValidMnemonic, callbackOnInvalidMnemonic){
    $(affectedMnemonic).keyup(function() {
        var e = $(this);
        var value = $(this).val();
        //@note: remove whitespace, linebreaks.
        value = value.replace(/^\s+|\s+$/g, '');

        var parsedWords = value.trim().toLowerCase().split(" ");
        var numWords = 0;
        var combinedWords = "";

        for (var i = 0; i < parsedWords.length; i++) {
            if (parsedWords[i] !== "") {
                numWords++;
                combinedWords += parsedWords[i];
                if (i < parsedWords.length - 1) {
                    combinedWords += " ";
                }
            }
        }
        // changes rohit//
        if(affectedMnemonic == '.settings.verifyMnemonic textarea.validateMnemonic'){
             var validateActualMnemonic = wallet.getMnemonic();
            validateActualMnemonic = validateActualMnemonic.replace(/^\s+|\s+$/g, '');
            var parsedWordsActualMnemonic = validateActualMnemonic.trim().toLowerCase().split(" ");

            var is_same_backupphrase = parsedWords.length == parsedWordsActualMnemonic.length && parsedWords.every(function(element, index) {
                return element === parsedWordsActualMnemonic[index];
            });

                if (numWords == 12 && thirdparty.bip39.validateMnemonic(combinedWords) && is_same_backupphrase) {
                    callbackOnValidMnemonic(e, combinedWords);
                } else {
                    callbackOnInvalidMnemonic(e, combinedWords);
                }
        }else{
        // chnages end//
        //    console.log("parsedWords :: " + parsedWords + " :: numWords :: " + numWords);
            if (numWords == 12 && thirdparty.bip39.validateMnemonic(combinedWords)) {
                callbackOnValidMnemonic(e, combinedWords);
            } else {
                callbackOnInvalidMnemonic(e, combinedWords);
            }
        }
    });
}
g_attachKeyupToValidateMnemonic('.settings.verifyMnemonic textarea.validateMnemonic', function(e, combinedWords){
    e.val(combinedWords);
    $(e.attr('targetButton')).show();
    $('.verifyMnemonic .backupPhraseConfirmText').show();
}, function(e, combinedWords){
    $(e.attr('targetButton')).hide();
    $('.verifyMnemonic .backupPhraseConfirmText').hide();
}); // Attach keyup in settings > validateMnemonic

g_attachKeyupToValidateMnemonic('.settings.verifyMnemonicCustomIntroOption textarea.validateMnemonic', function(){
    g_JaxxApp.getUI().getIntro().mnemonicEnteredIsValidCustomIntroOption();
}, function(){
    g_JaxxApp.getUI().getIntro().mnemonicEnteredIsNotValidCustomIntroOption();
}); // Attach keyup in intro screen > validate mnemonic

g_attachKeyupToValidateMnemonic('.settings.importMnemonic textarea.validateMnemonic', function(e, combinedWords){
    e.val(combinedWords);
    $(e.attr('targetButton')).addClass('cssEnabled').addClass('enabled');
}, function(e, combinedWords){
    $(e.attr('targetButton')).removeClass('cssEnabled').removeClass('enabled');
}); // Attach keyup in settings > validateMnemonic

g_attachKeyupToValidateMnemonic('.settings.loadJaxxToken textarea.validateMnemonic', function(e, combinedWords){
    e.val(combinedWords);
    $(e.attr('targetButton')).addClass('cssEnabled').addClass('enabled');
}, function(e, combinedWords){
    $(e.attr('targetButton')).removeClass('cssEnabled').removeClass('enabled');
}); // Attach keyup in settings > validateMnemonic
g_attachKeyupToValidateMnemonic('.settings.introLoadJaxxToken textarea.validateMnemonic', function(e, combinedWords){
    e.val(combinedWords);
    $(e.attr('targetButton')).addClass('cssEnabled').addClass('enabled');
}, function(e, combinedWords){
    $(e.attr('targetButton')).removeClass('cssEnabled').removeClass('enabled');
});

$('textarea.validateMnemonic').on('paste', function () {
    var self = this;

    setTimeout(function() {
        $(self).trigger('keyup');
    }, 100);

});

$('.settings.quickVerifyMnemonic input').keyup(function () {
    var input = $('.settings.quickVerifyMnemonic input');
    var value = input.val().toLowerCase();
    if (value === input.data('word')) {
        $(this).val(combinedWords);
        $('.settings.quickVerifyMnemonic .button').addClass('cssEnabled').addClass('enabled');
    } else {
        $('.settings.quickVerifyMnemonic .button').removeClass('cssEnabled').removeClass('enabled');
    }
});

$('.settings.sweepPrivateKeyPasswordEntry input').keyup(function () {
    var value = $('.sweepPrivateKeyPasswordEntry input').val();

    var nextSweepPassBehaviours = buttonBehaviours['nextSweepPass'];
    if (value != "" && value != null) {
        nextSweepPassBehaviours.enableButton();
    } else {
        nextSweepPassBehaviours.disableButton();
    }
});


$('.settings.sweepPrivateKey input').keyup(function(){g_JaxxApp.getController().keyUpOnSweepPrivateKey();});

$('.settings.onenameSelect input').keyup(function () {
    var input = $('.settings.onenameSelect input')

    var checkOnename = function(value) {
        Onename.usernameAvailable(value, function (error, available) {
            if (value !== input.val()) {
                return;
            }

            if (error) {
                console.log('Onename error', error);

            } else {
                if (available) {
                    $('.settings.onenameConfirm .button').data('onename', value);
                    $('.settings.onenameSelect .button').addClass('cssEnabled').addClass('enabled');
                    $('.settings.onenameConfirm .populatePendingOnename').text(value);
                }
            }
        });
    }

    var delayToken = null;

    return function() {
        $('.settings.onenameSelect .button.next').removeClass('cssEnabled').removeClass('enabled');

        var value = input.val()
        if (delayToken) { clearTimeout(delayToken); }

        delayToken = setTimeout(function() {
            delayToken = null;
            checkOnename(value)
        }, 400);
    };
}());

//@note: @here: this isn't used right now.
$('.settings.onenameTwitter input').keyup(function () {
    var input = $(this);
    input.css({ backgroundImage: 'none'});
    $('.settings.onenameTwitter .button').removeClass('enabled').removeClass('cssEnabled');

    Onename.lookupTwitter(input.val(), function(username, data) {
        if (username != input.val()) { return; }
        if (data.status === 'success' && data.twitter == input.val()) {

            var avatarImage = 'img/default-profile_360.png';
            if (data.avatar && data.avatar.url) {
                avatarImage = sanitizeOneNameAvatar(data.avatar.url);
            }

            input.css({ backgroundImage: 'url(' + avatarImage + ')'});
            $('.settings.onenameTwitter .button').addClass('enabled').addClass('cssEnabled');

            $('.settings.onenameTwitterProfile .populateOnename').text(wallet.getOnename());
            $('.settings.onenameTwitterProfile .populateTwitter').text(username);
            $('.settings.onenameTwitterProfile .populateName').text(data.name);

            $('.settings.onenameTwitterProfile .populateAvatar').css({
                background: 'url(' + avatarImage + ') no-repeat center center',
                backgroundSize: 'cover',
                display: 'inline-block',
            });

            $('.settings.onenameTwitterProfile .button').data('twitter', data);
        }
    });
});

function sanitizeOneNameAvatar(avatarUrl) {
    var isValidAvatar = true;

    var schemePrefixIdx = avatarUrl.indexOf("://");

    if (schemePrefixIdx !== -1) {
        var prefixScheme = avatarUrl.substr(0, schemePrefixIdx);

        if (prefixScheme !== "http" && prefixScheme !== "https") {
            console.log("avatar invalid prefix scheme :: " + prefixScheme);
            isValidAvatar = false;
        } else {
            var hackArray = [")", ","];

            for (var hackIdx in hackArray) {
                var curHackToCheck = hackArray[hackIdx];

                if (avatarUrl.indexOf(curHackToCheck) !== -1) {
                    console.log("avatar has inclusion hack :: " + curHackToCheck);
                    isValidAvatar = false;
                }
            }
        }
    }

    if (isValidAvatar) {
        return avatarUrl;
    } else {
        console.log("invalid avatar");
        return "img/default-profile_360.png";
    }
}

var buttonBehaviours = {};

function setupUIButtonBehaviours() {
    buttonBehaviours['nextSweepPass'] = {};

    buttonBehaviours['nextSweepPass'].disableButton = function() {
        //        console.log("disabled");
        var element = $('.nextSweepPass');
        element.removeClass('cssEnabled');
        element.removeClass('cssBlueButton');
        element.addClass('cssGreyButton');
        element.css('cursor', 'default');
        element.attr('specialAction', null);
        element.attr('pushSettings', null);
    }

    buttonBehaviours['nextSweepPass'].enableButton = function() {
        //        console.log("enabled");
        var element = $('.nextSweepPass');
        element.addClass('cssEnabled');
        element.addClass('cssBlueButton');
        element.removeClass('cssGreyButton');
        element.css('cursor', 'pointer');
        element.attr('specialAction', 'sweepPrivateKey.tryToDecrypt');
    }
}

/**
 *  Bootstrap the wallet
 */


// Make sure all buttons enabled by design is enabled internally
$('.button.cssEnabled').addClass('enabled');

function updateDefaultWalletList() {
    $('.settings.setDefaultWallet .setDefaultWalletList div').each(function() {
        var element = $(this);

        var elementCoinType = parseInt(element.attr('changedefaultcointype'), 10);
        //        console.log("curDefaultCoinType :: " + elementCoinType);

        if (elementCoinType === g_JaxxApp.getSettings().getDefaultCoinType()) {
            element.addClass('selected').addClass('cssSelected');
            element.find('.cssCircleUnchecked').addClass('cssCurrencyisChecked').removeClass('cssCircleUnchecked');

            //            console.log("selectedDefaultCoinType :: " + elementCoinType + " :: " + typeof(elementCoinType));
            g_JaxxApp.getSettings().setDefaultCoinType(elementCoinType);
            g_JaxxApp.getUI().updateSettingsUI();
        } else {
            element.removeClass('selected').removeClass('cssSelected');
            element.find('.cssCurrencyisChecked').removeClass('cssCurrencyisChecked').addClass('cssCircleUnchecked');

        }
    });
}

function setupDefaultWalletList() {
    $('.setDefaultWalletList').empty();

    for (var i = 0; i < COIN_NUMCOINTYPES; i++) {
        var coinDisplayFullName = HDWalletPouch.getStaticCoinPouchImplementation(i).uiComponents['coinDisplayFullName'];


        $('.settings.setDefaultWallet .setDefaultWalletList').append('<div class="scriptAction defaultWalletItem cssDefaultWalletItem" changedefaultcointype="' + i + '"> <div class="cssSelectDefaultWallet cssCircleUnchecked" > </div>' + coinDisplayFullName + ' Wallet</div>');
    }

    $('.settings.setDefaultWallet .setDefaultWalletList').css("height", (COIN_NUMCOINTYPES * 30) + "px");

    $('.settings.setDefaultWallet .setDefaultWalletList div').click(function() {
        //        console.log("item :: " + $(this).attr('changedefaultcointype'));
        var elementCoinType = parseInt($(this).attr('changedefaultcointype'), 10);


        g_JaxxApp.getSettings().setDefaultCoinType(elementCoinType);
        updateDefaultWalletList();
    });

    updateDefaultWalletList();
}

function startJaxx() {
    g_JaxxApp.getInitializer().startJaxx();
}

function initializeJaxx(callback) {
    g_JaxxApp.getUI().updateChangeLogFromServer();
    g_JaxxApp.getUI().updateChangeLogSummaryFromServer();
    Navigation.clearSettings();
    console.log("[ Jaxx Initialize Version " + g_JaxxApp.getVersionCode() + " ]");
    $('.menusAboutVersionCode').text(g_JaxxApp.getVersionCode());
    g_JaxxApp.getUI().setupExternalLink($('.menusAboutWebsiteLink'), 'www.jaxx.io', 'http://jaxx.io');
    g_JaxxApp.getUI().setupExternalLink($('.menusAboutWebsiteContact'), 'support.decentral.ca', 'http://support.decentral.ca/');
    g_JaxxApp.getUI().setupExternalLink($('.menusHelpResetWalletLink'), 'here', 'https://decentral.zendesk.com/hc/en-us/articles/218375737-How-do-I-reset-my-Jaxx-wallet-');
    g_JaxxApp.getUI().loadExtraStylesheets();

    var defaultCoinType = g_JaxxApp.getSettings().getDefaultCoinType();

    setupDefaultCoinType(defaultCoinType);

    jaxx.Registry.currentCoinType = defaultCoinType;
    // jaxx.Registry.currentCoinType = g_JaxxApp.getSettings().getDefaultCoinType();

    Navigation.setupCoinUI(defaultCoinType);

    //@note: @todo: @here: make setup better timed with pouches if necessary.

    g_JaxxApp.getBitcoinRelays().setup(function(resultParams) {
        console.log("initializeJaxx :: getBitcoinRelays :: RelayTests :: fetchBlockHeights :: " + JSON.stringify(resultParams));
    }); // Setup the relays (Stored in a global so that instance data is not discarded.)

    g_JaxxApp.getLitecoinRelays().setup(function(resultParams) {
        console.log("initializeJaxx :: getLitecoinRelays :: yTests :: fetchBlockHeights :: " + JSON.stringify(resultParams));
    }); // Setup the relays (Stored in a global so that instance data is not discarded.)

    setupDefaultWalletList();

    showPageScanAddresses(defaultCoinType);

    setupUIButtonBehaviours();
    /*
    $('.btnActionShapeShift').click(function(){
        if (g_JaxxApp.getShapeShiftHelper().getIsTriggered()) {
            $('.tabContent .address input').val('').trigger('keyup');
        } else {
            $('.tabContent .address input').val('ShapeShift').trigger('keyup');
        }
    });*/

    //@note: @here: @todo: @next: remove this.
    //    shapeShiftPairSwitcher
    $('.shapeShiftToggleItem :checkbox').click(function() {
        var $this = $(this);
        var positionZero = $this.is(':checked');

        console.log("checked :: " + positionZero);

        var receiveCoinType = COIN_BITCOIN;

        while (receiveCoinType === curCoinType)
        {
            receiveCoinType = (receiveCoinType + 1) % COIN_NUMCOINTYPES;
        }

        g_JaxxApp.getShapeShiftHelper().setReceivePairForCoinType(curCoinType, receiveCoinType);
        g_JaxxApp.getShapeShiftHelper().clearUpdateIntervalIfNecessary();

//        var coinDisplayColor = HDWalletPouch.getStaticCoinPouchImplementation(receiveCoinType).uiComponents['coinDisplayColor'];

//        $('.shapeShiftToggleButtonLabel').css({'background': coinDisplayColor});

        $('.tabContent .address input').trigger('keyup');
	//        var $this = $(this);
	//        console.log("checked :: " + $this.is(':checked'));
	//        // $this will contain a reference to the checkbox
	//        if ($this.is(':checked')) {
	//            // the checkbox was checked
	//        } else {
	//            // the checkbox was unchecked
	//        }
    });

    var receiveCoinType = COIN_BITCOIN;

    if (defaultCoinType === COIN_BITCOIN) {
        receiveCoinType = COIN_ETHEREUM;
    } else {
        receiveCoinType = COIN_BITCOIN;
    }

//    var coinDisplayColor = HDWalletPouch.getStaticCoinPouchImplementation(receiveCoinType).uiComponents['coinDisplayColor'];
//
//    $('.shapeShiftToggleButtonLabel').css({'background': coinDisplayColor});

    $('.spendableShapeshift').slideUp(0); // hide ShapeShift logo and Info icon

    $('.copied').slideUp(0);
    $('.ethereumChecksumAddressWarningText').slideUp(0);
    $('.ethereumTokenInsufficientGasForSpendableWarningText').slideUp(0);

    g_JaxxApp.getUI().hideShapeshiftSpinner();

    setTimeout(function() {
        $('.copied').css('position', 'relative');
    }, 1500);

    if (window.chrome && chrome.extension) {
        var backgroundPage = chrome.extension.getBackgroundPage();
        if (backgroundPage) {
            console.log("[ Jaxx :: Trying to load background wallet :: " + backgroundPage.Wallet + " ]");
        }

        if (backgroundPage && backgroundPage.Wallet) {
            console.log('Using background wallet');
            var wallet = backgroundPage.Wallet;
            if (wallet) {

                for (var i = 0; i < COIN_NUMCOINTYPES; i++) {
                    wallet.getPouchFold(i).setLogger(console);
                    wallet.getPouchFold(i).dumpLog();
                }

                var success = _loadWallet(wallet);
                console.log('Linked to background wallet: ' + success);
            }
        }
    }

    //@note: disable the camera if it's not available.
    if (!window.native || !native.scanCode) {
        $('.cameraPairFromDevice').hide();
        $('.imageCamera').hide();
        $('.imageQR').hide();
        $('.cameraTab').hide();
        $('.settings.loadJaxxToken .pairFromDevice').hide();
        $('.settings.loadJaxxToken .cssBackContinue .cameraButton').hide();
        $('.settings.introLoadJaxxToken .pairFromDevice').hide();
        $('.settings.introLoadJaxxToken .cssBackContinue .cameraButton').hide();


        $('.tabContent .address input').css('width', 'calc(100% - 20px)');
    } else {
        $('.cameraTab').hide(); // Hide the camera - added when fox icon is added.
    }

    if (PlatformUtils.mobileCheck()) {
        console.log("mobile check passed");
        $('.tabSend').removeClass('cssTab');
        $('.tabSend').addClass('cssTabOverrideHover');

        $('.tabReceive').removeClass('cssTab');
        $('.tabReceive').addClass('cssTabOverrideHover');

        if (PlatformUtils.mobileAndroidCheck() && window.native && window.native.getAndroidSoftNavbarHeight) {
            console.log("android :: navbar size :: " + window.native.getAndroidSoftNavbarHeight());
        }
    }

    var dontShowReminder = false;

    if (!wallet) {
        var mnemonicEncrypted = getStoredData('mnemonic', false);
        if (mnemonicEncrypted) {
            // @NOTE: Dan This code is run if we are initializing Jaxx and the wallet has already been created.
            Navigation.openModal('loading');
            loadFromEncryptedMnemonic(mnemonicEncrypted, function(err, wallet) {
                if (err) {
                    console.log("initializeJaxx :: error :: " + err);

                    //@note: @here: maybe a better error display in this case.
                    g_JaxxApp.getUI().updateSettingsUI();
                    Navigation.startBlit();
                } else {
                    g_JaxxApp.getUI().updateSettingsUI();
                    Navigation.startBlit();
                    // g_JaxxApp.getUI().showCoinBulletinUsingAbbreviatedName(HDWalletPouch.getStaticCoinPouchImplementation(curCoinType).pouchParameters["coinAbbreviatedName"]);
                    // g_JaxxApp.getUI().initializeBTCMiningOptions(wallet);
                    callback();
                }
                setTimeout(function(){
                    g_JaxxApp.getUI().functionToCallWhenJaxxIsFinishedLoading();
                }, 1000);
            });
        } else {
            // @NOTE: Dan This code is run if we are initializing Jaxx and the wallet has not been created yet.
            console.log("[Show Splash Screen]");
            resize();

            dontShowReminder = true;
            var createNewWalletRadioButton = $(".settings.splash .optionTrigger input:radio[value=CreateNewWallet]");
            createNewWalletRadioButton.prop('checked', true);
            specialAction('splashOptionClicked', createNewWalletRadioButton);
            g_JaxxApp.getUI().hideApplicationLoadingScreen(); // splash
            Navigation.pushSettings('splash');
        }
    } else {
        g_JaxxApp.getUI().updateSettingsUI();
        Navigation.startBlit();

        callback();
    }
    Navigation.closeModal();
    // g_JaxxApp.getUI().showCoinBulletinUsingAbbreviatedName(HDWalletPouch.getStaticCoinPouchImplementation(curCoinType).pouchParameters["coinAbbreviatedName"]);
    // Logic behind showing reminders using banners.
    // Anthony asked to take this notification out Date: 1st Feb 2017
    /*
    var hasShownBackupReminder = getStoredData('hasShownBackupReminder');
    if (hasShownBackupReminder !== null) {
        var lastBackupTimestamp = getStoredData('lastBackupTimestamp');
        if (lastBackupTimestamp === null) {
            Navigation.flashBannerMultipleMessages(['Please remember to back up your wallet'], 5);
        }
    } else if (dontShowReminder === false) {
        storeData('hasShownBackupReminder', 'true');
        Navigation.flashBannerMultipleMessages(['Please remember to back up your wallet'], 5);
    } */

}

// Help Page Question Toggle

$('dd').hide();

$('dt').click(
    function() {
        var toggle = $(this).nextUntil('dt');
        toggle.slideToggle();
        $('dd').not(toggle).slideUp();
    });

/* Hover states off on mobile */
var touch = window.ontouchstart || ('ontouchstart' in window) || (navigator.MaxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);

console.log("touch :: " + touch);
if (touch) { // remove all :hover stylesheets
    try { // prevent crash on browsers not supporting DOM styleSheets properly
        for (var si in document.styleSheets) {
            var styleSheet = document.styleSheets[si];
            if (!styleSheet.rules) continue;

            for (var ri = styleSheet.rules.length - 1; ri >= 0; ri--) {
                if (!styleSheet.rules[ri].selectorText) continue;

                if (styleSheet.rules[ri].selectorText.match(':hover')) {
                    styleSheet.deleteRule(ri);
                }
            }
        }
    } catch (ex) {}

    // Check a box for the default Jaxx currency.
    // Assertion: the currency has been loaded into the helper wallet.
}

function setupDefaultCoinType(defaultCoinType) {
    curCoinType = defaultCoinType;
    //    g_JaxxApp.getUI().resetCoinButton(COIN_BITCOIN);
    //    console.log("setupDefaultCoinType :: " + defaultCoinType);

    g_JaxxApp.getUI().initializeToCoinType(defaultCoinType);
}

function resize() {
    JaxxUI.runAfterNextFrame(function() {
        g_JaxxApp.getUI().refreshSizes();

        var offsetHeight = 0;
        if (curProfileMode === PROFILE_PORTRAIT) {
            //        console.log("nonScrollSize.height :: " + $('.nonScrollSize').height());
            offsetHeight = $('.mainTransactionHistoryHeader').height() + $('.landscapeLeft').height();
            //        offsetHeight = $('.nonScrollSize').height();

            //        console.log("$(window).height() :: " + $(window).height() + " :: $('.landscapeLeft').height() :: " + $('.landscapeLeft').height())

            $('.landscapeRight').css({height: ($(window).height() - $('.landscapeLeft').height())});
        } else if (curProfileMode === PROFILE_LANDSCAPE) {
            var landscapeRightOffsetHeight = $('.logoBanner').height() + $('.imageLogoBannerSVG').height();

            offsetHeight = $('.mainTransactionHistoryHeader').height() + $('.logoBanner').height() + $('.imageLogoBannerSVG').height();

            //        console.log("offsetHeight :: " + offsetHeight);

            var wWidth = $(window).width() / 2; // g_JaxxApp.getUI().getLargerScreenDimension() / 2;

            //        console.log("window dimensions inner (width/height) :: " + window.innerWidth + " :: " + window.innerHeight + " :: outer :: " + window.outerWidth + " :: " + window.outerHeight + " :: " + window.width + " :: " + window.height);

            //        console.log("$(window).height() :: " + $(window).height());
            //        var leftWindowWidth = $(document).width() / 2;
            //        console.log("using width :: " + wWidth);
            var leftWindowWidth = wWidth;
            var rightWindowWidth = wWidth;

            var wrapTableCurrencyWidth = $('.wrapTableCurrencySelectionMenu').width();
            var wrapTableCurrencyOffset = (leftWindowWidth / 2) - (rightWindowWidth / 2);
            var positionFromRight = leftWindowWidth;
            $('.cameraTab').css('right', positionFromRight + 'px');
            $('.shapeshiftTab').css('right', positionFromRight + 'px');

            $('.wrapTableCurrencySelectionMenu').css('left', wrapTableCurrencyOffset + 'px');


            //        console.log("landscapeRight height :: " + (($(window).height() - $('.logoBanner').height()) + cssLogoBannerNegativeMarginHack));
            $('.landscapeRight').css({height: ($(window).height() - landscapeRightOffsetHeight)});
        }
        // $('.transactionWrapper').css({height: ($(window).height() - 363)}); // For transaction history.
        $('.transactions').css({height: ($(window).height() - offsetHeight - 35)}); // For transaction history.
        // g_JaxxApp.getUI().resizeTransactionTable();
    });
}

var forcePortrait = false;
var forceLandscape = false;


var initializeOrientationV20 = function () {

    if (PlatformUtils.mobileIphoneCheck()) {
        forcePortrait = true;
    } else {
        if (PlatformUtils.mobileIpadCheck()) {
            forceLandscape = true;
        }
    }

//console.log("window.iosdefaultprofilemode :: " + window.iosdefaultprofilemode);
    if (typeof(window.iosdefaultprofilemode) !== 'undefined') {
        //    console.log("window.iosdefaultprofilemode :: " + window.iosdefaultprofilemode);

        if (window.iosdefaultprofilemode == 1) {
            forceLandscape = true;
            forcePortrait = false;
        } else {
            forceLandscape = false;
            forcePortrait = true;
        }
    }

    if (PlatformUtils.extensionCheck()) {
        console.log("ext check");

        forcePortrait = true;
    } else if (PlatformUtils.mobileAndroidCheck()) {
        lowestScreenDim = (g_JaxxApp.getUI().getWindowHeight() < g_JaxxApp.getUI().getWindowWidth()) ? g_JaxxApp.getUI().getWindowHeight() : g_JaxxApp.getUI().getWindowWidth();

        console.log("ff check");

        if (lowestScreenDim > 700) {
        } else {
            forcePortrait = true;
        }
    }

//PlatformUtils.outputAllChecks();
/* Code was written in order to accomidate the logic for tracking device orientation, for now it was only applied to ipads*/
$( window ).on( "orientationchange", function( event ) {
    if (PlatformUtils.mobileIpadCheck()) {
          if(forceLandscape){
            switchToProfileMode(PROFILE_PORTRAIT);
            forcePortrait = true;
              forceLandscape = false;
          }else if (forcePortrait){
            switchToProfileMode(PROFILE_LANDSCAPE);
            forceLandscape = true;  
               forcePortrait = false;
          }
    }    
});




    console.log("forcePortrait :: " + forcePortrait);
    console.log("forceLandscape :: " + forceLandscape);

    loadProfileMode = PROFILE_PORTRAIT;

    if (forcePortrait) {
        console.log("force portrait mode");
        loadProfileMode = PROFILE_PORTRAIT;
    } else if (forceLandscape) {
        console.log("force landscape mode");
        loadProfileMode = PROFILE_LANDSCAPE;
    } else if (g_JaxxApp.getUI().getWindowHeight() > g_JaxxApp.getUI().getWindowWidth()) {
        console.log("portrait mode detected");
        loadProfileMode = PROFILE_PORTRAIT;
    } else {
        console.log("landscape mode detected");
        loadProfileMode = PROFILE_LANDSCAPE;
    }

    if (loadProfileMode === PROFILE_PORTRAIT) {
        switchToProfileMode(PROFILE_PORTRAIT);
    } else {
        switchToProfileMode(PROFILE_LANDSCAPE);
        setDefaultProfileMode(PROFILE_LANDSCAPE);
    }

    if (PlatformUtils.extensionSafariCheck()) {
        safari.self.width = 375;
        safari.self.height = 600;
    }

    if (PlatformUtils.extensionCheck()) {
        JaxxUI._sUI.resizeChromeExtension();
    }

    $(window).on('openurl', function (event, url) {
        console.log("received openurl event :: " + event + " :: url ::" + url);
        checkOpenUrl(url);
    });

    $(window).resize(resize);


}
//@note: @todo: optimize more!
function updateScreen(time) {


    //@note: this is for minor code styling.

//    if (PlatformUtils.browserChromeCheck()) {
//        var oldConsoleLogger = console.log;
//        console.log = function() {
//            oldConsoleLogger("%creddy", "color:red;");
//            var allArguments = arguments;
//            var curLength = allArguments.length;
//
//            allArguments[0] = "%c" + allArguments[0];
//            allArguments[allArguments.length] = "color: red;";//; background: yellow;";
//            allArguments.length++;
////            allArguments[curLength - 1] += ", background: yellow;";
//
//            oldConsoleLogger.apply(oldConsoleLogger, allArguments);
//        }
//    }

    //@note: this is for resetting the cache.
    var shouldShowLoading = window.localStorage.getItem('shouldShowLoading');

    if (typeof(shouldShowLoading) !== 'undefined' && shouldShowLoading !== null && shouldShowLoading === "true") {
        /// Navigation.openModal('loading'); // Commented out because we don't want to show this modal right after pairing from a mnemonic and starting the app from the Chrome extension.
        window.localStorage.removeItem('shouldShowLoading');


        setTimeout(function() {
            updateScreen(0);
        }, 300);

        return;
    }

    if (PlatformUtils.extensionSafariCheck()) {
        setTimeout(function() {
            startJaxx();
            //initializeJaxx();
            console.log("switch");
        }, 1500);
    } else {

        console.log('     !!!!!!!!!!!!!!!!!!!!!!!!!!           startJaxx  ');
        startJaxx();

        //        Navigation.pushSettings('backupPrivateKeysBitcoin');
    }

    //    for (var i = 0;i < 10000; i++) {
//        var curSecret  = new thirdparty.Buffer.Buffer(crypto.getRandomValues(new Uint8Array(32 + 16 + 16)))
//
//        var liskKeyDict = thirdparty.liskjs.crypto.getKeys(curSecret);
//
//        console.log("liskKeyDict :: " + i + " :: " + liskKeyDict.publicKey);
//    }
}

if (!exports) {
    var exports = {};
}
//@note: this waits for the first frame.


//setInterval(function() {
//    var baseUrl = 'https://btc.blockr.io/';
//    var addresses = "13v9LAiAypC4TTuL8U56K9jBCf5SB4ZuXQ,1QBUrAzLJVQAvTxfVm8mf5LuDPaaYqk5u3,1BxB8eednC23dNwsapGXhAa3Wc6qAvHBcP,1CXbh4STLe39BocfZNRPy3dC4PLJdc44sg,1GYeRrZAXxj3S6JsgfHhADhW24PcuDQS6g,1Ntx4zwK5UrGXE2FWT1uHdBEc5deBpVYqK,19zTVALEmDUFXABZj6zBsDnjnvq2spBDwy,1Eiwx5Jdpf3WGcAbgJzvz4crC3yU6fb6E2,1PusjJ32X6eWEHxbU18adKc9CecjTQEu6e,1BRNiqb4CeBHbBcYi3rUZqCqxkDSgB3dB4";
//
//    RequestSerializer.getJSON(baseUrl+'api/v1/address/txs/'+addresses, function (response,status) {
//        if(status==='error'){
//            g_JaxxApp.getBitcoinRelays().relayLog("Chain Relay :: Cannot get txList : No connection with blockr");
//        }
//        else {
//            g_JaxxApp.getBitcoinRelays().relayLog("Chain Relay :: " + this.getBitcoinRelays().blockr.name+" Tx List Raw response:"+JSON.stringify(response));
//        }
//    },true);
//}, 100);
//setTimeout(function() {
//    g_JaxxApp.getUI().showDAORefund();
//
//}, 2000);
//
//setTimeout(function() {
//    g_JaxxApp.getUI().showEtcEthSplitModal();
//}, 100);
//console.log("try filesystem");
//
//function errorHandler(err) {
//    console.log("errorHandler :: " + err);
//
//}
//
//function onInitFs() {
//    console.log("file system init");
//}
//
//window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
//
//var fs = window.requestFileSystem(window.PERSISTENT, 1024*1024,onInitFs,errorHandler);
//
//console.log("filesystem :: " + fs);

//var passingPhrases = [];
//var searchWords = ["hamster", "spirit"];
//
//for (var i = 0; i < 100000; i++) {
//    var newPhrase = thirdparty.bip39.generateMnemonic();
//
//    var parsedWords = newPhrase.trim().toLowerCase().split(" ");
//
//    var foundSearchWords = {};
//
//    for (var j = 0; j < parsedWords.length; j++) {
//        var curWord = parsedWords[j];
//
//        for (var k = 0; k < searchWords.length; k++) {
//            var curSearchWord = searchWords[k];
//
//            if (curWord === curSearchWord) {
//                foundSearchWords[curWord] = true;
//            }
//        }
//
//        if (Object.keys(foundSearchWords).length === searchWords.length) {
//            passingPhrases.push(newPhrase);
//        }
//    }
//}
//
//console.log("[ phrases ] ::");
//
//for (var i = 0; i < passingPhrases.length; i++) {
//    var curPhrase = passingPhrases[i];
//
//    console.log(curPhrase);
//}
//
//console.log("[ end of phrases ]");
