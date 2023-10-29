import {BATCH_STAT_UPDATE_INTERVAL, BLACKLISTED_WEBSITES_KEY_PREFIX, DEBUG, FILTER_LIST_KEY_PREFIX,} from "./constants";
import {isCurrentSiteDisabled} from "./modules/hostname";
import {FilterActionStore} from "./modules/settings";
import {getFeedlikeAncestor} from "./modules/content/elementSelection";
import {
  filterElement,
  getFilterWords,
  hasScriptOrStyleAncestor,
  nodeHasAProcessedParent,
  shouldFilterTextContent,
  unfilterElementsIfNotInList,
  unfilterElementsIfWrongAction,
  writeInMemoryStatisticsToStorage
} from "./modules/content/filter";

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


const CONTENT_CONTEXT = "content";

async function checkAndFilterElements() {
  const isDisabled = await isCurrentSiteDisabled(CONTENT_CONTEXT);
  if (isDisabled) {
    await unfilterElementsIfNotInList([]);  // Unhide all
    return;
  }

  const actionStore = new FilterActionStore();
  const filterAction = await actionStore.get();
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
  );

  const filterWords = await getFilterWords();
  await unfilterElementsIfNotInList(filterWords);
  await unfilterElementsIfWrongAction(filterAction);

  let node = walker.nextNode();
  while (node) {
    if (nodeHasAProcessedParent(node)) {
      node = walker.nextNode();
      continue;
    }

    if (node.nodeType === Node.TEXT_NODE &&
        node.textContent &&
        !hasScriptOrStyleAncestor(node)) {  // Skip script and style tags
      const ancestor = getFeedlikeAncestor(node);
      const filterResult = shouldFilterTextContent(node.textContent!, filterWords, false);

      if (filterResult.shouldFilter && filterResult.triggeringWord) {
        if (ancestor instanceof HTMLElement) {
          await filterElement(ancestor, filterResult.triggeringWord, filterAction);
        }
      }
    }
    node = walker.nextNode();
  }
}


let debounceTimeout: NodeJS.Timeout;

async function debouncedCheckAndFilter() {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    checkAndFilterElements()
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
    if(key.startsWith(BLACKLISTED_WEBSITES_KEY_PREFIX)){
      return true;
    }
    if(key.startsWith(FILTER_LIST_KEY_PREFIX)){
      return true;
    }
    return false;
  }
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


setInterval(async () => {
    await writeInMemoryStatisticsToStorage();
}, BATCH_STAT_UPDATE_INTERVAL);
window.addEventListener('beforeunload', async function() {
  await writeInMemoryStatisticsToStorage();
});
