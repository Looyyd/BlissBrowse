import React from 'react';
import {Button, List, ListItem, ListItemText, Typography} from '@mui/material';
import {ListNamesDataStore} from "../../modules/wordLists";
import LoadingScreen from "../LoadingScreen";
import {Edit} from "@mui/icons-material";
import {FullListSettingsStore} from "../../modules/settings";

const listNamesDataStore = new ListNamesDataStore();
const settingsDataStore = new FullListSettingsStore();

const ListsDisplay: React.FC = () => {
  const [lists] = listNamesDataStore.useData([]);
  const [listSettings, setRowData] = settingsDataStore.useData();


  const openListEditor = (listName: string) => {
    const tabToOpen = '1';
    const listToSelect = listName;
    const optionsURL = chrome.runtime.getURL('options.html');
    const urlWithState = `${optionsURL}?tab=${tabToOpen}&list=${listToSelect}`;
    chrome.tabs.create({ url: urlWithState });
  }

  const toggleListDisable = async (listName: string) => {
    if (!lists || !listSettings) {
      return;
    }
    const settingsKeyValue = listSettings[listName];
    const settings = settingsKeyValue ? settingsKeyValue.value : {disabled: false};//hardcoded default
    settings.disabled = !settings.disabled;
    await setRowData(listName, settings);
  }

  return (
    <>
      <Typography variant="h6">Your lists</Typography>
      <List id="listsList">
        {lists === null || listSettings === undefined ? (
          <LoadingScreen/>
        ) : (
          lists.map((listName, index) => (
          <div key={index}>
            <ListItem>
              <ListItemText primary={listName} />
              <Button
                onClick={() => toggleListDisable(listName)}
                id={"toggle-"+listName.replace(" ", "_")}
                color="primary"
                variant="contained"
              >
                {listSettings[listName]?.value.disabled ? "Enable" : "Disable"}
              </Button>
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

