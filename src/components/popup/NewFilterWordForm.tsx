import React, {useState} from 'react';
import {
  Button,
  TextField,
  FormControl,
  FormHelperText,
  Typography,
} from '@mui/material';
import ListSelector from "../ListSelector";
import {useAlert} from "../AlertContext";
import {Add} from "@mui/icons-material";
import {useDataStore} from "../DataStoreContext";
import {FilterListDataStore} from "../../modules/wordLists";
import {useDataFromStore} from "../../modules/datastore";


/* A form to add a new word to a list. */
const NewFilterWordForm: React.FC = () => {
  const { listNamesDataStore } = useDataStore();
  const [newWord, setNewWord] = useState<string>('');
  const [list, setList] = useState<string>('');
  const [lists] = useDataFromStore(listNamesDataStore);
  const { showAlert } = useAlert();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newWord.trim()) {
      showAlert('warning', 'Please enter a word to filter');
      return;
    }
    if (!list) {
      showAlert('warning', 'Please select a list to add the word to');
      return;
    }

    setNewWord('');
    const dataStore = new FilterListDataStore(list);
    try {
      await dataStore.addWord(newWord);
      showAlert('success', 'Word added successfully!');
    } catch (e) {
      console.error('Error adding word:', e);
      showAlert('error', 'An error occurred while adding the word');
    }
  };

  return (
    <>
      <Typography variant="h6">Add a filter word</Typography>
      <form onSubmit={handleSubmit}>
        <FormControl fullWidth margin="normal">
          <TextField
            id="addWordTextInput"
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

        <Button type="submit" variant="contained" color="primary" id="submitNewWordButton" startIcon={<Add/>}>
          Add Word
        </Button>
      </form>
    </>
  );
};


export default NewFilterWordForm;

