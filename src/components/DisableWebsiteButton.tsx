import React, { useEffect, useState } from 'react';
import {
  addHostnameToBlacklist,
  currentTabHostname,
  isHostnameDisabled,
  removeHostnameFromBlacklist
} from "../modules/hostname";
import Button from "@mui/material/Button"

//TODO: pass context as a prop to DisableWebsiteButton?
const DisableWebsiteButton: React.FC = () => {
  const [isDisabled, setIsDisabled] = useState(false);
  const [hostname, setHostname] = useState('');

  useEffect(() => {
    const fetchHostname = async () => {
      const host = await currentTabHostname("popup");
      setHostname(host);

      const disabled = await isHostnameDisabled(host);
      setIsDisabled(disabled);
    };

    fetchHostname();
  }, []);

  const updateDisableButtonText = (disableStatus: boolean) => {
    setIsDisabled(disableStatus);
  };

  const handleClick = async () => {
    if (isDisabled) {
      await removeHostnameFromBlacklist(hostname);
      updateDisableButtonText(false);
    } else {
      await addHostnameToBlacklist(hostname);
      updateDisableButtonText(true);
    }
  };

  return (
    <Button
      variant="contained"
      color={isDisabled ? "warning" : "secondary"}
      onClick={handleClick}
    >
      {isDisabled ? 'Enable on This Site' : 'Disable on This Site'}
    </Button>
  );
};

export default DisableWebsiteButton;
