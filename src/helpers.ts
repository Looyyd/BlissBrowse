import {devWords} from "./constants";

export function getSavedWords(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['userDefinedWords'], function(result) {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
      }
      let userDefinedWords: string[] = result.userDefinedWords ? result.userDefinedWords : [];
      if (process.env.NODE_ENV === 'development') {
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


