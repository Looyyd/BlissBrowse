import {currentTabHostname} from "../hostname";

const CONTENT_CONTEXT = "content";

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
  const feedPosts = document.querySelectorAll("shreddit-post");
  const faceplatePosts = document.querySelectorAll("faceplate-tracker");
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

export const supportedWebsites = [
  "twitter.com",
  "youtube.com",
  "reddit.com",
  "news.ycombinator.com",
  "tiktok.com"
].sort();

//TODO: language detection, only support english for now, for ml features
export async function getElementsToCheck(): Promise<HTMLElement[]> {
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
  // tweetText is all the elements with the attribute 'data-testid="tweetText"' (includes quoted tweets)
  const tweetTexts = element.querySelectorAll('[data-testid="tweetText"]');
  //concateneate all tweetTexts
  let tweetText = "";
  tweetTexts.forEach(t => {
    if(!t || !(t instanceof HTMLElement)){
      return;
    }
    tweetText += t.innerText;
  });
  // Return the text of tweetText
  return tweetText;
}

export async function getElementText(element: HTMLElement): Promise<string> {
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