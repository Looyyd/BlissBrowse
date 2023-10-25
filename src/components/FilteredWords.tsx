// FilteredWords.tsx
import React, {useEffect, useState} from 'react';
import {getSavedWordsFromList} from "../modules/wordLists";
import { List, ListItem} from '@mui/material';
import ListItemText from '@mui/material/ListItemText';



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
    <List id={`${listName}FilteredWords`}>
      {words.map((word, index) => (
        <ListItem key={index}>
          <ListItemText primary={word} />
        </ListItem>
      ))}
    </List>
  );

};

export default FilteredWords;