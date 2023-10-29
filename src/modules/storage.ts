import {DEBUG, DEBUG_MESSAGES} from "../constants";
import {GetDataMessage, SetDataMessage} from "./types";

export async function getStorageKey<T>(key: string): Promise<T>{
  return new Promise((resolve, reject) => {
    const getMessage: GetDataMessage = {
      action: 'get',
      key: key
    };
    chrome.runtime.sendMessage(getMessage, (response) => {
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
    const setMessage: SetDataMessage<T> = {
      action: 'set',
      key: key,
      value: value
    };
    chrome.runtime.sendMessage(setMessage, (response) => {
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

