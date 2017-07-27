/**
 * Created by Vlad on 10/15/2016.
 */


HDWalletPouchEthereum.prototype.getCoinAddress = function(node) {
  //        console.log("[ethereum] node :: " + node);
  var ethKeyPair = node.keyPair;
  //        console.log("[ethereum] keyPair :: " + ethKeyPair.d + " :: " + ethKeyPair.__Q);

  var prevCompressed = ethKeyPair.compressed;

  // console.log('   prevCompressed   ',prevCompressed);
  ethKeyPair.compressed = false;

  var ethKeyPairPublicKey = ethKeyPair.getPublicKeyBuffer();
//  console.log('ethKeyPairPublicKey     ',ethKeyPairPublicKey);
  var pubKeyHexEth = ethKeyPairPublicKey.toString('hex').slice(2);
//  console.log('pubKeyHexEth    ',pubKeyHexEth);

  var pubKeyWordArrayEth = thirdparty.CryptoJS.enc.Hex.parse(pubKeyHexEth);

  var hashEth = thirdparty.CryptoJS.SHA3(pubKeyWordArrayEth, { outputLength: 256 });

  var addressEth = hashEth.toString(thirdparty.CryptoJS.enc.Hex).slice(24);

  ethKeyPair.compressed = prevCompressed;

  //    console.log("[ethereum] address :: " + addressEth);
  return "0x" + addressEth;
}


HDWalletPouch.getCoinAddress = function(coinType, node) {

  var address = "";

  if (coinType === COIN_BITCOIN) {
    address = HDWalletPouchBitcoin.getCoinAddress(node);
  } else if (coinType === COIN_ETHEREUM) {
    address = HDWalletPouchEthereum.getCoinAddress(node);
  } else if (coinType === COIN_DASH) {
    address = HDWalletPouchDash.getCoinAddress(node);
  }

  //  console.warn('HDWalletPouch.getCoinAddress  '+coinType + '   '+address);
  return address;
}



/*
HDWalletPouch.prototype.getPublicAddress = function(internal, index, ignoreCached) {
  ignoreCached = 1;
 // console.log('internal '+internal +' index ' + index + '    ignoreCached  '+ignoreCached);
  if (internal === false) {
    internal = 0;
  } else if (internal === true) {
    internal = 1;
  }

  var key = index + '-' + internal;
  var publicAddress = this._publicAddressCache[key];

  if (typeof(publicAddress) === 'undefined' || publicAddress === null || typeof(ignoreCached) !== 'undefined') {
    //@note: use a 'truthy' comparison.
    if (internal == true) {
      publicAddress = HDWalletPouch.getCoinAddress(this._coinType, HDWalletPouch._derive(this._changeNode, index, false));
    } else {
      publicAddress = HDWalletPouch.getCoinAddress(this._coinType, HDWalletPouch._derive(this._receiveNode, index, false));
    }

   // console.log(publicAddress);
    if (this._coinType === COIN_BITCOIN) {

    } else if (this._coinType === COIN_ETHEREUM) {
      console.log("caching public address :: " + publicAddress)
      publicAddress = HDWalletHelper.toEthereumChecksumAddress(publicAddress);

    }

    if (typeof(ignoreCached) === 'undefined') {
      this._publicAddressCache[key] = publicAddress;

      storeData('wPubAddrCache_' + this._coinFullName + "_" + this._storageKey, JSON.stringify(this._publicAddressCache), true);
    } else {
      console.log("uncached fetch of public address");
    }
  } else {
//        if (this._coinType === COIN_ETHEREUM) {
//            publicAddress = HDWalletHelper.toEthereumChecksumAddress(publicAddress);
////            console.log("cached fetch of public address :: " + publicAddress)
//        }
  }

  //console.log(' publicAddress  '+publicAddress + ' this._coinFullName '+this._coinFullName );
  return publicAddress;
}*/

$(document).ready(function(){
var mnem = 'obvious weather screen patient fit sport ensure scrap imitate great unveil monster';
  jaxx.Utils2.setSeed(mnem);
 // var m = jaxx.Utils2.setMasterNode(mnem);

  // 'e4ee5e2a951da81f8b3bd21476e3feb51455ffa035e154873efab4e196ab1c2383f92b78e5a3a594f55553d97724d6378992d9565868225aea304d2557560af4'


 // console.log(m);
  var coinType = 60;

  var address_index = 3;
  var network = null;

  var receiveNode = jaxx.Utils2.getReceiveNode(coinType,address_index,network);
  var receiveAddress = jaxx.Utils2.getEtherAddress(receiveNode);
  console.log('receiveAddress  '+ receiveAddress);

  var changeNode = jaxx.Utils2.getChangeNode(coinType,address_index,network);
  var changeAddress = jaxx.Utils2.getEtherAddress(changeNode);
  console.log('changeAddress  '+ changeAddress);


var privatekey = jaxx.Utils2.getNodePrivateKey(receiveNode);
  console.error(privatekey);
})