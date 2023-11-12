import {STORE_NAMES} from "../constants";
import {IndexedDBKeyValueStore} from "./types";

class DatabaseNotInitError extends Error {
  constructor() {
    super("Database is not initialized");
    this.name = "DatabaseNotInitError";

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DatabaseNotInitError);
    }
  }
}

class IndexedDBRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IndexedDBRequestError";

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, IndexedDBRequestError);
    }
  }
}

class IndexedDBModule {
  private static dbName = 'myExtensionDB';
  private static db: IDBDatabase | null = null;

  static async init() {
    /* @throws IndexedDBRequestError if IndexedDB can't be opened */
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
        reject(new IndexedDBRequestError(`Failed to open IndexedDB: ${event}`));
      };
    });
  }

  static async getIndexedDBKey<T>(storeName: string, key: string): Promise<T> {
    /* @throws IndexeDBRequestError
    *  @throws DatabaseNotInitError
    *  */
    return new Promise((resolve, reject) => {
      if (this.db) {
        const transaction = this.db.transaction([storeName], 'readonly');
        const objectStore = transaction.objectStore(storeName);
        const request = objectStore.get(key);
        request.onsuccess = () => resolve(request.result ? request.result.value : null);
        request.onerror = () => reject(new IndexedDBRequestError(`Error fetching data for key ${key}`));
      } else {
        reject(new DatabaseNotInitError());
      }
    });
  }

  static async setIndexedDBKey<T>(storeName: string, key: string, value: T): Promise<void> {
    /* @throws IndexeDBRequestError
    *  @throws DatabaseNotInitError
    *  */
    return new Promise((resolve, reject) => {
      if (this.db) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const objectStore = transaction.objectStore(storeName);
        const request = objectStore.put({ key, value });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new IndexedDBRequestError(`Error setting data for key ${key}`));
      } else {
        reject(new DatabaseNotInitError());
      }
    });
  }

  static async removeIndexedDBKey(storeName: string, key: string): Promise<void> {
    /* @throws IndexeDBRequestError
    *  @throws DatabaseNotInitError
    *  */
    return new Promise((resolve, reject) => {
      if (this.db) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const objectStore = transaction.objectStore(storeName);
        const request = objectStore.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new IndexedDBRequestError(`Error removing data for key ${key}`));
      } else {
        reject(new DatabaseNotInitError());
      }
    });
  }

  static async getAllIndexedDBKeys<T>(storeName: string): Promise<IndexedDBKeyValueStore<T>> {
    /* @throws IndexeDBRequestError
    *  @throws DatabaseNotInitError
    *  */
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
          reject(new IndexedDBRequestError(`Error fetching all data from ${storeName}`));
        };
      } else {
        reject(new DatabaseNotInitError());
      }
    });
  }


}



export default IndexedDBModule;
