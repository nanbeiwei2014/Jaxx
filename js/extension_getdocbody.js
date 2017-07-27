var body = document.documentElement.innerHTML;

chrome.runtime.sendMessage({action: "getDocBody", results: body});

