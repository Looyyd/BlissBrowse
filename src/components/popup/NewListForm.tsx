import React, {useState, FormEvent} from 'react';
import {Button, TextField, FormControl, Typography} from '@mui/material';
import {useAlert} from "../AlertContext";
import {Add} from "@mui/icons-material";
import {useDataStore} from "../DataStoreContext";


const NewListForm: React.FC = () => {
  const { listNamesDataStore } = useDataStore();
  const [listName, setListName] = useState<string>('');
  const { showAlert } = useAlert();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!listName.trim()) {
      showAlert('warning', 'Please enter a list name');
      return;
    }

    try {
      await listNamesDataStore.createNewList(listName);
      setListName('');
      //TODO: add more precise feedback(list already exists, etc)
      showAlert('success', 'List created successfully!');
    } catch (error) {
      console.error('Error saving new list:', error);
      showAlert('error', 'Error saving new list');
    }
  };


  return (
    <>
      <Typography variant="h5">Create a new list</Typography>
      <form onSubmit={handleSubmit}>
        <FormControl fullWidth margin="normal">
          <TextField
            id="listNameInputField"
            type="text"
            placeholder="Enter a list name"
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            autoComplete="off"
          />
        </FormControl>

        <Button type="submit" variant="contained" color="primary" id="newListSubmit" startIcon={<Add/>}>
          Add List
        </Button>
      </form>
    </>
  );
};

export default NewListForm;
