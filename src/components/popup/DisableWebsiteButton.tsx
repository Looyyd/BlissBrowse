import React, { useEffect, useState } from 'react';
import {
  BlacklistDatastore,
  currentTabHostname, isCurrentSiteForbiddenForExtensions,
} from "../../modules/hostname";
import Button from "@mui/material/Button"
import {Block, Cancel, Link, LinkOff} from "@mui/icons-material";
import {Tooltip} from "@mui/material";
import {useDataFromStore} from "../../modules/datastore";
import {useAlert} from "../AlertContext";
import {supportedWebsites} from "../../modules/content/siteSupport";

const blacklistDataStore = new BlacklistDatastore();

const DisableWebsiteButton: React.FC = () => {
  const [blacklist] = useDataFromStore(blacklistDataStore);
  const [isDisabled, setIsDisabled] = useState(false);
  const [hostname, setHostname] = useState('');
  const [forbiddenSite, setForbiddenSite] = useState(false);
  const { showAlert } = useAlert();


  useEffect(() => {
    if(blacklist === null) return;
    const fetchHostname = async () => {
      const host = await currentTabHostname("popup");
      console.log('host:', host);
      setHostname(host);
      const forbidden = await isCurrentSiteForbiddenForExtensions("popup");
      setForbiddenSite(forbidden);
      setIsDisabled(forbidden || (blacklist && blacklist.includes(host)));
    };
    fetchHostname();
  }, [blacklist]);

  const handleClick = async () => {
    if (!forbiddenSite) {
      try {
        if (isDisabled) {
          await blacklistDataStore.removeHostnameFromBlacklist(hostname);
        } else {
          await blacklistDataStore.addHostnameToBlacklist(hostname);
        }
        setIsDisabled(!isDisabled);
      } catch (e) {
        console.error('Error toggling blacklist:', e);
        showAlert('error', 'An error occurred while toggling the blacklist');
      }
    }
  };

  const unsupportedSite = !supportedWebsites.includes(hostname);

  const buttonText =
    forbiddenSite ? 'Site Restricted' :
      unsupportedSite ? 'Site Unsupported' :
        isDisabled ? 'Site Disabled' : 'Site Enabled';

  const buttonColor =
    forbiddenSite ? "info" :
      unsupportedSite ? "secondary" : // 'secondary' or any other color that signifies unsupported
        isDisabled ? "warning" : "primary";

  const buttonIcon =
    forbiddenSite ? <Block/> :
      unsupportedSite ? <Cancel/> : // 'Block' or any other icon that signifies unsupported
        isDisabled ? <LinkOff/> : <Link/>;

  let tooltipText;
  if (forbiddenSite) {
    tooltipText = "Chrome extensions are disabled on this website";
  } else if (unsupportedSite) {
    tooltipText = "This site is not supported by the extension";
  } else if (isDisabled) {
    tooltipText = "Click to enable the extension on this website";
  } else {
    tooltipText = "Click to disable the extension on this website";
  }


  return (
    <Tooltip title={tooltipText}>
      <span>
        <Button
          variant="contained"
          color={buttonColor}
          onClick={handleClick}
          disabled={forbiddenSite || unsupportedSite}
          style={{ margin: "10px 2px" }}
          id="disable-website-button"
          startIcon={buttonIcon}
        >
          {buttonText}
        </Button>
      </span>
    </Tooltip>
  );
};

export default DisableWebsiteButton;
