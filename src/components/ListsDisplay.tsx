import React, { useEffect, useState } from 'react';
import FilteredWords from './FilteredWords';
import {getLists} from "../modules/wordLists";
import {List, ListItem, ListItemText, Divider, Collapse, Typography} from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';



const DEBUG = true;  // Toggle your debug flag here

const ListsDisplay: React.FC = () => {
  const [lists, setLists] = useState<string[]>([]);
  const [open, setOpen] = React.useState(false);

  const handleClick = () => {
    setOpen(!open);
  };

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
              <ListItem onClick={handleClick}>
                <ListItemText primary={listName} />
                {open ? <ExpandLess /> : <ExpandMore />}
              </ListItem>
              <Collapse in={open} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  <FilteredWords listName={listName} />
                </List>
              </Collapse>
              <Divider />
            </div>
          ))}
        </List>
      </>
    );
};


export default ListsDisplay;

