import {STORE_NAMES} from "../constants";
import {IndexedDBKeyValueStore} from "./types";

class IndexedDBModule {
  private static dbName = 'myExtensionDB';
  private static db: IDBDatabase | null = null;

  static async init() {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const target = event.target as IDBRequest;
        if (target) {
          this.db = target.result as IDBDatabase;
          //TODO: this is not rerun when extension refreshsed, so new stores are not added
          for(const storeName of STORE_NAMES){
            this.db.createObjectStore(storeName, { keyPath: 'key' });
          }
        }
      };

      request.onsuccess = (event: Event) => {
        const target = event.target as IDBRequest;
        if (target) {
          this.db = target.result as IDBDatabase;
          resolve();
        }
      };

      request.onerror = (event) => {
        reject(new Error(`Failed to open IndexedDB: ${event}`));
      };
    });
  }

  static async getIndexedDBKey<T>(storeName: string, key: string): Promise<T> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        const transaction = this.db.transaction([storeName], 'readonly');
        const objectStore = transaction.objectStore(storeName);
        const request = objectStore.get(key);
        request.onsuccess = () => resolve(request.result ? request.result.value : null);
        request.onerror = () => reject(new Error(`Error fetching data for key ${key}`));
      } else {
        reject(new Error(`Database is not initialized`));
      }
    });
  }

  static async setIndexedDBKey<T>(storeName: string, key: string, value: T): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const objectStore = transaction.objectStore(storeName);
        const request = objectStore.put({ key, value });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error(`Error setting data for key ${key}`));
      } else {
        reject(new Error(`Database is not initialized`));
      }
    });
  }

  static async removeIndexedDBKey(storeName: string, key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const objectStore = transaction.objectStore(storeName);
        const request = objectStore.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error(`Error removing data for key ${key}`));
      } else {
        reject(new Error(`Database is not initialized`));
      }
    });
  }

  static async getAllIndexedDBKeys<T>(storeName: string): Promise<IndexedDBKeyValueStore<T>> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        const transaction = this.db.transaction([storeName], 'readonly');
        const objectStore = transaction.objectStore(storeName);
        const request = objectStore.openCursor();
        const results: IndexedDBKeyValueStore<T> = {};

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            // Store the value in the results object using the key
            results[cursor.key as string] = cursor.value;
            cursor.continue(); // Move to the next object in the store
          } else {
            // No more entries, so resolve with the collected results
            resolve(results);
          }
        };

        request.onerror = () => {
          reject(new Error(`Error fetching all data from ${storeName}`));
        };
      } else {
        reject(new Error(`Database is not initialized`));
      }
    });
  }


}



export default IndexedDBModule;
