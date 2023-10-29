import {
  DEFAULT_LISTNAMES_ARRAY,
  DEFAULT_WORD_STATISTICS,
  DEFAULT_WORDLIST,
  LIST_OF_LIST_NAMES_KEY_PREFIX,
  FILTER_LIST_KEY_PREFIX,
  WORD_STATISTICS_KEY_PREFIX
} from "../constants";
import {DatabaseStorage} from "./datastore";
import {isNumber, isStringArray} from "./types";
import {removeStorageKey} from "./storage";

/*
* @throws Error if n is not a number
 */
export async function getFilterWordStatistics(word: string): Promise<number> {
  const dataStore = new StatisticsDataStore(word);
  return await dataStore.get();
}

/*
* @throws Error if n is not a number
 */
export async function addToFilterWordStatistics(word: string, countToAdd: number){
  const dataStore = new StatisticsDataStore(word);
  await dataStore.add(countToAdd);
}


export class StatisticsDataStore extends DatabaseStorage<number> {
  key: string;
  defaultValue = DEFAULT_WORD_STATISTICS;
  isType = isNumber;

  constructor(word: string) {
    super();
    this.key = WORD_STATISTICS_KEY_PREFIX + word;
  }

  async add(countToAdd: number): Promise<void> {
    const currentCount = await this.get();
    const value = currentCount + countToAdd;
    await this.syncedSet(value);
  }
  async subtract(countToSubtract: number): Promise<void> {
    const currentCount = await this.get();
    const value = currentCount - countToSubtract;
    await this.syncedSet(value);
  }
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
      const listStore = new FilterListDataStore(listName);
      await listStore.clear();
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

  async clear(): Promise<void> {
    await removeStorageKey(this.key);
  }
}

