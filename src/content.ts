import * as $ from 'jquery';
import {getSavedWords} from "./helpers";

/*
some logic taken from:
https://github.com/yeahpython/filter-anything-everywhere/blob/main/extension/content.ts
 */

const min_feed_neighbors = 3;

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

function getFeedlikeAncestor(node:Node) {
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
  return $(chosen_dom_element);
}



function filterTextContent(textContent: string, wordsToFilter: string[]): boolean {
  const cleanedTextContent = textContent.toLowerCase().trim();
  if (cleanedTextContent === "") {
    return false;
  }

  for (const word of wordsToFilter) {
    if (cleanedTextContent.includes(word.toLowerCase())) {
      return true; // Word found, the element should be filtered
    }
  }

  return false; // No words found, element should not be filtered
}





async function checkAndFilterElements() {
  // Create a TreeWalker to traverse text nodes
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
  );

  let wordsToFilter: string[] = [];

  try {
    const savedWords = await getSavedWords();  // Using await to get the saved words

    if (!Array.isArray(savedWords) || !savedWords.every(() => true)) {
      console.error("Invalid format for saved words. Must be an array of strings.");
      return;
    }

    wordsToFilter = savedWords;  // You can now use the savedWords as you need

  } catch (e) {
    console.error("Error retrieving saved words.", e);
  }


  if (process.env.NODE_ENV === 'development') {
    // Sample array of words to filter
    const devWords: string[] = ["c++", "requiem", "elon musk"];
    wordsToFilter = wordsToFilter.concat(devWords)
  }


  // Traverse through all text nodes
  let node = walker.nextNode();
  while (node) {
    const parentElement = node.parentElement;
    const parentTagName = parentElement ? parentElement.tagName.toLowerCase() : '';

    if (node.nodeType === Node.TEXT_NODE &&
      node.textContent &&
      !['script', 'style'].includes(parentTagName)) {  // Skip certain tags
      if (filterTextContent(node.textContent, wordsToFilter)) {
        console.log(`Target text: ${node.textContent.substring(0, 100)}`);


        // Find the feed-like ancestor of the parent element
        const ancestor = getFeedlikeAncestor(node);

        // Hide the ancestor
        if (ancestor[0] instanceof HTMLElement) {
          console.log(`Hidden ancestor: ${ancestor[0].tagName} - Text: ${ancestor[0].textContent?.substring(0, 100)}`);
          ancestor[0].style.display = "none";
        }

      }
    }

    node = walker.nextNode();
  }
}

// Run the function
checkAndFilterElements();

const observer = new MutationObserver(async () => {
  await checkAndFilterElements();
});

observer.observe(document.body, { childList: true, subtree: true });

chrome.storage.onChanged.addListener(checkAndFilterElements);

