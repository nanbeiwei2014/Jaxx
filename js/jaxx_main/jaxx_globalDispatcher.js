var JaxxGlobalDispatcher = function() {
    this._dispatchManager = null;
    this._eventList = null;
}

JaxxGlobalDispatcher.prototype.initialize = function() {
    this._dispatchManager = $({});
    this._eventList = {};
}

JaxxGlobalDispatcher.prototype.addEvent = function(registryObject, eventSymbol, callback) {
    console.log("[ dispatchManager :: addEvent ] :: eventSymbol :: " + eventSymbol);
    
    if (typeof(this._eventList[eventSymbol]) === 'undefined' || this._eventList[eventSymbol]) {
        this._eventList[eventSymbol] = {};
    }
    
    if (typeof(this._eventList[eventSymbol][registryObject]) !== 'undefined' && this._eventList[eventSymbol][registryObject] !== null) {
        console.log("[ dispatchManager :: addEvent ] :: warning :: eventSymbol :: " + eventSymbol + " :: registryObject :: " + registryObject + " :: has existing function :: " + this._eventList[eventSymbol][registryObject]);    
    }
    
    this._eventList[eventSymbol][registryObject] = callback;
    
    this._dispatchManager.on(eventSymbol, callback);
}

JaxxGlobalDispatcher.prototype.removeEvent = function(eventSymbol, callback) {
    if (typeof(this._eventList[eventSymbol]) === 'undefined' || this._eventList[eventSymbol] === null) {
        console.log("[ dispatchManager :: removeEvent ] :: error :: eventSymbol has no existing function");
        
        return;
    }

    if (typeof(this._eventList[eventSymbol][registryObject]) !== 'undefined' && this._eventList[eventSymbol][registryObject] !== null) {
        console.log("[ dispatchManager :: removeEvent ] :: success :: eventSymbol has existing function :: " + this._eventList[eventSymbol][registryObject]);
        
        delete this._eventList[eventSymbol][registryObject];
    }
    
    this._dispatchManager.off(eventSymbol, callback);
}

JaxxGlobalDispatcher.prototype.triggerEvent = function(eventSymbol, params) {
    var params = 
    this._dispatchManager.triggerHandler(eventSymbol, params);
}