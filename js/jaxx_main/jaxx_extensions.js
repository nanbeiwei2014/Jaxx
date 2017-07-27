/**
 * Created by Daniel on 2017-01-20.
 */
HDNode.buildNodeFromData = function(jsonChainCode, intDepth, intIndex, strKeyPairWIF, jsonNetwork, intParentFingerPrint){
    var objECPair = thirdparty.bitcoin.ECPair.fromWIF(ethKeyPair.toWIF(), ethKeyPair.network);
    return HDNode.buildNodeFromDataAndECPair(jsonChainCode, intDepth, intIndex, objECPair, intParentFingerPrint);
}

HDNode.buildNodeFromDataAndECPair = function(jsonChainCode, intDepth, intIndex, objECPair, intParentFingerPrint) {
    var returnNode = new HDNode();
    var objectData = {"chainCode":jsonChainCode, "depth":intDepth, "intIndex":intIndex, "keyPair":objECPair, "parentfingerprint": intParentFingerPrint};

}

