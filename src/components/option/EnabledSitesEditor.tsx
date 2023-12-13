import React from 'react';
import {
  Box,
  Container, IconButton, List, ListItem, ListItemSecondaryAction, ListItemText,
  Typography
} from '@mui/material';
import {BlacklistDatastore} from "../../modules/hostname";
import {useAlert} from "../AlertContext";
import {RadioButtonChecked, RadioButtonUnchecked} from "@mui/icons-material";
import InfoIcon from '@mui/icons-material/Info';
import {useDataFromStore} from "../../modules/datastore";
import {supportedWebsites} from "../../modules/content/siteSupport";
import PaperBlissBrowse from "../style/PaperBlissBrowse";
import LoadingScreen from "../style/LoadingScreen";




const blacklistDataStore = new BlacklistDatastore();


const EnabledSitesEditor = () => {
  const [blacklist] = useDataFromStore(blacklistDataStore);
  const { showAlert } = useAlert();

  // Toggle site blacklist status
  const toggleBlacklist = (site: string) => {
    if(blacklist === null) return;
    const newBlacklist = blacklist.includes(site) ? blacklist.filter(s => s !== site) : [...blacklist, site];

    const dataStore = new BlacklistDatastore();
    dataStore.set(newBlacklist)
      .then(() => showAlert('success', 'List of enabled sites updated successfully!'))
      .catch(e => {
        showAlert('error', 'An error occurred while updating the enabled sites list');
        console.error('Error updating blacklist:', e);
      });
  };

  // Check if a site is blacklisted
  const isBlacklisted = (site: string) => blacklist === null ? false : blacklist.includes(site);

  if(blacklist === null){
    return (
      <LoadingScreen/>
    );
  }

  return (
    <Container>
      <PaperBlissBrowse>
        <Box display="flex" flexDirection="column" alignItems="start" gap={2}>
          <Typography variant="body1" display="flex" alignItems="center" gap={1}>
            <InfoIcon color="primary" />
            Toggle the status of supported websites.
          </Typography>
          <List>
            {supportedWebsites.map(site => (
              <ListItem key={site}>
                <ListItemText primary={site} />
                <ListItemSecondaryAction>
                  <IconButton edge="end" aria-label="toggle blacklist" onClick={() => toggleBlacklist(site)}>
                    {isBlacklisted(site) ?  <RadioButtonUnchecked/> : <RadioButtonChecked color="secondary" />}
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>
      </PaperBlissBrowse>
    </Container>
  );
};

export default EnabledSitesEditor;


