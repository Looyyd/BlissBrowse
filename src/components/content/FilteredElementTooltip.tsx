import {Button, Typography} from "@mui/material";
import React from "react";
import FilterIgnore from "./FilterIgnore";
import {unfilterAndIgnoreElement} from "../../modules/content/filter";
import TooltipBox from "./TooltipBox";
import ExtensionTitle from "../style/ExtensionTitle";
import {FilteredElement} from "../../modules/content/content";


type FilteredElementTooltipProps = {
  tooltipText: React.JSX.Element;
  element: FilteredElement;
}

export const FilteredElementTooltip: React.FC<FilteredElementTooltipProps> = ({ tooltipText , element}) => {

  return (
    <FilterIgnore>
      <TooltipBox>
        <ExtensionTitle />
        <Typography color="text.primary"
                    style={{marginBottom: 4}}>{tooltipText}</Typography> {/* Add margin to space the text and button */}
        <Button onClick={() => unfilterAndIgnoreElement(element)} id="unfilterAndIgnoreElementButton"
                variant="contained">
          Unfilter element
        </Button>
      </TooltipBox>
    </FilterIgnore>
  );
};

