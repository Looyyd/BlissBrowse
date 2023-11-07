import React, { useEffect, useState } from 'react';
import {
  BlacklistDatastore,
  currentTabHostname, isCurrentSiteForbiddenForExtensions,
} from "../../modules/hostname";
import Button from "@mui/material/Button"
import {Link, LinkOff} from "@mui/icons-material";

const DisableWebsiteButton: React.FC = () => {
  const blacklistDataStore = new BlacklistDatastore();
  const [blacklist,] = blacklistDataStore.useData();
  const [isDisabled, setIsDisabled] = useState(false);
  const [hostname, setHostname] = useState('');
  const [forbiddenSite, setForbiddenSite] = useState(false);

  useEffect(() => {
    if(blacklist === null) return;
    const fetchHostname = async () => {
      const host = await currentTabHostname("popup");
      setHostname(host);
      const forbidden = await isCurrentSiteForbiddenForExtensions("popup");
      setForbiddenSite(forbidden);
      setIsDisabled(forbidden || (blacklist && blacklist.includes(host)));
    };
    fetchHostname();
  }, [blacklist]);

  const handleClick = async () => {
    if (!forbiddenSite) {
      if (isDisabled) {
        await blacklistDataStore.removeHostnameFromBlacklist(hostname);
      } else {
        await blacklistDataStore.addHostnameToBlacklist(hostname);
      }
      setIsDisabled(!isDisabled);
    }
  };

  const buttonText = forbiddenSite ? 'Site Restricted' : isDisabled ? 'Site Disabled' : 'Site Enabled';
  const buttonColor = forbiddenSite ? "info" : isDisabled ? "warning" : "primary";
  const buttonIcon = forbiddenSite ? <LinkOff/> : isDisabled ? <LinkOff/> : <Link/>;

  return (
    <Button
      variant="contained"
      color={buttonColor}
      onClick={handleClick}
      disabled={forbiddenSite}
      style={{ margin: "10px 2px" }}
      id="disable-website-button"
      startIcon={buttonIcon}
    >
      {buttonText}
    </Button>
  );
};

export default DisableWebsiteButton;
