var JaxxUser = function() {
    this._firstName = "John";
    this._lastName = "Smythe, Esquire";
    
    this._storageKey = "";
    
    this._pinCodeHash = "";
}

JaxxUser.prototype.initialize = function() {
    
}

JaxxUser.prototype.setupWithWallet = function() {
    var mnemonic = getStoredData('mnemonic',true); //Get mnemonic from localstorage
    var hashMnemonicKey = mnemonic + (TESTNET ? '-test': '-main');

    this._storageKey = thirdparty.bitcoin.crypto.sha256(hashMnemonicKey).toString('hex');

    var hashedPIN = getStoredData("userPin_" + this._storageKey);

    if (hashedPIN === null) {
        hashedPIN = "";
//        userPIN = thirdparty.bitcoin.crypto.sha256("0012").toString('hex');
//
//        console.log("store user pin :: " + userPIN);
//
//        storeData("userPin_" + storageKey, userPIN);
    }
    
    this._pinCodeHash = hashedPIN;
}

JaxxUser.prototype.checkForValidPin = function(pinCode) {
    //checks argument pinCode against hashed pin

    var hashedPIN = thirdparty.bitcoin.crypto.sha256(pinCode).toString('hex');

    if (this._pinCodeHash === hashedPIN) {
//        console.log("PIN correct");
        return true;
    } else {
//        console.log("PIN incorrect");
        return false;
    }
}

JaxxUser.prototype.hasPin = function() {
//    return false;
    if (this._pinCodeHash !== "") {
        return true;
    } else {
        return false;
    }
}

JaxxUser.prototype.clearPin = function() {
    console.log("[ User :: Clear PIN ]");
    
    removeStoredData("userPin_" + this._storageKey);

    this._pinCodeHash = "";
}

JaxxUser.prototype.setPin = function(pinCode) {
    console.log("[ User :: Set PIN ]");
    
    //@note: if this is ever augmented, there should be a salt + vector and a bunch
    //of hash passes.
    
    var hashedPIN = thirdparty.bitcoin.crypto.sha256(pinCode).toString('hex');

    storeData("userPin_" + this._storageKey, hashedPIN);
    
    this._pinCodeHash = hashedPIN;
}

JaxxUser.prototype.getEncryptedPin = function() {
    return getStoredData('userPin_' + this._storageKey, false);
}

JaxxUser.prototype.manuallyStoreHashedPin = function(hashedPIN) {
    storeData("userPin_" + this._storageKey, hashedPIN);   
}