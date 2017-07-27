var RequestSerializer = function (maxInflight) {
    this._maxInflight = maxInflight || 1;
    this._requests = [];
    this._startTimes = {};
    this._inflight = 0;
}

RequestSerializer.prototype._nudge = function() {
    var self = this;

    while (this._requests.length && this._inflight < this._maxInflight) {
        var request = this._requests.pop();
        //console.log('Activating: ' + request.url);

        this._startTimes[request.url] = (new Date()).getTime();

        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == XMLHttpRequest.DONE) {
                //var dt = ((new Date()).getTime() - self._startTimes[request.url]) / 1000;
                if(xmlhttp.status == 200){
                    var jsonReturnData = {};
                    try {
                        jsonReturnData = JSON.parse(xmlhttp.responseText);
                    } catch(err) {
//                        console.log("RequestSerializer :: error :: " + JSON.stringify(err) + " :: " + xmlhttp.responseText + " :: url :: " + xmlhttp.responseURL);

                        request.callback(xmlhttp.responseURL, 'error', request.passthroughParam);
                        return;
                    }
                    
                    //console.log('Success: ' + request.url + ' (' + dt + 's)');
                    request.callback(jsonReturnData, 'success', request.passthroughParam);

                } else if (request.callbackOnError) {
                    request.callback({}, 'error', request.passthroughParam);
                    console.log('Failed: ' + request.url + ' (' + xmlhttp.passthroughParam + ')');
                }

                //delete self._urls[request.url];
                delete self._startTimes[request.url];
                self._inflight--;

                self._nudge();
            }
        }

        xmlhttp.open(request.method, request.url, true);

        if (request.method === "GET") {
            xmlhttp.send();
        } else if (request.method === 'POST') { //POST
            xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            xmlhttp.send(JSON.stringify(request.payload));
        } else if (request.method === 'POST-urlenc') {
            xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xmlhttp.send(JSON.stringify(request.payload));
        }
        this._inflight++;
    }
}


RequestSerializer.prototype.getJSON = function(url, callback, callbackOnError, passthroughParam) {
    this._requests.push({url: url, method: "GET", callback: callback, callbackOnError: callbackOnError, passthroughParam: passthroughParam});

    this._nudge();
}

RequestSerializer.prototype.postJSON = function(url, payload, callback, callbackOnError, passthroughParam) {
    this._requests.push({url: url, method : "POST", payload: payload, callback: callback, callbackOnError: callbackOnError, passthroughParam: passthroughParam});
    this._nudge();
}

RequestSerializer.prototype.postUrlEncoded = function(url, payload, callback, callbackOnError, passthroughParam) {
    this._requests.push({url: url, method : "POST-urlenc", payload: payload, callback: callback, callbackOnError: callbackOnError, passthroughParam: passthroughParam});
    this._nudge();
}

RequestSerializer.sharedRequestSerializer = new RequestSerializer(4);

RequestSerializer.getJSON = function (url, callback, callbackOnError, passthroughParam) {
  //return; //TODO remove-it
    RequestSerializer.sharedRequestSerializer.getJSON(url, callback, callbackOnError, passthroughParam);
}

RequestSerializer.postJSON = function (url, payload, callback, callbackOnError, passthroughParam) {
    RequestSerializer.sharedRequestSerializer.postJSON(url, payload,callback, callbackOnError, passthroughParam);
}

RequestSerializer.postUrlEncoded = function (url, payload, callback, callbackOnError, passthroughParam) {
    RequestSerializer.sharedRequestSerializer.postUrlEncoded(url, payload, callback, callbackOnError, passthroughParam);
}

if (typeof(exports) !== 'undefined') {
    exports.requestSerializer = RequestSerializer;
}
