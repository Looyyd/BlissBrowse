import React, {useEffect, useState} from 'react';
import {getLists, getSavedWordsFromList, saveList} from "../modules/wordLists";


const WordlistsContent = () => {
  const [lists, setLists] = useState<string[]>([]);
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [words, setWords] = useState<string[]>([]);
  const [textAreaValue, setTextAreaValue] = useState<string>("");

  const setNewList = async (list: string) => {
    setSelectedList(list);
    const fetchedWords = await getSavedWordsFromList(list);
    setWords(fetchedWords);
    setTextAreaValue(fetchedWords.join('\n'));
  }

  useEffect(() => {
    async function fetchData() {
      const lists = await getLists();
      setLists(lists);
      if (lists.length > 0) {
        await setNewList(lists[0]);
      }
    }
    fetchData();
  }, []);

  const handleListChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const list = event.target.value;
    await setNewList(list);
  };

  const handleTextAreaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextAreaValue(event.target.value);
  };

  const saveWords = () => {
    const newWords = textAreaValue.split('\n');
    const list = selectedList;
    if (!list) return;
    saveList(newWords, list);
  };

  return (
    <div>
      <select
        id="wordlist"
        onChange={handleListChange}
      >
        {lists.map((list) => (
          <option key={list} value={list}>{list}</option>
        ))}
      </select>
      <textarea
        value={textAreaValue}
        onChange={handleTextAreaChange}
        rows={10}
        cols={30}
      />
      <button onClick={saveWords}>Save</button>
    </div>
  );
};



export default WordlistsContent;

