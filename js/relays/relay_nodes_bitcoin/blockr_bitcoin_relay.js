var BTCBlockrRelay = function() {
    this._baseUrl =  'https://btc.blockr.io/';
    this._name = 'Bitcoin Blockr.io API';
    this._reliable = true;
    this._lastBlock = 0;
    this._relayManager = null;
    this._forceThisRelayToFail = false; // This is for testing purposes.
}

BTCBlockrRelay.prototype.isForceThisRelayToFail = function(){
    return this._forceThisRelayToFail;
}

BTCBlockrRelay.prototype.getName = function(){
    return this._name;
}

BTCBlockrRelay.prototype.initialize = function(relayManager) {
    this._relayManager = relayManager;
}

BTCBlockrRelay.prototype.getLastBlockHeight = function(){
	// This function shares a common interface with the other relays.
	return this._lastBlock;
}

BTCBlockrRelay.prototype.setLastBlockHeight = function(newHeight){
	this._lastBlock = newHeight;
}

BTCBlockrRelay.prototype.fetchLastBlockHeight = function(callback, passthroughParams) {
    if (this._forceThisRelayToFail) {
        this._relayManager.relayLog("Chain Relay :: " + this._name + " :: fetchLastBlockHeight :: Forcing Fail");

        setTimeout(function() {
            callback("error: forced error state", passthroughParams);
        }, 100);

        return;
    }
    
    var self = this;
	
    this._relayManager.relayLog("Fetching the block height for " + this._name);
    
    RequestSerializer.getJSON(this._baseUrl+'api/v1/coin/info', function(response, status, passthroughParams) {
        if (response.status === "success"){
            //this._lastBlock = response.data.last_block.nb;
            self.setLastBlockHeight(response.data.last_block.nb);
            self._relayManager.relayLog("Chain Relay :: Updated blockr height: " + self.getLastBlockHeight()); // We cannot use 'this' since the function is contained inside a callback.
            // @Note: Potential problem with btcRelays on next line.
            //self._relayManager.relayLog("Chain Relay :: Updated Blockr.io height: " + this._lastBlock);
        }
        else {
            self._relayManager.relayLog("Chain Relay :: No connection with " + self._name + ". Setting height to 0");
            self._lastBlock = 0;
        }

        callback(response.status, passthroughParams);
    }, true, passthroughParams);
}


BTCBlockrRelay.prototype.checkCurrentHeightForAnomalies = function() {
    if(this._lastBlock == 0 || typeof this._lastBlock == "undefined"){
        this._reliable=false;
    } 
    else{
        this._reliable=true;
    }  
}

//@note: this takes in an array of addresses.
BTCBlockrRelay.prototype.getTxList = function(addresses, callback, passthroughParams) {
    // g_JaxxApp.getBitcoinRelays().getRelayByIndex(1).getTxList("13cs8tXBGEGCFXY88o9MgE4asmMZhNYSG7", function(){console.log(JSON.stringify(arguments));}, "Passthrough");
    if (this._forceThisRelayToFail) {
        this._relayManager.relayLog("Chain Relay :: " + this._name + " :: getTxList :: Forcing Fail");
        
        setTimeout(function() {
            callback("error: forced error state", {}, passthroughParams);
        }, 100);

        return;
    }
    
    this._relayManager.relayLog("Chain Relay :: " + this._name+ " :: Requested txlist for :: " + addresses);

    var self = this;
    // "https://btc.blockr.io/api/v1/address/txs/13cs8tXBGEGCFXY88o9MgE4asmMZhNYSG7" // requestString
    RequestSerializer.getJSON(this._baseUrl + 'api/v1/address/txs/' + addresses, function(response, status, addressPassthrough) {
        // "{"status":"success","data":{"address":"13cs8tXBGEGCFXY88o9MgE4asmMZhNYSG7","limit_txs":200,"nb_txs":9,"nb_txs_displayed":9,"txs":[{"tx":"9c2e82a67f875f3cac31b25ccd2e81592809aa3fc31c52413c8a1eb114ea6087","time_utc":"2017-01-17T14:16:30Z","confirmations":4878,"amount":-0.0002,"amount_multisig":0},{"tx":"a494d1dc3e9a46f8af51af72243fc0e4464970a0ed70f8513ecc475dd5d47c55","time_utc":"2017-01-16T18:23:34Z","confirmations":5008,"amount":0.0001,"amount_multisig":0}]},"code":200,"message":""}" // JSON.stringify(response) // shortened to make code less cluttered.
        var returnTxList = null;

        if (status==='error') {
            self._relayManager.relayLog("Chain Relay :: Cannot get txList : No connection with " + self._name);

            callback(status, returnTxList, passthroughParams);
        } else {
            self._relayManager.relayLog("Chain Relay :: " + self._name+" Tx List Raw response:"+JSON.stringify(response));

            var passthroughFromConfirmed = {response: response, callback: callback, addressList: addressPassthrough};
            // https://btc.blockr.io/api/v1/address/unconfirmed/13cs8tXBGEGCFXY88o9MgE4asmMZhNYSG7 // try this request string
            RequestSerializer.getJSON(self._baseUrl + 'api/v1/address/unconfirmed/' + addresses, function (response, status, passthrough) {
                // "{"status":"success","data":{"address":"13cs8tXBGEGCFXY88o9MgE4asmMZhNYSG7","unconfirmed":[]},"code":200,"message":""}" // JSON.stringify(response);
                if (status === 'error'){
                    self._relayManager.relayLog("Chain Relay :: Cannot get txList : No connection with " + self._name);
                } else {
                    self._relayManager.relayLog("Chain Relay :: " + self._name+ " Tx List (unconfirmed) Raw response:" + JSON.stringify(response));

                    returnTxList = self.getTxListParse(passthrough.response, response);
                }
                // "{"data":[{"address":"13cs8tXBGEGCFXY88o9MgE4asmMZhNYSG7","txs":[{"txHash":"9c2e82a67f875f3cac31b25ccd2e81592809aa3fc31c52413c8a1eb114ea6087"},{"txHash":"a494d1dc3e9a46f8af51af72243fc0e4464970a0ed70f8513ecc475dd5d47c55"},{"txHash":"3f0a998b9f0384af646b037a265fa153560f3a0565fcfb5415c475da5bfc35d8"},{"txHash":"b76ad607e498e71bdc83679873be9c5f0c6959a447a37491d88b69dcaefddcfa"},{"txHash":"66d6fe96aa7932d6a01c536d6ac9d494e9e56752ecd52b5b7c73326b87bf3c12"},{"txHash":"a9b4b130871c288988bccaeaa52669be82b5b7ab2dd98e7ad51a3d2abe50b9c9"},{"txHash":"27d7a52437d190c79cf9167e8362a7ae95cc86dc2ab3e64246a0a713bb01bae1"},{"txHash":"a747526ba25af8fb9a3120adea238dd8c416372361fbdbfef9a29ee6f84df945"},{"txHash":"7412bef1736d42c7ef349bcf92c043b0eb84d46a9e8e26284637808c16d9b202"}],"unconfirmed":[]}]}" // JSON.stringify(returnTxList)
                callback(status, returnTxList, passthroughParams);
            }, true, passthroughFromConfirmed);
        }
    }, true, addresses);
}

BTCBlockrRelay.prototype.getTxListParse = function(primaryTXListData, unconfirmedTXListData) { 
    var txDictForAddresses = {};
    
    var dataArray = [];
    
    if (Array.isArray(primaryTXListData.data)) {
        dataArray = primaryTXListData.data;
    } else {
        dataArray = [primaryTXListData.data];
    }
    
    for (var addrIdx = 0; addrIdx < dataArray.length; addrIdx++) {
        var curAddrData = dataArray[addrIdx];

        var curAddress = curAddrData.address;

        var txListItems = [];

        for ( i = 0; i < curAddrData.txs.length; i++) {
            var txItem = curAddrData.txs[i];

            txListItems.push({
//                amount: txItem.amount.toString(),
//                confirmations: txItem.confirmations, 
//                time_utc: parseInt(new Date(txItem.time_utc).getTime()) / 1e3,
                txHash: txItem.tx
            });
        }

        var newTxList = {
            address: curAddress,
            txs: txListItems,
            unconfirmed: []
        }

//        var newTxList = {
//            address: curAddress,
//            txs: txListItems,
//            unconfirmed: []
//        }

        txDictForAddresses[curAddress] = newTxList;
    }
    
    var unconfirmedDataArray = [];
    
    if (Array.isArray(unconfirmedTXListData.data)) {
        unconfirmedDataArray = unconfirmedTXListData.data;
    } else {
        unconfirmedDataArray = [unconfirmedTXListData.data];
    }

    var appendUnconfirmedTxLists = [];

    for (var addrIdx = 0; addrIdx < unconfirmedDataArray.length; addrIdx++) {
        var curAddrData = unconfirmedDataArray[addrIdx];

        var curAddress = curAddrData.address;

        var txListItems = [];

        for ( i = 0; i < curAddrData.unconfirmed.length; i++) {
            var txItem = curAddrData.unconfirmed[i];

            txListItems.push({
                //                amount: txItem.amount.toString(),
                //                confirmations: txItem.confirmations, 
                //                time_utc: parseInt(new Date(txItem.time_utc).getTime()) / 1e3,
                txHash: txItem.tx
            });
        }
        
        var regTxList = null;
        
        if (txDictForAddresses[curAddress] !== 'undefined' &&
            txDictForAddresses[curAddress] !== null) {
            regTxList = txDictForAddresses[curAddress];
        } else {
            regTxList = {
                address: curAddress,
                txs: [],
                unconfirmed: []
            }
            
            txDictForAddresses[curAddress] = regTxList;
        }
        
        for (var i = 0; i < txListItems.length; i++) {
            regTxList.txs.push(txListItems[i]);
            regTxList.unconfirmed.push(txListItems[i]);
        }
    }
    
    var txListForAddresses = [];
    
    var allKeys = Object.keys(txDictForAddresses);
    
    for (var i = 0; i < allKeys.length; i++) {
        txListForAddresses.push(txDictForAddresses[allKeys[i]]);
    }
//    console.log(txList);
    return {data: txListForAddresses};
}

BTCBlockrRelay.prototype.getTxCount = function(addresses, callback, passthroughParams) {
    // g_JaxxApp.getBitcoinRelays().getRelayByIndex(1).getTxCount("13cs8tXBGEGCFXY88o9MgE4asmMZhNYSG7", function(){console.log(JSON.stringify(arguments));}, "Passthrough"); // try in console
    if (this._forceThisRelayToFail) {
        this._relayManager.relayLog("Chain Relay :: " + this._name + " :: getTxCount :: Forcing Fail");  
        setTimeout(function() {
            callback("error: forced error state", 0, passthroughParams);
        }, 100);
        return;
    }
    var self = this;
    this._relayManager.relayLog("Chain Relay :: " + this._name + " :: Requested txCount for :: " + addresses);
    var requestString = this._baseUrl + 'api/v1/address/txs/' + addresses + "?unconfirmed=1";
    this._relayManager.relayLog("relay :: " + this._name + " :: requesting :: " + requestString);
    // https://btc.blockr.io/api/v1/address/txs/13cs8tXBGEGCFXY88o9MgE4asmMZhNYSG7?unconfirmed=1 // requestString
    RequestSerializer.getJSON(requestString, function (response,status) {
        // "{"status":"success","data":{"address":"13cs8tXBGEGCFXY88o9MgE4asmMZhNYSG7","limit_txs":200,"nb_txs":9,"nb_txs_displayed":9,"txs":[{"tx":"9c2e82a67f875f3cac31b25ccd2e81592809aa3fc31c52413c8a1eb114ea6087","time_utc":"2017-01-17T14:16:30Z","confirmations":4881,"amount":-0.0002,"amount_multisig":0},{"tx":"a494d1dc3e9a46f8af51af72243fc0e4464970a0ed70f8513ecc475dd5d47c55","time_utc":"2017-01-16T18:23:34Z","confirmations":5011,"amount":0.0001,"amount_multisig":0},{"tx":"3f0a998b9f0384af646b037a265fa153560f3a0565fcfb5415c475da5bfc35d8","time_utc":"2017-01-09T19:54:13Z","confirmations":6138,"amount":-0.01687279,"amount_multisig":0}]},"code":200,"message":""}" // JSON.stringify(response) // shortened for comment sake.
        var txCount = -1;
        if (status === 'error') {
            self._relayManager.relayLog("Chain Relay :: Cannot get txCount : No connection with "+ this._name);
        } else {
            var txCount = 0;

            for (var i = 0; i < response.data.length; i++) {
                txCount += response.data[i].nb_txs;
            }            
        }
        // {"0":"success","1":9,"2":"Passthrough"}
        callback(status, txCount, passthroughParams);
    }, true);
}

BTCBlockrRelay.prototype.getTxDetails = function(txHash, callback, passthroughParams) {
    // g_JaxxApp.getBitcoinRelays().getRelayByIndex(1).getTxDetails("5a4cae32b6cd0b8146cbdf32dd746ddc42bdec89c574fa07b204ddea36549e65", function(){console.log(JSON.stringify(arguments));}, "Passthrough");
    if (this._forceThisRelayToFail) {
        this._relayManager.relayLog("Chain Relay :: " + this._name + " :: getTxDetails :: Forcing Fail");
        
        setTimeout(function() {
            callback("error: forced error state", [], passthroughParams);
        }, 100);

        return;
    } 

    var self = this;

    this._relayManager.relayLog("Chain Relay :: " + this._name+" - Requested tx details for "+txHash);
    // RequestSerializer.getJSON('https://btc.blockr.io/api/v1/tx/info/5a4cae32b6cd0b8146cbdf32dd746ddc42bdec89c574fa07b204ddea36549e65?amount_format=string', function(){console.log(arguments)})
    
    var requestString = this._baseUrl+'api/v1/tx/info/'+txHash+'?amount_format=string';
    // https://btc.blockr.io/api/v1/tx/info/5a4cae32b6cd0b8146cbdf32dd746ddc42bdec89c574fa07b204ddea36549e65?amount_format=string // requestString
    RequestSerializer.getJSON(requestString, function (response,status, passthroughParams) {
        // "{"status":"success","data":{"tx":"5a4cae32b6cd0b8146cbdf32dd746ddc42bdec89c574fa07b204ddea36549e65","block":419401,"confirmations":34122,"time_utc":"2016-07-05T13:34:53Z","is_coinbased":0,"trade":{"vins":[{"address":"16xk7Y7Gz43EJkfFPwJvxexqN6mgicmHuv","is_nonstandard":false,"amount":"-0.00020900","n":1,"type":0,"vout_tx":"262f2f8e3153972295479a75ff7f43044a7001156115d78bd20473797f6e19f6"}],"vouts":[{"address":"1XBp1zfVHVpMtAjEkMUm1co8o6HQ56r7u","is_nonstandard":false,"amount":"0.00000900","n":0,"type":1,"is_spent":0}]},"vins":[{"address":"16xk7Y7Gz43EJkfFPwJvxexqN6mgicmHuv","is_nonstandard":false,"amount":"-0.00409099","n":1,"type":0,"vout_tx":"262f2f8e3153972295479a75ff7f43044a7001156115d78bd20473797f6e19f6"}],"vouts":[{"address":"1XBp1zfVHVpMtAjEkMUm1co8o6HQ56r7u","is_nonstandard":false,"amount":"0.00000900","n":0,"type":1,"is_spent":0,"extras":{"asm":"OP_DUP OP_HASH160 05b580cc97178ed737019b34817dbad4d34adcce OP_EQUALVERIFY OP_CHECKSIG","script":"76a91405b580cc97178ed737019b34817dbad4d34adcce88ac","reqSigs":1,"type":"pubkeyhash"}},{"address":"16xk7Y7Gz43EJkfFPwJvxexqN6mgicmHuv","is_nonstandard":false,"amount":"0.00388199","n":1,"type":1,"is_spent":1,"extras":{"asm":"OP_DUP OP_HASH160 41637ed7fda5cced49ec283cdae71a256f040573 OP_EQUALVERIFY OP_CHECKSIG","script":"76a91441637ed7fda5cced49ec283cdae71a256f04057388ac","reqSigs":1,"type":"pubkeyhash"}}],"fee":"0.00020000","days_destroyed":"0.00","is_unconfirmed":false,"extras":null},"code":200,"message":""}" // JSON.stringify(response)
        var txDetails = null;

        if(status==='error'){
            self._relayManager.relayLog("Chain Relay :: Cannot get tx details : No connection with "+ self._name);
        }
        else {

            self._relayManager.relayLog("Chain Relay :: " + self._name+" Tx Details Raw response:" + JSON.stringify(response));

            txDetails = self.getTxDetailsParse(response);
            //            console.log(passthrough.response.data);
        }  
        // "[{"txid":"5a4cae32b6cd0b8146cbdf32dd746ddc42bdec89c574fa07b204ddea36549e65","block":419401,"confirmations":34122,"time_utc":1467725693,"inputs":[{"address":"16xk7Y7Gz43EJkfFPwJvxexqN6mgicmHuv","amount":"-0.00409099","index":0,"previousTxId":"262f2f8e3153972295479a75ff7f43044a7001156115d78bd20473797f6e19f6","previousIndex":1,"standard":true}],"outputs":[{"address":"1XBp1zfVHVpMtAjEkMUm1co8o6HQ56r7u","amount":"0.00000900","index":0,"spent":false,"standard":true},{"address":"16xk7Y7Gz43EJkfFPwJvxexqN6mgicmHuv","amount":"0.00388199","index":1,"spent":true,"standard":true}]}]" // JSON.stringify(txDetails)
        callback(status, txDetails, passthroughParams);
    },true);
}

BTCBlockrRelay.prototype.getTxDetailsParse = function(primaryTxDetailData) {
    var txArray = [];
    var dataArray = [];
    
    if (Array.isArray(primaryTxDetailData.data)) {
        dataArray = primaryTxDetailData.data;
    } else {
        dataArray = [primaryTxDetailData.data];
    }
    
    for (var i = 0; i < dataArray.length; i++) {
        var curData = dataArray[i];
        
        var outputs = [];
        var inputs = [];

        for (var j = 0; j < curData.vouts.length; j++) {
            var output = curData.vouts[j];

            outputs.push({

                address: output.address,
                amount: output.amount,
                index: j,
                spent: (output.is_spent === 1),
                standard: !(output.is_nonstandard),
            });
        }


        for (var j = 0; j < curData.vins.length; j++) {
            var input = curData.vins[j];

            inputs.push({

                address: input.address,
                amount: input.amount,
                index: j,
                previousTxId: input.vout_tx,
                previousIndex: input.n,
                standard: !(output.is_nonstandard),
            });
        }
        
        var tx = {
            txid: curData.tx,
            block: curData.block || 0,
            confirmations: curData.confirmations,
            time_utc: parseInt(new Date(curData.time_utc).getTime()) / 1e3,
            inputs: inputs,
            outputs: outputs
        }
        
        txArray.push(tx);
    }

    return txArray;
}

BTCBlockrRelay.prototype.getAddressBalance = function(address, callback, passthroughParams) {
    if (this._forceThisRelayToFail) {
        this._relayManager.relayLog("Chain Relay :: " + this._name + " :: getAddressBalance :: Forcing Fail");
        
        setTimeout(function() {
            callback("error: forced error state", 0, passthroughParams);
        }, 100);
        
        return;
    }
    
    var self = this;
    
    RequestSerializer.getJSON(this._baseUrl + 'api/v1/address/info/' + address + "?confirmations=0", function (response,status) {
        var balance = -1;
        
        if(status==='error'){
            self._relayManager.relayLog("Chain Relay :: Cannot get address balance : No connection with "+ self._name);
        }
        else {
            self._relayManager.relayLog("Chain Relay :: " + self._name + " Address Balance Raw response:"+JSON.stringify(response));
            
            balance = response.data.balance;
        }
        
        callback(status, balance, passthroughParams);
    });
}

BTCBlockrRelay.prototype.getFixedBlockHeight = function(address, callback, passthroughParams) {
    if (this._forceThisRelayToFail) {
        this._relayManager.relayLog("Chain Relay :: " + this._name + " :: getFixedBlockHeight :: Forcing Fail");

        setTimeout(function() {
            callback("error: forced error state", -1, passthroughParams);
        }, 100);

        return;
    }
    
    var self = this;

    RequestSerializer.getJSON(this._baseUrl + 'api/v1/address/info/' + address , function(response,status) {

        if(status==='error'){
            self._relayManager.relayLog("Chain Relay :: Cannot get Tx Block Height : No connection with "+ self._name);
            callback(-1, passthroughParams);
        }
        else {
            self._relayManager.relayLog("Chain Relay :: " + self._name + " Tx Block Height Raw response:"+JSON.stringify(response));

            var setBlockHeight = response.data.first_tx.block_nb;
            callback(parseInt(setBlockHeight), passthroughParams);
        }
    });
}

BTCBlockrRelay.prototype.getUTXO = function(address, callback, passthroughParams) {
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
    
    var url=this._baseUrl+'api/v1/address/unspent/'+address+'?unconfirmed=1';
    this._relayManager.relayLog("Chain Relay :: " + this._name+" - Requested UTXO for "+address + " :: url :: " + url);
    
	var self = this;
    
    // https://btc.blockr.io/api/v1/address/unspent/1NoMhneypFEt2VvPBkn8cUXxb7vhhUBKLE,156NsCs1jrKbb1zNne6jB2ZqMfBnd6KRve?unconfirmed=1 // url: try this in the browser // test case 2 - multiple addresses
    // https://btc.blockr.io/api/v1/address/unspent/1NoMhneypFEt2VvPBkn8cUXxb7vhhUBKLE,156NsCs1jrKbb1zNne6jB2ZqMfBnd6KRve?unconfirmed=1 // url: try this in the browser // test case 1 - one addresses
    RequestSerializer.getJSON(url, function (response,status, passthroughParams) {
        // "{"status":"success","data":[{"address":"1NoMhneypFEt2VvPBkn8cUXxb7vhhUBKLE","unspent":[],"with_unconfirmed":true},{"address":"156NsCs1jrKbb1zNne6jB2ZqMfBnd6KRve","unspent":[],"with_unconfirmed":true}],"code":200,"message":""}" // JSON.stringify(response) // JSON.stringify(response) - test case 2 - more addresses
        // "{"status":"success","data":{"address":"1NoMhneypFEt2VvPBkn8cUXxb7vhhUBKLE","unspent":[],"with_unconfirmed":true},"code":200,"message":""}" // JSON.stringify(response) - test case 1 - 1 address
        if(status==='error'){
            self._relayManager.relayLog("Chain Relay :: Cannot get UTXO: No connection with "+ self._name);
            callback(status, "The server returned an error", passthroughParams);
        }
        else if (response.data){
            //self._relayManager.relayLog("Chain Relay :: " + btcRelays.blockr.name+" UTXO Raw :"+JSON.stringify(response.data.unspent));
            
            var dataToReturn = self.getUTXOParse(response.data);

            self._relayManager.relayLog("Chain Relay :: " + self._name+" UTXO minified :"+JSON.stringify(dataToReturn));
            
            // test case 1 - assertion - 
            callback("success", dataToReturn, passthroughParams);
            // "[{"unspent":[],"address":"1NoMhneypFEt2VvPBkn8cUXxb7vhhUBKLE"}]" // JSON.stringify(dataToReturn) - test case 1
            // "[{"unspent":[],"address":"1NoMhneypFEt2VvPBkn8cUXxb7vhhUBKLE"},{"unspent":[],"address":"156NsCs1jrKbb1zNne6jB2ZqMfBnd6KRve"}]" // JSON.stringify(dataToReturn) - test case 2
        }
        else {
            self._relayManager.relayLog("Chain Relay :: " + self._name+" : Cannot get UTXO. ");
            callback("error: cannot get utxo", {}, passthroughParams);
        }
    },true, passthroughParams);
}

BTCBlockrRelay.prototype.getUTXOParse = function(responseData){
    var returnData = {};
    //@note: @here: @codereview: maybe figure out if this is a single return, and create an array if necessary like the txdetailsparse function.
    if (Array.isArray(responseData)){
        for (var i = 0; i < responseData.length; i++){
            returnData[responseData[i].address] = this.getUTXOParseForOneAddress(responseData[i]);
            //returnData.push(this.getUTXOParseForOneAddress(responseData[i]));
        }
    } else {
        returnData[responseData.address] = this.getUTXOParseForOneAddress(responseData);
        // returnData.push(this.getUTXOParseForOneAddress(responseData));
    }

    return returnData;
}

BTCBlockrRelay.prototype.getUTXOParseForOneAddress = function(responseDataForOneAddress){
    var unspent = [];
    for (var i = 0 ; i < responseDataForOneAddress.unspent.length ; i++){
        var tempRemote = responseDataForOneAddress.unspent[i];
        var tempTx = { txid: tempRemote.tx , amount: parseFloat(tempRemote.amount).toFixed(8), index: tempRemote.n, confirmations: tempRemote.confirmations };
        unspent[i] = tempTx;
    }
    return unspent;    
}

BTCBlockrRelay.prototype.pushRawTx = function(hex, callback, passthroughParams) {

    if (this._forceThisRelayToFail) {
        this._relayManager.relayLog("Chain Relay :: " + this._name + " :: pushRawTx :: Forcing Fail");
        
        setTimeout(function() {
            callback("error: forced error state", {}, passthroughParams);
        }, 100);
        
        return;
    } 
    
    this._relayManager.relayLog("Chain Relay :: " + this._name+ " pushing raw tx : " + hex);
    
    $.ajax(this._baseUrl+'api/v1/tx/push', {
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
            
            callback(status, JSON.parse(response), passthroughParams);
        },
        contentType: 'application/x-www-form-urlencoded',

        data: '{"hex": "' + hex + '"}',
        type: 'POST'
    });

    //@note: @todo: @here: @next: figure out why this works and the helper doesn't.
    
//    var urlToCall = this._baseUrl + 'api/v1/tx/push';
//    var dataToSend = '{"hex":"' + encodeURIComponent(hex) + '"}';
//    
//    BTCRelayHelper.pushRawTx(this._name, urlToCall, dataToSend, callback, null);
}

// *******************************************************
// Some test stubs:
// *******************************************************

BTCBlockrRelay.prototype.getRelayType = function() {
	return 'BTCBlockrRelay';
}

BTCBlockrRelay.prototype.getRelayTypeWithCallback = function(callback) {
	var relayName = 'BTCBlockrRelay';
	callback("success", relayName);
	return relayName; 
}

BTCBlockrRelay.prototype.getRelayTypeWithCallbackForgettingStatus = function(callback) {
	var relayName = 'BTCBlockrRelay';
	callback(relayName);
	return relayName; 
}

if (typeof(exports) !== 'undefined') {
    exports.relayBlockr = BTCBlockrRelay;
}

BTCBlockrRelay.prototype.getMultiAddressBalance = function(addresses, callback, passthroughParams) {
    //@note: @here: @todo: @next: this returns just a single object, while it should return an array.
    // getMultiAddressBalance("198aMn6ZYAczwrE5NvNTUMyJ5qkfy4g3Hi,156NsCs1jrKbb1zNne6jB2ZqMfBnd6KRve", function(){console.log(arguments);}, "passthroughParams") // 
    if (this._forceThisRelayToFail) {
        this._relayManager.relayLog("Chain Relay :: " + this._name + " :: getBalance :: Forcing Fail");

        setTimeout(function() {
            callback("error: forced error state", 0, passthroughParams);
        }, 100);

        return;
    }
    var self = this;
    var requestString = this._baseUrl + "api/v1/address/balance/" + addresses + "?confirmations=0";   
    // https://btc.blockr.io/api/v1/address/balance/198aMn6ZYAczwrE5NvNTUMyJ5qkfy4g3Hi,156NsCs1jrKbb1zNne6jB2ZqMfBnd6KRve?confirmations=0 // requestString
    RequestSerializer.getJSON(requestString, function (response, status, passthroughParams) {
        // "{"status":"success","data":[{"address":"198aMn6ZYAczwrE5NvNTUMyJ5qkfy4g3Hi","balance":8000.00236957,"balance_multisig":0},{"address":"156NsCs1jrKbb1zNne6jB2ZqMfBnd6KRve","balance":0,"balance_multisig":0}],"code":200,"message":""}" // JSON.stringify(response)
        callback(status, response.data, passthroughParams);
    },true, passthroughParams);
}