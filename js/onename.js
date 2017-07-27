// This is a wildcard

function ProofOfWork() {
}

function Onename(username, privateKey) {
    this._username = username;
    this._privateKey = privateKey;

    this._twitterUsername = null;
    this._bitcoinAddress = null
}

Onename.usernameAvailable = function(username, callback) {
    var notify = function(data) {
        if (data.reason === 'notfound') {
            callback(null, true);

        } else if (data.status === 'success') {
            callback(null, false);

        } else {
            callback(data.error);
        }
    };
    //RequestSerializer.getJSON('http://localhost:5000/v2/onename/lookup/' + username, notify, true);
    RequestSerializer.getJSON('https://glacial-plains-9083.herokuapp.com/v2/onename/lookup/' + username, notify, true);
}


Onename.registerUsername = function(username, targetAddress,callback) {
    var notify = function(data) {
        console.log(data);
        if (data.status !== 'success') {
            callback(new Error("There was an error registering"));

        } else {
            callback(null, true);
        }
    };

    //setTimeout(function() { callback(null, true); }, 1000);
    RequestSerializer.getJSON('http://glacial-plains-9083.herokuapp.com/v2/onename/register/' + username + "?recipientAddress=" + targetAddress, notify, true);
}

Onename.lookupTwitter = (function() {
    var cache = {};

    return function(username, callback) {
        if (cache[username]) {
            setTimeout(function() { callback(null, cache[username]); }, 1);
            return;
        }

        var notify = function(data) {
            console.log(data);
            callback(username, data);
            /*
            if (data.status !== 'success') {

            } else if (data.twitter) {
                cache[username] = data;
                callback(null, {request: username, avatar: data.ava});

            } else {
                callback(null, {request: username});
            }
            */
        };

        RequestSerializer.getJSON('http://glacial-plains-9083.herokuapp.com/v2/twitter/lookup/' + username, notify, true);
    }
})();

Onename.prototype.getTwitter = function() {
    return this._twitterUsername;
}

Onename.prototype.setTwitter = function(twitterUsername) {
    this._twitterUsername = twitterUsername;
}

Onename.prototype.validateTwitter = function(callback) {
}


Onename.prototype.getBitcoinAddress = function() {
    return this._bitcoinAddress;
}

Onename.prototype.setBitcoinAddress = function(bitcoinAddress) {
    this._bitcoinAddress = bitcoinAddress;
}


Onename.prototype.getNamecoinAddress = function() {
}


Onename.prototype.updateOnename = function() {
   // @TODO: push to onename
}
