import * as $ from 'jquery';
import {getSavedWords, isCurrentSiteDisabled} from "./helpers";
import {scriptName} from "./constants";

/*
some logic taken from:
https://github.com/yeahpython/filter-anything-everywhere/blob/main/extension/content.ts
 */

const min_feed_neighbors = 3;
const context = "content";

function isSimilar(my_rect:DOMRect, sib_rect:DOMRect) {
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
    // three siblings is good enough to be a list.
    // I used to check whether siblings were hidden, but this caused problems
    // when there were large hidden arrays of objects, e.g. in YouTube, which would
    // cause the whole page to be hidden. This new setting hopefully is less prone
    // to hiding entire lists.
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
        // Function returns true iff sibling has a class in common with the original.
        if (sib.nodeType != Node.ELEMENT_NODE) {
          return false;
        }
        const sibRect = sib.getBoundingClientRect();

        return isSimilar(myRect, sibRect);
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
    chosen_dom_element = parents[best_index]; // Select one level below the identified ancestor
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

// Function to hide an element
function hideElement(element: HTMLElement, triggeringWord: string) {
  const originalDisplay = element.style.display;
  element.setAttribute('data-original-display-' + scriptName, originalDisplay);
  element.setAttribute('data-hidden-by-' + scriptName, 'true');
  element.setAttribute('data-processed', 'true');
  element.setAttribute('data-triggering-word', triggeringWord);
  element.style.display = 'none';
}

async function unhideAndUnprocessElements(currentWords: string[]) {
  // Function to unhide and unprocess elements based on a list of current words
  //TODO: can this be more efficient?
  const hiddenElements = document.querySelectorAll('[data-hidden-by-' + scriptName + '="true"]');
  hiddenElements.forEach(element => {
    const triggeringWord = element.getAttribute('data-triggering-word') || '';

    const shouldUnhide = !currentWords.includes(triggeringWord);

    if (shouldUnhide) {
      element.removeAttribute('data-processed');
      element.removeAttribute('data-hidden-by-' + scriptName);
      element.removeAttribute('data-triggering-words');

      (element as HTMLElement).style.display =
        element.getAttribute('data-original-display-' + scriptName) || '';

      element.removeAttribute('data-original-display-' + scriptName);
    }
  });
}


let debounceTimeout: NodeJS.Timeout;

function debouncedCheckAndFilter() {
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
    wordsToFilter = await getSavedWords();
  } catch (e) {
    console.error("Error retrieving saved words.", e);
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
          hideElement(ancestor, filterResult.triggeringWord);
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

chrome.storage.onChanged.addListener(async () => {
  await debouncedCheckAndFilter();
});

debouncedCheckAndFilter()
