import {getAllDataStore, getStorageKey, removeStorageKey, setLocalStorageKey, setStorageKey} from "./storage";
import {useEffect, useState} from "react";
import {DEBUG_MESSAGES, LOCAL_STORAGE_STORE_NAME} from "../constants";
import {changeValueIndexedDB, IndexedDBKeyValueStore, Message} from "./types";



// Global counter variable
let listenerCount = 0;



export abstract class FullDataStore<T> {
  abstract IndexedDBStoreName:string;
  protected _currentData: IndexedDBKeyValueStore<T> | null = null;

  messageListener: ((request: Message<unknown>) => void) | null = null;

  setPreprocessor(value: T): T {
    return value;
  }

  constructor() {
    // Setup listener in the constructor
    this.messageListener = (request: Message<unknown>) => {
      if (request.action === 'dataChanged' && request.storeName === this.IndexedDBStoreName) {
        if(this._currentData !== null){
          const newValue = request.value as T;//TODO: type check?
          changeValueIndexedDB(this._currentData, request.key, newValue);
        }
      }
    };
    chrome.runtime.onMessage.addListener(this.messageListener);
  }

  async getAll(){
    if(this._currentData === null){
      this._currentData = await getAllDataStore<T>(this.IndexedDBStoreName);
    }
    return this._currentData;
  }

  dispose() {
    if (this.messageListener) {
      chrome.runtime.onMessage.removeListener(this.messageListener);
      this.messageListener = null;
    }
  }

  async set(key:string,value: T): Promise<void> {
    //synced through background script
    const processedValue = this.setPreprocessor(value);
    await setStorageKey(this.IndexedDBStoreName, key, processedValue);
  }

  useData() {
    const [allRows, setAllRows] = useState<IndexedDBKeyValueStore<T>>();

    useEffect(() => {
      const fetchData = async () => {
        try {
          const value = await this.getAll();
          setAllRows(value);
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };
      fetchData();

      //TODO: is this listener needed since we have one in the constructor?
      // would need to put the hook in the constructor
      const listener = (request: Message<unknown>,) => {
        if(DEBUG_MESSAGES){
          console.log('message received in custom hook', request);
        }
        if (request.action === 'dataChanged' && request.storeName === this.IndexedDBStoreName) {
          const key = request.key;
          const newValue = request.value as T;//TODO: type check?
          const newPair: IndexedDBKeyValueStore<T> = {};
          newPair[key] = {key: key, value: newValue};
          setAllRows({...allRows,...newPair});
        }
      };
      // Add message listener
      if(DEBUG_MESSAGES){
        console.log('listener added in custom hook', this.IndexedDBStoreName);
      }
      chrome.runtime.onMessage.addListener(listener);

      return () => {
        // Remove message listener
        chrome.runtime.onMessage.removeListener(listener);
        if(DEBUG_MESSAGES){
          console.log('listener removed in custom hook', this.IndexedDBStoreName);
        }
      };
    }, []);

    const setRow = async (key: string, newValue: T) => {
      await this.set(key,newValue);
      const newPair: IndexedDBKeyValueStore<T> = {};
      newPair[key] = {key: key, value: newValue};
      setAllRows({...allRows,...newPair});
    };

    return [allRows, setRow] as const;
  }
}

export abstract class RowDataStore<T> {
  protected abstract key: string;
  abstract IndexedDBStoreName:string;
  protected _currentData: T | null = null;
  abstract defaultValue: T;

  abstract get(): T | Promise<T>;
  abstract set(value: T): Promise<void> | void;
  abstract isType: (data: unknown) => data is T;
  abstract fetchData(): Promise<T> | T;

  messageListener: ((request: Message<unknown>) => void) | null = null;


  constructor() {
    // Setup listener in the constructor
    this.messageListener = (request: Message<unknown>) => {
      if (request.action === 'dataChanged' && request.storeName === this.IndexedDBStoreName && request.key === this.key) {
        if (this.isType(request.value)) {
          this._currentData = request.value; // Update the private variable
        }
      }
    };
    chrome.runtime.onMessage.addListener(this.messageListener);
  }

  //TODO: use dispose method to clean up all listeners
  dispose() {
    if (this.messageListener) {
      chrome.runtime.onMessage.removeListener(this.messageListener);
      this.messageListener = null;
    }
  }

  setPreprocessor(value: T): T {
    return value;
  }

  useData(initialState: T | null = null) {
    const [data, setData] = useState<T | null>(initialState);

    useEffect(() => {
      const fetchData = async () => {
        try {
          const value = await this.get();
          setData(value);
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };
      fetchData();

      //TODO: is this listener needed since we have one in the constructor?,
      // would need to put the hook in the constructor
      const listener = (request: Message<unknown>,) => {
        if(DEBUG_MESSAGES){
          console.log('message received in custom hook', request);
        }
        if (request.action === 'dataChanged' && request.storeName === this.IndexedDBStoreName && request.key === this.key) {
          if(this.isType(request.value)){
            setData(request.value);
          }
        }
      };

      // Add message listener
      if(DEBUG_MESSAGES){
        listenerCount++;
        console.log('listener added in custom hook', this.key);
        console.log('listener count', listenerCount);
      }
      chrome.runtime.onMessage.addListener(listener);

      return () => {
        // Remove message listener
        chrome.runtime.onMessage.removeListener(listener);
        if(DEBUG_MESSAGES){
          listenerCount--;
          console.log('listener removed in custom hook', this.key);
          console.log('listener count', listenerCount);
        }
      };
    }, []);

    const setSyncedData = async (newValue: T) => {
      await this.syncedSet(newValue);
      setData(newValue);
    };

    return [data, setSyncedData] as const;
  }

  async syncedSet(value: T) :Promise<void>{
    // all messages are synced now
    await this.set(value);
  }
}

export abstract class LocalStorageStore<T> extends RowDataStore<T> {
  IndexedDBStoreName: string = LOCAL_STORAGE_STORE_NAME;

  fetchData(): T {
    const item = localStorage.getItem(this.key);
    if (item === null) {
      return this.defaultValue;
    }
    const parsedItem = JSON.parse(item);
    if (!this.isType(parsedItem)) {
      throw new Error(`Item in local storage is not of type ${this.key}`);
    }
    return parsedItem;
  }

  get(): T {
    if (this._currentData === null) {
      this._currentData = this.fetchData(); // Implement fetchData method
    }
    return this._currentData;
  }
  async set(value: T): Promise<void> {
    //synced through background script
    const processedValue = this.setPreprocessor(value);
    await setLocalStorageKey(this.key, processedValue)
  }
}


export abstract class DatabaseStorage<T> extends RowDataStore<T> {

  //TODO: error handling, because doesn't say if store is not found
  async get(): Promise<T> {
    if (this._currentData === null) {
      this._currentData = await this.fetchData();
    }
    return this._currentData;
  }

  async fetchData(): Promise<T> {
    const item = await getStorageKey<T>(this.IndexedDBStoreName,this.key);
    if(!this.isType(item)){
      if(item === null){
        return this.defaultValue;
      }
      throw new Error(`Item in database is not of type ${this.key}`);
    }
    return item;
  }

  async set(value: T): Promise<void> {
    //synced through background script
    const processedValue = this.setPreprocessor(value);
    await setStorageKey(this.IndexedDBStoreName, this.key, processedValue);
  }

  async clear(): Promise<void> {
    this._currentData = null;
    await removeStorageKey(this.IndexedDBStoreName,this.key);
  }
}

