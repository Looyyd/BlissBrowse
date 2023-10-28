import React from 'react';
import { Typography, List, ListItem } from '@mui/material';
import {BlacklistDatastore} from "../../modules/hostname";



const BlacklistedSites = () => {
  const blacklistDataStore = new BlacklistDatastore();
  const [blacklist,] = blacklistDataStore.useData();

  //TODO: proper loading screen
  return (
    <div>
      {!blacklist ? (
        <Typography variant="body1">Loading...</Typography>
      ) : blacklist.length === 0 ? (
        <Typography variant="body1">No blacklisted sites</Typography>
      ) : (
        <List>
          {blacklist.map((hostname) => (
            <ListItem key={hostname}>
              <Typography variant="body1">{hostname}</Typography>
            </ListItem>
          ))}
        </List>
      )}
    </div>
  );
};

export default BlacklistedSites;
