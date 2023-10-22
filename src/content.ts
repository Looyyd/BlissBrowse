import * as $ from 'jquery';
import {
  addWordStatistics,
  getSavedWords,
  isCurrentSiteDisabled
} from "./helpers";
import {getLists} from "./helpers";
import {DEBUG, scriptName, wordStatisticsKeyPrefix} from "./constants";

/*
some logic taken from:
https://github.com/yeahpython/filter-anything-everywhere/blob/main/extension/content.ts
 */

const min_feed_neighbors = 3;
const context = "content";

interface MyStats {
  [key: string]: number;
}

let inMemoryStatistics: MyStats = {};

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

// Update the function to return the new type
function filterTextContent(textContent: string, wordsToFilter: string[]): FilterResult {
  const cleanedTextContent = textContent.toLowerCase().trim();
  const result: FilterResult = {
    shouldFilter: false,
  };

  for (const word of wordsToFilter) {
    if (cleanedTextContent.includes(word.toLowerCase())) {
      result.shouldFilter = true;
      result.triggeringWord = word;
      return result;
    }
  }
  return result;
}


enum Action {
  BLUR = "blur",
  HIDE = "hide"
}

async function processElement(element: HTMLElement, triggeringWord: string, action: Action) {
  //TODO: hardcoded strings should be constants
  element.setAttribute('processed-by-' + scriptName, 'true');
  element.setAttribute('triggering-word', triggeringWord);
  element.setAttribute('applied-action', action);

  inMemoryStatistics[triggeringWord] = (inMemoryStatistics[triggeringWord] || 0) + 1;

  if (action === Action.BLUR) {
    const originalFilter = element.style.filter;
    element.setAttribute('original-filter-' + scriptName, originalFilter);
    element.style.filter = 'blur(8px)';
  } else if (action === Action.HIDE) {
    const originalDisplay = element.style.display;
    element.setAttribute('original-display-' + scriptName, originalDisplay);
    element.style.display = 'none';
  }
}

async function unprocessElement(element: HTMLElement) {
  const action = element.getAttribute('applied-action') || Action.HIDE;
  element.removeAttribute('processed-by' + scriptName);
  const triggeringWord = element.getAttribute('triggering-word') || '';
  element.removeAttribute('triggering-words');

  inMemoryStatistics[triggeringWord] = (inMemoryStatistics[triggeringWord] || 0) - 1;

  if (action === Action.BLUR) {
    element.style.filter = element.getAttribute('original-filter-' + scriptName) || '';
    element.removeAttribute('original-filter-' + scriptName);
  }
  else if (action === Action.HIDE) {
    element.style.display = element.getAttribute('original-display-' + scriptName) || '';
    element.removeAttribute('original-display-' + scriptName);
  }
}


async function unhideAndUnprocessElements(currentWords: string[]) {
  // Function to unhide and unprocess elements based on a list of current words
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


let debounceTimeout: NodeJS.Timeout;

async function debouncedCheckAndFilter() {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    checkAndFilterElements()
  }, 100);//TODO: what value should this be?
}



async function checkAndFilterElements() {
  const isDisabled = await isCurrentSiteDisabled(context);
  if (isDisabled) {
    await unhideAndUnprocessElements([])//unhide all
    return;
  }
  // Create a TreeWalker to traverse text nodes
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
  );

  let wordsToFilter: string[] = [];
  try {
    const lists = await getLists();
    for (const list of lists) {
      const savedWords = await getSavedWords(list);
      wordsToFilter = wordsToFilter.concat(savedWords);
    }
  } catch (e) {
    console.error("Error retrieving saved words.", e);
  }
  if(DEBUG){
    console.log('wordsToFilter:', wordsToFilter);
  }
  await unhideAndUnprocessElements(wordsToFilter);

  // Traverse through all text nodes
  let node = walker.nextNode();
  while (node) {
    const parentElement = node.parentElement;
    const parentTagName = parentElement ? parentElement.tagName.toLowerCase() : '';

    if (node.nodeType === Node.TEXT_NODE &&
      node.textContent &&
      !['script', 'style'].includes(parentTagName)) {  // Skip certain tags

      const filterResult = filterTextContent(node.textContent!, wordsToFilter);

      if (filterResult.shouldFilter && filterResult.triggeringWord) {
        const ancestor = getFeedlikeAncestor(node);
        if (ancestor instanceof HTMLElement) {
          await processElement(ancestor, filterResult.triggeringWord, Action.BLUR)
        }
      }
    }

    node = walker.nextNode();
  }//end node traversal
}


// Run the function

const observer = new MutationObserver(async () => {
  await debouncedCheckAndFilter();
});

observer.observe(document.body, { childList: true, subtree: true });

chrome.storage.onChanged.addListener(async (changes) => {
  let shouldRunDebounce = false;
  for (const key in changes) {
    if (!key.startsWith(wordStatisticsKeyPrefix)) {
      shouldRunDebounce = true;
      break;
    }
  }
  if (shouldRunDebounce) {
    await debouncedCheckAndFilter();
  }
});


//init
(async () => {
  await debouncedCheckAndFilter();
})();


//statistics

const BATCH_UPDATE_INTERVAL = 60000; // 60 seconds

async function writeInMemoryStatisticsToStorage() {
  // Go over keys
  for (const key in inMemoryStatistics) {
    if (Object.prototype.hasOwnProperty.call(inMemoryStatistics, key)) {
      const value = inMemoryStatistics[key];
      await addWordStatistics(key, value);
    }
  }
  inMemoryStatistics = {};
}

setInterval(async () => {
  if (Object.keys(inMemoryStatistics).length > 0) {
    await writeInMemoryStatisticsToStorage();
  }
}, BATCH_UPDATE_INTERVAL);
window.addEventListener('beforeunload', async function() {
  console.log('Statistics saved at tab close.');
  await writeInMemoryStatisticsToStorage();
});
