import React, { useState, FormEvent } from 'react';
import {createNewList} from "../modules/wordLists";

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
      <label htmlFor="listName">Enter a list name:</label>
      <input
        type="text"
        id="listName"
        placeholder="Enter a list name"
        value={listName}
        onChange={(e) => setListName(e.target.value)}
        autoComplete="off"
      />
      <button type="submit">Add List</button>
    </form>
  );
};

export default NewListForm;
