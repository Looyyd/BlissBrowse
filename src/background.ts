import {createNewList} from "./modules/wordLists";
import {DEBUG} from "./constants";

//TODO: browser agnostic


//installation
chrome.runtime.onInstalled.addListener(async function(details) {
  if (details.reason === 'install') {
    // This block will run when the extension is first installed
    await createNewList('default');
  } else if (details.reason === 'update') {
    // This block will run when the extension is updated
    // You can also set or update storage values here
  }
});

//Indexed DB

const dbName = 'myExtensionDB';
const storeName = 'myExtensionStore';
let db: IDBDatabase | null = null;

// Initialize IndexedDB
const request = indexedDB.open(dbName, 1);
request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
  const target = event.target as IDBRequest;
  if (target) {
    db = target.result as IDBDatabase;
    db.createObjectStore(storeName, { keyPath: 'key' });
  }
};

request.onsuccess = (event: Event) => {
  const target = event.target as IDBRequest;
  if (target) {
    db = target.result as IDBDatabase;
  }
};


// Function to get data from IndexedDB
async function getIndexedDBKey(key: string) : Promise<string[]>{
  return new Promise((resolve, reject) => {
    if(db){
      const transaction = db.transaction([storeName], 'readonly');
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.get(key);
      request.onsuccess = () => resolve(request.result ? request.result.value : []);
      request.onerror = () => reject(new Error(`Error fetching data for key ${key}`));
    }
    else{
      reject(new Error(`Error fetching data for key ${key}`));
    }
  });
}

// Function to set data to IndexedDB
async function setIndexedDBKey(key: string, value: string[]) : Promise<void>{
  return new Promise((resolve, reject) => {
    if(db){
      const transaction = db.transaction([storeName], 'readwrite');
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.put({ key, value });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Error setting data for key ${key}`));
    }
    else{
      reject(new Error(`Error setting data for key ${key}`));
    }
  });
}

// storage listeners
/*
using async await because of this bug when using await:
Of course, let's dive deep into the problem and understand why this solution works.

Lifetime of sendResponse:
The sendResponse callback is designed to be called exactly once to send a single response to a single request. It's meant to be invoked synchronously, in the same turn of the event loop as the onMessage listener was called.
Once the onMessage event handler exits, unless you've returned true to indicate that you will send a response asynchronously, Chrome assumes you've finished handling the message. If you've returned true, Chrome will keep the message channel open for a while, allowing sendResponse to be called later. However, the channel won't be held open indefinitely – it will be closed as soon as the event loop becomes idle.
Using async/await in the onMessage listener:
When you use async/await inside the onMessage listener, the function is transformed internally by TypeScript (and JavaScript) into a Promise-based structure. The moment the await keyword is encountered, the function essentially "pauses", and control is returned to the main event loop, making the function asynchronous.
Even though you're returning true at the end of the listener to indicate you're handling the response asynchronously, the await inside the listener is causing the function to exit before the sendResponse is actually invoked. This is a subtle nuance and can be a source of confusion.
Solution: Promise-based structure:
Instead of using async/await, we explicitly handle the asynchronous logic using Promises. By chaining .then() and .catch(), we maintain control within the listener's scope and prevent it from prematurely exiting. This ensures that the sendResponse callback remains valid and can be called after our asynchronous operation completes.
In other words, by directly using Promises, we have a more explicit control flow. The listener understands that it should wait for the promise resolution or rejection, and only then should it execute the sendResponse callback. This maintains the message channel's open state correctly.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (DEBUG) {
    console.log('request:', request);
  }

  if (request.action === 'get') {
    getIndexedDBKey(request.key)
      .then(data => {
        if (DEBUG) {
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
  } else if (request.action === 'set') {
    setIndexedDBKey(request.key, request.value)
      .then(() => {
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
  return true;  // This is necessary to handle the asynchronous response
});



