import $ from 'jquery';
import {
  addToWordStatistics,
  ListNamesDataStore, WordListDataStore
} from "./modules/wordLists";
import {
  DEBUG,
  scriptName,
  BATCH_STAT_UPDATE_INTERVAL, siteBlacklistKey, wordBlacklistKeyPrefix,
} from "./constants";
import {isCurrentSiteDisabled} from "./modules/hostname";
import {Action} from "./modules/types";
import {FilterActionStore} from "./modules/settings";

/*
some logic taken from:
https://github.com/yeahpython/filter-anything-everywhere/blob/main/extension/content.ts
 */

interface DataChangeMessage {
  action: 'dataChanged';
  key: string;
}

//TODO: not sure if should use these types? maybe use them to standardize message format
// TODO: could use value to refresh only what is needed
type Message = DataChangeMessage;


interface MyStats {
  [key: string]: number;
}
let inMemoryStatistics: MyStats = {};
const min_feed_neighbors = 3;
const context = "content";

function isSimilar(my_rect:DOMRect, sib_rect:DOMRect) {
  //TODO: test if this logic can be improved or another functio nused
  const my_x = my_rect.left + my_rect.width / 2;
  const sib_x = sib_rect.left + sib_rect.width / 2;

  const my_y = my_rect.top + my_rect.height / 2;
  const sib_y = sib_rect.top + sib_rect.height / 2;

  const is_vertically_placed = Math.abs(my_y - sib_y) > Math.abs(my_x - sib_x);

  if (is_vertically_placed) {
    return sib_rect.height != 0 && my_rect.width == sib_rect.width;
  } else {
    return my_rect.height == sib_rect.height;
  }
}

function getFeedlikeAncestor(node:Node): Node{
  let chosen_dom_element;
  const parents = $(node).add($(node).parents());
  const sibling_counts = parents.map(function(index, elem) {
    if (!(elem instanceof Element)) {
      return 0;
    }
    const myRect = elem.getBoundingClientRect();

    // Ignore elements with zero height.
    if (myRect.height == 0) {
      return 0;
    }

    const matching_siblings = $(elem)
      .siblings()
      .filter(function(index, sib) {
        if (sib.nodeType != Node.ELEMENT_NODE) {
          return false;
        }
        const sibRect = sib.getBoundingClientRect();
        return isSimilar(myRect, sibRect);//is similar helps on youtube to avoir hiding everythin
      });
    return matching_siblings.length;
  });

  let best_index = 0;

  // Note, parents were ordered by document order
  //TODO: better logic for best index? maybe put into a function?
  for (let i = 0 ; i<sibling_counts.length -1 ; i++) {
    if (sibling_counts[i] >= min_feed_neighbors) {
      best_index = i;
    }
  }
  if (best_index < 0 || best_index === 0) {
    console.log('Uh oh: best_index < 0 or best_index is the node itself');
    chosen_dom_element = node;
  } else {
    chosen_dom_element = parents[best_index];
  }
  return $(chosen_dom_element)[0];
}



// Define a new type for the filter result
type FilterResult = {
  shouldFilter: boolean;
  triggeringWord?: string;
};

function shouldFilterTextContent(textContent: string, wordsToFilter: string[], isRegex: boolean): FilterResult {
  const cleanedTextContent = textContent.toLowerCase().trim();
  const result: FilterResult = {
    shouldFilter: false,
  };

  if (isRegex) {
    for (const word of wordsToFilter) {
      const regex = new RegExp(word, 'i'); // case-insensitive matching
      const match = cleanedTextContent.match(regex);
      if (match) {
        result.shouldFilter = true;
        result.triggeringWord = word;
        return result;
      }
    }
  } else {
    for (const word of wordsToFilter) {
      if (cleanedTextContent.includes(word.toLowerCase())) {
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
const SCRIPT_NAME = scriptName;

async function processElement(element: HTMLElement, triggeringWord: string, action: Action) {
  element.setAttribute(`${PROCESSED_BY_PREFIX}${SCRIPT_NAME}`, 'true');
  element.setAttribute(TRIGGERING_WORD, triggeringWord);
  element.setAttribute(APPLIED_ACTION, action);

  inMemoryStatistics[triggeringWord] = (inMemoryStatistics[triggeringWord] || 0) + 1;

  if (action === Action.BLUR) {
    const originalFilter = element.style.filter;
    element.setAttribute(`${ORIGINAL_FILTER_PREFIX}${SCRIPT_NAME}`, originalFilter);
    element.style.filter = 'blur(8px)';
  } else if (action === Action.HIDE) {
    const originalDisplay = element.style.display;
    element.setAttribute(`${ORIGINAL_DISPLAY_PREFIX}${SCRIPT_NAME}`, originalDisplay);
    element.style.display = 'none';
  }
}

async function unprocessElement(element: HTMLElement) {
  const action = element.getAttribute(APPLIED_ACTION) || Action.HIDE;
  element.removeAttribute(APPLIED_ACTION);
  element.removeAttribute(`${PROCESSED_BY_PREFIX}${SCRIPT_NAME}`);
  const triggeringWord = element.getAttribute(TRIGGERING_WORD) || '';
  element.removeAttribute(TRIGGERING_WORD);

  inMemoryStatistics[triggeringWord] = (inMemoryStatistics[triggeringWord] || 0) - 1;

  if (action === Action.BLUR) {
    element.style.filter = element.getAttribute(`${ORIGINAL_FILTER_PREFIX}${SCRIPT_NAME}`) || '';
    element.removeAttribute(`${ORIGINAL_FILTER_PREFIX}${SCRIPT_NAME}`);
  }
  else if (action === Action.HIDE) {
    element.style.display = element.getAttribute(`${ORIGINAL_DISPLAY_PREFIX}${SCRIPT_NAME}`) || '';
    element.removeAttribute(`${ORIGINAL_DISPLAY_PREFIX}${SCRIPT_NAME}`);
  }
}



async function unprocessElements(currentWords: string[]) {
  // Function to unprocess elements based on a list of current words
  //TODO: can this be more efficient?
  const hiddenElements = document.querySelectorAll('[processed-by-' + scriptName + '="true"]');
  hiddenElements.forEach(element => {
    const triggeringWord = element.getAttribute('triggering-word') || '';
    const shouldUnhide = !currentWords.includes(triggeringWord);
    if (shouldUnhide) {
      if (element instanceof HTMLElement) {
        unprocessElement(element);
      }
    }
  });
}

async function checkAndProcessElements() {
  const isDisabled = await isCurrentSiteDisabled(context);
  if (isDisabled) {
    await unprocessElements([])//unhide all
    return;
  }
  const actionStore = new FilterActionStore();
  const action = await actionStore.get();
  // Create a TreeWalker to traverse text nodes
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
  );

  let wordsToFilter: string[] = [];
  try {
    const listsStore = new ListNamesDataStore;
    const lists = await listsStore.get();
    for (const list of lists) {
      const listStore = new WordListDataStore(list);
      const savedWords = await listStore.get();
      wordsToFilter = wordsToFilter.concat(savedWords);
    }
  } catch (e) {
    console.error("Error retrieving saved words.", e);
  }
  if(DEBUG){
    console.log('wordsToFilter:', wordsToFilter);
  }
  await unprocessElements(wordsToFilter);

  // Traverse through all text nodes
  let node = walker.nextNode();
  while (node) {
    const parentElement = node.parentElement;
    const parentTagName = parentElement ? parentElement.tagName.toLowerCase() : '';
    const ancestor = getFeedlikeAncestor(node);

    //if already processed, skip
    //TODO: is the ancestor always the same?
    //TODO: what if ancestor was processed with wrong effect?
    //TODO: now disable in to enable doesn't work
    if (ancestor instanceof HTMLElement && ancestor.getAttribute('processed-by-' + scriptName) === 'true') {
      node = walker.nextNode();
      continue;
    }

    if (node.nodeType === Node.TEXT_NODE &&
      node.textContent &&
      !['script', 'style'].includes(parentTagName)) {  // Skip script and style tags

      const filterResult = shouldFilterTextContent(node.textContent!, wordsToFilter, false);

      if (filterResult.shouldFilter && filterResult.triggeringWord) {
        if (ancestor instanceof HTMLElement) {
          await processElement(ancestor, filterResult.triggeringWord, action)
        }
      }
    }
    node = walker.nextNode();
  }//end node traversal
}

let debounceTimeout: NodeJS.Timeout;

async function debouncedCheckAndFilter() {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    checkAndProcessElements()
  }, 100);//TODO: what value should this be?
}


/*
INITIALIZE
 */
const observer = new MutationObserver(async () => {
  await debouncedCheckAndFilter();
});

observer.observe(document.body, { childList: true, subtree: true });


const listener = async (request: Message) => {
  function keyImpactsFilter(key: string) {
    if(key.startsWith(siteBlacklistKey)){
      return true;
    }
    if(key.startsWith(wordBlacklistKeyPrefix)){
      return true;
    }
    return false;
  }
  //TODO: need to make this work, not sending data to tabs rn
  if(DEBUG) {
    console.log('message received in content listener', request);
  }
  if (request.action === 'dataChanged' && keyImpactsFilter(request.key)) {
    await debouncedCheckAndFilter();
  }
};

// Add message listener
chrome.runtime.onMessage.addListener(listener);

(async () => {
  await debouncedCheckAndFilter();
})();


//statistics
async function writeInMemoryStatisticsToStorage() {
  // Go over keys
  for (const key in inMemoryStatistics) {
    if (Object.prototype.hasOwnProperty.call(inMemoryStatistics, key)) {
      const value = inMemoryStatistics[key];
      await addToWordStatistics(key, value);
    }
  }
  inMemoryStatistics = {};
}

setInterval(async () => {
  if (Object.keys(inMemoryStatistics).length > 0) {
    await writeInMemoryStatisticsToStorage();
  }
}, BATCH_STAT_UPDATE_INTERVAL);
window.addEventListener('beforeunload', async function() {
  console.log('Statistics saved at tab close.');
  await writeInMemoryStatisticsToStorage();
});
