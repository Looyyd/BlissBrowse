import React, {useEffect, useState} from 'react';
import {
  Box,
  Button,
  Container, IconButton, List, ListItem, ListItemSecondaryAction, ListItemText,
  Typography
} from '@mui/material';
import {BlacklistDatastore} from "../../modules/hostname";
import {useAlert} from "../AlertContext";
import {TextEditBox} from "../TextEditBox";
import {RadioButtonChecked, RadioButtonUnchecked, Save} from "@mui/icons-material";
import InfoIcon from '@mui/icons-material/Info';
import {useDataFromStore} from "../../modules/datastore";
import {supportedWebsites} from "../../modules/content/siteSupport";




const blacklistDataStore = new BlacklistDatastore();


const BlacklistedSitesEditor = () => {
  const [blacklist] = useDataFromStore(blacklistDataStore);
  const { showAlert } = useAlert();

  // Toggle site blacklist status
  const toggleBlacklist = (site: string) => {
    if(blacklist === null) return;
    const newBlacklist = blacklist.includes(site) ? blacklist.filter(s => s !== site) : [...blacklist, site];

    const dataStore = new BlacklistDatastore();
    dataStore.set(newBlacklist)
      .then(() => showAlert('success', 'Blacklist updated successfully!'))
      .catch(e => {
        showAlert('error', 'An error occurred while updating the blacklist');
        console.error('Error updating blacklist:', e);
      });
  };

  // Check if a site is blacklisted
  const isBlacklisted = (site: string) => blacklist === null ? false : blacklist.includes(site);

  if(blacklist === null){
    return (
      <Container>
        <Typography variant="h5">Loading...</Typography>
      </Container>
    );
  };

  return (
    <Container>
      <Box display="flex" flexDirection="column" alignItems="start" gap={2}>
        <Typography variant="body1" display="flex" alignItems="center" gap={1}>
          <InfoIcon color="primary" />
          Toggle the blacklist status of supported websites.
        </Typography>
        <List>
          {supportedWebsites.map(site => (
            <ListItem key={site}>
              <ListItemText primary={site} />
              <ListItemSecondaryAction>
                <IconButton edge="end" aria-label="toggle blacklist" onClick={() => toggleBlacklist(site)}>
                  {isBlacklisted(site) ? <RadioButtonChecked color="secondary" /> : <RadioButtonUnchecked/>}
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Box>
    </Container>
  );
};

export default BlacklistedSitesEditor;


