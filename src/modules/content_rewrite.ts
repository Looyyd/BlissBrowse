import {DEBUG, DEBUG_PERFORMANCE, ML_FEATURES} from "../constants";
import {currentTabHostname, isCurrentSiteDisabled} from "./hostname";
import {
  filterElement,
  getFilterTries, hasAncestorTagThatShouldBeIgnored, ListTriePair, nodeHasAIgnoredParent, nodeHasAProcessedParent,
  unfilterElementsIfNotInList,
  unfilterElementsIfNotInTries,
  unfilterElementsIfWrongAction
} from "./content/filter";
import {FilterActionStore} from "./settings";
import {getFeedlikeAncestor} from "./content/elementSelection";
import {shouldTextBeSkippedML} from "./ml";
import {FilterAction} from "./types";

const CONTENT_CONTEXT = "content";

async function getTwitterElementsToCheck(): Promise<HTMLElement[]> {
  // Use querySelectorAll to find all elements with the attribute 'data-testid="cellInnerDiv"'
  const elements = document.querySelectorAll('[data-testid="cellInnerDiv"]');

  // Filter out non-HTMLElement objects (if any) and return an array of HTMLElements
  return Array.from(elements).filter(e => e instanceof HTMLElement) as HTMLElement[];
}


async function getElementsToCheck(): Promise<HTMLElement[]> {
  const website = await currentTabHostname(CONTENT_CONTEXT);
  switch (website) {
    case "twitter.com":
      return await getTwitterElementsToCheck();
    default:
      return [];
  }
}

async function elementToCheckShouldBeSkipped(element: HTMLElement): Promise<boolean> {
  //TODO
  return false;
}

async function shouldTextBeFilteredML(element: HTMLElement, text: string, filterAction: FilterAction): Promise<boolean> {
  //TODO
  return false;
}

async function unfilterElements(elements: HTMLElement[]) {
  //TODO, rewrite and add a unfilter ML elements
  await unfilterElementsIfNotInList([]);
}

async function checkAndUnfilterPreviouslyFiltered(filterAction: FilterAction, triesWithNames: ListTriePair[]) {
  //TODO: unfilter ml elements
  await unfilterElementsIfNotInTries(triesWithNames.map(twn => twn.trie));
  await unfilterElementsIfWrongAction(filterAction);
}

export async function checkAndFilterElementsRewrite() {
  const isDisabled = await isCurrentSiteDisabled(CONTENT_CONTEXT);
  const elementsToCheck = await getElementsToCheck();
  if (isDisabled) {
    await unfilterElements(elementsToCheck);
    return;
  }

  const actionStore = new FilterActionStore();
  const filterAction = await actionStore.get();
  const triesWithNames = await getFilterTries();

  await checkAndUnfilterPreviouslyFiltered(filterAction, triesWithNames);

  elementsToCheck.map(async (element) => {
    let textFiltered = false;
    if (await elementToCheckShouldBeSkipped(element)) {
      return;
    }
    for (const {listName, trie} of triesWithNames) {
      const filterResult = trie.shouldFilterTextContent(element.innerText);
      if (filterResult.shouldFilter && filterResult.triggeringWord) {
        await filterElement(element, filterResult.triggeringWord, listName, filterAction);
        textFiltered = true;
        break;
      }
    }
    // Bypass ML based filtering if text filtering has occurred
    if (ML_FEATURES && !textFiltered) {
      const text = element.innerText.trim();
      if (!shouldTextBeSkippedML(text)) {
        if (await shouldTextBeFilteredML(element, text, filterAction)) {
          //TODO: filter element specialized for ML
          await filterElement(element, text, 'ML', filterAction);
        }
      }
    }
  });
}
