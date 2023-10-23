import React from 'react';

const OpenOptionsButton: React.FC = () => {
  const handleClick = () => {
    // TODO: Make this browser-agnostic
    chrome.runtime.openOptionsPage();
  };

  return (
    <button id="openOptionsButton" onClick={handleClick}>
      Open Options
    </button>
  );
};

export default OpenOptionsButton;
