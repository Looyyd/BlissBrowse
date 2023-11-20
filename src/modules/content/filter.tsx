import {FilterAction} from "../types";
import {DEBUG, EXTENSION_NAME, FILTER_IGNORE_ATTRIBUTE} from "../../constants";
import {addToFilterWordStatistics, ListNamesDataStore, TrieRootNodeDataStore} from "../wordLists";
import {Trie} from "../trie";
import React from 'react';
import {createRoot} from "react-dom/client";
import {FilteredElementTooltip} from "../../components/content/FilteredElementTooltip";
import {UnfilteredElementTooltip} from "../../components/content/UnfilteredElementTooltip";
import {MLSubject} from "../ml";
import {FilteredElement, FilteredMLElement, FilteredTextElement} from "../content_rewrite";


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
    const viewportHeight = window.innerHeight;
    const tooltipHeight = tooltip.offsetHeight;

    // Check if there is enough space above the element for the tooltip
    // If not, display the tooltip below the element
    const topPosition = rect.top - tooltipHeight;
    const bottomPosition = rect.bottom + tooltipHeight;

    if (topPosition < 0 && bottomPosition < viewportHeight) {
      // Not enough space above and enough space below
      tooltip.style.top = `${rect.bottom + window.scrollY}px`;
    } else {
      // Enough space above or no space below, display above
      tooltip.style.top = `${rect.top + window.scrollY - tooltipHeight}px`;
    }

    // Center the tooltip horizontally
    const leftPosition = rect.left + (element.offsetWidth - tooltip.offsetWidth) / 2;
    const rightOverflow = leftPosition + tooltip.offsetWidth - window.innerWidth;

    if (leftPosition < 0) {
      // Adjust if tooltip overflows on the left
      tooltip.style.left = `${window.scrollX}px`;
    } else if (rightOverflow > 0) {
      // Adjust if tooltip overflows on the right
      tooltip.style.left = `${rect.left - rightOverflow + window.scrollX}px`;
    } else {
      // Position is good, no adjustment needed
      tooltip.style.left = `${leftPosition + window.scrollX}px`;
    }

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

export function addComponentTooltip(element: HTMLElement, tooltipElement: React.ReactElement): void {
  addTooltipStylesIfAbsent();

  const tooltip = document.createElement('div');
  tooltip.classList.add('tooltip-content');

  const root = createRoot(tooltip);
  root.render(
    <React.StrictMode>
      {tooltipElement}
    </React.StrictMode>
  );

  const tooltipId = 'tooltip-' + Math.random().toString(36).substring(2, 11);
  tooltip.id = tooltipId;

  if (!element.dataset.tooltipId) {
    element.dataset.tooltipId = tooltipId;
    document.body.appendChild(tooltip);
    setupTooltipListeners(tooltip, element);
  }
}

// Function to add a FilterTooltip specifically, using the addComponentTooltip function
export function addFilterTooltipToTextFilteredElement(
  fe: FilteredTextElement,
): void {
  const tooltipText = (
    <>
      Filter triggered by word: <span style={{color: 'blue'}}>{fe.triggeringWord}</span> in list:
      <span style={{color: 'green'}}>{fe.listName}</span>
    </>
  );
  const tooltipElement = (
    <FilteredElementTooltip
      element={fe}
      tooltipText={tooltipText}
    />
  );

  addComponentTooltip(fe.element, tooltipElement);
}

export function addFilterTooltipToMLFilteredElement(
  fe: FilteredMLElement,
): void {
  const tooltipText = (
    <>
      Filter triggered by subject: <span style={{color: 'blue'}}>{fe.subject}</span>
    </>
  );
  const tooltipElement = (
    <FilteredElementTooltip
      element={fe}
      tooltipText={tooltipText}
    />
  );

  addComponentTooltip(fe.element, tooltipElement);
}

function addUnfilteredElementTooltip(fe: FilteredElement): void {
  const tooltipElement = (
    <UnfilteredElementTooltip element={fe.element} />
  );

  addComponentTooltip(fe.element, tooltipElement);
}

export function removeTooltipFromElement(element: HTMLElement) {
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

//TODO: don't include ML filtered
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
const SCRIPT_NAME = EXTENSION_NAME;

export async function filterElementCommon<T extends FilteredElement>(filterElement: T): Promise<T> {
  const element = filterElement.element;
  const filterAction = filterElement.filterAction;
  if (element.getAttribute(`${PROCESSED_BY_PREFIX}${SCRIPT_NAME}`) === 'true') {
    if (DEBUG) {
      //TODO: fix this, it shouldn't be happending
      console.log('Element already processed', element);
    }
    throw new Error('Element already processed');
  }
  element.setAttribute(`${PROCESSED_BY_PREFIX}${SCRIPT_NAME}`, 'true');

  if (filterAction === FilterAction.BLUR) {
    filterElement.originalAttribueValue = element.style.filter;
    element.style.filter = 'blur(8px)';
  } else if (filterAction === FilterAction.HIDE) {
    filterElement.originalAttribueValue = element.style.display;
    element.style.display = 'none';
  }
  return filterElement;

}

export async function filterTextElement(fe: FilteredTextElement): Promise<FilteredTextElement> {
  const filterElement = await filterElementCommon(fe);
  const textElement = filterElement as FilteredTextElement;
  const triggeringWord = textElement.triggeringWord;
  addFilterTooltipToTextFilteredElement(textElement);
  inMemoryStatistics[triggeringWord] = (inMemoryStatistics[triggeringWord] || 0) + 1;
  return filterElement;
}

export async function filterMLElement(fe: FilteredMLElement): Promise<FilteredMLElement> {
  const filterElement = await filterElementCommon(fe);
  const mlElement = filterElement as FilteredMLElement;
  addFilterTooltipToMLFilteredElement(mlElement);
  return filterElement;
}

export async function unfilterElement(fe: FilteredElement) {
  const element = fe.element;
  element.removeAttribute(`${PROCESSED_BY_PREFIX}${SCRIPT_NAME}`);

  const action = fe.filterAction;
  if (action === FilterAction.BLUR) {
    element.style.filter = fe.originalAttribueValue || '';
  } else if (action === FilterAction.HIDE) {
    element.style.display = fe.originalAttribueValue || '';
  }

  if(fe.type === 'text') {
    const triggeringWord = (fe as FilteredTextElement).triggeringWord;
    inMemoryStatistics[triggeringWord] = (inMemoryStatistics[triggeringWord] || 0) - 1;
  }
  removeTooltipFromElement(element);
}

export function markElementAsIgnored(element: HTMLElement) {
  element.setAttribute(FILTER_IGNORE_ATTRIBUTE, 'true');
}

export function isElementIgnored(element: HTMLElement) {
  return element.getAttribute(FILTER_IGNORE_ATTRIBUTE) === 'true';
}

export function unmarkElementAsIgnored(element: HTMLElement) {
  element.removeAttribute(FILTER_IGNORE_ATTRIBUTE);
}

export function isElementProcessed(element: HTMLElement) {
  return element.getAttribute(`${PROCESSED_BY_PREFIX}${SCRIPT_NAME}`) === 'true';
}

export async function unfilterAndIgnoreElement(fe: FilteredElement) {
  markElementAsIgnored(fe.element);
  await unfilterElement(fe);
  addUnfilteredElementTooltip(fe);
}

export async function reAllowFilterElement(element: HTMLElement) {
  unmarkElementAsIgnored(element);
  removeTooltipFromElement(element)
}


export async function unfilterElementsIfNotInTries(tries: Trie[], filteredElements: FilteredTextElement[]) : Promise<FilteredTextElement[]> {
  const remainingElements: FilteredTextElement[] = [];
  filteredElements.forEach(filteredElement => {
    const triggeringWord = filteredElement.triggeringWord;
    let shouldUnfilter = true;
    for (const trie of tries) {
      if (trie.wordExists(triggeringWord)) {
        shouldUnfilter = false;
        break;
      }
    }
    if (shouldUnfilter) {
      unfilterElement(filteredElement);
    } else {
      remainingElements.push(filteredElement);
    }
  });
  return remainingElements;
}

export async function unfilterElementIfNotInSubjects(subjects: MLSubject[], filteredElements: FilteredMLElement[]) : Promise<FilteredMLElement[]> {
  const remainingElements: FilteredMLElement[] = [];
  const subjectDescriptions = subjects.map(subject => subject.description);
  filteredElements.forEach(filteredElement => {
    if (subjectDescriptions.includes(filteredElement.subject)) {
      remainingElements.push(filteredElement);
    } else {
      unfilterElement(filteredElement);
    }
  });
  return remainingElements;
}

export async function unfilterElementsIfWrongAction(currentAction: FilterAction, filteredElements: FilteredElement[]) {
  const remainingElements: FilteredElement[] = [];
  filteredElements.forEach(fe => {
    const action = fe.filterAction;
    if (action !== currentAction) {
      unfilterElement(fe);
    } else {
      remainingElements.push(fe);
    }
  });
  return remainingElements;
}

export function hasAncestorTagThatShouldBeIgnored(node: Node) {
  /* Check if the node has an ancestor that should be ignored such as a <script> tag */
  const ignore_tags = ['script', 'style', 'noscript', 'meta', 'link', 'head', 'title', 'iframe', 'object', 'embed', 'svg']
  let current = node;
  while (current.parentElement) {
    const tagName = current.parentElement.tagName.toLowerCase();
    if (ignore_tags.includes(tagName)) {
      return true;
    }
    current = current.parentElement;
  }
  return false;
}

const trieDataStores: { [key: string]: TrieRootNodeDataStore} = {};
export interface ListTriePair {
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
      if (!trieDataStores[listName]) {
        trieDataStores[listName] = new TrieRootNodeDataStore(listName);
      }

      const listStore = trieDataStores[listName];
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