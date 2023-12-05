import {FilterAction} from "../types";
import {DEBUG_FILTERING, EXTENSION_NAME, FILTER_IGNORE_ATTRIBUTE} from "../../constants";
import {addToFilterWordStatistics, ListNamesDataStore, FilterListDataStore, FilterList} from "../wordLists";
import {Trie} from "../trie";
import React from 'react';
import {createRoot} from "react-dom/client";
import {FilteredElementTooltip} from "../../components/content/FilteredElementTooltip";
import {UnfilteredElementTooltip} from "../../components/content/UnfilteredElementTooltip";
import {FilteredElement, FilteredMLElement, FilteredTextElement, removeElementFromCaches,} from "./content";
import {MLSubject} from "../ml/mlTypes";


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

function addFilterBubbleStylesIfAbsent() {
  // Check if the styles have already been added
  if (!document.getElementById('filter-bubble-styles')) {
    // Create a style element
    const style = document.createElement('style');
    style.id = 'filter-bubble-styles';
    style.textContent = `
      .filter-bubble {
        padding: 5px 10px;
        font-family: 'Roboto', sans-serif;
        border: 1px solid #ddd;
        border-radius: 5px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        font-size: 12px;
        margin-bottom: 5px; /* Adjust spacing if needed */
        /* Add any additional styles you need for the filter bubble */
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

    // Calculate the top position for the tooltip, preferring above the element
    let topPosition = rect.top + window.scrollY - tooltipHeight;

    // If placing above would overflow off the top of the viewport, adjust it to be at the top of the viewport
    if (topPosition < window.scrollY) {
      topPosition = window.scrollY;
    }

    // If placing it above the element causes the bottom of the tooltip to go past the bottom of the viewport, adjust to be at the bottom of the viewport
    if (topPosition + tooltipHeight > viewportHeight + window.scrollY) {
      topPosition = viewportHeight + window.scrollY - tooltipHeight;
    }

    tooltip.style.top = `${topPosition}px`;



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
      Filter triggered by subject: <span style={{color: 'blue'}}>{fe.subject_description}</span>
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


const PROCESSED_BY_PREFIX = 'processed-by-';
const PROCESSED_BY_ATTRIBUTE = `${PROCESSED_BY_PREFIX}${EXTENSION_NAME}`.toLowerCase();

function addFilterBubble(element:HTMLElement, categoryName:string) {
  // Create the bubble element
  const bubble = document.createElement('div');
  bubble.className = 'filter-bubble';
  bubble.textContent = EXTENSION_NAME + " tag : " + categoryName; // Set the category name as text

  addFilterBubbleStylesIfAbsent();
  // Prepend the bubble as the first child of the element
  element.insertBefore(bubble, element.firstChild);
}

function removeFilterBubble(element:HTMLElement) {
  const filterBubble = element.querySelector('.filter-bubble');
  if (filterBubble) {
    element.removeChild(filterBubble);
  }
}

export async function filterElementCommon<T extends FilteredElement>(filterElement: T): Promise<T> {
  const element = filterElement.element;
  const filterAction = filterElement.filterAction;
  if(DEBUG_FILTERING){
    console.log('Filtering element', element);
    console.log("Processed by attribute", element.getAttribute(PROCESSED_BY_ATTRIBUTE));
  }
  if (element.getAttribute(PROCESSED_BY_ATTRIBUTE) === 'true') {
    if (DEBUG_FILTERING) {
      //TODO: fix this, it shouldn't be happending
      console.log('Element already processed', element);
    }
    throw new Error('Element already processed');
  }
  element.setAttribute(PROCESSED_BY_ATTRIBUTE, 'true');

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

  if(fe.filterAction === FilterAction.BLUR){
    addFilterTooltipToTextFilteredElement(textElement);
  } else if (fe.filterAction === FilterAction.TAG) {
    addFilterBubble(fe.element, fe.listName);
  }

  inMemoryStatistics[triggeringWord] = (inMemoryStatistics[triggeringWord] || 0) + 1;
  return filterElement;
}

export async function filterMLElement(fe: FilteredMLElement): Promise<FilteredMLElement> {
  const filterElement = await filterElementCommon(fe);
  const mlElement = filterElement as FilteredMLElement;

  if(fe.filterAction === FilterAction.BLUR){
    addFilterTooltipToMLFilteredElement(mlElement);
  } else if (fe.filterAction === FilterAction.TAG) {
    addFilterBubble(fe.element, fe.subject_description);
  }

  return filterElement;
}

export async function unfilterElement(fe: FilteredElement) {
  const element = fe.element;
  if(DEBUG_FILTERING){
    console.log('Unfiltering element', element);
  }
  element.removeAttribute(PROCESSED_BY_ATTRIBUTE);

  const action = fe.filterAction;
  if (action === FilterAction.BLUR) {
    element.style.filter = fe.originalAttribueValue || '';
    removeTooltipFromElement(element);
  } else if (action === FilterAction.HIDE) {
    element.style.display = fe.originalAttribueValue || '';
  } else if (action === FilterAction.TAG) {
    removeFilterBubble(element);
  }

  if(fe.type === 'text') {
    const triggeringWord = (fe as FilteredTextElement).triggeringWord;
    inMemoryStatistics[triggeringWord] = (inMemoryStatistics[triggeringWord] || 0) - 1;
  }
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
  return element.getAttribute(PROCESSED_BY_ATTRIBUTE) === 'true';
}

export async function unfilterAndIgnoreElement(fe: FilteredElement) {
  removeElementFromCaches(fe.element);
  markElementAsIgnored(fe.element);
  await unfilterElement(fe);
  addUnfilteredElementTooltip(fe);
}

export async function reAllowFilterElement(element: HTMLElement) {
  removeElementFromCaches(element);
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
    if (subjectDescriptions.includes(filteredElement.subject_description)) {
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

const filterListDataStores: { [key: string]: FilterListDataStore} = {};

/*
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
 */

export async function getFilterLists(): Promise<FilterList[]> {
  const result: FilterList[] = [];
  try {
    const listsStore = new ListNamesDataStore();
    const lists: string[] = await listsStore.get();
    for (const listName of lists) {
      if (!filterListDataStores[listName]) {
        filterListDataStores[listName] = new FilterListDataStore(listName);
      }

      const listStore = filterListDataStores[listName];
      const list: FilterList = await listStore.get();
      result.push(list);
    }
  } catch (e) {
    console.error("Error retrieving saved words.", e);
  }
  return result;
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
}