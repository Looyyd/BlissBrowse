import {createNewList} from "./modules/wordLists";

//TODO: browser agnostic
chrome.runtime.onInstalled.addListener(async function(details) {
  if (details.reason === 'install') {
    // This block will run when the extension is first installed
    await createNewList('default');
  } else if (details.reason === 'update') {
    // This block will run when the extension is updated
    // You can also set or update storage values here
  }
});
