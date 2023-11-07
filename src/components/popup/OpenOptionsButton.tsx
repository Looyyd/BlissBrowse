import React from 'react';
import Button from '@mui/material/Button';
import {Settings} from "@mui/icons-material";

const OpenOptionsButton: React.FC = () => {
  const handleClick = () => {
    chrome.runtime.openOptionsPage();
  };

  return (
    <Button
      id="openOptionsButton"
      color="primary"
      onClick={handleClick}
      variant="contained"
      startIcon={<Settings/>}
      style={{ margin: "10px 2px" }}
    >
      Open Options
    </Button>
  );
};

export default OpenOptionsButton;
