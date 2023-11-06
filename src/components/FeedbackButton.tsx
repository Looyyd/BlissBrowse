import React from 'react';
import Button from '@mui/material/Button';

const feedbackFormUrl = 'https://docs.google.com/forms/d/e/1FAIpQLScjTffzbJdl6hIA3Dqx6pCgPpxrCaMc0m5FoBogDst8qeNpDw/viewform?usp=sf_link'

const FeedbackButton = () => {
  const handleOpenForm = () => {
    // Open the Google Form in a new tab
    window.open(feedbackFormUrl, '_blank');
  };

  return (
    <Button variant="contained" color="primary" onClick={handleOpenForm}>
      Give Feedback
    </Button>
  );
};

export default FeedbackButton;

