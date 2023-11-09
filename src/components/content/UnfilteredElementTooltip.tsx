import React from "react";
import FilterIgnore from "./FilterIgnore";
import {Button} from "@mui/material";
import {refilterElement} from "../../modules/content/filter";
import TooltipBox from "./TooltipBox";
import ExtensionTitle from "../ExtensionTitle";


type UnfilteredElementTooltip = {
  element: HTMLElement;
  listName: string;
  word: string;
}

export const UnfilteredElementTooltip: React.FC<UnfilteredElementTooltip> = ({element, listName, word}) => {

  return (
    <FilterIgnore>
      <TooltipBox>
        <ExtensionTitle />
        <Button onClick={() => refilterElement(element, listName, word)} id="refilterElementButton" variant="contained">
          Refilter element
        </Button>
      </TooltipBox>
    </FilterIgnore>
  );
};