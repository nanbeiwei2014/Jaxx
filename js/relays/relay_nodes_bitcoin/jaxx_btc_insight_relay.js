var BTCJaxxInsightRelay = function() {
    this._baseUrl = "http://api.jaxx.io:2082/insight-api/";
    this._name = "Jaxx Bitcoin Insight API";
    this._reliable = "true";
    this._lastBlock = 0;
    this._relayManager = null;
    this._forceThisRelayToFail = false; // This is for testing purposes.
}

BTCJaxxInsightRelay.prototype.initialize = function(relayManager) {
    this._relayManager = relayManager;
}

BTCJaxxInsightRelay.prototype.isForceThisRelayToFail = function(){
    return this._forceThisRelayToFail;
}

BTCJaxxInsightRelay.prototype.getLastBlockHeight = function(){
	// This function shares a common interface with the other relays.
	return this._lastBlock;
}

BTCJaxxInsightRelay.prototype.setLastBlockHeight = function(newHeight){
	this._lastBlock = newHeight;
}

BTCJaxxInsightRelay.prototype.fetchLastBlockHeight  = function(callback, passthroughParams) {
    if (this._forceThisRelayToFail) {
        this._relayManager.relayLog("Chain Relay :: " + this._name + " :: fetchLastBlockHeight :: Forcing Fail");

        setTimeout(function() {
            callback("error: forced error state", passthroughParams);
        }, 100);

        return;
    }
    
    var self = this;
    
	this._relayManager.relayLog("Fetching the block height for " + this._name);
    
    RequestSerializer.getJSON(this._baseUrl + 'status?q=getBlockCount', function(response, status, passthroughParams) {
        if (status === 'error'){
            self._relayManager.relayLog("Chain Relay :: No connection with " + this._name + ". Setting height to 0");
            self._lastBlock = 0;
        }
        else {
            //this._lastBlock = response.blockcount;
            //self._relayManager.relayLog("Chain Relay :: Updated blockrexplorer.com height: " + this._lastBlock);
			self.setLastBlockHeight(response.info.blocks);
            self._relayManager.relayLog("Chain Relay :: Updated :: " + self._name + " :: height: " + self.getLastBlockHeight()); // We cannot use 'this' since the function is contained inside a callback.
        }
        
        callback(status, passthroughParams);
    }, true, passthroughParams);
}

BTCJaxxInsightRelay.prototype.checkCurrentHeightForAnomalies  = function() {
    if(this._lastBlock ==0 || typeof this._lastBlock == "undefined"){
        this._reliable=false;
    } 
    else{
        this._reliable=true;
    }  
}

//@note: @here: this is using insight.io, which has the issue with the transactions not being associated to the proper addresses if using multiple.

BTCJaxxInsightRelay.prototype.getTxList = function(addresses, callback, passthroughParams) {
    if (this._forceThisRelayToFail) {
        this._relayManager.relayLog("Chain Relay :: " + this._name + " :: getTxList :: Forcing Fail");

        setTimeout(function() {
            callback("error: forced error state", {}, passthroughParams);
        }, 100);

        return;
    }
    
    this._relayManager.relayLog("Chain Relay :: " + this._name+ " - Requested txlist for " + addresses);
    
    var self = this;
    
    var passthroughAddresses = {addresses: addresses};
    
    var requestString = this._baseUrl + 'addrs/' + addresses + "/txs?group=1";
    // 
    
    
    this._relayManager.relayLog("relay :: " + this._name + " :: requesting :: " + requestString);

    RequestSerializer.getJSON(requestString, function(response, status, passthroughAddresses) {
        var returnTxList = null;
        
        if(status==='error'){
            self._relayManager.relayLog("Chain Relay :: Cannot get txList : No connection with "+ this._name);
        }
        else {
            self._relayManager.relayLog("Chain Relay :: " + self._name + " Tx List Raw response:" + JSON.stringify(response));

            returnTxList = self.getTxListParse(response, passthroughAddresses);
            //            console.log(passthrough.response)
        }
        
        self._relayManager.relayLog("relay :: " + this._name + " :: getTxList :: Request Serializer :: " + JSON.stringify(response));
        
        callback(status, returnTxList, passthroughParams);
    }, true, passthroughAddresses);    
}

BTCJaxxInsightRelay.prototype.getTxListParse = function(primaryTxDetailData, passthroughParams) {
    var txListForAddresses = [];
    var inputDataByAddress = primaryTxDetailData['byAddress'];
    var keysAddresses = Object.keys(inputDataByAddress); // ie. ['1NoMhneypFEt2VvPBkn8cUXxb7vhhUBKLE', '156NsCs1jrKbb1zNne6jB2ZqMfBnd6KRve']
    for (var i = 0; i < keysAddresses.length; i++){
        var currentAddress = keysAddresses[i]; // ie. 1NoMhneypFEt2VvPBkn8cUXxb7vhhUBKLE
        var outputDataAddress = {};
        outputDataAddress['address'] = currentAddress;
        outputDataAddress['txs'] = [];
        var inputDataCurrentAddressArray = inputDataByAddress[currentAddress];
        for (var j = 0; j < inputDataCurrentAddressArray.length; j++){
            var txid = inputDataCurrentAddressArray[j]['txid']; // ie. bc7597f3f0c170cb8966dc37250eca1b8dab169702299c464b3a82185c2227e7
            outputDataAddress['txs'].push({'txHash' : txid});
        }
        outputDataAddress['unconfirmed'] = {};
        txListForAddresses.push(outputDataAddress);
    }
    return {data : txListForAddresses};   
}

BTCJaxxInsightRelay.prototype.getTxCount = function(addresses, callback, passthroughParams) {
    if (this._forceThisRelayToFail) {
        this._relayManager.relayLog("Chain Relay :: " + this._name + " :: getTxCount :: Forcing Fail");

        setTimeout(function() {
            callback("error: forced error state", 0, passthroughParams);
        }, 100);

        return;
    } 
    
    var self = this;
    
    this._relayManager.relayLog("Chain Relay :: " + this._name + " :: requested txCount for :: " + addresses);
    
    var requestString = this._baseUrl + 'addrs/' + addresses + "/txs";
    
    this._relayManager.relayLog("relay :: " + this._name + " :: requesting :: " + requestString);

    RequestSerializer.getJSON(requestString, function(response,status) {
        var txCount = -1;
        if (status === 'error') {
            self._relayManager.relayLog("Chain Relay :: Cannot get txCount : No connection with " + self._name);
        } else {
            txCount = response.totalItems;
            //            console.log("found :: " + JSON.stringify(response));
        }

        callback(status, txCount, passthroughParams);
    },true);    
}

BTCJaxxInsightRelay.prototype.getTxDetails = function(txHashes, callback, passthroughParams) {
    if (this._forceThisRelayToFail) {
        this._relayManager.relayLog("Chain Relay :: " + this._name + " :: getTxDetails :: Forcing Fail");

        setTimeout(function() {
            callback("error: forced error state", [], passthroughParams);
        }, 100);

        return;
    } 

    var self = this;

    this._relayManager.relayLog("Chain Relay :: " + this._name + " :: requested tx details for :: " + txHashes);
    
    var txDetailsStatus = {numHashesTotal: txHashes.length, numHashesProcessed: 0, allHashes: txHashes, numHashRequestsSucceeded: 0, allTxDetails: []};
    
    for (var i = 0; i < txHashes.length; i++) {
        var curHash = txHashes[i];
        
        var requestString = this._baseUrl + 'tx/' + curHash;

        this._relayManager.relayLog("relay :: " + this._name + " :: requesting :: " + requestString);
        
        var passthroughTxDetails = {curHash: curHash, txDetailsStatus: txDetailsStatus};
        
        RequestSerializer.getJSON(requestString, function (response, status, passthroughTxDetails) {
            passthroughTxDetails.txDetailsStatus.numHashesProcessed++;
            
            if (status === 'error') {
                self._relayManager.relayLog("Chain Relay :: Cannot get tx details : No connection with " + self._name);
            } else {
                self._relayManager.relayLog("Chain Relay :: " + self._name + " :: Tx Details Raw response :: " + JSON.stringify(response));

                var txDetails = self.getTxDetailsParse(response);

                passthroughTxDetails.txDetailsStatus.numHashRequestsSucceeded++;
                passthroughTxDetails.txDetailsStatus.allTxDetails.push(txDetails);
            }
            
            if (passthroughTxDetails.txDetailsStatus.numHashesProcessed === passthroughTxDetails.txDetailsStatus.numHashesTotal) {
                var finalStatus = "success";

                if (passthroughTxDetails.txDetailsStatus.numHashRequestsSucceeded !== passthroughTxDetails.txDetailsStatus.numHashesTotal) {
                    finalStatus = "error";
                }

                passthroughTxDetails.txDetailsStatus.allTxDetails.sort(function(a, b) {
                    return a.txid > b.txid; 
                });

                callback(finalStatus, passthroughTxDetails.txDetailsStatus.allTxDetails, passthroughParams);
            }            
        }, true, passthroughTxDetails);
    }
}

BTCJaxxInsightRelay.prototype.getTxDetailsParse = function(primaryTxDetailData) {
//    console.log(primaryTxDetailData)
    
    var outputs = [];
    var inputs = [];
    
    for (i = 0; i < primaryTxDetailData.vout.length; i++) {
        var output = primaryTxDetailData.vout[i];
        
        outputs.push({
            address: output.scriptPubKey.addresses[0],
            amount: output.value, 
            index: i, 
            spent: !(output.spentTxId === 'null'),
            standard: !(primaryTxDetailData.vin[0].scriptPubKey === 'null')
        });
    }
    
    for (i = 0; i < primaryTxDetailData.vin.length; i++) {
        var input = primaryTxDetailData.vin[i];

        inputs.push({
            address: input.addr,
            amount: parseFloat(-input.value).toFixed(8),
            index: i,
            previousTxId: input.txid,
            previousIndex: input.vout,
            standard: !(input.scriptSig === 'null')
        })
    }
    
    var tx = {
        txid: primaryTxDetailData.txid,
        block: primaryTxDetailData.blockheight || 0,
        confirmations: primaryTxDetailData.confirmations,
        time_utc: primaryTxDetailData.time,
        inputs: inputs,
        outputs: outputs     
    }
//    console.log(tx)
    return tx;
}

BTCJaxxInsightRelay.prototype.getMultiAddressBalance = function(addresses, callback, passthroughParams) {
    // getMultiAddressBalance("198aMn6ZYAczwrE5NvNTUMyJ5qkfy4g3Hi,156NsCs1jrKbb1zNne6jB2ZqMfBnd6KRve", function(){console.log(arguments);}, "passthroughParams") // 
    if (this._forceThisRelayToFail) {
        this._relayManager.relayLog("Chain Relay :: " + this._name + " :: getBalance :: Forcing Fail");

        setTimeout(function() {
            callback("error: forced error state", 0, passthroughParams);
        }, 100);

        return;
    }
    
    var addressList = addresses.split(",");

    var self = this;

    this._relayManager.relayLog("Chain Relay :: " + this._name + " :: requested tx details for :: " + addresses);

    var addressBalancesStatus = {numAddressesTotal: addressList.length, numAddressesProcessed: 0, allAddresses: addressList, numAddressRequestsSucceeded: 0, allAddressBalances: [], allAddressUnconfirmedBalances: {}};

    for (var i = 0; i < addressList.length; i++) {
        var curAddress = addressList[i];

        var requestString = this._baseUrl + 'addr/' + curAddress + "/unconfirmedBalance";

        var passthroughAddressBalances = {curAddress: curAddress, addressBalancesStatus: addressBalancesStatus};

        RequestSerializer.getJSON(requestString, function (response, status, passthroughAddressBalances) {
            // http://api.jaxx.io:2082/insight-api/addr/13cs8tXBGEGCFXY88o9MgE4asmMZhNYSG7/balance // Example Call
            var requestString = self._baseUrl + 'addr/' + passthroughAddressBalances.curAddress + "/balance";

            self._relayManager.relayLog("relay :: " + this._name + " :: requesting :: " + requestString);

            if (status === 'error') {
                passthroughAddressBalances.addressBalancesStatus.numAddressesProcessed++; // Increment this whenever the call process is finished
                self._relayManager.relayLog("Chain Relay :: Cannot get tx details : No connection with " + self._name);
                self.getMultiAddressBalanceCheckForCompletion(addressBalancesStatus, passthroughAddressBalances, callback, passthroughParams);
            } else {
                self._relayManager.relayLog("Chain Relay :: " + self._name + " :: Tx Details Raw response :: " + JSON.stringify(response));
                addressBalancesStatus.allAddressUnconfirmedBalances[passthroughAddressBalances.curAddress] = response; // Record the unconfirmed balance.

                RequestSerializer.getJSON(requestString, function (response, status, passthroughAddressBalances) {
                    // "{"curAddress":"1JmumZ1sMMzE5A9rW9K2pf3VezoG9c1i1T","addressBalancesStatus":{"numAddressesTotal":10,"numAddressesProcessed":0,"allAddresses":["13cs8tXBGEGCFXY88o9MgE4asmMZhNYSG7","1FZZqYgmQvbzXb3jhBewXJonA7ut3GRY4k","1JmumZ1sMMzE5A9rW9K2pf3VezoG9c1i1T","198bhqadgbnWebHhWR577Ju6ZPn1zsXLSe","14WFCZ343GAFLmYRRyiBmArZnB9pvCEnBy","1P6Cj2uRbKFPqzShVc94KdPQWv7ekpJ5hr","1MvrpF9tPGeSEAneQBXaFGqk1T7xFDEKke","12GnyZhy3BQYYbmxug1z4hmQfS1vzWGrrs","1MLyrWNPc6kiB6f951oLjepCh9bRic1qJv","19ADNWw3qDertkj3NXqYf1i65mxbegvQGB"],"numAddressRequestsSucceeded":0,"allAddressBalances":[]}}" // JSON.stringify(passthroughAddressBalances)
                    // console.log({"title":"Jaxx Insight Balance", "address": passthroughAddressBalances.curAddress, "balance": response});
                    var addressBalanceDict = {address: passthroughAddressBalances.curAddress, balance: response};

                    passthroughAddressBalances.addressBalancesStatus.numAddressesProcessed++; // Increment this whenever the call process is finished
                    if (status === 'error') {
                        self._relayManager.relayLog("Chain Relay :: Cannot get tx details : No connection with " + self._name);
                        // callback("error", null, passthroughParams);
                    } else {
                        self._relayManager.relayLog("Chain Relay :: " + self._name + " :: Tx Details Raw response :: " + JSON.stringify(response));

                        var addressBalanceDict = {address: passthroughAddressBalances.curAddress, balance: response};

                        passthroughAddressBalances.addressBalancesStatus.numAddressRequestsSucceeded++;
                        passthroughAddressBalances.addressBalancesStatus.allAddressBalances.push(addressBalanceDict);
                    }
                    self.getMultiAddressBalanceCheckForCompletion(addressBalancesStatus, passthroughAddressBalances, callback, passthroughParams);

                }, true, passthroughAddressBalances);
            }
        }, true, passthroughAddressBalances);
    }
}

BTCJaxxInsightRelay.prototype.getMultiAddressBalanceCheckForCompletion = function(addressBalancesStatus, passthroughAddressBalances, callback, passthroughParams) {
    if (passthroughAddressBalances.addressBalancesStatus.numAddressesProcessed === passthroughAddressBalances.addressBalancesStatus.numAddressesTotal) {
        var finalStatus = "success";

        if (passthroughAddressBalances.addressBalancesStatus.numAddressRequestsSucceeded !== passthroughAddressBalances.addressBalancesStatus.numAddressesTotal) {
            finalStatus = "error";
        }
        // At this point we assume

        // Compute total balances here.
        // console.log(passthroughAddressBalances);
        for (var i = 0; i < passthroughAddressBalances.addressBalancesStatus.allAddressBalances.length; i++){
            var address = passthroughAddressBalances.addressBalancesStatus.allAddressBalances[i].address;
            var unconfirmedBalance = addressBalancesStatus.allAddressUnconfirmedBalances[address];
            passthroughAddressBalances.addressBalancesStatus.allAddressBalances[i].balance += unconfirmedBalance;
        }

        passthroughAddressBalances.addressBalancesStatus.allAddressBalances.sort(function (a, b) {
            return a.txid > b.txid;
        });

        var dataToReturn = this.getMultiAddressBalanceParse(passthroughAddressBalances.addressBalancesStatus.allAddressBalances);

        callback(finalStatus, dataToReturn, passthroughParams);

        // Callback arguments example
        // [{"address":"198aMn6ZYAczwrE5NvNTUMyJ5qkfy4g3Hi","balance":800000236957},{"address":"156NsCs1jrKbb1zNne6jB2ZqMfBnd6KRve","balance":0}]}}" // requestString example 2
    }
}

BTCJaxxInsightRelay.prototype.getMultiAddressBalanceParse = function(response){
    // assertion: response is an array.
    var dataToReturn = [];
    for (var i = 0; i < response.length ; i++){
        var addressData = {};
        addressData.address = response[i].address;
        addressData.balance = response[i].balance / 100000000;
        dataToReturn.push(addressData);
    }
    return dataToReturn
}

// /100000000.0
BTCJaxxInsightRelay.prototype.getAddressBalance = function(address, callback, passthroughParams) {
    if (this._forceThisRelayToFail) {
        this._relayManager.relayLog("Chain Relay :: " + this._name + " :: getAddressBalance :: Forcing Fail");

        setTimeout(function() {
            callback("error: forced error state", 0, passthroughParams);
        }, 100);

        return;
    }

    var self = this;
    
    var requestString = this._baseUrl + 'addr/' + address + '/balance';
    
    RequestSerializer.getJSON(requestString, function (response, status) {
        var balance = -1;
        
        if(status === 'error'){
            self._relayManager.relayLog("Chain Relay :: Cannot get address balance : No connection with "+ self._name);
        }
        else {
            self._relayManager.relayLog("Chain Relay :: " + self._name + " Address Balance Raw response:"+JSON.stringify(response));
            
            balance = parseInt(response)/100000000.0;
        }
        callback(status, balance, passthroughParams);
    });
}

BTCJaxxInsightRelay.prototype.getFixedBlockHeight = function(address, callback, passthroughParams) {
    if (this._forceThisRelayToFail) {
        this._relayManager.relayLog("Chain Relay :: " + this._name + " :: getFixedBlockHeight :: Forcing Fail");

        setTimeout(function() {
            callback("error: forced error state", -1, passthroughParams);
        }, 100);

        return;
    }

    var self = this;

    RequestSerializer.getJSON(this._baseUrl + 'api/txs/?address=' + address , function (response,status) {
        if(status==='error'){
            self._relayManager.relayLog("Chain Relay :: Cannot get Tx Block Height : No connection with "+ self._name);
            callback(-1, passthroughParams);
        }
        else {
            var setBlockHeight = response.txs[1].blockheight;

            self._relayManager.relayLog("Chain Relay :: " + self._name + " Tx Block Height Raw response:"+JSON.stringify(setBlockHeight));

            callback(setBlockHeight, passthroughParams);
            //            console.log(self._name + "  :: " + setBlockHeight);

        }
    });
}

BTCJaxxInsightRelay.prototype.getUTXO  = function(addresses, callback, passthroughParams) {
    // addr/[:addr]/utxo - one address
    // addrs/[:addr]/utxo - multiple addresses
    if (this._forceThisRelayToFail) {
        this._relayManager.relayLog("Chain Relay :: " + this._name + " :: getUTXO :: Forcing Fail");

        setTimeout(function() {
            callback("error: forced error state", {}, passthroughParams);
        }, 100);

        return;
    }
    
    if (!callback) {
        throw new Error('missing callback');
    }
    
    var url = this._baseUrl + "addrs/" + addresses + '/utxo';
    this._relayManager.relayLog("Chain Relay :: " + this._name + " - Requested UTXO for "+addresses + " :: url :: " + url);
    
	var self = this;
    var passthroughAddresses = addresses;
    // http://api.jaxx.io:2082/insight-api/addrs/1NoMhneypFEt2VvPBkn8cUXxb7vhhUBKLE,156NsCs1jrKbb1zNne6jB2ZqMfBnd6KRve,1BF9aFApL44QBq7ofnVMweqHEFF8ayxBq9,1PJSEkeiGt4n6FfARxbirgNLTaVQAYp2Hf/utxo // url value 1
    // http://api.jaxx.io:2082/insight-api/addrs/1NoMhneypFEt2VvPBkn8cUXxb7vhhUBKLE,156NsCs1jrKbb1zNne6jB2ZqMfBnd6KRve,1BF9aFApL44QBq7ofnVMweqHEFF8ayxBq9,1PJSEkeiGt4n6FfARxbirgNLTaVQAYp2Hf,1os9tWLDhYEfN6Et8HQWpv5gsS3LKahqT/utxo // url value 2
    RequestSerializer.getJSON(url, function (response,status, passthroughAddresses) {
        // JSON.stringify(response)
        //"[{"address":"1PJSEkeiGt4n6FfARxbirgNLTaVQAYp2Hf","txid":"cacc1f517deb93f37e768bd0c5849ccfc156d509cc7bb84923bcd0a938ee5f48","vout":0,"scriptPubKey":"76a914f49ee7cd367fb8c72337ab37a91902c1d6971b1588ac","amount":0.00017,"satoshis":17000,"height":436787,"confirmations":3},{"address":"1PJSEkeiGt4n6FfARxbirgNLTaVQAYp2Hf","txid":"f21f8279a302fc42fc7dc098cc1f5dacb6462d900d78ce61a643739c5f7e553d","vout":0,"scriptPubKey":"76a914f49ee7cd367fb8c72337ab37a91902c1d6971b1588ac","amount":0.00015,"satoshis":15000,"height":436787,"confirmations":3}]" - response 1
        // "[{"address":"1os9tWLDhYEfN6Et8HQWpv5gsS3LKahqT","txid":"896121d1ff89d572ffdcaa1918ea086901812dbd7cec5329346682e502609de3","vout":0,"scriptPubKey":"76a91408dd0003f3735da9dc004b182f024f9992e40ec488ac","amount":0.000013,"satoshis":1300,"confirmations":0,"ts":1477936313},{"address":"1PJSEkeiGt4n6FfARxbirgNLTaVQAYp2Hf","txid":"cacc1f517deb93f37e768bd0c5849ccfc156d509cc7bb84923bcd0a938ee5f48","vout":0,"scriptPubKey":"76a914f49ee7cd367fb8c72337ab37a91902c1d6971b1588ac","amount":0.00017,"satoshis":17000,"height":436787,"confirmations":3},{"address":"1PJSEkeiGt4n6FfARxbirgNLTaVQAYp2Hf","txid":"f21f8279a302fc42fc7dc098cc1f5dacb6462d900d78ce61a643739c5f7e553d","vout":0,"scriptPubKey":"76a914f49ee7cd367fb8c72337ab37a91902c1d6971b1588ac","amount":0.00015,"satoshis":15000,"height":436787,"confirmations":3}]" - response 2
        var statusToReturn = "unknown status";

        var dataToReturn = {};

        if(status==='error'){
            statusToReturn = "error: no connection with server";

            self._relayManager.relayLog("Chain Relay :: Cannot get UTXO: No connection with "+ self._name);
        } else if (response){
            statusToReturn = "success";

            var dataToReturn = self.getUTXOParse(response, passthroughAddresses);

            self._relayManager.relayLog("Chain Relay :: " + self._name + " UTXO minified :" + JSON.stringify(dataToReturn));
        } else {
            statusToReturn = "error: cannot get utxo";

            self._relayManager.relayLog("Chain Relay :: " + self._name + " : Cannot get UTXO. ");
        }

        callback(statusToReturn, dataToReturn, passthroughParams);

    },true,passthroughAddresses);
}

BTCJaxxInsightRelay.prototype.getUTXOParse = function(response, passthroughAddresses){
    var returnData = {};
    var arrAddresses = [];

    if (typeof(passthroughAddresses) === 'object') {
        arrAddresses = passthroughAddresses;
    } else {
        arrAddresses = passthroughAddresses.split(",");
    }

    for (var i = 0; i < arrAddresses.length; i++){
        returnData[arrAddresses[i]] = [];
    }
    for (var i = 0; i < response.length; i++){
        returnData[response[i]['address']].push({"txid" : response[i]['txid'], "index" : response[i]['vout'], "confirmations" : response[i]['confirmations'], "amount" : parseFloat(response[i]['amount']).toFixed(8)});
    }
    return returnData;
} 

BTCJaxxInsightRelay.prototype.pushRawTx  = function(hex, callback, passthroughParams) {
    if (this._forceThisRelayToFail) {
        this._relayManager.relayLog("Chain Relay :: " + this._name + " :: pushRawTx :: Forcing Fail");

        setTimeout(function() {
            callback("error: forced error state", {}, passthroughParams);
        }, 100);

        return;
    }
    
    var requestString = this._baseUrl + 'tx/send';
    
    this._relayManager.relayLog("Chain Relay :: " + this._name+ " pushing raw tx : " + hex);
    
    $.ajax(requestString, {
        complete: function(ajaxRequest, status) {
            var response;
            var responseText;
            if (status === 'success') {
                response = '{"status": "success"}';
            }
            else {
                responseText = JSON.stringify(ajaxRequest.responseText)
                response = '{"status": "fail" , "message": ' + responseText + '}';
            }
            
            callback(status, JSON.parse(response), passthroughParams);
        },
        contentType: 'application/x-www-form-urlencoded',
        data: "rawtx="+ hex,
        type: 'POST'
    });
    
    
    // var dataToSend = "rawtx=" + hex;
    /*
    if (this._forceThisRelayToFail) {
        callback("We want this relay to fail.", passthroughParams);
    } else {
        $.ajax(requestString, {
            complete: function(ajaxRequest, status) {          
                var response;
                var responseText;
                if (status === 'success') {
                    response = '{"status": "success"}';
                }
                else {
                    responseText = JSON.stringify(ajaxRequest.responseText);
                    response = '{"status": "fail" , "message": ' + responseText + '}';
                }
                callback(status, JSON.parse(response));
            },
            contentType: 'application/x-www-form-urlencoded',
            data: '{"rawtx": "' + hex + '"}',
            type: 'POST'
        });
        
    }    
    */
    //BTCRelayHelper.pushRawTx(this._name, urlToCall, dataToSend, callback, null);
}

// *******************************************************
// Some test stubs:
// *******************************************************

BTCJaxxInsightRelay.prototype.getRelayType = function() {
	return 'BTCJaxxInsightRelay';
}

BTCJaxxInsightRelay.prototype.getRelayTypeWithCallback = function(callback) {
	var relayName = 'BTCJaxxInsightRelay';
	callback("success", relayName);
	return relayName; 
}

BTCJaxxInsightRelay.prototype.getRelayTypeWithCallbackForgettingStatus = function(callback) {
	var relayName = 'BTCJaxxInsightRelay';
	callback(relayName);
	return relayName; 
}

if (typeof(exports) !== 'undefined') {
    exports.relayBlockExplorer = BTCJaxxInsightRelay;
}