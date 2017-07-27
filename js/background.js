'use strict';

var audio = new Audio('message.ogg');
var endpoint = 'https://api.kryptokit.com/v0/gpg';

(function checkMessages() {
  storage.get(['pgpKeyId', 'prevSecret'], function (data) {
    if ( !data.pgpKeyId ) {
      return;	
    }

    $.post(endpoint, {
      'function': 'countMessages',
      'keyid': data.pgpKeyId,
      'prevSecret': data.prevSecret
    }).done(function (res) {
      storage.set({ 'msgCount': res.count });
    });
  });
  setTimeout(checkMessages, 5000);
}());

chrome.storage.onChanged.addListener(function(changes) {
  if (changes.msgCount !== undefined) {
    var msgCount = changes.msgCount;
    if ( msgCount.newValue > msgCount.oldValue  ) {
      audio.play();

      chrome.notifications.create(
        'id' + new Date().getTime(),
        {   
          type: 'basic', 
          iconUrl: 'jaxx_48.png', 
          title: 'New Message', 
          message: 'You have ' + msgCount.newValue + ' new messages in KryptoKit!',
          priority: 0
        },
        function() {
        }
      );
    }

    var txt = '';
    if ( msgCount.newValue > 0  ) {
      chrome.browserAction.setBadgeBackgroundColor({color: '#F00'});
      txt += msgCount.newValue;
    }
    chrome.browserAction.setBadgeText({text: txt });
  }
});

var Wallet = null; //HDWallet.fromPasscode();
var mnemonic = getStoredData('mnemonic',true);
if (mnemonic) {
    
    //@note:@todo:@next:
    Wallet = new HDWallet(mnemonic);
}

