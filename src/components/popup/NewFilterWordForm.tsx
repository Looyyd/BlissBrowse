import React, {useState} from 'react';
import {ListNamesDataStore, FilterListDataStore} from "../../modules/wordLists";
import {
  Button,
  TextField,
  FormControl,
  FormHelperText,
  Typography,
} from '@mui/material';
import ListSelector from "../ListSelector";
import {useAlert} from "../AlertContext";


const NewFilterWordForm: React.FC = () => {
  const listNamesDataStore = new ListNamesDataStore();
  const [newWord, setNewWord] = useState<string>('');
  const [list, setList] = useState<string>('');
  const [lists] = listNamesDataStore.useData([]);
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
    await dataStore.addNonWhiteSpaceWord(newWord);

    showAlert('success', 'Word added successfully!');
  };

  return (
    <>
      <Typography variant="h6">Add Custom Word</Typography>
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

        <Button type="submit" variant="contained" color="primary" id="submitNewWordButton">
          Add Word
        </Button>
      </form>
    </>
  );
};


export default NewFilterWordForm;

