import {FilterAction} from "../types";
import {DEBUG, EXTENSION_NAME} from "../../constants";
import {addToFilterWordStatistics, FilterListDataStore, ListNamesDataStore} from "../wordLists";
import {Trie} from "../trie";
import React from 'react';
import ReactDOM from 'react-dom';
import {createRoot} from "react-dom/client";

// Banner component
type BannerProps = {
  reason: string;
};


const Banner: React.FC<BannerProps> = ({reason}) => {
  return (
    <div className="banner">
      {reason}
    </div>
  );
};

// Function to mount the React component
export function showBannerOnElement(element: HTMLElement, reason: string) {
  const bannerMountPoint = document.createElement('div');
  const rootContainer = createRoot(bannerMountPoint);

  // You might need to set some styles on bannerMountPoint here to position it correctly
  element.prepend(bannerMountPoint);

  rootContainer.render(<Banner reason={reason} />);
}

// Function to mount the React component
//this version was a bit slower than the one above, could be tested more though
/*
export function showBannerOnElement(element:HTMLElement, reason: string) {
  const bannerMountPoint = document.createElement('div');
  // You might need to set some styles on bannerMountPoint here to position it correctly
  element.prepend(bannerMountPoint);

  ReactDOM.render(<Banner reason={reason} />, bannerMountPoint);
}
 */

interface MyStats {
  [key: string]: number;
}

export type FilterResult = {
  shouldFilter: boolean;
  triggeringWord?: string;
};

let inMemoryStatistics: MyStats = {};

export function resetAndReturnStatistics(): MyStats {
  const stats = inMemoryStatistics;
  inMemoryStatistics = {};
  return stats;
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

  //TODO: undo banner
  showBannerOnElement(element, `Filtered by: ${triggeringWord}`);
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

export async function unfilterElementsIfNotInTries(tries: Trie[]) {
  const hiddenElements = document.querySelectorAll(`[${PROCESSED_BY_PREFIX}${SCRIPT_NAME}="true"]`);
  hiddenElements.forEach(element => {
    const triggeringWord = element.getAttribute(TRIGGERING_WORD) || '';
    let shouldUnfilter = true;
    for (const trie of tries) {
      if (trie.wordExists(triggeringWord)) {
        shouldUnfilter = false;
        break;
      }
    }
    if (shouldUnfilter && element instanceof HTMLElement) {
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


const filterListDataStores: { [key: string]: FilterListDataStore } = {};
export async function getFilterTries() {
  const tries = [];
  try {
    const listsStore = new ListNamesDataStore();
    const lists = await listsStore.get();

    for (const list of lists) {
      // Reuse or create a FilterListDataStore instance
      if (!filterListDataStores[list]) {
        filterListDataStores[list] = new FilterListDataStore(list);
      }

      const listStore = filterListDataStores[list];
      const tri = await listStore.getTrie();
      tries.push(tri);
    }
  } catch (e) {
    console.error("Error retrieving saved words.", e);
  }
  return tries;
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