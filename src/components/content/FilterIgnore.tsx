import React from 'react';
import {FILTER_IGNORE_ATTRIBUTE} from "../../constants";

type FilterIgnoreProps = {
  children: React.ReactNode;
}

const FilterIgnore: React.FC<FilterIgnoreProps> = ({ children }) => {
  const ignoreAttributes = {
    [FILTER_IGNORE_ATTRIBUTE]: 'true'
  };

  return (
    <div {...ignoreAttributes}>
      {children}
    </div>
  );
};

export default FilterIgnore;

