import {
  DEFAULT_LISTNAMES_ARRAY,
  DEFAULT_WORD_STATISTICS,
  LIST_OF_LIST_NAMES_DATASTORE,
  WORD_STATISTICS_STORE_NAME, TRIE_STORE_NAME
} from "../constants";
import {DatabaseStorage, FullDataStore} from "./datastore";
import {isNumber, isStringArray, Message} from "./types";
import {Trie, TrieNode} from "./trie";

/*
* @throws Error if n is not a number
 */
export async function getFilterWordStatistics(word: string): Promise<number> {
  const dataStore = new WordStatisticsDataStore(word);
  return await dataStore.get();
}

/*
* @throws Error if n is not a number
 */
export async function addToFilterWordStatistics(word: string, countToAdd: number){
  const dataStore = new WordStatisticsDataStore(word);
  await dataStore.add(countToAdd);
}


export class WordStatisticsDataStore extends DatabaseStorage<number> {
  key: string;
  defaultValue = DEFAULT_WORD_STATISTICS;
  IndexedDBStoreName = WORD_STATISTICS_STORE_NAME;
  isType = isNumber;

  constructor(word: string) {
    super();
    this.key =  word;
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

//TODO: change into object to be able to add more statistics
export type Statistics = number;

export class FullStatisticsDataStore extends FullDataStore<Statistics> {
  IndexedDBStoreName = WORD_STATISTICS_STORE_NAME;
}


export class ListNamesDataStore extends DatabaseStorage<string[]> {
  //TODO: datastore used as key, maybe fix names
  key = LIST_OF_LIST_NAMES_DATASTORE;//TODO: should maybe not use single key but 1 row per list? what are the tradeoffs?
                                                        // seems to me like this works fine
  IndexedDBStoreName = LIST_OF_LIST_NAMES_DATASTORE;
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
      const trieStore = new TrieRootNodeDataStore(listName);
      await trieStore.clear();
    }
  }
}


export class TrieRootNodeDataStore extends DatabaseStorage<TrieNode> {
  key: string;
  defaultValue = new Trie([]).getRoot();
  IndexedDBStoreName = TRIE_STORE_NAME;
  isType = (obj: unknown): obj is TrieNode => (obj !== null);//TODO: make sure skipping this check is ok

  constructor(listName: string) {
    super();
    this.key = listName;
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

  async getWordList(): Promise<string[]> {
    const trie = await this.getTrie();
    return trie.generateWordList();
  }

  async setWordList(wordList: string[]): Promise<void> {
    const trie = new Trie(wordList);
    const reserializedTrie = trie.getRoot();
    await this.set(reserializedTrie);
  }
}

