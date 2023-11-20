import React from "react";
import FilterIgnore from "./FilterIgnore";
import {Button} from "@mui/material";
import TooltipBox from "./TooltipBox";
import ExtensionTitle from "../ExtensionTitle";
import {reAllowFilterElement} from "../../modules/content/filter";


type UnfilteredElementTooltip = {
  element: HTMLElement;
}

export const UnfilteredElementTooltip: React.FC<UnfilteredElementTooltip> = ({element}) => {

  return (
    <FilterIgnore>
      <TooltipBox>
        <ExtensionTitle />
        <Button onClick={() => reAllowFilterElement(element)} id="refilterElementButton" variant="contained">
          Refilter element
        </Button>
      </TooltipBox>
    </FilterIgnore>
  );
};