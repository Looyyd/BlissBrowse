import React from 'react';
import {Button, List, ListItem, ListItemText, Typography} from '@mui/material';
import LoadingScreen from "../LoadingScreen";
import {Edit} from "@mui/icons-material";
import {useDataStore} from "../DataStoreContext";
import {useDataFromStore} from "../../modules/datastore";
import {useAlert} from "../AlertContext";

//const listSettingsDataStore = new FullListSettingsStore();

const ListsDisplay: React.FC = () => {
  const { listNamesDataStore } = useDataStore();
  const [lists] = useDataFromStore(listNamesDataStore);
  //const [listSettings] = useDataFromStore(listSettingsDataStore);
  const { showAlert } = useAlert();


  const openListEditor = (listName: string) => {
    const tabToOpen = '1';
    const listToSelect = listName;
    const optionsURL = chrome.runtime.getURL('options.html');
    const urlWithState = `${optionsURL}?tab=${tabToOpen}&list=${listToSelect}`;
    chrome.tabs.create({ url: urlWithState });
  }

  /*
  const toggleListDisable = async (listName: string) => {
    if (!lists || !listSettings) {
      return;
    }
    const settingsKeyValue = listSettings[listName];
    const settings = settingsKeyValue ? settingsKeyValue.value : {disabled: false};//hardcoded default
    settings.disabled = !settings.disabled;
    try {
      await listSettingsDataStore.set(listName, settings);
    } catch (e) {
      console.error('Error toggling list:', e);
      showAlert('error', 'An error occurred while toggling the list');
    }
  }
   */

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
              {/*
              <Button
                onClick={() => toggleListDisable(listName)}
                id={"toggle-"+listName.replace(" ", "_")}
                color="primary"
                variant="contained"
              >
                {listSettings[listName]?.value.disabled ? "Enable" : "Disable"}
              </Button>
               */}
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

