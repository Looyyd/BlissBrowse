import React, {useEffect, useState} from 'react';
import {Button, List, ListItem, ListItemText, Typography} from '@mui/material';
import {ListNamesDataStore} from "../../modules/wordLists";
import LoadingScreen from "../LoadingScreen";
import {Edit} from "@mui/icons-material";
import {ListSettings, ListSettingsStore} from "../../modules/settings";

//TODO: put as global generic type?
type UseDataReturnType = readonly [ListSettings | null, (newValue: ListSettings) => Promise<void>];


//TODO: these settings are not refreshed when a setting changes, there is no listener
function useListSettings(lists: string[] | null) {
  const [listSettings, setListSettings] = useState<ListSettings[]>([]);

  useEffect(() => {
    async function fetchListSettings() {
      if (!lists) {
        return;
      }

      try {
        const settings = await Promise.all(
          lists.map(listName => {
            // Assuming ListSettingsDataStore has a method to fetch data without using a hook
            const dataStore = new ListSettingsStore(listName);
            return dataStore.get();
          })
        );
        setListSettings(settings);
      } catch (error) {
        console.error("Error fetching list settings:", error);
      }
    }

    fetchListSettings();
  }, [lists]);

  return listSettings;
}

const ListsDisplay: React.FC = () => {
  const listNamesDataStore = new ListNamesDataStore();
  const [lists] = listNamesDataStore.useData([]);
  const listSettings = useListSettings(lists);


  const openListEditor = (listName: string) => {
    const tabToOpen = '1';
    const listToSelect = listName;
    const optionsURL = chrome.runtime.getURL('options.html');
    const urlWithState = `${optionsURL}?tab=${tabToOpen}&list=${listToSelect}`;
    chrome.tabs.create({ url: urlWithState });
  }

  //TODO: don't use index, i think maybe there is a cleaner way to do this
  const toggleListDisable = (currentSettings: ListSettings, index: number) => {
    if(!lists || !listSettings) {
      return;
    }
    const newListSettings = currentSettings;
    newListSettings.disabled = !newListSettings.disabled;
    const dataStore = new ListSettingsStore(lists[index]);
    dataStore.set(newListSettings);
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
                onClick={() => toggleListDisable(listSettings[index], index)}
                id={"toggle-"+listName.replace(" ", "_")}
                color="primary"
                variant="contained"
              >
                {listSettings[index]?.disabled ? "Enable" : "Disable"}
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

