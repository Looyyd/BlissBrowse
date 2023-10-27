import $ from 'jquery';
import {
  addToWordStatistics,
  getSavedWordsFromList, ListNamesDataStore
} from "./modules/wordLists";
import {
  DEBUG,
  scriptName,
  wordStatisticsKeyPrefix,
  BATCH_STAT_UPDATE_INTERVAL,
} from "./constants";
import {isCurrentSiteDisabled} from "./modules/hostname";
import {Action} from "./modules/types";
import {FilterActionStore} from "./modules/settings";

/*
some logic taken from:
https://github.com/yeahpython/filter-anything-everywhere/blob/main/extension/content.ts
 */

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
      const savedWords = await getSavedWordsFromList(list);
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

    if (node.nodeType === Node.TEXT_NODE &&
      node.textContent &&
      !['script', 'style'].includes(parentTagName)) {  // Skip script and style tags

      const filterResult = shouldFilterTextContent(node.textContent!, wordsToFilter, false);

      if (filterResult.shouldFilter && filterResult.triggeringWord) {
        const ancestor = getFeedlikeAncestor(node);
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

//TODO: change now that indexedDB is used
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
