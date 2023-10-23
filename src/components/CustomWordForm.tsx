import React, { useState, useEffect, FormEvent } from 'react';
import {getLists, getSavedWordsFromList, saveNewWordToList} from "../modules/wordLists";

const CustomWordForm: React.FC = () => {
  const [userDefinedWords, setUserDefinedWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState<string>('');
  const [list, setList] = useState<string>('default');
  const [lists, setLists] = useState<string[]>([]);

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const listsData = await getLists();
        setLists(listsData);
      } catch (error) {
        console.error('Error fetching lists:', error);
      }
    };

    fetchLists();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    try {
      const words = await getSavedWordsFromList(list);
      setUserDefinedWords(words);
    } catch (error) {
      console.error('Error fetching saved words:', error);
      return;
    }

    if (newWord) {
      try {
        await saveNewWordToList(newWord, userDefinedWords, list);
      } catch (error) {
        console.error('Error saving new word:', error);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="customWord">Enter a custom word:</label>
      <input
        type="text"
        id="customWord"
        placeholder="Enter a custom word"
        value={newWord}
        onChange={(e) => setNewWord(e.target.value)}
        autoComplete="off"
      />
      <label htmlFor="customWordListSelect">Select a list:</label>
      <select
        id="customWordListSelect"
        value={list}
        onChange={(e) => setList(e.target.value)}
      >
        {lists.map((listName) => (
          <option key={listName} value={listName}>
            {listName}
          </option>
        ))}
      </select>
      <button type="submit">Add Word</button>
    </form>
  );
};

export default CustomWordForm;

