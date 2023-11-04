import React from "react";
import FilterIgnore from "./FilterIgnore";
import Box from "@mui/material/Box";
import {Button} from "@mui/material";
import {refilterElement} from "../../modules/content/filter";


type UnfilteredElementTooltip = {
  element: HTMLElement;
  listName: string;
  word: string;
}

export const UnfilteredElementTooltip: React.FC<UnfilteredElementTooltip> = ({element, listName, word}) => {

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
        <Button onClick={() => refilterElement(element, listName, word)} id="unfilterAndIgnoreElementButton" variant="contained">
          Refilter element
        </Button>
      </Box>
    </FilterIgnore>
  );
};