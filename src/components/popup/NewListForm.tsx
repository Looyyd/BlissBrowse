import React, {useState, FormEvent, SyntheticEvent} from 'react';
import {Button, TextField, FormControl, Typography, Snackbar, Alert, SnackbarCloseReason} from '@mui/material';
import {ListNamesDataStore} from "../../modules/wordLists";


const NewListForm: React.FC = () => {
  const listNamesDataStore = new ListNamesDataStore();
  const [listName, setListName] = useState<string>('');
  const [openFeedbackAlert, setOpenFeedbackAlert] = useState(false);

  const handleClose = (event: Event | SyntheticEvent<Element, Event>, reason: SnackbarCloseReason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenFeedbackAlert(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (listName) {
      try {
        await listNamesDataStore.createNewList(listName);
        setListName('');
        //TODO: add more precise feedback(list already exists, etc)
        setOpenFeedbackAlert(true);
      } catch (error) {
        console.error('Error saving new list:', error);
      }
    }
  };


  return (
    <>
      <Typography variant="h6">Create a New List</Typography>
      <Snackbar
        open={openFeedbackAlert}
        autoHideDuration={3000}
        onClose={handleClose}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          List added successfully!
        </Alert>
      </Snackbar>
      <form onSubmit={handleSubmit}>
        <FormControl fullWidth margin="normal">
          <TextField
            id="listName"
            type="text"
            placeholder="Enter a list name"
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            autoComplete="off"
          />
        </FormControl>

        <Button type="submit" variant="contained" color="primary">
          Add List
        </Button>
      </form>
    </>
  );
};

export default NewListForm;
