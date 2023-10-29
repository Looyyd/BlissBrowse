import {
  DEBUG,
  DEFAULT_LISTNAMES_ARRAY,
  DEFAULT_WORD_STATISTICS,
  DEFAULT_WORDLIST,
  LIST_OF_LIST_NAMES_KEY_PREFIX,
  FILTER_LIST_KEY_PREFIX,
  WORD_STATISTICS_KEY_PREFIX
} from "../constants";
import {getStorageKey, setStorageKey} from "./storage";
import {DatabaseStorage} from "./datastore";
import {isNumber, isStringArray} from "./types";

/*
* @throws Error if n is not a number
 */
//TODO: use datastore
export async function getFilterWordStatistics(word: string): Promise<number> {
  const key = WORD_STATISTICS_KEY_PREFIX + word;
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
export async function addToFilterWordStatistics(word: string, countToAdd: number){
  if(DEBUG){
    console.log('addWordStatistics:', word, countToAdd);
  }
  const key = WORD_STATISTICS_KEY_PREFIX + word;
  const currentCount = await getFilterWordStatistics(word);
  const value = currentCount + countToAdd;
  await setStorageKey(key, value);
}

export class ListNamesDataStore extends DatabaseStorage<string[]> {
  key = LIST_OF_LIST_NAMES_KEY_PREFIX;
  defaultValue = DEFAULT_LISTNAMES_ARRAY;
  isType = isStringArray;

  async createNewList(listName: string): Promise<void> {
    const listNames = await this.get();
    if (!listNames.includes(listName)) {
      await this.syncedSet(listNames.concat(listName));
    }
  }

  async deleteList(listName: string): Promise<void> {
    const listNames = await this.get();
    const index = listNames.indexOf(listName);
    if (index > -1) {
      listNames.splice(index, 1);
      await this.syncedSet(listNames);
      //TODO: remove list from storage instead of resetting to default value
      const listStore = new FilterListDataStore(listName);
      await listStore.syncedSet(DEFAULT_WORDLIST);
    }
  }
}




export class FilterListDataStore extends DatabaseStorage<string[]> {
  key: string;
  defaultValue = DEFAULT_WORDLIST;
  isType = isStringArray;
  setPreprocessor = (value: string[]) => [...new Set(value)];

  constructor(listName: string) {
    super();
    this.key = FILTER_LIST_KEY_PREFIX + listName;
  }

  async addWord(word: string): Promise<void> {
    const words = await this.get();
    if (!words.includes(word)) {
      await this.syncedSet(words.concat(word));
    }
  }

  async removeWord(word: string): Promise<void> {
    const words = await this.get();
    const index = words.indexOf(word);
    if (index > -1) {
      words.splice(index, 1);
      await this.syncedSet(words);
    }
  }
}

