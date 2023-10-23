// FilteredWords.tsx
import React, {useEffect, useState} from 'react';
import {getSavedWordsFromList} from "../modules/wordLists";

interface FilteredWordsProps {
  listName: string,
}

const FilteredWords: React.FC<FilteredWordsProps> = ({listName}) => {
  const [words, setWords] = useState<string[]>([]);
  // Fetch filtered words here or use passed data.
  useEffect(() => {
    const fetchData = async () => {

      const fetchedWords = await getSavedWordsFromList(listName)
      setWords(fetchedWords);
    };
    fetchData();
  }, []);

  return (
    <ul id={`${listName}FilteredWords`}>
      {words.map((word, index) => (
        <li key={index}>{word}</li>
      ))}
    </ul>
  );
};

export default FilteredWords;