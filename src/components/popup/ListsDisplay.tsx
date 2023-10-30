import React from 'react';
import {Button, List, ListItem, ListItemText, Typography} from '@mui/material';
import {ListNamesDataStore} from "../../modules/wordLists";
import LoadingScreen from "../LoadingScreen";




const ListsDisplay: React.FC = () => {
  const listNamesDataStore = new ListNamesDataStore();
  const [lists] = listNamesDataStore.useData([]);

  const openListEditor = (listName: string) => {
    const tabToOpen = 'specificTab';
    const listToSelect = listName;
    const optionsURL = chrome.runtime.getURL('dist/options.html');// hardcoded string TODO: remove
    const urlWithState = `${optionsURL}?tab=${tabToOpen}&list=${listToSelect}`;
    chrome.tabs.create({ url: urlWithState });
  }

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
              <Button onClick={() => openListEditor(listName)} id={"edit-"+listName.replace(" ", "_")}>Edit</Button>
            </ListItem>
          </div>
        )))
        }
      </List>
    </>
  );
};


export default ListsDisplay;

