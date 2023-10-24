import React, {useEffect, useState} from 'react';
import {getHostnameBlacklist} from "../modules/hostname";
import { Typography, List, ListItem } from '@mui/material';



const BlacklistedSitesContent = () => {
  const [blacklist, setBlacklist] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const blacklist = await getHostnameBlacklist();
      setBlacklist(blacklist);
    };
    fetchData();
  });


  return (
    <div>
      {blacklist.length === 0 ? (
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
  )
};


export default BlacklistedSitesContent;
