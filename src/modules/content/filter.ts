import {FilterAction} from "../types";
import {DEBUG, EXTENSION_NAME} from "../../constants";
import {addToFilterWordStatistics, FilterListDataStore, ListNamesDataStore} from "../wordLists";

interface MyStats {
  [key: string]: number;
}

type FilterResult = {
  shouldFilter: boolean;
  triggeringWord?: string;
};

let inMemoryStatistics: MyStats = {};

export function resetAndReturnStatistics(): MyStats {
  const stats = inMemoryStatistics;
  inMemoryStatistics = {};
  return stats;
}

interface TrieNode {
  isEndOfWord: boolean;
  children: Map<string, TrieNode>;
}

export class Trie {
  private readonly root: TrieNode;

  constructor(words: string[]) {
    //TODO: wordsToFilter lowercase class to make sure only lowercase is passed
    this.root = { isEndOfWord: false, children: new Map() };
    this.buildTrie(words);
  }

  private buildTrie(words: string[]): void {
    for (const word of words) {
      let currentNode = this.root;
      for (const char of word.toLowerCase()) {
        if (!currentNode.children.has(char)) {
          currentNode.children.set(char, { isEndOfWord: false, children: new Map() });
        }
        currentNode = currentNode.children.get(char)!;
      }
      currentNode.isEndOfWord = true;
    }
  }

  public shouldFilterTextContent(textContent: string): FilterResult {
    const cleanedTextContent = textContent.toLowerCase().trim();
    const result: FilterResult = {
      shouldFilter: false,
    };
    let currentNode = this.root;
    let triggeringWord = '';

    for (const char of cleanedTextContent) {
      if (currentNode.children.has(char)) {
        triggeringWord += char;
        currentNode = currentNode.children.get(char)!;
        if (currentNode.isEndOfWord) {
          result.shouldFilter = true;
          result.triggeringWord = triggeringWord;
          return result;
        }
      } else {
        triggeringWord = '';
        currentNode = this.root;
      }
    }
    return result;
  }
}

export function shouldFilterTextContent(textContent: string, wordsToFilter: string[], isRegex: boolean): FilterResult {
  //TODO: wordsToFilter lowercase class
  const cleanedTextContent = textContent.toLowerCase().trim();
  const result: FilterResult = {
    shouldFilter: false,
  };

  if (isRegex) {
    const nonEmptyWords = wordsToFilter.filter(word => word !== '');
    const joinedWords = nonEmptyWords.join('|');
    const regex = new RegExp(joinedWords, 'i'); // case-insensitive matching

    const match = cleanedTextContent.match(regex);
    if (match) {
      result.shouldFilter = true;
      result.triggeringWord = match[0]; // Gets the matched word
      return result;
    }
  } else {
    for (const word of wordsToFilter) {
      if (word === '') {
        continue;
      }
      if (cleanedTextContent.includes(word)) {
        result.shouldFilter = true;
        result.triggeringWord = word;
        return result;
      }
    }
  }
  return result;
}

/*
TODO: add a visual indicator using react, something like this:
  // Create a DOM element to host the React component
  const reactRoot = document.createElement('div');
  element.appendChild(reactRoot);
  // Create React root and render the component
  const rootContainer = ReactDOM.createRoot(reactRoot);
  rootContainer.render(<VisualIndicator message={`Filtered by: ${triggeringWord}`} />);
  // Your existing logic here...

 */
const PROCESSED_BY_PREFIX = 'processed-by-';
const TRIGGERING_WORD = 'triggering-word';
const APPLIED_ACTION = 'applied-action';
const ORIGINAL_FILTER_PREFIX = 'original-filter-';
const ORIGINAL_DISPLAY_PREFIX = 'original-display-';
const SCRIPT_NAME = EXTENSION_NAME;

export async function filterElement(element: HTMLElement, triggeringWord: string, filterAction: FilterAction) {
  if (element.getAttribute(`${PROCESSED_BY_PREFIX}${SCRIPT_NAME}`) === 'true') {
    if (DEBUG) {
      console.log('Element already processed', element, triggeringWord, filterAction);
      throw new Error('Element already processed');
    }
    return
  }
  element.setAttribute(`${PROCESSED_BY_PREFIX}${SCRIPT_NAME}`, 'true');
  element.setAttribute(TRIGGERING_WORD, triggeringWord);
  element.setAttribute(APPLIED_ACTION, filterAction);

  inMemoryStatistics[triggeringWord] = (inMemoryStatistics[triggeringWord] || 0) + 1;

  if (filterAction === FilterAction.BLUR) {
    const originalFilter = element.style.filter;
    element.setAttribute(`${ORIGINAL_FILTER_PREFIX}${SCRIPT_NAME}`, originalFilter);
    element.style.filter = 'blur(8px)';
  } else if (filterAction === FilterAction.HIDE) {
    const originalDisplay = element.style.display;
    element.setAttribute(`${ORIGINAL_DISPLAY_PREFIX}${SCRIPT_NAME}`, originalDisplay);
    element.style.display = 'none';
  }
}

async function unfilterElement(element: HTMLElement) {
  const action = element.getAttribute(APPLIED_ACTION);
  element.removeAttribute(APPLIED_ACTION);
  element.removeAttribute(`${PROCESSED_BY_PREFIX}${SCRIPT_NAME}`);
  const triggeringWord = element.getAttribute(TRIGGERING_WORD) || '';
  element.removeAttribute(TRIGGERING_WORD);

  inMemoryStatistics[triggeringWord] = (inMemoryStatistics[triggeringWord] || 0) - 1;

  if (action === FilterAction.BLUR) {
    element.style.filter = element.getAttribute(`${ORIGINAL_FILTER_PREFIX}${SCRIPT_NAME}`) || '';
    element.removeAttribute(`${ORIGINAL_FILTER_PREFIX}${SCRIPT_NAME}`);
  } else if (action === FilterAction.HIDE) {
    element.style.display = element.getAttribute(`${ORIGINAL_DISPLAY_PREFIX}${SCRIPT_NAME}`) || '';
    element.removeAttribute(`${ORIGINAL_DISPLAY_PREFIX}${SCRIPT_NAME}`);
  }
}

export async function unfilterElementsIfNotInList(currentWords: string[]) {
  //TODO: can this be more efficient?
  const hiddenElements = document.querySelectorAll(`[${PROCESSED_BY_PREFIX}${SCRIPT_NAME}="true"]`);
  hiddenElements.forEach(element => {
    const triggeringWord = element.getAttribute(TRIGGERING_WORD) || '';
    if (!currentWords.includes(triggeringWord) && element instanceof HTMLElement) {
      unfilterElement(element);
    }
  });
}

export async function unfilterElementsIfWrongAction(currentAction: FilterAction) {
  const hiddenElements = document.querySelectorAll(`[${PROCESSED_BY_PREFIX}${SCRIPT_NAME}="true"]`);
  hiddenElements.forEach(element => {
    const action = element.getAttribute(APPLIED_ACTION);
    if (action !== currentAction && element instanceof HTMLElement) {
      unfilterElement(element);
    }
  });
}

export function hasScriptOrStyleAncestor(node: Node) {
  let current = node;
  while (current.parentElement) {
    const tagName = current.parentElement.tagName.toLowerCase();
    if (['script', 'style', 'noscript'].includes(tagName)) {
      return true;
    }
    current = current.parentElement;
  }
  return false;
}

// Function to retrieve the words to be filtered
export async function getFilterWords() {
  let filterWords: string[] = [];
  try {
    const listsStore = new ListNamesDataStore();
    const lists = await listsStore.get();
    for (const list of lists) {
      const listStore = new FilterListDataStore(list);
      const savedWords = await listStore.get();
      filterWords = filterWords.concat(savedWords);
    }
  } catch (e) {
    console.error("Error retrieving saved words.", e);
  }
  if (DEBUG) {
    console.log('filterWords:', filterWords);
  }
  return filterWords;
}

export function nodeHasAProcessedParent(node: Node) {
  let currentNode:Node | null = node;
  do {
    if (currentNode instanceof HTMLElement) {
      if (currentNode.getAttribute(`${PROCESSED_BY_PREFIX}${SCRIPT_NAME}`) === 'true') {
        return true;
      }
    }
    currentNode = currentNode.parentNode;
  } while (currentNode !== null);
  return false;
}



export async function writeInMemoryStatisticsToStorage() {
  // Go over keys
  const stats = resetAndReturnStatistics();
  for (const key in stats) {
    if (Object.prototype.hasOwnProperty.call(stats, key)) {
      const value = stats[key];
      await addToFilterWordStatistics(key, value);
    }
  }
  if(DEBUG) {
    console.log('wrote in memory statistics to storage', stats);
  }
}