'use strict';

/* jshint camelcase: false */
var pgp = {
  generateKeyPair: openpgp.generate_key_pair,
  key: {
    readArmored: openpgp.read_publicKey,
    readPrivate: openpgp.read_privateKey,
  },
  readMessage: openpgp.read_message,
  signAndEncryptMessage: openpgp.write_signed_and_encrypted_message,
  signMessage: openpgp.write_signed_message,
  getFingerprint: function(publicKey) {
      return s2hex(openpgp.read_publicKey(publicKey)[0].getFingerprint()).toLowerCase();
  }
};
/* jshint camelcase: true */

/* jshint unused: false */
function showMessages() {
  return;
}
/* jshint unused: true */

function s2hex(s) {
    // http://stackoverflow.com/questions/6226189/how-to-convert-a-string-to-bytearray
    var result = '';
    for (var i = 0; i < s.length; i++) {
        var charCode = s.charCodeAt(i);
        var cLen = Math.ceil(Math.log(charCode) / Math.log(256));
        for (var j = 0; j < cLen; j++) {
            var octet = ((charCode << (j*8)) & 0xFF).toString(16);
            if (octet.length === 1) { octet = '0' + octet; }
            result += octet;
        }
    }

    console.log(result);

    return result;
    //return Bitcoin.convert.bytesToHex(Bitcoin.convert.stringToBytes(s));
}

var endpoint = 'https://api.kryptokit.com/v0/gpg';

var message = {
  'pgpKeys': [],
  'generateKey': function(userId, password) {
    var keypair = pgp.generateKeyPair(1, 2048, userId, password);
    storage.set({
      'pgpPrivate': keypair.privateKeyArmored,
      'pgpPublic':  keypair.publicKeyArmored,
      'pgpKeyId':   message.pgpKeyId(keypair.publicKeyArmored)
    });
  },
  'pgpKeyId': function(keyTxt) {
    var key = pgp.key.readArmored(keyTxt);
    return s2hex(key[0].publicKeyPacket.getKeyId());
  },
  'pgpImport': function (keyTxt) {
    if (false === /PUBLIC KEY/.test(keyTxt)) {
      return false;
    }

    var key = pgp.key.readArmored(keyTxt);
    var keyId = message.pgpKeyId(keyTxt);
    var user = key[0].userIds[0].text;
    if (!user) {
      return false;
    }

    user = user.replace('<>', '');

    this.pgpKeys.push({
      'name': user,
      'key': keyTxt,
      'keyId': keyId
    });

    message.pgpKeys.sort(function (a, b) {
      return (a.name.toUpperCase() < b.name.toUpperCase()) ? -1 : 1;
    });

    storage.set({
      'pgpKeys': message.pgpKeys
    }, function () {
      $('.message').hide();
      $('.success').text('Key for "' + user + '" added succesfully!').show();
      $('#messagesPageHeader').show();
      $('#messageList').show();
    });
  },
  'pgpSend': function (name, publicKeyTxt, text) {
    storage.get(['pgpKeyId', 'pgpPrivate'], function (data) {

      var publicKey = pgp.key.readArmored(publicKeyTxt);
      var privateKey = pgp.key.readPrivate(data.pgpPrivate);
      privateKey = privateKey[0];
      var keyid = s2hex(publicKey[0].publicKeyPacket.getKeyId());

      var encrypted = pgp.signAndEncryptMessage(privateKey, publicKey, text);

      $.post(endpoint, {
        'function': 'sendMessage',
        'text': encrypted,
        'keyid': keyid,
        'fromkeyid': data.pgpKeyId,
        'publickey': publicKeyTxt
      }).done(function() {
        $('.message').hide();
        $('.success').text('Message Sent to ' + name).show();
        $('#messagesPageHeader').show();
        $('#messageList').show();
      });
    });
  },
  'pgpFetch': function() {
    storage.get(['pgpKeyId', 'pgpPrivate'], function (data) {
      $.post(endpoint, {
        'function': 'verifyGetMessages',
        'keyid': data.pgpKeyId
      }).done(function (res) {
        message.pgpGet(res.secret, data.pgpKeyId, data.pgpPrivate);
      });
    });
  },
  'pgpGet': function (secret, keyid, pgpPrivate) {
    var privateKey = pgp.key.readPrivate(pgpPrivate);
    var signed = pgp.signMessage(privateKey[0], secret);

    $.post(endpoint, {
      'function': 'getMessages',
      'keyid': keyid,
      'signed': signed
    }).done(function (res) {
      var queue = [];
      var messages = res.messages;
      while (messages.length) {
        var body = messages.pop();
        var msg = pgp.readMessage(body.text);

        var keymat = null;
        var sesskey = null;
        for (var i = 0; i < msg[0].sessionKeys.length; i++) {
          if (privateKey[0].privateKeyPacket.publicKey.getKeyId() === msg[0].sessionKeys[i].keyId.bytes) {
            keymat = {
              key: privateKey[0],
              keymaterial: privateKey[0].privateKeyPacket
            };
            sesskey = msg[0].sessionKeys[i];
            break;
          }
          for (var j = 0; j < privateKey[0].subKeys.length; j++) {
            if (privateKey[0].subKeys[j].publicKey.getKeyId() === msg[0].sessionKeys[i].keyId.bytes) {
              keymat = {
                key: privateKey[0],
                  keymaterial: privateKey[0].subKeys[j]
              };
              sesskey = msg[0].sessionKeys[i];
              break;
            }
          }
        }

        var verifyPublicKeyTxt = '';
        var name = '';
        /* jshint camelcase: false */
        var fromKeyId = body.from_keyid;
        /* jshint camelcase: true */

        var matched = Contacts.lookup({service: "pgpFingerprint", method: "suffix", value: fromKeyId});
        if (matched.length) {
            name = matched[0].getAccount('name');
            verifyPublicKeyTxt = matched[0].getAccount('pgp');
        }

        var result = {
          'name': 'Unknown Sender',
          'read': false
        };
        var decrypted;
        if (!name) {
          decrypted = msg[0].decrypt(keymat, sesskey);
          result.time = body.timeTxt;
          result.message = decrypted;

        } else {
          openpgp.keyring.importPublicKey(verifyPublicKeyTxt);

          decrypted = msg[0].decryptAndVerifySignature(keymat, sesskey);

          if ((s2hex(decrypted.sigs[0].issuerKeyId) === fromKeyId)) {
            result.name = name;
            result.time = '' + decrypted.sigs[0].creationTime;
            result.message = decrypted.text;
            result.keyid = fromKeyId;
          }
        }
        queue.unshift(result);
      }

      storage.get('pgpMessages', function (result) {
        if (result.pgpMessages === undefined) {
          result.pgpMessages = [];
        }
        var messages = result.pgpMessages.concat(queue);
        storage.set({
          'prevSecret': secret,
          'pgpMessages': messages,
          'msgCount': 0
        });
      });
    });
  }
};

$(document).ready(function () {
  openpgp.init();
  storage.get(['pgpPrivate', 'pgpKeys'], function(value) {
    if (value.pgpPrivate !== undefined && value.pgpPrivate !== '') {
      $('#message1').hide();
      $('#messagesPageHeader').show();
      $('#messageList').show();
    }

    /*
    if (value.pgpKeys !== undefined && value.pgpKeys !== '') {
      message.pgpKeys = value.pgpKeys;
      var options = $('#messageRecipients');
      $.each(message.pgpKeys, function(key, value) {
        options.append($('<option />').val(key).text(value.name));
      });
    }
    */
  });
});
