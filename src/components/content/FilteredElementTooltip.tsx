import {Button, Typography} from "@mui/material";
import React from "react";
import FilterIgnore from "./FilterIgnore";
import {unfilterAndIgnoreElement} from "../../modules/content/filter";
import {EXTENSION_NAME} from "../../constants";
import TooltipBox from "./TooltipBox";
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
      <TooltipBox>
        <img src={logoUrl} alt="Logo" id={EXTENSION_NAME+"logo"} style={{ marginRight: 8, marginBottom: 4}} />
        <Typography color="text.primary"
                    style={{marginBottom: 4}}>{tooltipText}</Typography> {/* Add margin to space the text and button */}
        <Button onClick={() => unfilterAndIgnoreElement(element, listName, word)} id="unfilterAndIgnoreElementButton"
                variant="contained">
          Unfilter element
        </Button>
      </TooltipBox>
    </FilterIgnore>
  );
};

