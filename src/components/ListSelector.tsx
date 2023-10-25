import React from 'react';
import {Select, MenuItem, FormControl, FormHelperText, SelectChangeEvent} from '@mui/material';

type ListSelectorProps = {
  lists: string[];
  onListChange: (event: SelectChangeEvent<string>) => void;
}

const ListSelector : React.FC<ListSelectorProps> = ({ lists, onListChange}) => (
  <FormControl fullWidth>
    <Select
      labelId="customWordListSelect-label"
      id="customWordListSelect"
      onChange={onListChange}
      disabled={lists.length === 0}
    >
      {lists.map((listName) => (
        <MenuItem key={listName} value={listName}>
          {listName}
        </MenuItem>
      ))}
    </Select>
    {lists.length === 0 && (
      <FormHelperText error>Add a list first</FormHelperText>
    )}
  </FormControl>
);

export default ListSelector;

