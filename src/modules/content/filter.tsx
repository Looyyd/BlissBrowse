import {FilterAction} from "../types";
import {DEBUG, EXTENSION_NAME, FILTER_IGNORE_ATTRIBUTE} from "../../constants";
import {addToFilterWordStatistics, FilterListDataStore, ListNamesDataStore} from "../wordLists";
import {Trie} from "../trie";
import React from 'react';
import {createRoot} from "react-dom/client";
import {FilteredElementTooltip} from "../../components/content/filteredElementTooltip";


function addTooltipStylesIfAbsent(): void {
  // Check if the styles have already been added
  if (!document.getElementById('tooltip-styles')) {
    // Create a style element
    const style = document.createElement('style');
    style.id = 'tooltip-styles';
    style.textContent = `
      .tooltip-content {
        position: absolute;
        z-index: 100;
        visibility: hidden; /* Initially hidden */
        opacity: 0;
        transition: opacity 0.3s, visibility 0.3s;
      }
      .tooltip-content.visible {
        visibility: visible;
        opacity: 1;
      }
    `;
    // Append the style element to the document head
    document.head.appendChild(style);
  }
}

// This variable should be in a scope accessible to both setupTooltipListeners and removeTooltipListeners
const tooltipVisibilityHandlers = new Map<HTMLElement, { show: () => void; hide: () => void; hideTimeoutId?: number }>();

function createShowTooltipHandler(element: HTMLElement, tooltip: HTMLElement) {
  return () => {
    // Clear any hide timeout if it exists
    const handlers = tooltipVisibilityHandlers.get(element);
    if (handlers && handlers.hideTimeoutId) {
      clearTimeout(handlers.hideTimeoutId);
      handlers.hideTimeoutId = undefined;
    }

    const rect = element.getBoundingClientRect();
    tooltip.style.top = `${rect.top + window.scrollY - tooltip.offsetHeight}px`;
    tooltip.style.left = `${rect.left + window.scrollX + (element.offsetWidth - tooltip.offsetWidth) / 2}px`;

    tooltip.classList.add('visible');
  };
}

function createHideTooltipHandler( element: HTMLElement, tooltip: HTMLElement) {
  return () => {
    const handlers = tooltipVisibilityHandlers.get(element);
    if (handlers) {
      handlers.hideTimeoutId = window.setTimeout(() => {
        tooltip.classList.remove('visible');
        // Clear the timeout ID once the tooltip is hidden
        handlers.hideTimeoutId = undefined;
      }, 100);
    }
  };
}



function setupTooltipListeners(tooltip: HTMLElement, element: HTMLElement) {
  const showTooltipHandler = createShowTooltipHandler(element, tooltip);
  const hideTooltipHandler = createHideTooltipHandler(element, tooltip);

  // Store the handlers for future removal
  tooltipVisibilityHandlers.set(element, { show: showTooltipHandler, hide: hideTooltipHandler });

  // Setup event listeners
  element.addEventListener('mouseenter', showTooltipHandler);
  element.addEventListener('mouseleave', hideTooltipHandler);
  tooltip.addEventListener('mouseenter', showTooltipHandler);
  tooltip.addEventListener('mouseleave', hideTooltipHandler);
}

function removeTooltipListeners(tooltip: HTMLElement, element: HTMLElement) {
  // Retrieve the handlers
  const handlers = tooltipVisibilityHandlers.get(element);

  if (handlers) {
    // Remove any pending timeout
    if (handlers.hideTimeoutId) {
      clearTimeout(handlers.hideTimeoutId);
    }
    // Remove event listeners
    element.removeEventListener('mouseenter', handlers.show);
    element.removeEventListener('mouseleave', handlers.hide);
    tooltip.removeEventListener('mouseenter', handlers.show);
    tooltip.removeEventListener('mouseleave', handlers.hide);

    // Clean up references to the handlers
    tooltipVisibilityHandlers.delete(element);
  }
}

export function addFilterTooltipToFilteredElement(element: HTMLElement, triggeredByWord: string, triggeredByList: string) {
  addTooltipStylesIfAbsent();

  // Create tooltip element
  const tooltip = document.createElement('div');
  tooltip.classList.add('tooltip-content'); // Using a class for common styles

  const root = createRoot(tooltip);
  root.render(
    <React.StrictMode>
      <FilteredElementTooltip word={triggeredByWord} listName={triggeredByList}/>
    </React.StrictMode>
  );

  // Generate a unique ID for the tooltip
  const tooltipId = 'tooltip-' + Math.random().toString(36).substring(2, 11);
  tooltip.id = tooltipId;

  // Only add tooltip if it doesn't already exist
  if (!element.dataset.tooltipId) {
    element.dataset.tooltipId = tooltipId;
    document.body.appendChild(tooltip);

    // Set up event listeners to control tooltip visibility with CSS classes
    setupTooltipListeners(tooltip, element);
  }
}

export function removeFilterTooltipFromFilteredElement(element: HTMLElement) {
  // Check if the element has a tooltip associated with it
  const tooltipId = element.dataset.tooltipId;
  if (tooltipId) {
    // Find the tooltip element using the ID
    const tooltip = document.getElementById(tooltipId);
    if (tooltip) {
      // Remove tooltip element from the DOM
      document.body.removeChild(tooltip);
      removeTooltipListeners(tooltip, element);
    }
    // Remove the data attribute from the element
    delete element.dataset.tooltipId;
  }
}


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

const PROCESSED_BY_PREFIX = 'processed-by-';
const TRIGGERING_WORD = 'triggering-word';
const APPLIED_ACTION = 'applied-action';
const ORIGINAL_FILTER_PREFIX = 'original-filter-';
const ORIGINAL_DISPLAY_PREFIX = 'original-display-';
const SCRIPT_NAME = EXTENSION_NAME;

export async function filterElement(element: HTMLElement, triggeringWord: string, listName: string,  filterAction: FilterAction) {
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

  addFilterTooltipToFilteredElement(element, triggeringWord, listName);
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

  removeFilterTooltipFromFilteredElement(element);
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
interface ListTriePair {
  listName: string;
  trie: Trie;
}
export async function getFilterTries(): Promise<ListTriePair[]> {
  const triesWithNames: ListTriePair[] = [];
  try {
    const listsStore = new ListNamesDataStore();
    const lists: string[] = await listsStore.get();

    for (const listName of lists) {
      // Reuse or create a FilterListDataStore instance
      if (!filterListDataStores[listName]) {
        filterListDataStores[listName] = new FilterListDataStore(listName);
      }

      const listStore = filterListDataStores[listName];
      const trie: Trie = await listStore.getTrie();
      triesWithNames.push({ listName, trie });
    }
  } catch (e) {
    console.error("Error retrieving saved words.", e);
  }
  return triesWithNames;
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

export function nodeHasAIgnoredParent(node: Node) {
  let currentNode:Node | null = node;
  do {
    if (currentNode instanceof HTMLElement) {
      if (currentNode.getAttribute(FILTER_IGNORE_ATTRIBUTE) === 'true') {
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