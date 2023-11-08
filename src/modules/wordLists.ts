import {
  DEFAULT_LISTNAMES_ARRAY,
  DEFAULT_WORD_STATISTICS,
  DEFAULT_WORDLIST,
  LIST_OF_LIST_NAMES_KEY,
  FILTER_LIST_KEY_PREFIX,
  WORD_STATISTICS_KEY_PREFIX, TRIE_KEY_PREFIX
} from "../constants";
import {DatabaseStorage, DataStore} from "./datastore";
import {isNumber, isStringArray, Message} from "./types";
import {removeStorageKey} from "./storage";
import {Trie, TrieNode} from "./trie";
import {useEffect, useState} from "react";

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
  key = LIST_OF_LIST_NAMES_KEY;
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


class TrieRootNodeDataStore extends DatabaseStorage<TrieNode> {
  key: string;
  defaultValue = new Trie([]).getRoot();
  isType = (obj: unknown): obj is TrieNode => (obj !== null);//TODO: make sure skipping this check is ok

  constructor(listName: string) {
    super();
    this.key = TRIE_KEY_PREFIX + listName;
  }

  async getTrie(): Promise<Trie> {
    const serializedTrie= await super.get();
    const trie = new Trie([]);
    trie.setRoot(serializedTrie);
    return trie;
  }

  async addWord(word: string): Promise<void> {
    // does not add whitespace words
    if(word.trim() === '') return;
    const trie = await this.getTrie();
    trie.addWord(word);
    const reserializedTrie = trie.getRoot();
    await this.set(reserializedTrie);
  }
}


export class FilterListDataStore extends DataStore<string[]> {
  key: string;
  defaultValue = DEFAULT_WORDLIST;
  isType = isStringArray;
  setPreprocessor = (value: string[]) => [...new Set(value)];
  serializedTrieDataStore: TrieRootNodeDataStore;
  _currentData: string[] | null = null;

  // Store a reference to the listener
  messageListener: ((request: Message<unknown>) => void) | null = null;

  constructor(listName: string) {
    super();
    this.key = FILTER_LIST_KEY_PREFIX + listName;
    this.serializedTrieDataStore = new TrieRootNodeDataStore(listName);

    this.messageListener = (request: Message<unknown>) => {
      if (request.action === 'dataChanged' && request.key === this.serializedTrieDataStore.key) {
        if (this.serializedTrieDataStore.isType(request.value)) {
          const serializedTrie = request.value;
          const trie = new Trie([]);
          trie.setRoot(serializedTrie);
          this._currentData = trie.generateWordList();
        }
      }
    };

    // Add the listener
    chrome.runtime.onMessage.addListener(this.messageListener);
  }

  //TODO: use this dispose method to clean up all listeners
  dispose() {
    if (this.messageListener) {
      chrome.runtime.onMessage.removeListener(this.messageListener);
      this.messageListener = null;
    }
  }



  useData(initialState: string[] | null = null): [string[] | null, (newValue: string[]) => Promise<void>] {
    const [data, setData] = useState<string[] | null>(initialState);

    useEffect(() => {
      const fetchData = async () => {
        try {
          // Fetch latest data using the get method
          const value = await this.get();
          setData(value);
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };

      // Call fetchData once to initialize data
      fetchData();
    }, []);

    const setNewValue = async (newValue: string[]) => {
      await this.set(newValue);
    };

    return [data, setNewValue];
  }


  async get(): Promise<string[]> {
    if (this._currentData === null) {
      // Fetch data only if it's the first call or no data is currently stored
      this._currentData = await this.fetchData();
    }
    return this._currentData;
  }

  async fetchData(): Promise<string[]> {
    const serializedTrie = await this.serializedTrieDataStore.get();
    const trie = new Trie([]);
    trie.setRoot(serializedTrie);
    return trie.generateWordList();
  }


  async set(wordlist: string[]): Promise<void> {
    const Tri = new Trie(wordlist);
    await this.serializedTrieDataStore.set(Tri.getRoot());
  }

  async getTrie(): Promise<Trie> {
    const rootNode= await this.serializedTrieDataStore.get();
    const trie = new Trie([]);
    trie.setRoot(rootNode);
    return trie;
  }

  async setTrie(trie: Trie): Promise<void> {
    await this.serializedTrieDataStore.set(trie.getRoot());
  }

  async addNonWhiteSpaceWord(word: string): Promise<void> {
    if(word.trim() === '') return;
    await this.serializedTrieDataStore.addWord(word);
  }

  async clear(): Promise<void> {
    await removeStorageKey(this.serializedTrieDataStore.key);
  }
}

