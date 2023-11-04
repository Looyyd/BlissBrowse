import React from "react";
import FilterIgnore from "./FilterIgnore";
import Box from "@mui/material/Box";
import {Button} from "@mui/material";
import {refilterElement} from "../../modules/content/filter";
import {EXTENSION_NAME} from "../../constants";
const logoUrl = chrome.runtime.getURL("icons/48.png");


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
          flexDirection: 'column', // Set the direction of the flex items as column
          alignItems: 'center', // This will center the flex items (text and button) horizontally
          justifyContent: 'center' // This will center the button vertically, beneath the text
        }}
      >
        <img src={logoUrl} alt="Logo" id={EXTENSION_NAME+"logo"} style={{ marginRight: 8, marginBottom: 4}} />
        <Button onClick={() => refilterElement(element, listName, word)} id="refilterElementButton" variant="contained">
          Refilter element
        </Button>
      </Box>
    </FilterIgnore>
  );
};