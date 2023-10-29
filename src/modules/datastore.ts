import {getStorageKey, setStorageKey} from "./storage";
import {useEffect, useState} from "react";
import {DEBUG, DEBUG_MESSAGES} from "../constants";
import {DataChangeMessage, Message} from "./types";



// Global counter variable
let listenerCount = 0;


abstract class DataStore<T> {
  protected abstract key: string;

  abstract get(): Promise<T> | T;
  abstract set(value: T): Promise<void> | void;
  abstract isType: (data: unknown) => data is T;
  abstract defaultValue: T;
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

      const listener = (request: Message<unknown>,) => {
        if(DEBUG_MESSAGES){
          console.log('message received in custom hook', request);
        }
        if (request.action === 'dataChanged' && request.key === this.key) {
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

  // TODO: There should no be a need for syncedSet, since the data is synced automatically through background script
  // rn it's not synced automatically but maybe should be?
  // also maybe all sync messages should be sent from background byt using a message SyncedSet to the background
  async syncedSet(value: T) :Promise<void>{
    await this.set(value);
    const message: DataChangeMessage<T> = { action: 'dataChanged', key: this.key, value: value, source: 'datastore'};
    if(DEBUG_MESSAGES){
      console.log('sending message from syncedSet', message);
    }
    chrome.runtime.sendMessage(message, () => {
      if(DEBUG_MESSAGES){
        console.log('message sent from syncedSet', message);
      }
    });
  }
}

export abstract class LocalStorageStore<T> extends DataStore<T> {
  get(): T {
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

  set(value: T): void {
    const processedValue = this.setPreprocessor(value);
    localStorage.setItem(this.key, JSON.stringify(processedValue));
  }
}


export abstract class DatabaseStorage<T> extends DataStore<T> {
  async get(): Promise<T> {
    const item = await getStorageKey<T>(this.key);
    if(!this.isType(item)){
      if(item === null){
        return this.defaultValue;
      }
      throw new Error(`Item in database is not of type ${this.key}`);
    }
    return item;
  }

  async set(value: T): Promise<void> {
    const processedValue = this.setPreprocessor(value);
    await setStorageKey(this.key, processedValue);
  }
}

