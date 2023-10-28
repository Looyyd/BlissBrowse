import React, { useEffect, useState } from 'react';
import {
  BlacklistDatastore,
  currentTabHostname,
} from "../../modules/hostname";
import Button from "@mui/material/Button"

const DisableWebsiteButton: React.FC = () => {
  const blacklistDataStore = new BlacklistDatastore();
  const [blacklist,] = blacklistDataStore.useData();
  const [isDisabled, setIsDisabled] = useState(false);
  const [hostname, setHostname] = useState('');

  useEffect(() => {
    const fetchHostname = async () => {
      const host = await currentTabHostname("popup");
      setHostname(host);
    };
    fetchHostname();
  }, []);

  useEffect(() => {
    const fetchIsDisabled = async () => {
      const isDisabled = blacklist && blacklist.includes(hostname);
      if(isDisabled !== null){
        setIsDisabled(isDisabled);
      }
    };
    fetchIsDisabled();
  }, [blacklist, hostname]);

  const updateDisableButtonText = (disableStatus: boolean) => {
    setIsDisabled(disableStatus);
  };

  const handleClick = async () => {
    if (isDisabled) {
      await blacklistDataStore.removeHostnameFromBlacklist(hostname);
      updateDisableButtonText(false);
    } else {
      await blacklistDataStore.addHostnameToBlacklist(hostname);
      updateDisableButtonText(true);
    }
  };

  return (
    <Button
      variant="contained"
      color={isDisabled ? "warning" : "primary"}
      onClick={handleClick}
      style={{ margin: "10px 2px" }}
    >
      {isDisabled ? 'Enable on This Site' : 'Disable on This Site'}
    </Button>
  );
};

export default DisableWebsiteButton;
