var RelayManagerLisk = function() {
    this._debugRelays = true; // Set to 'true' to report messages from the relay log.
    this._name = "LiskRelays"; // Just maybe used for testing.
    this._relayNodes = [];
    this._defaultRelayIndex = 0;
}

RelayManagerLisk.prototype.initialize = function(arrRelayNodes) {
    if (typeof(importScripts) !== 'undefined') {
        importScripts("../relays/relay_nodes_lisk/jaxx_lsk_custom_relay.js");
//        importScripts("../relays/relay_nodes_litecoin/jaxx_ltc_custom_relay.js");
    }

    if (typeof(arrRelayNodes) !== 'undefined' && arrRelayNodes !== null){
        this._relayNodes = arrRelayNodes;
    } else {
        this._relayNodes = [
            new LSKJaxxCustomRelay(),
    //        new LTCJaxxCustomRelay(),
        ]
    }
}

RelayManagerLisk.prototype.getDefaultRelayIndex = function() {
    return this._defaultRelayIndex;
}

if (typeof(exports) !== 'undefined') {
    exports.relayManagerImplementation = RelayManagerLisk;
}

RelayManagerLisk.prototype.setRelayNodes = function(arrNodes){
    this._relayNodes = arrNodes;
}