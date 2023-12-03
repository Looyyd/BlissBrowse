import {DEBUG, ML_FEATURES} from "../constants";
import {currentTabHostname, isCurrentSiteDisabled} from "./hostname";
import {
  filterMLElement, filterTextElement,
  getFilterTries,
  isElementIgnored,
  ListTriePair,
  unfilterElement, unfilterElementIfNotInSubjects,
  unfilterElementsIfNotInTries,
  unfilterElementsIfWrongAction
} from "./content/filter";
import {FilterActionStore} from "./settings";
import {getSubjects, isTextInSubject, MLSubject, shouldTextBeSkippedML} from "./ml";
import {FilterAction} from "./types";

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



async function getTwitterElementsToCheck(): Promise<HTMLElement[]> {
  // Use querySelectorAll to find all elements with the attribute 'data-testid="cellInnerDiv"'
  const elements = document.querySelectorAll('[data-testid="cellInnerDiv"]');

  // Filter out non-HTMLElement objects (if any) and return an array of HTMLElements
  return Array.from(elements).filter(e => e instanceof HTMLElement) as HTMLElement[];
}

async function getYoutubeElementsToCheck(): Promise<HTMLElement[]> {
  const homePageVideos = document.querySelectorAll("#content.ytd-rich-item-renderer");
  const elementsSearchReels = document.querySelectorAll("ytd-reel-item-renderer");
  const elementsSearchVideos = document.querySelectorAll("ytd-video-renderer");
  const elements = [...Array.from(homePageVideos), ...Array.from(elementsSearchReels), ...Array.from(elementsSearchVideos)];
  return Array.from(elements).filter(e => e instanceof HTMLElement) as HTMLElement[];
}

async function getRedditElementsToCheck(): Promise<HTMLElement[]> {
  //TODO: seems like it doesn't work anymore
  const feedPosts= document.querySelectorAll("shreddit-post");
  const faceplatePosts =  document.querySelectorAll("faceplate-tracker");
  const elements = [...Array.from(feedPosts), ...Array.from(faceplatePosts)];
  return Array.from(elements).filter(e => e instanceof HTMLElement) as HTMLElement[];
}

async function getHackerNewsElementsToCheck(): Promise<HTMLElement[]> {
  const elements = document.querySelectorAll(".athing");
  return Array.from(elements).filter(e => e instanceof HTMLElement) as HTMLElement[];
}

async function getTiktokElementsToCheck(): Promise<HTMLElement[]> {
  const elements = document.querySelectorAll('[data-e2e="recommend-list-item-container"]');
  return Array.from(elements).filter(e => e instanceof HTMLElement) as HTMLElement[];
}

//TODO: language detection, only support english for now, for ml features
async function getElementsToCheck(): Promise<HTMLElement[]> {
  const website = await currentTabHostname(CONTENT_CONTEXT);
  switch (website) {
    case "twitter.com":
      return await getTwitterElementsToCheck();
    case "youtube.com":
      return await getYoutubeElementsToCheck();
    case "reddit.com":
      return await getRedditElementsToCheck();
    case "news.ycombinator.com":
      return await getHackerNewsElementsToCheck();
    case "tiktok.com":
      return await getTiktokElementsToCheck();
    default:
      return [];
  }
}

async function getTwitterElementText(element: HTMLElement): Promise<string> {
  // tweetText is the first element with the attribute 'data-testid="tweetText"'
  const tweetText = element.querySelector('[data-testid="tweetText"]');
  // If tweetText is null, return an empty string
  if (!tweetText || !(tweetText instanceof HTMLElement)){
    return "";
  }
  // Return the text of tweetText
  return tweetText.innerText;
}


async function getElementText(element: HTMLElement): Promise<string> {
  const website = await currentTabHostname(CONTENT_CONTEXT);
  let text: string;

  switch (website) {
    case "twitter.com":
      text = await getTwitterElementText(element);
      break;
    default:
      // Using innerText by default; change to innerHTML if needed
      text = element.innerText;
      break;
  }
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
let processedElements : HTMLElement[] = [];

export function removeElementFromCaches(element: HTMLElement) {
  console.log("removeElementFromProcessedElements");
  const index = processedElements.indexOf(element);
  if (index > -1) {
    processedElements.splice(index, 1);
  }
  const filteredElementIndex = filteredElements.findIndex(fe => fe.element === element);
  if (filteredElementIndex > -1) {
    filteredElements.splice(filteredElementIndex, 1);
  }
}

export async function checkAndFilterElementsRewrite() {
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
    if(processedElements.includes(element)){
      return;
    }
    processedElements.push(element);
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
