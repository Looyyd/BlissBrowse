import {getStorageKey, setStorageKey} from "./storage";
import React from "react";

abstract class DataStore<T> {
  protected abstract key: string;

  abstract get(): Promise<T> | T;
  abstract set(value: T): Promise<void> | void;
  abstract isType: (data: unknown) => data is T;
  abstract defaultValue: T;


  useData() {
    const [data, setData] = React.useState<T | null>(null);

    React.useEffect(() => {
      const fetchData = async () => {
        const value = await this.get();
        setData(value);
      };

      fetchData();
    }, []);

    const setSyncedData = async (newValue: T) => {
      await this.set(newValue);
      setData(newValue);
    };

    return [data, setSyncedData];
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
    localStorage.setItem(this.key, JSON.stringify(value));
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
    await setStorageKey(this.key, value);
  }
}

