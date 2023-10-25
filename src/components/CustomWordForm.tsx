import React, { useState, useEffect, FormEvent } from 'react';
import {getLists, getSavedWordsFromList, saveNewWordToList} from "../modules/wordLists";
import {Button, TextField, FormControl, FormHelperText, Typography} from '@mui/material';
import ListSelector from "./ListSelector";


const CustomWordForm: React.FC = () => {
  const [userDefinedWords, setUserDefinedWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState<string>('');
  const [list, setList] = useState<string>('');
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
    <>
      <Typography variant="h6">Add Custom Word</Typography>
      <form onSubmit={handleSubmit}>
        <FormControl fullWidth margin="normal">
          <TextField
            id="customWord"
            type="text"
            placeholder="Enter a list name"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            autoComplete="off"
          />
        </FormControl>

        <FormControl fullWidth margin="normal">
          <ListSelector
            lists={lists}
            onListChange={(e) => setList(e.target.value)}
            value={list}
          />
          <FormHelperText>Select a list to add the word to</FormHelperText>
        </FormControl>

        <Button type="submit" variant="contained" color="primary">
          Add Word
        </Button>
      </form>
    </>
  );
};

export default CustomWordForm;

