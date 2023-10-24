import React, {useEffect, useState} from 'react';
import {getLists, getSavedWordsFromList} from "../modules/wordLists";


const WordlistsContent = () => {
  const [lists, setLists] = useState<string[]>([]);
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [words, setWords] = useState<string[]>([]);

  const setNewList = async (list: string) => {
    setSelectedList(list);
    const fetchedWords = await getSavedWordsFromList(list);
    setWords(fetchedWords);
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
      { words.map((word) => (
        <div key={word}>{word}</div>
      ))}
    </div>
  );
};


export default WordlistsContent;

