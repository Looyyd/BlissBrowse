import {getSavedWords, saveNewWord} from "./helpers";
import {isDisabledOnSite, addToBlacklist, removeFromBlacklist} from "./helpers";
import {DEBUG} from "./constants";


export async function currentTabHostnamePopup(): Promise<string> {
  const queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  const [tab] = await chrome.tabs.query(queryOptions);
  const url = tab.url ?? '';
  const hostname = new URL(url).hostname;
  if(DEBUG){
    console.log('Hostname in popup:', hostname);
  }
  if (hostname.startsWith('www.')) {
    return hostname.slice(4);
  }
  return hostname
}

document.getElementById('disableButton')?.addEventListener('click', async () => {
  const hostname = await currentTabHostnamePopup();
  const isDisabled = await isDisabledOnSite(hostname);
  if (isDisabled) {
    await removeFromBlacklist(hostname);
    updateDisableButtonText(false);
  } else {
    await addToBlacklist(hostname);
    updateDisableButtonText(true);
  }
});




function updateDisableButtonText(disabled: boolean) : void {
  const btn = document.getElementById('disableButton');
  if (DEBUG) {
    console.log('Disabled:', disabled);
  }
  if(btn){
    btn.textContent = disabled ? 'Enable on This Site' : 'Disable on This Site';
  }
}



document.getElementById('customWordForm')?.addEventListener('submit', async function() {
  // Load from local storage using getSavedWords
  let userDefinedWords: string[] = [];
  try {
    userDefinedWords = await getSavedWords();
  } catch (error) {
    console.error('Error fetching saved words:', error);
    return;
  }

  const newWord = (document.getElementById('customWord') as HTMLInputElement)?.value;
  if (newWord) {
    try {
      await saveNewWord(newWord, userDefinedWords);
    } catch (error) {
      console.error('Error saving new word:', error);
    }
  }
});


async function displayFilteredWords() {
  const words = await getSavedWords()
  const ul = document.getElementById('filteredWords');

  if (ul) {
    ul.innerHTML = '';
    words.forEach((word: string) => {
      const li = document.createElement('li');
      li.textContent = word;
      ul.appendChild(li);
    });
  }
}

async function isDisabledOnSitePopup(): Promise<boolean> {
  const hostname = await currentTabHostnamePopup();
  return await isDisabledOnSite(hostname);
}


/*
INITIAL SETUP:
 */

displayFilteredWords();


(async () => {
  const isDisabled = await isDisabledOnSitePopup();
  updateDisableButtonText(isDisabled);
})();
