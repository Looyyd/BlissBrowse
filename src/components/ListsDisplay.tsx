// ListsDisplay.tsx
import React, { useEffect, useState } from 'react';
import FilteredWords from './FilteredWords';
import {getLists} from "../modules/wordLists";

const DEBUG = true;  // Toggle your debug flag here

const ListsDisplay: React.FC = () => {
  const [lists, setLists] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (DEBUG) {
        console.log('displaying lists');
      }

      const fetchedLists = await getLists(); // Assume getLists() fetches your lists
      setLists(fetchedLists);
    };

    fetchData();
  }, []);

  return (
    <ul id="listsList">
      {lists.map((listName, index) => (
        <li key={index}>
          {listName}
          <FilteredWords listName={listName} />
        </li>
      ))}
    </ul>
  );
};


export default ListsDisplay;

