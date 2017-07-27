// I run Jaxx and then I run the following function in the javascript console.
function(){
	cypherRelay = new BTCBlockCypherRelay();
	cypherRelay.initialize();
	callback = function(){console.log('owls');};
	cypherRelay.getTxList('1LGNcR38rnMEu2kmrPJ7YSLWtnXyw7rMB8', callback)
	console.log();
}