//var http = require('http');
//var fs = require('fs');
//
//http.createServer(function(req, res){
//    fs.readFile('relays_test.html',function (err, data){
//        res.writeHead(200, {'Content-Type': 'text/html','Content-Length':data.length});
//        res.write(data);
//        res.end();
//    });
//}).listen(8000);

global["path"] = require('path');

global["XMLHttpRequest"] = require('xhr2');

global["RequestSerializer"] = require('../../js/request.js').requestSerializer;

global["BTCBlockcypherRelay"] =  require('../../js/relays/relay_nodes_bitcoin/blockcypher_relay.js').relayBlockCypher;

global["BTCBlockrRelay"] =  require('../../js/relays/relay_nodes_bitcoin/blockr_bitcoin_relay.js').relayBlockr;

global["BTCBlockExplorerRelay"] =  require('../../js/relays/relay_nodes_bitcoin/blockexplorer_relay.js').relayBlockExplorer;

global["BTCBlockChainRelay"] =  require('../../js/relays/relay_nodes_bitcoin/blockchain_relay.js').relayBlockChainInfo;

global["BTCJaxxInsightRelay"] =  require('../../js/relays/relay_nodes_bitcoin/jaxx_btc_insight_relay.js').relayBlockChainInfo;

global["LTCJaxxCustomRelay"] =  require('../../js/relays/relay_nodes_litecoin/jaxx_ltc_custom_relay.js').relayBlockChainInfo;

global["LSKJaxxCustomRelay"] =  require('../../js/relays/relay_nodes_lisk/jaxx_lsk_custom_relay.js').relayBlockChainInfo;

global["RelayTask"] = require('../../js/relays/relay_task.js').relayTask;

global["BitcoinRelays"] = require('../../js/relays/relay_manager_impl_bitcoin.js').bitcoinRelays;

//console.log("BitcoinRelays :: " + BitcoinRelays);

global["JaxxApp"] = require('./jaxxRelaysTests.js').jaxxApp;

global["g_JaxxApp"] = new JaxxApp();

global["baseLog"] = console.log;

//console.log = function() {
//    
//}

global['fs'] = require('fs');


g_JaxxApp.initialize();
g_JaxxApp.startTest();

//process.exit();