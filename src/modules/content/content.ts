import {DEBUG, ML_FEATURES} from "../../constants";
import {isCurrentSiteDisabled} from "../hostname";
import {
  filterMLElement,
  filterTextElement,
  getFilterTries,
  isElementIgnored,
  ListTriePair,
  unfilterElement,
  unfilterElementIfNotInSubjects,
  unfilterElementsIfNotInTries,
  unfilterElementsIfWrongAction
} from "./filter";
import {FilterActionStore} from "../settings";
import {getSubjects, isTextInSubject, shouldTextBeSkippedML} from "../ml/ml";
import {FilterAction} from "../types";
import {MLSubject} from "../ml/mlTypes";
import {getElementsToCheck, getElementText} from "./siteSupport";

const CONTENT_CONTEXT = "content";

export function preprocessTextBeforeEmbedding(text:string): string {
  // Convert to lowercase
  //text = text.toLowerCase();
  // Remove URLs
  text = text.replace(/https?:\/\/\S+/g, '');
  // Remove numbers
  text = text.replace(/\d+/g, '');
  // Remove punctuation (excluding apostrophes for contractions)
  //text = text.replace(/[^\w\s']|_/g, '');
  // Replace multiple whitespaces with a single space
  text = text.replace(/\s\s+/g, ' ');
  // Trim leading and trailing spaces
  text = text.trim();
  return text;
}



interface MLFilterResult {
  shouldFilter: boolean;
  subjects?: MLSubject[];
}

async function shouldTextBeFilteredML(text: string, subjects: MLSubject[]): Promise<MLFilterResult> {
  let filterSubjects: MLSubject[] = [];

  await Promise.all(subjects.map(async (subject) => {
    if (await isTextInSubject(subject, text)) {
      filterSubjects.push(subject);
    }
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
  //TODO: check if preprocessed text content has changed and unfilter if yes
  filteredElements = await unfilterElementsIfWrongAction(filterAction, filteredElements);

  const filteredTextElements = filteredElements.filter(fe => fe.type === "text") as FilteredTextElement[];
  const remainingtextElements = await unfilterElementsIfNotInTries(triesWithNames.map(twn => twn.trie), filteredTextElements);
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
//let processedElements : HTMLElement[] = [];
// try with hashes
interface ProcessedElement {
  element: HTMLElement;
  hash: number;
}
let processedElements : ProcessedElement[] = [];

export function removeElementFromCaches(element: HTMLElement) {
  console.log("removeElementFromProcessedElements");
  const index = processedElements.findIndex(pe => pe.element === element);
  if (index > -1) {
    processedElements.splice(index, 1);
  }
  const filteredElementIndex = filteredElements.findIndex(fe => fe.element === element);
  if (filteredElementIndex > -1) {
    filteredElements.splice(filteredElementIndex, 1);
  }
}

export async function checkAndFilterElementsRewrite() {
  function hashCode(s: string): number {
    return s.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
  }

  if (DEBUG) {
    console.log("checkAndFilterElementsRewrite");
  }

  const isDisabled = await isCurrentSiteDisabled(CONTENT_CONTEXT);
  const elementsToCheck = await getElementsToCheck();
  if (isDisabled) {
    await unfilterElements(filteredElements);
    filteredElements.length = 0;
    processedElements.length = 0;
    return;
  }

  const actionStore = new FilterActionStore();
  const filterAction = await actionStore.get();
  const triesWithNames = await getFilterTries();
  const subjects = await getSubjects();

  await checkAndUnfilterPreviouslyFiltered(filterAction, triesWithNames, subjects);

  const promises = elementsToCheck.map(async (element) => {
    const elementHash = hashCode(element.innerText); // Assuming 'text' property holds the content

    const processed = processedElements.find(p => p.element === element);

    if (processed) {
      if(processed.hash === elementHash){
        return; // Element is in cache and has not changed
      }
      // Element is in cache but has changed, remove from cache
      const index = processedElements.findIndex(pe => pe.element === element);
      if (index > -1) {
        processedElements.splice(index, 1);
      }
      // if filtered, unfilter
      const filteredElement = filteredElements.find(fe => fe.element === element);
      if (filteredElement) {
        await unfilterElement(filteredElement);
        const index = filteredElements.findIndex(fe => fe.element === element);
        if (index > -1) {
          filteredElements.splice(index, 1);
        }
      }
    }

    processedElements.push({element, hash: elementHash});
    if (isElementIgnored(element)) {
      return;
    }

    let textFiltered = false;
    const elementText = await getElementText(element);
    for (const {listName, trie} of triesWithNames) {
      const filterResult = trie.shouldFilterTextContent(elementText);
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
      const text = preprocessTextBeforeEmbedding(elementText);
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
