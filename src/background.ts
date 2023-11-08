import {DEBUG, DEBUG_MESSAGES, DEFAULT_LIST_NAME, LIST_OF_LIST_NAMES_KEY} from "./constants";
import IndexedDBModule from "./modules/IndexedDBModule";
import {DataChangeMessage, Message} from "./modules/types";
import {ListNamesDataStore} from "./modules/wordLists";


(async () => {
  await IndexedDBModule.init();
})();


chrome.runtime.onInstalled.addListener(async function(details) {
  if (details.reason === 'install') {
    // This block will run when the extension is first installed

    // create default wordlist
    //TODO: test if this works, because it doesn't with load unpacked extension
    const dataStore = new ListNamesDataStore();
    await dataStore.createNewList(DEFAULT_LIST_NAME);
    if(DEBUG){
      console.log('default list created');
    }
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

function sendDataChangedMessage(key: string, value: unknown) {
  const message : DataChangeMessage<unknown>= { action: 'dataChanged', key: key, value: value };
  if(DEBUG_MESSAGES){
    console.log('message sent from sendDataChangedMessage', message);
  }
  message.source = 'background';
  message.destination = 'runtime';
  chrome.runtime.sendMessage(message, () => {
  });
  message.destination = 'tabs';
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id!,message, () => {

      });
    }
  });
}

const handleSet = (key: string, value: unknown, sendResponse: SendResponseFunc): void => {
  IndexedDBModule.setIndexedDBKey(key, value)
    .then(() => {
      sendDataChangedMessage(key, value);
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


const handleRemove = (key: string, sendResponse: SendResponseFunc): void => {
  IndexedDBModule.removeIndexedDBKey(key)
    .then(() => {
      sendDataChangedMessage(key, null);//TODO: what should be sent here? default value?
      sendResponse({ success: true });
    })
    .catch((error: unknown) => {
      if (error instanceof Error) {
        sendResponse({ success: false, error: error.message });
      } else {
        sendResponse({ success: false, error: 'An unknown error occurred.' });
      }
    });
}

chrome.runtime.onMessage.addListener((request: Message<unknown>, sender, sendResponse) => {
  if (DEBUG_MESSAGES) {
    console.log('request in background listener:', request);
  }

  if (request.action === 'get') {
    handleGet(request.key, sendResponse);
  } else if (request.action === 'set') {
    handleSet(request.key, request.value, sendResponse);
  } else if (request.action === 'localStorageSet') {
    //only inform of change, can't set local storage from background so must be done from content script
    sendDataChangedMessage(request.key, request.value);
    sendResponse({ success: true });
  }
  else if (request.action === 'remove') {
    handleRemove(request.key, sendResponse);
  }
  else if(request.action === 'dataChanged'){
    sendResponse({ success: true });
  } else {
    console.log("Unknown action in background listener: ", request);
    sendResponse({ success: false, error: 'Unknown action.' });
  }

  return true;  // This is necessary to handle the asynchronous response
});



