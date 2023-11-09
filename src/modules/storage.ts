import {DEBUG_MESSAGES, LOCAL_STORAGE_STORE_NAME} from "../constants";
import {
  GetAllMessage,
  GetDataMessage,
  IndexedDBSetDataMessage,
  LocalStorageSetMessage,
  RemoveDataMessage
} from "./types";

export async function getStorageKey<T>(storeName:string, key: string): Promise<T>{
  return new Promise((resolve, reject) => {
    const getMessage: GetDataMessage = {
      action: 'get',
      key: key,
      storeName: storeName
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

export async function getAllDataStore<T>(storeName:string): Promise<T[]>{
  return new Promise((resolve, reject) => {
    const getMessage: GetAllMessage = {
      action: 'getAll',
      storeName: storeName
    };
    chrome.runtime.sendMessage(getMessage, (response) => {
      if(DEBUG_MESSAGES){
        console.log('getAllDataStore response:', response);
      }
      if (response.success) {
        resolve(response.data as T[]);
      } else {
        reject(new Error(response.error));
      }
    });
  });
}

export async function setStorageKey<T>(storeName: string, key: string, value: T): Promise<void> {
  return new Promise((resolve, reject) => {
    const setMessage: IndexedDBSetDataMessage<T> = {
      action: 'set',
      key: key,
      value: value,
      storeName: storeName
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

export async function setLocalStorageKey<T>(key: string, value: T): Promise<void> {
  //need to set the local storage key because background script doesn't have access to local storage
  localStorage.setItem(key, JSON.stringify(value));
  return new Promise((resolve, reject) => {
    const message: LocalStorageSetMessage<T> = {
      action: 'localStorageSet',
      key: key,
      value: value,
      storeName:  LOCAL_STORAGE_STORE_NAME//TODO: it's kinda hacky cause it's not going to be used
    };
    chrome.runtime.sendMessage(message, (response) => {
      if (response.success) {
        if (DEBUG_MESSAGES) {
          console.log('localStorageSet response:', response);
        }
        resolve();
      } else {
        reject(new Error(response.error));
      }
    });
  });
}

export async function removeStorageKey(storeName:string, key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const message: RemoveDataMessage= {
      action: 'remove',
      key: key,
      storeName: storeName
    };
    chrome.runtime.sendMessage(message, (response) => {
      if (response.success) {
        if (DEBUG_MESSAGES) {
          console.log('removeStorageKey response:', response);
        }
        resolve();
      } else {
        reject(new Error(response.error));
      }
    });
  });
}

