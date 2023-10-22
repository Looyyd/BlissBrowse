import {createNewList, getSavedWordsFromList, removeWordFromList, saveNewWordToList} from "./modules/wordLists";
import {getLists} from "./modules/wordLists";
import {DEBUG} from "./constants";
import {
  addHostnameToBlacklist, currentTabHostname,
  isCurrentSiteDisabled,
  isHostnameDisabled,
  removeHostnameFromBlacklist
} from "./modules/hostname";

const context = "popup";


document.getElementById('disableButton')?.addEventListener('click', async () => {
  const hostname = await currentTabHostname("popup");
  const isDisabled = await isHostnameDisabled(hostname);
  if (isDisabled) {
    await removeHostnameFromBlacklist(hostname);
    updateDisableButtonText(false);
  } else {
    await addHostnameToBlacklist(hostname);
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
  const list = (document.getElementById('customWordListSelect') as HTMLInputElement)?.value ?? "default"
  let userDefinedWords: string[] = [];
  try {
    userDefinedWords = await getSavedWordsFromList(list);
  } catch (error) {
    console.error('Error fetching saved words:', error);
    return;
  }

  const newWord = (document.getElementById('customWord') as HTMLInputElement)?.value;
  if (newWord) {
    try {
      await saveNewWordToList(newWord, userDefinedWords, list);
    } catch (error) {
      console.error('Error saving new word:', error);
    }
  }
});

document.getElementById("newListForm")?.addEventListener('submit', async function() {
  const listName = (document.getElementById('listName') as HTMLInputElement)?.value;
  if (listName) {
    try {
      await createNewList(listName);
    } catch (error) {
      console.error('Error saving new list:', error);
    }
  }
});

document.getElementById('openOptionsButton')?.addEventListener('click', function() {
  //TODO: browser agnostic
  chrome.runtime.openOptionsPage();
});

async function addListToSelect(listName: string) {
  const select = document.getElementById('customWordListSelect');
  if (select) {
    const option = document.createElement('option');
    option.value = listName;
    option.text = listName;
    select.appendChild(option);
  }
}

async function removePreviousListOptions() {
  const select = document.getElementById('customWordListSelect');
  if (select) {
    select.innerHTML = '';
  }
}

async function displayListsSelect() {
  const lists = await getLists();
  await removePreviousListOptions();
  lists.forEach((listName: string) => {
    addListToSelect(listName);
  });
}

async function displayFilteredWords(listName: string) {
  const ul = document.getElementById(listName+ 'FilteredWords');

  if (ul) {
    const words = await getSavedWordsFromList(listName)
    ul.innerHTML = '';
    words.forEach((word: string) => {
      // Create list item
      const li = document.createElement('li');

      // Create text node for the word
      const text = document.createTextNode(word);
      li.appendChild(text);

      // Create delete button
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'X';
      deleteButton.className = 'delete-button';

      // Attach event listener to call the deletion function
      deleteButton.addEventListener('click', function() {
        removeWordFromList(word, listName);
        displayFilteredWords(listName);//TODO: maybe juste remove the li?
      });

      // Append delete button to list item
      li.appendChild(deleteButton);
      ul.appendChild(li);
    });
  }
}

async function displayLists() {
  if(DEBUG){
    console.log("displaying lists")
  }
  const ul = document.getElementById('listsList');

  if (ul){
    if(DEBUG){
      console.log("creating lists list")
    }
    const lists = await getLists();
    ul.innerHTML = '';
    lists.forEach((listName: string) => {
      const li = document.createElement('li');
      const text = document.createTextNode(listName);
      li.appendChild(text);
      ul.appendChild(li);

      //add filtered words
      const filteredWords = document.createElement('ul');
      filteredWords.id = listName + "FilteredWords";
      li.appendChild(filteredWords);
      displayFilteredWords(listName);
    });
  }
}


/*
INITIAL SETUP:
 */

//TODO: don't fetch lists multiple times
(async () => {
  console.log("initial setup")
  await displayLists();
  await displayListsSelect();
  const isDisabled = await isCurrentSiteDisabled(context);
  updateDisableButtonText(isDisabled);
})();

