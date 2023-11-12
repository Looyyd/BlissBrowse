import {DEBUG_MESSAGES, LOCAL_STORAGE_STORE_NAME} from "../constants";
import {
  ActionType,
  GetAllMessage,
  GetDataMessage,
  IndexedDBKeyValueStore,
  IndexedDBSetDataMessage,
  LocalStorageSetMessage, MessageResponseGet, MessageResponseGetAll, MessageResponseSet,
  RemoveDataMessage
} from "./types";

export async function getStorageKey(storeName:string, key: string): Promise<unknown>{
  return new Promise((resolve, reject) => {
    const getMessage: GetDataMessage = {
      action: ActionType.Get,
      key: key,
      storeName: storeName
    };
    chrome.runtime.sendMessage(getMessage, (response: MessageResponseGet) => {
      if(DEBUG_MESSAGES){
        console.log('getStorageKey response:', response);
      }
      if (response.success) {
        resolve(response.data);
      } else {
        reject(new Error(response.error));
      }
    });
  });
}

export async function getAllDataStore(storeName:string): Promise<IndexedDBKeyValueStore<unknown>>{
  return new Promise((resolve, reject) => {
    const getMessage: GetAllMessage = {
      action: ActionType.GetAll,
      storeName: storeName
    };
    chrome.runtime.sendMessage(getMessage, (response: MessageResponseGetAll) => {
      if(DEBUG_MESSAGES){
        console.log('getAllDataStore response:', response);
      }
      if (response.success) {
        resolve(response.data as IndexedDBKeyValueStore<unknown>);
      } else {
        reject(new Error(response.error));
      }
    });
  });
}

export async function setStorageKey<T>(storeName: string, key: string, value: T): Promise<void> {
  return new Promise((resolve, reject) => {
    const setMessage: IndexedDBSetDataMessage<T> = {
      action: ActionType.Set,
      key: key,
      value: value,
      storeName: storeName
    };
    chrome.runtime.sendMessage(setMessage, (response: MessageResponseSet) => {
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
      action: ActionType.LocalStorageSet,
      key: key,
      value: value,
      storeName:  LOCAL_STORAGE_STORE_NAME//TODO: it's kinda hacky cause it's not going to be used
    };
    chrome.runtime.sendMessage(message, (response: MessageResponseSet) => {
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
      action: ActionType.Remove,
      key: key,
      storeName: storeName
    };
    chrome.runtime.sendMessage(message, (response: MessageResponseSet) => {
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

