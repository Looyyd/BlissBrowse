import {Button, Typography} from "@mui/material";
import React from "react";
import FilterIgnore from "./FilterIgnore";
import {unfilterAndIgnoreElement} from "../../modules/content/filter";
import TooltipBox from "./TooltipBox";
import ExtensionTitle from "../ExtensionTitle";


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
        <ExtensionTitle />
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

