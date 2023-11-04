import Box from "@mui/material/Box";
import {Typography} from "@mui/material";
import React from "react";
import FilterIgnore from "./FilterIgnore";
//TODO: fix, i think incorrect declaration.d.ts file
//import Logo from "../../../icons/48.png";

type FilteredElementTooltipProps = {
  listName: string;
  word: string;
}

export const FilteredElementTooltip: React.FC<FilteredElementTooltipProps> = ({ listName, word }) => {
  const tooltipText = (
    <>
      Filter triggered by word: <span style={{ color: 'blue' }}>{word}</span> in list: <span style={{ color: 'green' }}>{listName}</span>
    </>
  );

  return (
    <FilterIgnore>
      <Box
        className="tooltip-content-react"
        sx={{
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'grey.300',
          p: 1,
          borderRadius: 2,
          boxShadow: 3,
          typography: 'body2',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        {/*<img src={Logo} alt="Logo" style={{ marginRight: 8 }} /> */}
        <Typography color="text.primary">{tooltipText}</Typography>
      </Box>
    </FilterIgnore>
  );
};
