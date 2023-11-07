import React from 'react';
import Button from '@mui/material/Button';
import {BugReport} from "@mui/icons-material";

const feedbackFormUrl = 'https://docs.google.com/forms/d/e/1FAIpQLScjTffzbJdl6hIA3Dqx6pCgPpxrCaMc0m5FoBogDst8qeNpDw/viewform?usp=sf_link'

const FeedbackButton = () => {
  const handleOpenForm = () => {
    // Open the Google Form in a new tab
    window.open(feedbackFormUrl, '_blank');
  };

    return (
    <Button
      variant="contained"
      color="primary"
      startIcon={<BugReport/>} // Add the warning icon as the startIcon
      onClick={handleOpenForm}
    >
      Give Feedback
    </Button>
  );
}



export default FeedbackButton;

