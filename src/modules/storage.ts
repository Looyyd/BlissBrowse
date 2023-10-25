import {DEBUG} from "../constants";

export async function getStorageKey(key: string) : Promise<string[]>{
  if(DEBUG){
    console.log("In function getStorageKey")
  }
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'get', key }, (response) => {
      if(DEBUG){
        console.log('getStorageKey response:', response);
      }
      if (response.success) {
        resolve(response.data);
      } else {
        return ([])//TODO: should be able to raise errors maybe don't raise if key not found only
        //reject(new Error(response.error));
      }
    });
  });
}

export async function setStorageKey(key:string, value:string[]): Promise<void> {
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
