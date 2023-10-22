//TODO: are the types right here?
//TODO: do we want more types?
export async function getStorageKey(key: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(key, (data) => {
      const value = data[key];
      if (Array.isArray(value) && value.every(item => typeof item === 'string')) {
        resolve(value);
      } else if (value === undefined || value === null) {
        resolve([]);
      } else {
        reject(new Error(`The key "${key}" did not contain a valid array of strings.`));
      }
    });
  });
}

export async function setStorageKey(key: string, value: string[]) {
  await chrome.storage.sync.set({[key]: value});
}