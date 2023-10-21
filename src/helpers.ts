import {devWords} from "./constants";
import {DEBUG} from "./constants";

const blacklistKey = 'blacklist';


export function getSavedWords(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['userDefinedWords'], function(result) {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
      }
      let userDefinedWords: string[] = result.userDefinedWords ? result.userDefinedWords : [];
      if (DEBUG) {
        userDefinedWords = userDefinedWords.concat(devWords);
      }
      resolve(userDefinedWords);
    });
  });
}


export async function saveNewWord(newWord: string, existingWords: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const updatedWords = [...existingWords, newWord];
    chrome.storage.local.set({ 'userDefinedWords': updatedWords }, function() {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      resolve();
    });
  });
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
  return new Promise<string[]>((resolve) => {
    chrome.storage.sync.get(blacklistKey, (data) => {
      resolve(data[blacklistKey] || []);
    });
  });
}

async function setBlacklist(blacklist: string[]) {
  await chrome.storage.sync.set({[blacklistKey]: blacklist});
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

