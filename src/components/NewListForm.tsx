import React, { useState, FormEvent } from 'react';
import {Button, TextField, FormControl, Typography} from '@mui/material';
import {ListNamesDataStore} from "../modules/wordLists";


const NewListForm: React.FC = () => {
  const listNamesDataStore = new ListNamesDataStore();
  const [listName, setListName] = useState<string>('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (listName) {
      try {
        await listNamesDataStore.createNewList(listName);
      } catch (error) {
        console.error('Error saving new list:', error);
      }
    }
  };

  return (
    <>
      <Typography variant="h6">Create a New List</Typography>
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
