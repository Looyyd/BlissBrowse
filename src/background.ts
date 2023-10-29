import {DEBUG_MESSAGES} from "./constants";
import IndexedDBModule from "./modules/IndexedDBModule";
import {Message} from "./modules/types";


(async () => {
  await IndexedDBModule.init();
})();


chrome.runtime.onInstalled.addListener(async function(details) {
  if (details.reason === 'install') {
    // This block will run when the extension is first installed
  } else if (details.reason === 'update') {
    // This block will run when the extension is updated
    // You can also set or update storage values here
  }
});



type SendResponseFunc = (response: unknown) => void;
const handleGet = (key: string, sendResponse: SendResponseFunc): void => {
  IndexedDBModule.getIndexedDBKey(key)
    .then((data: unknown) => {
      if (DEBUG_MESSAGES) {
        console.log('Sending data from background listener data:', data);
      }
      sendResponse({ success: true, data });
    })
    .catch((error: unknown) => {
      if (error instanceof Error) {
        sendResponse({ success: false, error: error.message });
      } else {
        sendResponse({ success: false, error: 'An unknown error occurred.' });
      }
    });
};

const handleSet = (key: string, value: unknown, sendResponse: SendResponseFunc): void => {
  IndexedDBModule.setIndexedDBKey(key, value)
    .then(() => {
      /*
      //TODO: trying to remove this, this will cause all sets to be synced,
         with this removed we just sync the ones that use syncedSet
      const message = { action: 'dataChanged', key: key, value: value };
      chrome.runtime.sendMessage(message, () => {
        if(DEBUG){
          console.log('message sent from handleSet', message);
        }
      });
       */
      sendResponse({ success: true });
    })
    .catch((error: unknown) => {
      if (error instanceof Error) {
        sendResponse({ success: false, error: error.message });
      } else {
        sendResponse({ success: false, error: 'An unknown error occurred.' });
      }
    });
};

chrome.runtime.onMessage.addListener((request: Message<unknown>, sender, sendResponse) => {
  if (DEBUG_MESSAGES) {
    console.log('request in background listener:', request);
  }

  if (request.action === 'get') {
    handleGet(request.key, sendResponse);
  } else if (request.action === 'set') {
    handleSet(request.key, request.value, sendResponse);
  } else if(request.action === 'dataChanged'){
    //TODO: this is to propagate local.storage changes to options.html otherwise the message is not received, should it bed removed for something cleaner?
    request.source = 'background';
    request.destination = 'runtime';
    chrome.runtime.sendMessage(request, () => {
      if(DEBUG_MESSAGES){
        console.log('message sent from background listener', request);
      }
    });
    request.destination = 'tabs';
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        chrome.tabs.sendMessage(tab.id!, request, () => {
          if(DEBUG_MESSAGES){
            console.log('message sent from background listener', request);
          }
        });
      }
    });
    sendResponse({ success: true });
  } else {
    console.log("Unknown action in background listener: ", request);
    sendResponse({ success: false, error: 'Unknown action.' });
  }

  return true;  // This is necessary to handle the asynchronous response
});



