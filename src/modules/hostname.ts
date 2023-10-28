import {DEBUG, DEFAULT_HOSTNAME_BLACKLIST, siteBlacklistKey} from "../constants";
import {DatabaseStorage} from "./datastore";
import {isStringArray} from "./typeguards";


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
  const datastore = new BlacklistDatastore();
  const blacklist = await datastore.get();
  return blacklist.includes(hostname);
}


export class BlacklistDatastore extends DatabaseStorage<string[]> {
  key = siteBlacklistKey;
  defaultValue = DEFAULT_HOSTNAME_BLACKLIST;
  isType = isStringArray;

  async addHostnameToBlacklist(hostname: string) {
    const blacklist = await this.get();
    blacklist.push(hostname);
    await this.syncedSet(blacklist);
  }

  async removeHostnameFromBlacklist(hostname: string) {
    const blacklist = await this.get();
    const index = blacklist.indexOf(hostname);
    if (index > -1) {
      blacklist.splice(index, 1);
    }
    await this.syncedSet(blacklist);
  }
}
