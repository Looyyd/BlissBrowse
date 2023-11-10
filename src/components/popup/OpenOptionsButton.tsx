import React from 'react';
import Button from '@mui/material/Button';
import {Settings} from "@mui/icons-material";
import {Tooltip} from "@mui/material";

const OpenOptionsButton: React.FC = () => {
  const handleClick = () => {
    chrome.runtime.openOptionsPage();
  };

  return (
    <Tooltip title="Open extension options">
      <Button
        id="openOptionsButton"
        color="primary"
        onClick={handleClick}
        variant="contained"
        style={{ margin: "10px 2px" }}
      >
        <Settings/>
      </Button>
    </Tooltip>
  );
};

export default OpenOptionsButton;
