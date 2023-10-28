import React from 'react';
import {Select, MenuItem, FormControl, FormHelperText, SelectChangeEvent} from '@mui/material';
import {ALL_LISTS_SYMBOL} from "../constants";

type ListSelectorProps = {
  lists: string[] | null;
  onListChange: (event: SelectChangeEvent<string>) => void;
  value: string;
}

const ListSelector: React.FC<ListSelectorProps> = ({ lists, onListChange, value }) => {
  const disabled = lists === null || lists.length === 0;

  return (
    <FormControl fullWidth>
      <Select
        labelId="customWordListSelect-label"
        id="customWordListSelect"
        value={value}
        onChange={onListChange}
        disabled={disabled}
      >
        {!disabled && lists?.map((listName) => (
          <MenuItem key={listName} value={listName}>
            {listName === ALL_LISTS_SYMBOL ? 'All Lists' : listName}
          </MenuItem>
        ))}
      </Select>
      {disabled && (
        <FormHelperText error>Add a list first</FormHelperText>
      )}
    </FormControl>
  );
};


export default ListSelector;

