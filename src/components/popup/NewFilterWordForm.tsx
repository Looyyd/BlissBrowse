import React, {SyntheticEvent, useState} from 'react';
import {ListNamesDataStore, FilterListDataStore} from "../../modules/wordLists";
import {
  Button,
  TextField,
  FormControl,
  FormHelperText,
  Typography,
  Snackbar,
  SnackbarCloseReason,
  Alert
} from '@mui/material';
import ListSelector from "../ListSelector";


const NewFilterWordForm: React.FC = () => {
  const listNamesDataStore = new ListNamesDataStore();
  const [newWord, setNewWord] = useState<string>('');
  const [list, setList] = useState<string>('');
  const [lists,] = listNamesDataStore.useData([]);
  const [openFeedbackAlert, setOpenFeedbackAlert] = useState(false);

  const handleClose = (event: Event | SyntheticEvent<Element, Event>, reason: SnackbarCloseReason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenFeedbackAlert(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNewWord('');
    const dataStore = new FilterListDataStore(list);
    await dataStore.addWord(newWord);

    //TODO: add more precise feedback(word already exists, etc)
    setOpenFeedbackAlert(true);
  };

  return (
    <>
      <Snackbar
        open={openFeedbackAlert}
        autoHideDuration={3000}
        onClose={handleClose}
        >
        <Alert severity="success" sx={{ width: '100%' }}>
          Word added successfully!
        </Alert>
      </Snackbar>
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

export default NewFilterWordForm;

