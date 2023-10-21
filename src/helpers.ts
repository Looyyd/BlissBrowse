import {devWords} from "./constants";
import {DEBUG} from "./constants";

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
  const key = `disabled-${hostname}`;
  const isDisabled = await new Promise<boolean>((resolve) => {
    chrome.storage.sync.get(key, (data) => {
      resolve(!!data[key]);
    });
  });
  if(DEBUG){
    console.log('isDisabledOnSite:', isDisabled);
  }
  return isDisabled;
}



