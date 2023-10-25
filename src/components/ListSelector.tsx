import React from 'react';
import {Select, MenuItem, FormControl, FormHelperText, SelectChangeEvent} from '@mui/material';
import {ALL_LISTS} from "../constants";

type ListSelectorProps = {
  lists: string[];
  onListChange: (event: SelectChangeEvent<string>) => void;
  value: string;
}

const ListSelector : React.FC<ListSelectorProps> = ({ lists, onListChange, value}) => (
  <FormControl fullWidth>
    <Select
      labelId="customWordListSelect-label"
      id="customWordListSelect"
      value={value}
      onChange={onListChange}
      disabled={lists.length === 0}
    >
      {lists.map((listName) => (
        <MenuItem key={listName} value={listName}>
          {listName === ALL_LISTS ? 'All Lists' : listName}
        </MenuItem>
      ))}
    </Select>
    {lists.length === 0 && (
      <FormHelperText error>Add a list first</FormHelperText>
    )}
  </FormControl>
);

export default ListSelector;

