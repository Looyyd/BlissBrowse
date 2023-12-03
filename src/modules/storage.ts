import {DEBUG_MESSAGES, LOCAL_STORAGE_STORE_NAME} from "../constants";
import {
  ActionType,
  GetAllMessage,
  GetDataMessage,
  IndexedDBKeyValueStore,
  IndexedDBSetDataMessage,
  LocalStorageSetMessage, MessageResponseGet, MessageResponseGetAll, MessageResponseSet,
  ModelPredictMessage,
  RemoveDataMessage
} from "./types";
import {DatabaseNotInitError} from "./IndexedDBModule";




// The retries for databsenotinit error aren't really needed anymore because the database will init when first used, but it's still here just in case
export async function getStorageKey(storeName: string, key: string): Promise<unknown> {
  // Define a helper function for the actual operation
  async function attemptGetStorageKey(attemptCount: number): Promise<unknown> {
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
          console.log('Error encountered:', response.error);
          console.log('Error type:', response.error.constructor.name);

          // Check for DatabaseNotInitError and if attempts are left
          if(response.error.name === 'DatabaseNotInitError' && attemptCount > 0){
            console.log('Retrying due to DatabaseNotInitError...');
            resolve(attemptGetStorageKey(attemptCount - 1));
          } else {
            reject(response.error);
          }
        }
      });
    });
  }
  // Call the helper function with the number of retries (1 in this case)
  return attemptGetStorageKey(1);
}


export async function getAllDataStore(storeName: string): Promise<IndexedDBKeyValueStore<unknown>> {
  async function attemptGetAllDataStore(attemptCount: number): Promise<IndexedDBKeyValueStore<unknown>> {
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
          if(response.error.name === 'DatabaseNotInitError' && attemptCount > 0){
            console.log('Retrying getAllDataStore due to DatabaseNotInitError...');
            resolve(attemptGetAllDataStore(attemptCount - 1));
          } else {
            reject(response.error);
          }
        }
      });
    });
  }

  return attemptGetAllDataStore(1);
}


export async function setStorageKey<T>(storeName: string, key: string, value: T): Promise<void> {
  async function attemptSetStorageKey(attemptCount: number): Promise<void> {
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
          if(response.error.name === 'DatabaseNotInitError' && attemptCount > 0){
            console.log('Retrying setStorageKey due to DatabaseNotInitError...');
            resolve(attemptSetStorageKey(attemptCount - 1));
          } else {
            reject(response.error);
          }
        }
      });
    });
  }

  return attemptSetStorageKey(1);
}



export async function setLocalStorageKey<T>(key: string, value: T): Promise<void> {
  /* @throws Error if background returns an error */
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
        reject(response.error);
      }
    });
  });
}

export async function removeStorageKey(storeName: string, key: string): Promise<void> {
  async function attemptRemoveStorageKey(attemptCount: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const message: RemoveDataMessage = {
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
          if(response.error.name === 'DatabaseNotInitError' && attemptCount > 0){
            console.log('Retrying removeStorageKey due to DatabaseNotInitError...');
            resolve(attemptRemoveStorageKey(attemptCount - 1));
          } else {
            reject(response.error);
          }
        }
      });
    });
  }

  return attemptRemoveStorageKey(1);
}


