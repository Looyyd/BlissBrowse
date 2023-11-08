import React from 'react';
import {Button, List, ListItem, ListItemText, Typography} from '@mui/material';
import {ListNamesDataStore} from "../../modules/wordLists";
import LoadingScreen from "../LoadingScreen";
import {Edit} from "@mui/icons-material";




const ListsDisplay: React.FC = () => {
  const listNamesDataStore = new ListNamesDataStore();
  const [lists] = listNamesDataStore.useData([]);

  const openListEditor = (listName: string) => {
    const tabToOpen = '1';
    const listToSelect = listName;
    const optionsURL = chrome.runtime.getURL('options.html');
    const urlWithState = `${optionsURL}?tab=${tabToOpen}&list=${listToSelect}`;
    chrome.tabs.create({ url: urlWithState });
  }

  return (
    <>
      <Typography variant="h6">Your lists</Typography>
      <List id="listsList">
        {lists === null ? (
          <LoadingScreen/>
        ) : (
          lists.map((listName, index) => (
          <div key={index}>
            <ListItem>
              <ListItemText primary={listName} />
              <Button
                onClick={() => openListEditor(listName)}
                id={"edit-"+listName.replace(" ", "_")}
                color="primary"
                startIcon={<Edit/>}
                variant="contained"
              >Edit</Button>
            </ListItem>
          </div>
        )))
        }
      </List>
    </>
  );
};


export default ListsDisplay;

