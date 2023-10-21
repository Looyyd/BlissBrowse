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

export function currentTabHostnameContent(): string{
  const hostname = window.location.hostname;
  if(DEBUG){
    console.log('Hostname in content:', hostname);
  }
  if (hostname.startsWith('www.')) {
    return hostname.slice(4);
  }
  return hostname
}

export async function isDisabledOnSiteContent(): Promise<boolean> {
  const hostname = currentTabHostnameContent();
  return isDisabledOnSite(hostname);
}

export async function isDisabledOnSite(hostname: string): Promise<boolean> {
  const blacklist = await new Promise<string[]>((resolve) => {
    chrome.storage.sync.get(blacklistKey, (data) => {
      resolve(data[blacklistKey] || []);
    });
  });
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

