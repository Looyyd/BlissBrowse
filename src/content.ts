import {
  BATCH_STAT_UPDATE_INTERVAL,
  DEBUG,
  DEBUG_PERFORMANCE,
  LIST_OF_LIST_NAMES_DATASTORE,
  LIST_SETTINGS_STORE_NAME,
  ML_FEATURES,
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
import {ActionType, FilterAction, Message} from "./modules/types";
import {FilterSubject, getSubjects, isTextInSubject, populateSubjectAndSave, shouldTextBeSkippedML} from "./modules/ml";

/*
some logic taken from:
https://github.com/yeahpython/filter-anything-everywhere/blob/main/extension/content.ts
 */


const CONTENT_CONTEXT = "content";
let timePrevious:number;


async function checkAndFilterElements() {
  // Collect nodes into batches
  const nodeBatch = [];
  let batchSize = 200; // Example batch size, adjust based on your needs

  if (DEBUG) {
    console.log('ENTERING checkAndFilterElements');
  }
  if (DEBUG_PERFORMANCE) {
    if (timePrevious) {
      console.log('time since last checkAndFilterElements', Date.now() - timePrevious);
    }
    timePrevious = Date.now();
  }

  const isDisabled = await isCurrentSiteDisabled(CONTENT_CONTEXT);
  if (isDisabled) {
    //TODO: unfilter ml elements
    await unfilterElementsIfNotInList([]);  // Unhide all//TODO: rename to unfilterALL
    return;
  }

  const actionStore = new FilterActionStore();
  const filterAction = await actionStore.get();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
  const triesWithNames = await getFilterTries();
  //TODO: unfilter ml elements
  await unfilterElementsIfNotInTries(triesWithNames.map(twn => twn.trie));
  await unfilterElementsIfWrongAction(filterAction);


  let node = walker.nextNode();
  while (node) {
    let textFiltered = false;

    if (nodeHasAProcessedParent(node) || nodeHasAIgnoredParent(node) || node.nodeType !== Node.TEXT_NODE || !node.textContent || hasAncestorTagThatShouldBeIgnored(node)) {
      node = walker.nextNode();
      continue;
    }

    // Text based filtering
    for (const { listName, trie } of triesWithNames) {
      const filterResult = trie.shouldFilterTextContent(node.textContent);
      if (filterResult.shouldFilter && filterResult.triggeringWord) {
        const ancestor = getFeedlikeAncestor(node);
        if (ancestor instanceof HTMLElement) {
          await filterElement(ancestor, filterResult.triggeringWord, listName, filterAction);
          textFiltered = true;
          break;
        }
      }
    }

    // Bypass ML based filtering if text filtering has occurred
    if (ML_FEATURES && !textFiltered) {
      const text = node.textContent.trim();
        if (!shouldTextBeSkippedML(text)) {
          nodeBatch.push(node);
          if (nodeBatch.length >= batchSize) {
            // Process batch in parallel
            await processNodeBatch(nodeBatch);
            nodeBatch.length = 0; // Clear the batch after processing
          }
        }
      }


    /*
  const text = node.textContent.trim();
  if (!shouldTextBeSkippedML(text)) {
    //const subjects = await getSubjects();// we fetch here because subjects could be populated, so want to get the latest
    nodeBatch.push(node);
    if (nodeBatch.length >= batchSize) {
      // Process batch in parallel
      await processNodeBatch(nodeBatch);
      nodeBatch.length = 0; // Clear the batch after processing
    }
     */

        /*
        for(const subject of subjects){
          const modelPrediction = await isTextInSubject(subject, node.textContent);
          if (modelPrediction) {
            const ancestor = getFeedlikeAncestor(node);
            if (ancestor instanceof HTMLElement) {
              //TODO: filter element specialized for ML
              await filterElement(ancestor, subject.description, 'ML', filterAction);
            }
          }
        }
         */

    node = walker.nextNode();
  }

  // Process any remaining nodes
  if (nodeBatch.length > 0) {
    await processNodeBatch(nodeBatch);
  }

  if (DEBUG_PERFORMANCE) {
    console.log('time taken to checkandfilter', Date.now() - timePrevious);
  }
}

/*
async function processAncestorBatch(ancestors: HTMLElement[]){
  // Create a Promise for each node processing
  const actionStore = new FilterActionStore();
  const filterAction = await actionStore.get();
  const subjects = await getSubjects();
  const populatedSubjectsPromises = subjects.map(subject => populateSubjectAndSave(subject));
  const populatedSubjects = await Promise.all(populatedSubjectsPromises);

  const processingPromises =
    ancestors.map(ancestor => processSingleAncestor(ancestor, populatedSubjects, filterAction));

  // Wait for all nodes in the batch to be processed in parallel
  await Promise.all(processingPromises);
}
*/

async function processNodeBatch(nodes: Node[]) {
  // Create a Promise for each node processing
  const actionStore = new FilterActionStore();
  const filterAction = await actionStore.get();
  const subjects = await getSubjects();
  const populatedSubjectsPromises = subjects.map(subject => populateSubjectAndSave(subject));
  const populatedSubjects = await Promise.all(populatedSubjectsPromises);

  const processingPromises =
    nodes.map(node => processSingleNode(node, populatedSubjects, filterAction));

  // Wait for all nodes in the batch to be processed in parallel
  await Promise.all(processingPromises);
}

async function processSingleAncestor(ancestor: HTMLElement, subjects: FilterSubject[], filterAction:FilterAction) {
  const text = ancestor.innerText.trim();
  const modelPredictions = await Promise.all(
    subjects.map(subject => isTextInSubject(subject, text))
  );

  modelPredictions.forEach(async (modelPrediction, index) => {
    if (modelPrediction) {
      const subject = subjects[index];
      if (ancestor instanceof HTMLElement) {
        //TODO: filter element specialized for ML
        //TODO: can't filter in batches,
        await filterElement(ancestor, subject.description, 'ML', filterAction);
      }
    }
  });
}

async function processSingleNode(node: Node, subjects: FilterSubject[], filterAction:FilterAction) {
  if (node.textContent === null) {
    return
  }
  const text = node.textContent.trim();

  const modelPredictions = await Promise.all(
    subjects.map(subject => isTextInSubject(subject, text))
  );

  modelPredictions.forEach(async (modelPrediction, index) => {
    if (modelPrediction) {
      const subject = subjects[index];
      const ancestor = getFeedlikeAncestor(node);
      if (ancestor instanceof HTMLElement) {

        //TODO: filter element specialized for ML
        //TODO: can't filter in batches,
        // too likely to have issues if elements are done in parralel, or need to change logic
        await filterElement(ancestor, subject.description, 'ML', filterAction);
      }
    }
  });
}



let debounceTimeout: NodeJS.Timeout;

async function debouncedCheckAndFilter() {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    checkAndFilterElements()
  }, 1000);
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
