"use strict";

/**
 *  Overview: Contacts and Contact Database
 *
 *  Data Structure
 *  ==============
 *
 *  Using the Web Storage (http://en.wikipedia.org/wiki/Web_storage) API
 *  limits us to using a single key-value store, where keys and values
 *  must be strings.
 *
 *  We simulate tables by prefixing the keys with a table prefix. The
 *  table prefixes are:
 *    - k2-r- for contact records
 *    - k2-m- for meta details
 *
 *  Contacts
 *
 *  Each contact is made up of a number of contact records. Each record has the form:
 *  { cid: CID, accountService: SERVICE, account: ACCOUNT [, priority: PRIORITY] [, cache: CACHE_INFO ] }
 *
 *  Todo:
 *    - priority: this will allow us to deprecate a users old btc address, while
 *      knowing to still scan it)
 *    - cache: this will allow us to minimize hitting onename API's to keep up to date info
 *    - in the future we may wish a third "table", 'k2-i-' for indexing purposes; right now
 *      all searches are performed as linear probes.
 *    - accountService/account verification: for example, ensure a btc address is a valid address
 */


var Contact = function(database, cid) {
    this._database = database;
    this._cid = cid;
    this._records = null;

    // We keep track of our database's lamport timestamp; if it changes, our
    // contact info may have changed, so we'll need to refresh
    this._lamport = database._lamport;
}

Contact.services = {
    bitcoin: 'bitcoin',
    onename: 'onename',
    name: 'name',
    pgp: 'pgp',
    pgpFingerprint: 'pgpFingerprint',
    photo: 'photo',
    twitter: 'twitter',
}

Contact.prototype._load = function() {

    // Already loaded
    if (this._records !== null && this._database._lamport === this._lamport) {
        return;
    }

    this._records = [];

    var self = this;

    this._database._iterate('r', function(key) {
        // Parse the value
        var value = self._database._get('r', key);
        if (value.cid == self._cid) {
            value.key = key;
            self._records.push(value);
        }
    })
}


/**
 *  getAccount(accountService)
 *
 *  Retruns the primary account for a accountService for a contact or null if
 *  no accounts are found.
 */
Contact.prototype.getAccount = function(service) {
    this._load();

    var result = null, priority = 0;

    for (var i = 0; i < this._records.length; i++) {
        var kv = this._records[i];
        if (kv.accountService === service && (result === null || (kv.priority && kv.priority > priority))) {
            result = kv.account;
            if (kv.priority) {
                priority = kv.priority;
            }
        }
    }

    return result;
}


/**
 *  getAllAccounts(accountService)
 *
 *  Finds all accounts for a accountService for a contact. If no accounts are
 *  found, this returns an empty array;
 */
Contact.prototype.getAllAccounts = function(service) {
    this._load();

    var result = [];
    for (var i = 0; i < this._records.length; i++) {
        var kv = this._records[i];
        if (kv.accountService === service) {
            result.push(kv.account);
        }
    }

    return result;
}


/**
 *  addAccount(accountService, account)
 *
 *  Adds an account for a accountService to a contact. If link is specified,
 *  the account is linked to the onename account, so if the onename
 *  is removed or updates, this entry will be removed updated as well.
 *
 *  Duplicates accounts for a accountService are ignored.
 */
Contact.prototype.addAccount = function(service, account, link) {

    // Prevent junk from getting in the database
    if (!service || !account || !Contact.services[service]) {
        console.log('Bad accountService/account: accountService=' + service + ", account=" + account);
        return false;
    }

    // Prevent duplicate accounts
    var accounts = this.getAllAccounts(service);
    for (var i = 0; i < accounts.length; i++) {
        if (account === accounts[i]) {
            return true;
        }
    }

    // @TODO: test things... Like bitcoin address is valid; return false if not

    // Get a new contact identifier
    if (this._cid === null) {
        this._cid = this._database._get('m', 'nextCid', 1);
        this._database._set('m', 'nextCid', this._cid + 1);

        var count = this._database._get('m', 'count', 0);
        this._database._set('m', 'count', count + 1);
    }

    // Get a new record identifier
    var rid = this._database._get('m', 'nextRid', 1);
    this._database._set('m', 'nextRid', rid + 1);

    // The new record
    var record = {
        cid: this._cid,
        service: service,
        account: account,
    }

    // We are linking it to a onename account
    if (link) {
        record.link = link;
    }

    // Add the record to the database
    var key = this._database._set('r', rid, record);

    this._database._notify();

    // Track the database key and add it to the record cache
    record.key = key;
    this._records.push(record);

    return true;
}

Contact.prototype.getName = function(service) {
    var name = this.getAccount('name');
    if (!name) {
        name = this.getAccount('onename');
    }
    if (!name) {
        name = 'unknown';
    }
    return name;
}

Contact.prototype.getPhoto = function(service) {
    var photo = this.getAccount('photo');
    if (!photo) {
        photo = 'img/default-profile_360.png';
    }

    return photo;
}

/**
 *  refreshAccount(accountService [,account] [, callback])
 *
 *  Refreshes the content of a accountService (currently only onename) optionally
 *  for a specific account. If a callback is provided, it will be called for
 *  each account found, with the parameters (contact, account), or not at
 *  all if there is no found accounts.
 *
 *  Any old contact info for the account will be removed.
 */
Contact.prototype.refreshAccount = function(service, account, callback) {

    // Onename is the only "refreshable" contact right now
    if (service !== 'onename') {
        //if (callback) { callback(this, null); }
        return;
    }

    // Account was omitted, but a callback was provided
    if (typeof(account) === 'function' && !callback) {
        callback = account;
        account = null;
    }

    // What accounts do we need to update?
    var accounts = [];
    if (account) {
        accounts.push(account);
    } else {
        accounts = this.getAllAccounts(service);
    }

    // No accounts
    if (accounts.length == 0) { return; }

    for (var i = 0; i < accounts.length; i++) {
        var a = accounts[i];
        RequestSerializer.getJSON('https://rushwallet.com/lookup.php?id=' + a, function(contact, account) {
            return function(data, success) {

                // Remove any old account links
                contact.removeAccount(service, account);
                contact.addAccount(service, account);

                // @TODO: Don't do anything unless things changed

                contact._addOnenameJson(account, data, callback);
            };
        }(this, a));
    }
}


/**
 *  Itnernal
 *
 *  Adds the sub-fields of a onename json payload
 */
Contact.prototype._addOnenameJson = function(account, data, callback) {

     if (data.avatar && data.avatar.url) {
         this.addAccount('photo', data.avatar.url, account);
     }

     if (data.bitcoin && data.bitcoin.address) {
         this.addAccount('bitcoin', data.bitcoin.address, account);
     }

     if (data.twitter && data.twitter.username) {
         this.addAccount('twitter', data.twitter.username, account);
     }

     if (data.name && data.name.formatted) {
         this.addAccount('name', data.name.formatted, account);
     }

     if (data.pgp && data.pgp.fingerprint && data.pgp.url) {
         var fingerprint = data.pgp.fingerprint.toLowerCase();

         var self = this;
         $.get(data.pgp.url, function(data, success) {
             if (fingerprint === pgp.getFingerprint(data)) {
                 self.addAccount('pgp', data, account);
                 self.addAccount('pgpFingerprint', fingerprint, account);
             } else {
                 console.log('Fingerprint did not match!');
             }

             if (callback) {
                 callback(self, account);
             }
         }, 'text');
     } else if (callback) {
         callback(this, account);
     }
}


/**
 *  removeAccount(accountService [, account])
 *
 *  Remove an account from the contact, or all accounts for a accountService if
 *  account is not specified.
 *
 *  Linked records cannot be removed (the owning account must be removed)
 */
Contact.prototype.removeAccount = function(service, account) {
    if (account === undefined) { account = null; }

    this._load();

    for (var i = this._records.length - 1; i >= 0; i--) {
        var kv = this._records[i];

        // To be or not to be?
        var kill = false;
        if (account) {
            if (kv.accountService === service) {
                if (kv.account === account && !kv.link) {
                    // removing a specific account from a accountService; this is that
                    kill = true;
                }
            } else if (service === 'onename') {
                if (kv.link === account) {
                    // removing a specific onename; this is some onename populated entry
                    kill = true;
                }
            }

        } else if (service === kv.accountService) {
            // removing all of a accountService; this is that accountService
            kill = true;

        } else if (service === 'onename') {
            if (kv.link) {
                // removing all onename; this is some onename populated entry
                kill = true;
            }
        }

        // Kill it in both the db and our object records cache
        if (kill) {
            this._database._storage.removeItem(kv.key);
            this._records.splice(i, 1);
        }
    }
}


var ContactDatabase = function(prefix, storage) {

    // This is our internal delimiter; allowing it will shoot us in the foot
    // in subtle ways you cnanot imagine; imagine two databases, "k2" and
    // "k2-2"... clearing "k2" would obliterate both. Otherwise, general
    // corruption could happen.
    if (prefix.indexOf('-') != -1) {
        throw new Error('Prefix may not contain a hyphen (-)');
    }

    if (!storage || !storage.getItem || !storage.setItem) {
        throw new Error('No local storage capabilities; cannot create ContactDatabase');
    }

    this._prefix = prefix + '-';
    this._storage = storage;

    // Lamport is updated on any change to the database, so contacts can
    // know to check for changes to themselves.
    this._lamport = 0;

    // @TODO: Get storage events working to update lamport for cross window
    //        communication. Maybe?

    this._poll = null;

    this._listeners = [];
}

ContactDatabase.prototype._notify = function() {
    for (var i = 0; i < this._listeners.length; i++) {
        this._listeners[i]();
    }
}

ContactDatabase.prototype.setRefreshInterval = function(interval) {
     if (this._poll === null && interval) {

         // Kick off a refresh immediately
         this.refresh();

         // Schedule future refreshes
         var self = this;
         this._poll = setInterval(function() { self.refresh(); }, interval);

     } else if (this._poll !== null && !interval) {

         // Unschedule the interval
         clearInterval(this._poll);
         this._poll = null;
     }
}


ContactDatabase.prototype._get = function(prefix, key, defaultValue) {
    var value = this._storage.getItem(this._prefix + prefix + '-' + key);
    if (value === null || value === undefined) {
        return defaultValue;
    }

    return JSON.parse(value);
}

ContactDatabase.prototype._set = function(prefix, key, value) {
    if (!prefix || !key || !value) {
        console.log('Bad prefix/key/value');
        return;
    }

    var key = this._prefix + prefix + '-' + key;

    this._storage.setItem(key, JSON.stringify(value));

    this._lamport++;

    //this._notify();

    return key;
}

ContactDatabase.prototype._iterate = function(prefix, callback) {
    var prefix = this._prefix + prefix + '-';

    for (var i = 0; i < this._storage.length; i++) {
        var key = this._storage.key(i);

        if (key.substring(0, prefix.length) !== prefix) { continue; }
        callback(key.substring(prefix.length));
    }
}

/**
 *  addContact()
 *
 *  Creates a new contact. The contact is not written to the database
 *  until at least one accountService is added to the contact.
 */
ContactDatabase.prototype.addContact = function() {
    return (new Contact(this, null));
}


/**
 *  lookup(query)
 *
 *  Search contacts given a query.
 *
 *  If query is a string, search all services for any contains match.
 *
 *  If query is an object, it can have any of the following keys:
 *    - accountService (one of: "any" (default), "bitcoin", "name", "onename", "twitter")
 *    - method (one of: "contains" (default), "prefix", "suffix", "exact")
 *    - value (required)
 */
ContactDatabase.prototype.lookup = function(query) {
    if (typeof(query) === 'string') {
        query = { value: query };
    }
    if (!query.service) { query.service = 'any'; }
    if (!query.method) { query.method = 'contains'; }

    var check = null;
    switch (query.method) {
        case 'contains':
            check = function(q, t) {
                return (t.indexOf(q) >= 0);
            };
            break;
        case 'prefix':
            check = function(q, t) {
                return (t.substring(0, q.length) === q);
            };
            break;
        case 'suffix':
            check = function(q, t) {
                return (t.substring(t.length - q.length) === q);
            };
            break;
        case 'exact':
            check = function(q, t) {
                return (q === t);
            };
            break;
        default:
            console.log("Invalid query:", query);
            return null;
    }

    var cids = {};

    for (var i = 0; i < this._storage.length; i++) {
        var key = this._storage.key(i);
        if (key.substring(0, this._prefix.length + 2) !== (this._prefix + 'r-')) { continue; }
        var value = JSON.parse(this._storage[key]);
        if ((query.service === 'any' || value.accountService === query.service) && check(query.value, value.account)) {
            cids[value.cid] = true;
        }
    }

    var results = [];
    for (var cid in cids) {
        results.push(new Contact(this, cid));
    }

    return results;
}


ContactDatabase.prototype.iterate = function(callback) {
    var done = {};

    var self = this;
    this._iterate('r', function(key) {
        var record = self._get('r', key);
        if (done[record.cid]) { return; }
        done[record.cid] = true;

        var contact = new Contact(self, record.cid);
        callback(contact);
    });
}

ContactDatabase.prototype.refresh = function() {
    var inflight = {};

   var self = this;
    this._iterate('r', function(key) {
        var record = self._get('r', key);
        if (record.service === 'onename') {

            // Make sure we only process each request once (should not be any dups anyways...)
            var ck = record.cid + ':' + record.account;
            if (inflight[ck]) { return; }
            inflight[ck] = true;

            // Get the contact and request a refresh
            var contact = new Contact(self, record.cid);
            contact.refreshAccount('onename', record.account);
        }
    });
}

/**
 *  count()
 *
 *  Returns the total number of contacts in the database.
 */
ContactDatabase.prototype.count = function() {
    return this._get('m', 'count', 0);
}


/**
 *  clear()
 *
 *  Remove all contacts.
 */
ContactDatabase.prototype.clear = function() {
    var oldCount = this.count();

    for (var i = this._storage.length - 1; i >= 0; i--) {
        var key = this._storage.key(i);
        if (key.substring(0, this._prefix.length) === this._prefix) {
            this._storage.removeItem(key);
        }
    }

    this._lamport++;

    if (oldCount) {
        this._notify();
    }
}


ContactDatabase.prototype.addListener = function(callback) {
    this._listeners.push(callback);
}

// Instance of our database
//var Contacts = new ContactDatabase('k2', this.localStorage);
