import React from 'react';
import {Select, MenuItem, SelectProps} from '@mui/material';
import {SelectChangeEvent} from "@mui/material/Select/SelectInput";

interface SelectFromEnumProps extends Omit<SelectProps<string>, 'value' | 'onChange'> {
  enumObj: { [key: string]: string };
  onChange: (event: SelectChangeEvent<string>) => void;
  value: string;
  includeDefault?: boolean;
}

const SelectFromEnum: React.FC<SelectFromEnumProps> = ({
  enumObj,
  onChange,
  value,
  includeDefault = false,
  ...selectProps // Spread the rest of the selectProps
}) => {
  const enumKeys = Object.keys(enumObj);

  return (
    <Select value={value} onChange={onChange} {...selectProps}>
      {includeDefault && (
        <MenuItem key="default" value="default">
          default
        </MenuItem>
      )}
      {enumKeys.map((key) => (
        <MenuItem key={key} value={key}>
          {key}
        </MenuItem>
      ))}
    </Select>
  );
};

export default SelectFromEnum;


