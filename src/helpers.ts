import {devWords} from "./constants";
import {DEBUG} from "./constants";

const siteBlacklistKey = 'blacklist';
const wordBlacklistKeyPrefix = 'list-';


//TODO: are the types right here?
async function getStorageKey(key: string): Promise<string[]> {
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

async function setStorageKey(key: string, value: string[]) {
  await chrome.storage.sync.set({[key]: value});
}

export async function getSavedWords(list: string): Promise<string[]> {
  const key =  wordBlacklistKeyPrefix + list;
  let userDefinedWords: string[] = await getStorageKey(key);
  if (DEBUG) {
    userDefinedWords = userDefinedWords.concat(devWords);
  }
  return userDefinedWords;
}



export async function saveNewWord(newWord: string, existingWords: string[], list:string): Promise<void> {
  const key = wordBlacklistKeyPrefix + list;
  if (existingWords.includes(newWord)) {
    return;
  }
  await setStorageKey(key, existingWords.concat(newWord));
}

export async function removeFilterWord(wordToRemove: string, list: string): Promise<void> {
  const existingWords = await getSavedWords(list);
  const index = existingWords.indexOf(wordToRemove);
  if (index > -1) {
    const key = wordBlacklistKeyPrefix + list;
    existingWords.splice(index, 1);
    await setStorageKey(key, existingWords);
  }
}


export async function currentTabHostname(context: "popup" | "content"): Promise<string> {
  let hostname;

  if (context === "popup") {
    const queryOptions = { active: true, lastFocusedWindow: true };
    const [tab] = await chrome.tabs.query(queryOptions);
    const url = tab.url ?? '';
    hostname = new URL(url).hostname;
  } else if (context === "content") {
    hostname = window.location.hostname;
  } else {
    throw new Error("Invalid context specified");
  }

  if (DEBUG) {
    console.log(`Hostname in ${context}:`, hostname);
  }

  if (hostname.startsWith('www.')) {
    return hostname.slice(4);
  }

  return hostname;
}


export async function isCurrentSiteDisabled(context: "popup" | "content"): Promise<boolean> {
  const hostname = await currentTabHostname(context);
  return isHostnameDisabled(hostname);
}

export async function isHostnameDisabled(hostname: string): Promise<boolean> {
  const blacklist = await getBlacklist();
  return blacklist.includes(hostname);
}


async function getBlacklist(): Promise<string[]> {
  return getStorageKey(siteBlacklistKey);
}

async function setBlacklist(blacklist: string[]) {
  await setStorageKey(siteBlacklistKey, blacklist);
}

export async function addToBlacklist(hostname: string) {
  const blacklist = await getBlacklist();
  blacklist.push(hostname);
  await setBlacklist(blacklist);
}


export async function removeFromBlacklist(hostname: string) {
  const blacklist = await getBlacklist();
  const index = blacklist.indexOf(hostname);
  if (index > -1) {
    blacklist.splice(index, 1);
  }
  await setBlacklist(blacklist);
}

