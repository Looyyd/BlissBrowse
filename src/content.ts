import {
  BATCH_STAT_UPDATE_INTERVAL,
  DEBUG,
  LIST_OF_LIST_NAMES_DATASTORE,
  LIST_SETTINGS_STORE_NAME,
  SETTINGS_STORE_NAME, SUBJECTS_STORE_NAME,
  TRIE_STORE_NAME,
} from "./constants";
import {
  writeInMemoryStatisticsToStorage
} from "./modules/content/filter";
import {ActionType, Message} from "./modules/types";
import {checkAndFilterElements} from "./modules/content/content";
import {supportedWebsites} from "./modules/content/siteSupport";



let debounceTimeout: NodeJS.Timeout;

async function debouncedCheckAndFilter() {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    //checkAndFilterElements()
    checkAndFilterElements();
  }, 100);
}


/*
INITIALIZE
 */
const hostname =  window.location.hostname;

if(supportedWebsites.includes(hostname)){

  const observer = new MutationObserver(async () => {
    console.log('mutation observer called');
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
        LIST_SETTINGS_STORE_NAME,
        SUBJECTS_STORE_NAME
      ];
      return impactedStores.includes(dataStore);
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
}


