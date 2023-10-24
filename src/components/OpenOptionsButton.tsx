import React from 'react';
import Button from '@mui/material/Button';

const OpenOptionsButton: React.FC = () => {
  const handleClick = () => {
    // TODO: Make this browser-agnostic
    chrome.runtime.openOptionsPage();
  };

  return (
    <Button
      id="openOptionsButton"
      color="secondary"
      onClick={handleClick}
      variant="contained"
    >
      Open Options
    </Button>
  );
};

export default OpenOptionsButton;
