import Box from "@mui/material/Box";
import {Button, Typography} from "@mui/material";
import React from "react";
import FilterIgnore from "./FilterIgnore";
import {unfilterAndIgnoreElement} from "../../modules/content/filter";
//TODO: add test that image is loaded correctly
const logoUrl = chrome.runtime.getURL("icons/48.png");


type FilteredElementTooltipProps = {
  listName: string;
  word: string;
  element: HTMLElement;
}

export const FilteredElementTooltip: React.FC<FilteredElementTooltipProps> = ({ listName, word, element}) => {
  const tooltipText = (
    <>
      Filter triggered by word: <span style={{color: 'blue'}}>{word}</span> in list: <span
      style={{color: 'green'}}>{listName}</span>
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
          flexDirection: 'column', // Set the direction of the flex items as column
          alignItems: 'center', // This will center the flex items (text and button) horizontally
          justifyContent: 'center' // This will center the button vertically, beneath the text
        }}
      >
        <img src={logoUrl} alt="Logo" style={{ marginRight: 8, marginBottom: 4}} />
        <Typography color="text.primary"
                    style={{marginBottom: 4}}>{tooltipText}</Typography> {/* Add margin to space the text and button */}
        <Button onClick={() => unfilterAndIgnoreElement(element, listName, word)} id="unfilterAndIgnoreElementButton"
                variant="contained">
          Unfilter element
        </Button>
      </Box>
    </FilterIgnore>
  );
};

