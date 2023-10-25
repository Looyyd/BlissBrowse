import {DEBUG, wordStatisticsKeyPrefix} from "../constants";
import {getStorageKey, setStorageKey} from "./storage";
import {isNumber, isStringArray} from "./typeguards";

const wordBlacklistKeyPrefix = 'list-';
const listNamesKey = "listNames"



export async function getSavedWordsFromList(list: string): Promise<string[]> {
  const key =  wordBlacklistKeyPrefix + list;
  const words = await getStorageKey(key);
  if(!isStringArray(words)){
    if(words === null){
      //default value
      return [];
    }
    throw new Error('words is not a string array');
  }
  return words;
}

export async function createNewList(listName: string): Promise<void> {
  const listNames = await getLists();
  if (!listNames.includes(listName)) {
    await setStorageKey(listName, []);
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
      //default value
      return 0;
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
      //default value
      return [];
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
  await removeWordFromList('', list);//TODO: how to handle whitepace after words? maybe make it obvious in editing
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


