import {getStorageKey, setStorageKey} from "./storage";
import {DEBUG} from "../constants";

const siteBlacklistKey = 'blacklist';

export async function currentTabHostname(context: "popup" | "content"): Promise<string> {
  let hostname;

  if (context === "popup") {
    const queryOptions = {active: true, lastFocusedWindow: true};
    const [tab] = await chrome.tabs.query(queryOptions);
    const url = tab?.url ?? '';
    hostname = new URL(url).hostname;
  } else if (context === "content") {
    hostname = window.location.hostname;
  } else {
    throw new Error("Invalid context specified");
  }

  if (DEBUG) {
    console.log(`Hostname in ${context}:`, hostname);
  }

  if (hostname.startsWith('www.')) {
    return hostname.slice(4);
  }

  return hostname;
}

export async function isCurrentSiteDisabled(context: "popup" | "content"): Promise<boolean> {
  const hostname = await currentTabHostname(context);
  return isHostnameDisabled(hostname);
}

export async function isHostnameDisabled(hostname: string): Promise<boolean> {
  const blacklist = await getHostnameBlacklist();
  return blacklist.includes(hostname);
}

export async function getHostnameBlacklist(): Promise<string[]> {
  return getStorageKey(siteBlacklistKey);
}

async function setHostnameBlacklist(blacklist: string[]) {
  await setStorageKey(siteBlacklistKey, blacklist);
}

export async function addHostnameToBlacklist(hostname: string) {
  const blacklist = await getHostnameBlacklist();
  blacklist.push(hostname);
  await setHostnameBlacklist(blacklist);
}

export async function removeHostnameFromBlacklist(hostname: string) {
  const blacklist = await getHostnameBlacklist();
  const index = blacklist.indexOf(hostname);
  if (index > -1) {
    blacklist.splice(index, 1);
  }
  await setHostnameBlacklist(blacklist);
}