import React from "react";
import FilterIgnore from "./FilterIgnore";
import {Button} from "@mui/material";
import {refilterElement} from "../../modules/content/filter";
import {EXTENSION_NAME} from "../../constants";
import TooltipBox from "./TooltipBox";
const logoUrl = chrome.runtime.getURL("icons/48.png");


type UnfilteredElementTooltip = {
  element: HTMLElement;
  listName: string;
  word: string;
}

export const UnfilteredElementTooltip: React.FC<UnfilteredElementTooltip> = ({element, listName, word}) => {

  return (
    <FilterIgnore>
      <TooltipBox>
        <img src={logoUrl} alt="Logo" id={EXTENSION_NAME+"logo"} style={{ marginRight: 8, marginBottom: 4}} />
        <Button onClick={() => refilterElement(element, listName, word)} id="refilterElementButton" variant="contained">
          Refilter element
        </Button>
      </TooltipBox>
    </FilterIgnore>
  );
};