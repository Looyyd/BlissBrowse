import {getAllDataStore, getStorageKey, removeStorageKey, setLocalStorageKey, setStorageKey} from "./storage";
import {useEffect, useState} from "react";
import {DEBUG, LOCAL_STORAGE_STORE_NAME} from "../constants";
import {ActionType, IndexedDBKeyValueStore, KeyValue, Message} from "./types";

export abstract class ListenableDataStore<T> {
  abstract get(): T | Promise<T>;
  private dataChangeSubscribers: (() => void)[] = [];

  // Method for components to subscribe to changes
  subscribe(callback: () => void): void {
    this.dataChangeSubscribers.push(callback);
  }

  // Method for components to unsubscribe
  unsubscribe(callback: () => void): void {
    this.dataChangeSubscribers = this.dataChangeSubscribers.filter(sub => sub !== callback);
  }

  // Notify all dataChangeSubscribers of a change
  protected notifySubscribers(): void {
    this.dataChangeSubscribers.forEach(callback => callback());
  }
}

export function useDataFromStore<T>(dataStore: ListenableDataStore<T>, defaultValue: T | null = null) {
  /* returns [data, error]
  error is null if no error happened, if datastore.get errors out,
  error is set until next successful set*/
  const [data, setData] = useState<T | null>(defaultValue);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const updateState = async () => {
      try {
        const value = await dataStore.get();
        setData(value);
        setError(null); // Reset error state if successful
      } catch (err) {
        setError(err as Error); // Capture any errors
      }
    };

    dataStore.subscribe(updateState); // Subscribe for updates

    // Fetch initial data
    updateState();

    return () => {
      dataStore.unsubscribe(updateState); // Unsubscribe when component unmounts
    };
  }, [dataStore]);

  return [data, error] as const; // Return both data and error
}



export abstract class FullDataStore<T> extends ListenableDataStore<IndexedDBKeyValueStore<T>> {
  abstract IndexedDBStoreName:string;
  protected _currentData: IndexedDBKeyValueStore<T> | null = null;
  abstract isType: (data: unknown) => data is T;
  abstract typeUpgrade?: (data: unknown) => T ;
  abstract defaultValue?: T;

  messageListener: ((request: Message<unknown>) => void) | null = null;

  setPreprocessor(value: T): T {
    return value;
  }


  constructor() {
    super();
    // Setup listener in the constructor
    this.messageListener = (request: Message<unknown>) => {
      if (request.action === ActionType.DataChanged && request.storeName === this.IndexedDBStoreName) {
        if(this._currentData !== null){
          const newValue = request.value as T;//TODO: type check?
          //TODO: we are not using this function anymore, because react needs deep copy to refresh components.
          // maybe because deepcopy is not an optimal default, we should only deepcopy if there is a subscriber?
          // or maybe there is another way to force rerender of components?
          //changeValueIndexedDB(this._currentData, request.key, newValue);
          this._currentData = {...this._currentData, [request.key]: KeyValue(request.key, newValue)};
          //TODO: notify only if value changed?
          this.notifySubscribers();
        }
      }
    };
    chrome.runtime.onMessage.addListener(this.messageListener);
  }

  async get() {
    /* @throws {Error} if item is not of type T or IndexeDB errors */
    if (this._currentData === null) {
      let fetchedData: IndexedDBKeyValueStore<unknown>;
      try {
        fetchedData = await getAllDataStore(this.IndexedDBStoreName);
      } catch (e) {
        if(DEBUG){
          console.error("Error in datastore getAllData", e);
        }
        throw e;
      }

      for (const value of Object.values(fetchedData)) {
        if (!this.isType(value.value)) {
          if(value.value === null){
            if(this.defaultValue){
              value.value = this.defaultValue;
            } else {
              throw new Error(`Data in database is null and no default value is set`);
            }
          } else if (this.typeUpgrade) {
              try {
                value.value = this.typeUpgrade(value.value);
              } catch (e) {
                if (DEBUG) {
                  console.error("Error in datastore typeUpgrade", e);
                }
                throw e;
              }
          } else {
            throw new Error(`Data in database is not of type ${this.IndexedDBStoreName}`);
          }
        }
      }
      this._currentData = fetchedData as IndexedDBKeyValueStore<T>;
    }
    return this._currentData;
  }

  dispose() {
    if (this.messageListener) {
      chrome.runtime.onMessage.removeListener(this.messageListener);
      this.messageListener = null;
    }
  }

  //TODO: should we set currentData in there?
  async set(key:string,value: T): Promise<void> {
    /* @throws {Error} if indexedDB errors */
    //synced through background script
    const processedValue = this.setPreprocessor(value);
    //TODO: does this cause double notification since we also have a dataChanged listener?
    //this.notifySubscribers();
    try {
      await setStorageKey(this.IndexedDBStoreName, key, processedValue);
    } catch (e) {
      if(DEBUG){
        console.error("Error in datastore set", e);
      }
      throw e;
    }
  }

  async clearKey(key:string): Promise<void> {
    this._currentData = null;
    await removeStorageKey(this.IndexedDBStoreName,key);
  }
}

export abstract class RowDataStore<T> extends ListenableDataStore<T>{
  protected abstract key: string;
  abstract IndexedDBStoreName:string;
  protected _currentData: T | null = null;
  abstract defaultValue: T;

  abstract get(): T | Promise<T>;
  abstract set(value: T): Promise<void> | void;
  abstract isType: (data: unknown) => data is T;
  abstract typeUpgrade?: (data: unknown) => T ;
  abstract fetchData(): Promise<T> | T;

  messageListener: ((request: Message<unknown>) => void) | null = null;


  constructor() {
    super();
    // Setup listener in the constructor
    this.messageListener = (request: Message<unknown>) => {
      if (request.action === ActionType.DataChanged && request.storeName === this.IndexedDBStoreName && request.key === this.key) {
        if (this.isType(request.value)) {
          this._currentData = request.value; // Update the private variable
          this.notifySubscribers();
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
      if(this.typeUpgrade){
        try{
          return this.typeUpgrade(parsedItem);
        }catch (e) {
          if(DEBUG){
            console.error("Error in datastore typeUpgrade", e);
          }
          throw e;
        }
      }
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
    /* @throws {Error} if indexedDB errors */
    //synced through background script
    const processedValue = this.setPreprocessor(value);
    //TODO: does this cause double notification since we also have a dataChanged listener?
    this.notifySubscribers();

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
    /* @throws {Error} if item is not of type T or IndexeDB errors */
    let item: unknown;
    try {
      item = await getStorageKey(this.IndexedDBStoreName,this.key);
    } catch (e) {
      if(DEBUG){
        console.error("Error in datastore fetchData", e);
      }
      throw e;
    }

    if(!this.isType(item)){
      if(item === null){
        return this.defaultValue;
      } else if(this.typeUpgrade){
        try{
          return this.typeUpgrade(item);
        } catch (e) {
          if(DEBUG){
            console.error("Error in datastore typeUpgrade", e);
          }
          throw e;
        }
      } else{
        throw new Error(`Item in database is not of type ${this.key}`);
      }
    }
    return item;
  }

  async set(value: T): Promise<void> {
    /* @throws {Error} if indexedDB errors */
    //synced through background script
    const processedValue = this.setPreprocessor(value);
    //TODO: notify only if value changed?
    //TODO: does this cause double notification since we also have a dataChanged listener?
    this.notifySubscribers();
    try {
      await setStorageKey(this.IndexedDBStoreName, this.key, processedValue);
    } catch (e) {
      if(DEBUG){
        console.error("Error in datastore set", e);
      }
      throw e;
    }
  }

  async clear(): Promise<void> {
    this._currentData = null;
    await removeStorageKey(this.IndexedDBStoreName,this.key);
  }
}

