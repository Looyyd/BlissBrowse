class IndexedDBModule {
  private static dbName = 'myExtensionDB';
  private static storeName = 'myExtensionStore';
  private static db: IDBDatabase | null = null;

  static async init() {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const target = event.target as IDBRequest;
        if (target) {
          this.db = target.result as IDBDatabase;
          this.db.createObjectStore(this.storeName, { keyPath: 'key' });
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

  static async getIndexedDBKey<T>(key: string): Promise<T> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const objectStore = transaction.objectStore(this.storeName);
        const request = objectStore.get(key);
        request.onsuccess = () => resolve(request.result ? request.result.value : null);
        request.onerror = () => reject(new Error(`Error fetching data for key ${key}`));
      } else {
        reject(new Error(`Database is not initialized`));
      }
    });
  }

  static async setIndexedDBKey<T>(key: string, value: T): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const objectStore = transaction.objectStore(this.storeName);
        const request = objectStore.put({ key, value });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error(`Error setting data for key ${key}`));
      } else {
        reject(new Error(`Database is not initialized`));
      }
    });
  }

  static async removeIndexedDBKey(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const objectStore = transaction.objectStore(this.storeName);
        const request = objectStore.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error(`Error removing data for key ${key}`));
      } else {
        reject(new Error(`Database is not initialized`));
      }
    });
  }
}



export default IndexedDBModule;
