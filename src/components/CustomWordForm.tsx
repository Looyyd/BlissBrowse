import React, { useState } from 'react';
import {ListNamesDataStore, WordListDataStore} from "../modules/wordLists";
import {Button, TextField, FormControl, FormHelperText, Typography} from '@mui/material';
import ListSelector from "./ListSelector";


const CustomWordForm: React.FC = () => {
  const listNamesDataStore = new ListNamesDataStore();
  const [newWord, setNewWord] = useState<string>('');
  const [list, setList] = useState<string>('');
  const [lists,] = listNamesDataStore.useData([]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    //TODO: feedback to user
    const dataStore = new WordListDataStore(list);
    await dataStore.addWord(newWord);
  };

  return (
    <>
      <Typography variant="h6">Add Custom Word</Typography>
      <form onSubmit={handleSubmit}>
        <FormControl fullWidth margin="normal">
          <TextField
            id="customWord"
            type="text"
            placeholder="Enter a word to filter"
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

