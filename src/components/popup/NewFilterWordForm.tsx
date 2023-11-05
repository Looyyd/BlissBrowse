import React, {useState} from 'react';
import {ListNamesDataStore, FilterListDataStore} from "../../modules/wordLists";
import {
  Button,
  TextField,
  FormControl,
  FormHelperText,
  Typography,
  Snackbar,
  Alert
} from '@mui/material';
import ListSelector from "../ListSelector";


const NewFilterWordForm: React.FC = () => {
  const listNamesDataStore = new ListNamesDataStore();
  const [newWord, setNewWord] = useState<string>('');
  const [list, setList] = useState<string>('');
  const [lists] = listNamesDataStore.useData([]);
  const [feedbackAlert, setFeedbackAlert] = useState<{ open: boolean; type: 'success' | 'warning'; message: string }>({
    open: false,
    type: 'success',
    message: ''
  });

  const showAlert = (type: 'success' | 'warning', message: string) => {
    setFeedbackAlert({ open: true, type, message });
  };

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setFeedbackAlert((prev) => ({ ...prev, open: false }));
  };

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
    await dataStore.addWord(newWord);

    showAlert('success', 'Word added successfully!');
  };

  return (
    <>
      <Snackbar open={feedbackAlert.open} autoHideDuration={3000} onClose={handleClose}>
        <Alert onClose={handleClose} severity={feedbackAlert.type} sx={{ width: '100%' }}>
          {feedbackAlert.message}
        </Alert>
      </Snackbar>
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

