import {getSavedWords, saveNewWord} from "./helpers";


document.getElementById('customWordForm')?.addEventListener('submit', async function(event) {
  event.preventDefault();

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


