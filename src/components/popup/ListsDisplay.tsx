import React from 'react';
import {List, ListItem, ListItemText, Typography} from '@mui/material';
import {ListNamesDataStore} from "../../modules/wordLists";
import LoadingScreen from "../LoadingScreen";




const ListsDisplay: React.FC = () => {
  const listNamesDataStore = new ListNamesDataStore();
  const [lists] = listNamesDataStore.useData([]);

  return (
    <>
      <Typography variant="h6">Your Lists</Typography>
      <List id="listsList">
        {lists === null ? (
          <LoadingScreen/>
        ) : (
          lists.map((listName, index) => (
          <div key={index}>
            <ListItem>
              <ListItemText primary={listName} />
            </ListItem>
          </div>
        )))
        }
      </List>
    </>
  );
};


export default ListsDisplay;

