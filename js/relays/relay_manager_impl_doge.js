var RelayManagerDoge = function() {
  this._debugRelays = false; // Set to 'true' to report messages from the relay log.
  this._name = "DogeRelays"; // Just maybe used for testing.
  this._relayNodes = [];

  this._defaultRelayIndex = 0;
}

RelayManagerDoge.prototype.initialize = function() {
  if (typeof(importScripts) !== 'undefined') {
   // importScripts("../relays/relay_nodes_dogecoin/jaxx_dogecoin_relay.js");
      //importScripts("../relays/relay_nodes_dogecoin/blockcypher_relay.js");
  }

  this._relayNodes = [
      // new DogeBlockcypherRelay(),
      new DogeJaxxCustomRelay()
  ]
}

RelayManagerDoge.prototype.getDefaultRelayIndex = function() {
  return this._defaultRelayIndex;
}

if (typeof(exports) !== 'undefined') {
    exports.relayManagerImplementation = RelayManagerDoge;
}