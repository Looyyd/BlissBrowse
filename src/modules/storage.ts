import {DEBUG} from "../constants";

export async function getStorageKey<T>(key: string): Promise<T>{
  if(DEBUG){
    console.log("In function getStorageKey")
  }
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'get', key }, (response) => {
      if(DEBUG){
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
  if(DEBUG){
    console.log("In function setStorageKey")
  }
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'set', key, value }, (response) => {
      if (response.success) {
        if(DEBUG){
          console.log('setStorageKey response:', response);
        }
        resolve();
      } else {
        reject(new Error(response.error));
      }
    });
  });
}

