import React, { useState, FormEvent } from 'react';
import {createNewList} from "../modules/wordLists";
import { Button, TextField, FormControl, InputLabel } from '@mui/material';


const NewListForm: React.FC = () => {
  const [listName, setListName] = useState<string>('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (listName) {
      try {
        await createNewList(listName);
      } catch (error) {
        console.error('Error saving new list:', error);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormControl fullWidth margin="normal">
        <InputLabel htmlFor="listName">Enter a list name:</InputLabel>
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
  );
};

export default NewListForm;
