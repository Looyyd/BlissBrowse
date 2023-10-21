import {getSavedWords, isCurrentSiteDisabled, saveNewWord} from "./helpers";
import {isHostnameDisabled, addToBlacklist, removeFromBlacklist} from "./helpers";
import {currentTabHostname} from "./helpers";
import {DEBUG} from "./constants";

const context = "popup";


document.getElementById('disableButton')?.addEventListener('click', async () => {
  const hostname = await currentTabHostname("popup");
  const isDisabled = await isHostnameDisabled(hostname);
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



/*
INITIAL SETUP:
 */

displayFilteredWords();


(async () => {
  const isDisabled = await isCurrentSiteDisabled(context);
  updateDisableButtonText(isDisabled);
})();
