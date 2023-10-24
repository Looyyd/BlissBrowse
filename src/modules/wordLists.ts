import {DEBUG, wordStatisticsKeyPrefix} from "../constants";
import {getStorageKey, setStorageKey} from "./storage";

const wordBlacklistKeyPrefix = 'list-';
const listNamesKey = "listNames"


export async function getSavedWordsFromList(list: string): Promise<string[]> {
  const key =  wordBlacklistKeyPrefix + list;
  return await getStorageKey(key);
}

export async function createNewList(listName: string): Promise<void> {
  const listNames = await getStorageKey(listNamesKey);
  if (!listNames.includes(listName)) {
    await setStorageKey(listName, []);
    await setStorageKey(listNamesKey, listNames.concat(listName));
  }
}

export async function getWordStatistics(word: string): Promise<number> {
  const key = wordStatisticsKeyPrefix + word;
  const n = await getStorageKey(key);
  if (n.length === 0) {
    return 0;
  }
  return parseInt(n[0]);
}


export async function addToWordStatistics(word: string, countToAdd: number){
  if(DEBUG){
    console.log('addWordStatistics:', word, countToAdd);
  }
  const key = wordStatisticsKeyPrefix + word;
  const currentCount = await getWordStatistics(key);
  const value = currentCount + countToAdd;
  await setStorageKey(key, [value.toString()]);
}


export async function getLists(): Promise<string[]> {
  const listNames = await getStorageKey(listNamesKey);
  if(DEBUG){
    console.log('listNames:', listNames);
  }
  return listNames;
}

export async function deleteList(listName: string): Promise<void> {
  const listNames = await getStorageKey(listNamesKey);
  const index = listNames.indexOf(listName);
  if (index > -1) {
    const key = listName;
    listNames.splice(index, 1);
    await setStorageKey(listNamesKey, listNames);
    await setStorageKey(key, []);
  }
}


export async function saveNewWordToList(newWord: string, existingWords: string[], list:string): Promise<void> {
  const key = wordBlacklistKeyPrefix + list;
  if (existingWords.includes(newWord)) {
    return;
  }
  await setStorageKey(key, existingWords.concat(newWord));
}

export async function saveList(words: string[], list:string): Promise<void> {
  const key = wordBlacklistKeyPrefix + list;
  //filter out duplicates
  const uniqueWords = [...new Set(words)];
  removeWordFromList('', list);//TODO: how to handle whitepace after words? maybe make it obvious in editing
  await setStorageKey(key, uniqueWords);
}

export async function removeWordFromList(wordToRemove: string, list: string): Promise<void> {
  const existingWords = await getSavedWordsFromList(list);
  const index = existingWords.indexOf(wordToRemove);
  if (index > -1) {
    const key = wordBlacklistKeyPrefix + list;
    existingWords.splice(index, 1);
    await setStorageKey(key, existingWords);
  }
}


