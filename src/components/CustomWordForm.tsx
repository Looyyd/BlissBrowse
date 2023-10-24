import React, { useState, useEffect, FormEvent } from 'react';
import {getLists, getSavedWordsFromList, saveNewWordToList} from "../modules/wordLists";
import { Button, TextField, FormControl, InputLabel, Select, MenuItem, FormHelperText } from '@mui/material';


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
      <FormControl fullWidth margin="normal">
        <InputLabel htmlFor="customWord">Enter a custom word:</InputLabel>
        <TextField
          id="customWord"
          type="text"
          value={newWord}
          onChange={(e) => setNewWord(e.target.value)}
          autoComplete="off"
        />
      </FormControl>

      <FormControl fullWidth margin="normal">
        <InputLabel id="customWordListSelect-label">Select a list:</InputLabel>
        <Select
          labelId="customWordListSelect-label"
          id="customWordListSelect"
          value={list}
          onChange={(e) => setList(e.target.value)}
        >
          {lists.map((listName) => (
            <MenuItem key={listName} value={listName}>
              {listName}
            </MenuItem>
          ))}
        </Select>
        <FormHelperText>Select a list to add the word to</FormHelperText>
      </FormControl>

      <Button type="submit" variant="contained" color="primary">
        Add Word
      </Button>
    </form>
  );
};

export default CustomWordForm;

