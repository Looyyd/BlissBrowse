import Box from "@mui/material/Box";
import {Button, Typography} from "@mui/material";
import React from "react";
import FilterIgnore from "./FilterIgnore";
import {unfilterAndIgnoreElement} from "../../modules/content/filter";
//TODO: fix, i think incorrect declaration.d.ts file
//import Logo from "../../../icons/48.png";

type FilteredElementTooltipProps = {
  listName: string;
  word: string;
  element: HTMLElement;
}

export const FilteredElementTooltip: React.FC<FilteredElementTooltipProps> = ({ listName, word, element}) => {
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
        <Button onClick={() => unfilterAndIgnoreElement(element, listName, word)} id="unfilterAndIgnoreElementButton" variant="contained">
          Unfilter element
        </Button>
      </Box>
    </FilterIgnore>
  );
};
