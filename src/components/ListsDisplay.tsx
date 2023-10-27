import React, { useEffect, useState } from 'react';
import {getLists} from "../modules/wordLists";
import {List, ListItem, ListItemText, Typography} from '@mui/material';



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
    <>
      <Typography variant="h6">Your Lists</Typography>
      <List id="listsList">
        {lists.map((listName, index) => (
          <div key={index}>
            <ListItem>
              <ListItemText primary={listName} />
            </ListItem>
          </div>
        ))}
      </List>
    </>
  );
};


export default ListsDisplay;

