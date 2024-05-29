//background.js
import _, { map } from './underscore.js';
console.log('background.js');
var currentTab;
var version = "1.0";

chrome.tabs.onActivated.addListener(activeTab => {
  currentTab && chrome.debugger.detach({ tabId: currentTab.tabId });
  currentTab = activeTab;
  chrome.debugger.attach({ //debug at current tab
    tabId: currentTab.tabId
  }, version, onAttach.bind(null, currentTab.tabId));
});

chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
  const url = tabs[0].url;
  if (url.includes('gift-batch/batch-review')) {
    chrome.debugger.attach({ tabId: currentTab.tabId }, version, onAttach.bind(null, currentTab.tabId));
  }
});

function onAttach(tabId) {
  chrome.debugger.sendCommand({ //first enable the Network
    tabId: tabId
  }, "Network.enable");
  chrome.debugger.onEvent.addListener(allEventHandler);
}

let constituentIds = [];

// Listen for messages from content script
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.type === 'pageRefresh') {
    console.log('Page refreshed');
    constituentIds = [];
  }
});

function allEventHandler(debuggeeId, message, params) {
  if (currentTab.tabId !== debuggeeId.tabId) {
    return;
  }
  if (message === "Network.responseReceived") { //response return            
    setTimeout(() => {
      chrome.debugger.sendCommand({
        tabId: debuggeeId.tabId
      }, "Network.getResponseBody", {
        "requestId": params.requestId
        //use underscore to add callback a more argument, passing params down to callback
      }, _.partial(function (response, params, debuggeeId) {
        // you get the response body here!
        if (params.response.url.includes('gifts/v2/batchgifts') && response && response.body) {
          // Parse the JSON string
          const data = JSON.parse(response.body, params.response.ur);

          // Extract constituent_id from each item and create an array
          data.items.forEach(item => {
            constituentIds.push([item.constituent_id, item.constituent_name]);
          });
          console.log(constituentIds)
          chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { found: constituentIds });
          });
        }
      }, _, params, debuggeeId));
    }, 800)
  }
}


chrome.runtime.onMessage.addListener(data => {
  if (data.type === "notification") {
    console.log(data.type);
    chrome.notifications.create('', data.options, function (id) { console.log(data.options); });
  }
});

// Listen for keep-alive messages from content.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'keepAlive') {
    console.log('Received keep-alive message from content.js');
  }
});