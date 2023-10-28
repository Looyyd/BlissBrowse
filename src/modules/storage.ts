import {DEBUG, DEBUG_MESSAGES} from "../constants";

export async function getStorageKey<T>(key: string): Promise<T>{
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'get', key }, (response) => {
      if(DEBUG_MESSAGES){
        console.log('getStorageKey response:', response);
      }
      if (response.success) {
        resolve(response.data as T);
      } else {
        reject(new Error(response.error));
      }
    });
  });
}

export async function setStorageKey<T>(key: string, value: T): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'set', key, value }, (response) => {
      if (response.success) {
        if(DEBUG_MESSAGES){
          console.log('setStorageKey response:', response);
        }
        resolve();
      } else {
        reject(new Error(response.error));
      }
    });
  });
}

