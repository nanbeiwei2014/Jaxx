
var Vault = function() {
    //Encrypt using google crypto-js AES-base cypher
    this._key = "6Le0DgMTAAAAANokdfEial"; //length=22
    this._iv  = "mHGFxENnZLbienLyALoi.e"; //length=22
    this._keyB;
    this._ivB;
}

Vault.prototype.encryptSimple = function(clearTxt) {
    this._keyB = thirdparty.CryptoJS.enc.Base64.parse(this._key);
    this._ivB = thirdparty.CryptoJS.enc.Base64.parse(this._iv);
    var encrypted = thirdparty.CryptoJS.AES.encrypt(clearTxt, this._keyB, { iv: this._ivB });
    var encryptedString = encrypted.toString();
    return encryptedString;
}

Vault.prototype.decryptSimple = function(encryptedTxt) {
    this._keyB = thirdparty.CryptoJS.enc.Base64.parse(this._key);
    this._ivB = thirdparty.CryptoJS.enc.Base64.parse(this._iv);
    var decrypted = thirdparty.CryptoJS.AES.decrypt(encryptedTxt, this._keyB, { iv: this._ivB });
    var decryptedText = decrypted.toString(thirdparty.CryptoJS.enc.Utf8);
    return decryptedText;
}    

Vault.prototype.decrypt = function(encVal, callback) {
    var error = null;

    var decryptedVal = this.decryptSimple(encVal, true);

    callback(error, decryptedVal);
}


var g_Vault = new Vault();

//Vault.retrieve = function(encVal, callback) {
//    var error = null;
//    
//    var decryptedVal = Vault.decryptSimple(encVal, true);
//    
//    callback(error, decryptedVal);
//}