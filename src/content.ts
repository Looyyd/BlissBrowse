import {
  BATCH_STAT_UPDATE_INTERVAL,
  DEBUG,
  DEBUG_PERFORMANCE,
  LIST_OF_LIST_NAMES_DATASTORE,
  LIST_SETTINGS_STORE_NAME,
  SETTINGS_STORE_NAME,
  TRIE_STORE_NAME,
} from "./constants";
import {isCurrentSiteDisabled} from "./modules/hostname";
import {FilterActionStore} from "./modules/settings";
import {getFeedlikeAncestor} from "./modules/content/elementSelection";
import {
  filterElement,
  getFilterTries,
  hasAncestorTagThatShouldBeIgnored,
  nodeHasAIgnoredParent,
  nodeHasAProcessedParent,
  unfilterElementsIfNotInList,
  unfilterElementsIfNotInTries,
  unfilterElementsIfWrongAction,
  writeInMemoryStatisticsToStorage
} from "./modules/content/filter";
import {ActionType, Message} from "./modules/types";

/*
some logic taken from:
https://github.com/yeahpython/filter-anything-everywhere/blob/main/extension/content.ts
 */


const CONTENT_CONTEXT = "content";
let timePrevious:number;


async function checkAndFilterElements() {
  if(DEBUG) {
    console.log('ENTERING checkAndFilterElements');
  }
  if(DEBUG_PERFORMANCE){
    if(timePrevious){
      console.log('time since last checkAndFilterElements', Date.now() - timePrevious);
    }
    timePrevious = Date.now();
  }
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

  const triesWithNames = await getFilterTries();
  await unfilterElementsIfNotInTries(triesWithNames.map(twn => twn.trie));
  await unfilterElementsIfWrongAction(filterAction);

  let node = walker.nextNode();
  while (node) {
    if (nodeHasAProcessedParent(node) || nodeHasAIgnoredParent(node)) {
      node = walker.nextNode();
      continue;
    }

    if (node.nodeType === Node.TEXT_NODE &&
      node.textContent &&
      !hasAncestorTagThatShouldBeIgnored(node)) {  // Skip script and style tags

      for (const { listName, trie } of triesWithNames) {
        const filterResult = trie.shouldFilterTextContent(node.textContent);
        if (filterResult.shouldFilter && filterResult.triggeringWord) {
          const ancestor = getFeedlikeAncestor(node);
          if (ancestor instanceof HTMLElement) {
            await filterElement(ancestor, filterResult.triggeringWord, listName, filterAction);
            break;
          }
        }
      }
    }
    node = walker.nextNode();
  }


  if(DEBUG_PERFORMANCE){
    console.log('time taken to checkandfilter', Date.now() - timePrevious);
  }
}


let debounceTimeout: NodeJS.Timeout;

async function debouncedCheckAndFilter() {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    checkAndFilterElements()
  }, 100);
}


/*
INITIALIZE
 */
const observer = new MutationObserver(async () => {
  await debouncedCheckAndFilter();
});

observer.observe(document.body, { childList: true, subtree: true });


const listener = async (request: Message<unknown>) => {
  //TODO: the listener could be more specific about what changed, and only refresh that.
  // for example, if the blacklist changes, only refresh if the current site was added or removed
  function dataStoreImpactsContents(dataStore: string) {
    const impactedStores = [
      SETTINGS_STORE_NAME,
      TRIE_STORE_NAME,
      LIST_OF_LIST_NAMES_DATASTORE,
      LIST_SETTINGS_STORE_NAME
    ];
    return impactedStores.includes(dataStore);
  }
  if(DEBUG) {
    console.log('message received in content listener', request);
  }
  //TODO: add e2e tests? to make sure that refreshes are happening when they should
  if (request.action === ActionType.DataChanged && dataStoreImpactsContents(request.storeName)) {
    await debouncedCheckAndFilter();
  }
};

// Add message listener
//TODO: remove listener if extension is disabled on site
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
