import React from 'react';
import Button from '@mui/material/Button';
import {BugReport} from "@mui/icons-material";
import {Tooltip} from "@mui/material";

const feedbackFormUrl = 'https://docs.google.com/forms/d/e/1FAIpQLScjTffzbJdl6hIA3Dqx6pCgPpxrCaMc0m5FoBogDst8qeNpDw/viewform?usp=sf_link'

const FeedbackButton = () => {
  const handleOpenForm = () => {
    // Open the Google Form in a new tab
    window.open(feedbackFormUrl, '_blank');
  };

    return (
      <Tooltip title="Report a bug or request a feature">
        <Button
          variant="contained"
          color="primary"
          onClick={handleOpenForm}
          style={{ margin: "10px 2px" }}
        >
          <BugReport/>
        </Button>
      </Tooltip>
  );
}



export default FeedbackButton;

