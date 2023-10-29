import React from 'react';
import Button from '@mui/material/Button';

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
      style={{ margin: "10px 2px" }}
    >
      Open Options
    </Button>
  );
};

export default OpenOptionsButton;
