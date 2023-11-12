import {getAllDataStore, getStorageKey, removeStorageKey, setLocalStorageKey, setStorageKey} from "./storage";
import {useEffect, useState} from "react";
import {LOCAL_STORAGE_STORE_NAME} from "../constants";
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
  const [data, setData] = useState<T | null>(defaultValue);

  useEffect(() => {
    const updateState = async () => {
      const value = await dataStore.get();
      setData(value);
    };

    dataStore.subscribe(updateState); // Subscribe for updates

    // Fetch initial data
    updateState();

    return () => {
      dataStore.unsubscribe(updateState); // Unsubscribe when component unmounts
    };
  }, [dataStore]);

  return [data] as const;
}


export abstract class FullDataStore<T> extends ListenableDataStore<IndexedDBKeyValueStore<T>> {
  abstract IndexedDBStoreName:string;
  protected _currentData: IndexedDBKeyValueStore<T> | null = null;

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

  async get(){
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

  //TODO: should we set currentData in there?
  async set(key:string,value: T): Promise<void> {
    //synced through background script
    const processedValue = this.setPreprocessor(value);
    //TODO: does this cause double notification since we also have a dataChanged listener?
    //this.notifySubscribers();
    await setStorageKey(this.IndexedDBStoreName, key, processedValue);
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
    /* @throws {Error} if item is not of type T */
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
    //TODO: notify only if value changed?
    //TODO: does this cause double notification since we also have a dataChanged listener?
    this.notifySubscribers();
    await setStorageKey(this.IndexedDBStoreName, this.key, processedValue);
  }

  async clear(): Promise<void> {
    this._currentData = null;
    await removeStorageKey(this.IndexedDBStoreName,this.key);
  }
}

