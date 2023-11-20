import {DEBUG, ML_FEATURES} from "../constants";
import {currentTabHostname, isCurrentSiteDisabled} from "./hostname";
import {
  filterMLElement, filterTextElement,
  getFilterTries,
  isElementIgnored, isElementProcessed,
  ListTriePair,
  unfilterElement, unfilterElementIfNotInSubjects,
  unfilterElementsIfNotInTries,
  unfilterElementsIfWrongAction
} from "./content/filter";
import {FilterActionStore} from "./settings";
import {getSubjects, isTextInSubject, MLSubject, shouldTextBeSkippedML} from "./ml";
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
 if ( isElementIgnored(element) ) {
   return true;
 }
 if (isElementProcessed(element)) {
    return true;
 }
  return false;
}

interface MLFilterResult {
  shouldFilter: boolean;
  subjects?: MLSubject[];
}

async function shouldTextBeFilteredML(text: string, subjects: MLSubject[]): Promise<MLFilterResult> {
  let filterSubjects : MLSubject[] = [];
  const results = await Promise.all(subjects.map(async (subject, index) => {
    const res = await isTextInSubject(subject, text);
    if (res) {
      filterSubjects.push(subjects[index]);
    }
    return res;
  }));

  return {
    shouldFilter: filterSubjects.length > 0,
    subjects: filterSubjects.length > 0 ? filterSubjects : undefined
  };
}





async function unfilterElements(elements: FilteredElement[]) {
  elements.map(async (element) => {
    await unfilterElement(element);
  });
}

async function checkAndUnfilterPreviouslyFiltered(filterAction: FilterAction, triesWithNames: ListTriePair[], subjects:MLSubject[]) {
  filteredElements = await unfilterElementsIfWrongAction(filterAction, filteredElements);

  const filteredTextElements = filteredElements.filter(fe => fe.type === "text") as FilteredTextElement[];
  const remainingtextElements = await unfilterElementsIfNotInTries(triesWithNames.map(twn => twn.trie), filteredTextElements);
  //TODO: unfilter ml elements
  const filteredMLElements = filteredElements.filter(fe => fe.type === "ml") as FilteredMLElement[];
  const remainingMLElements = await unfilterElementIfNotInSubjects(subjects, filteredMLElements);

  filteredElements = [...remainingtextElements, ...remainingMLElements];
}


export interface FilteredElement {
  element: HTMLElement;
  type: "text" | "ml";
  filterAction: FilterAction;
  originalAttribueValue?: string;
}

export interface FilteredTextElement extends FilteredElement {
  type: "text";
  triggeringWord: string;
  listName: string;
}

export interface FilteredMLElement extends FilteredElement {
  type: "ml";
  subject_description: string;
}


let filteredElements : FilteredElement[] = [];

export async function checkAndFilterElementsRewrite() {
  if (DEBUG) {
    console.log("checkAndFilterElementsRewrite");
  }

  const isDisabled = await isCurrentSiteDisabled(CONTENT_CONTEXT);
  const elementsToCheck = await getElementsToCheck();
  if (isDisabled) {
    await unfilterElements(filteredElements);
    filteredElements.length = 0;
    return;
  }

  const actionStore = new FilterActionStore();
  const filterAction = await actionStore.get();
  const triesWithNames = await getFilterTries();
  const subjects = await getSubjects();

  await checkAndUnfilterPreviouslyFiltered(filterAction, triesWithNames, subjects);

  const promises = elementsToCheck.map(async (element) => {
    let textFiltered = false;
    if (await elementToCheckShouldBeSkipped(element)) {
      return;
    }
    for (const {listName, trie} of triesWithNames) {
      const filterResult = trie.shouldFilterTextContent(element.innerText);
      if (filterResult.shouldFilter && filterResult.triggeringWord) {
        let filteredTextElement: FilteredTextElement = {
          element: element,
          type: "text",
          triggeringWord: filterResult.triggeringWord,
          listName: listName,
          filterAction: filterAction
        };
        filteredTextElement = await filterTextElement(filteredTextElement);
        filteredElements.push(filteredTextElement);
        textFiltered = true;
        break;
      }
    }
    // Bypass ML based filtering if text filtering has occurred
    if (ML_FEATURES && !textFiltered) {
      const text = element.innerText.trim();
      if (!shouldTextBeSkippedML(text)) {
        const filterResult = await shouldTextBeFilteredML(text, subjects);
        if (filterResult.shouldFilter && filterResult.subjects && filterResult.subjects.length > 0) {
          const filteredMLElement: FilteredMLElement = {
            element: element,
            type: "ml",
            subject_description: filterResult.subjects[0].description,//TODO: implement multiple subjects
            filterAction: filterAction
          };
          await filterMLElement(filteredMLElement)
          filteredElements.push(filteredMLElement);
        }
      }
    }
  });

  await Promise.all(promises);
}