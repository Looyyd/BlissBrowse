import {DEBUG, DEFAULT_LISTNAMES_ARRAY, DEFAULT_WORD_STATISTICS, DEFAULT_WORDLIST, wordStatisticsKeyPrefix} from "../constants";
import {getStorageKey, setStorageKey} from "./storage";
import {isNumber, isStringArray} from "./typeguards";

const wordBlacklistKeyPrefix = 'list-';
const listNamesKey = "listNames"



export async function getSavedWordsFromList(list: string): Promise<string[]> {
  const key =  wordBlacklistKeyPrefix + list;
  const words = await getStorageKey(key);
  if(!isStringArray(words)){
    if(words === null){
      return DEFAULT_WORDLIST;
    }
    throw new Error('words is not a string array');
  }
  return words;
}

export async function createNewList(listName: string): Promise<void> {
  const listNames = await getLists();
  if (!listNames.includes(listName)) {
    await setStorageKey(listName, DEFAULT_WORDLIST);
    await setStorageKey(listNamesKey, listNames.concat(listName));
  }
}

/*
* @throws Error if n is not a number
 */
export async function getWordStatistics(word: string): Promise<number> {
  const key = wordStatisticsKeyPrefix + word;
  const n = await getStorageKey(key);

  if(!isNumber(n)){
    if(n === null){
      return DEFAULT_WORD_STATISTICS;
    }
    throw new Error('n is not a number');
  }
  return n;
}


/*
* @throws Error if n is not a number
 */
export async function addToWordStatistics(word: string, countToAdd: number){
  if(DEBUG){
    console.log('addWordStatistics:', word, countToAdd);
  }
  const key = wordStatisticsKeyPrefix + word;
  const currentCount = await getWordStatistics(key);
  const value = currentCount + countToAdd;
  await setStorageKey(key, value);
}


/*
* @throws Error if listNames is not a string array
 */
export async function getLists(): Promise<string[]> {
  const listNames = await getStorageKey(listNamesKey);
  if(!isStringArray(listNames)){
    if(listNames === null){
      return DEFAULT_LISTNAMES_ARRAY;
    }
    throw new Error('listNames is not a string array');
  }
  if(DEBUG){
    console.log('listNames:', listNames);
  }
  return listNames;
}

/*
* @throws Error if listNames is not a string array
 */
export async function deleteList(listName: string): Promise<void> {
  const listNames = await getStorageKey(listNamesKey);
  if(!isStringArray(listNames)){
    throw new Error('listNames is not a string array');
  }
  const index = listNames.indexOf(listName);
  if (index > -1) {
    const key = listName;
    listNames.splice(index, 1);
    await setStorageKey(listNamesKey, listNames);
    //TODO: remove list from storage instead of default value
    await setStorageKey(key, DEFAULT_WORDLIST);
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
  const uniqueWords = [...new Set(words)];
  const uniqueWordsWithoutEmptyString = uniqueWords.filter(word => word !== '');
  await setStorageKey(key, uniqueWordsWithoutEmptyString);
}

export async function removeWordFromList(wordToRemove: string, list: string): Promise<void> {
  const existingWords = await getSavedWordsFromList(list);
  const filteredWords = existingWords.filter(word => word !== wordToRemove);

  if (filteredWords.length !== existingWords.length) {
    const key = wordBlacklistKeyPrefix + list;
    await setStorageKey(key, filteredWords);
  }
}


