// AlertComponent.js
import React from 'react';
import { useAlert } from './AlertContext';
import { Snackbar, Alert } from '@mui/material';

const AlertComponent = () => {
  const { alert, closeAlert } = useAlert();

  return (
    <Snackbar open={alert.open} autoHideDuration={3000} onClose={closeAlert}>
      <Alert onClose={closeAlert} severity={alert.type} sx={{ width: '100%' }}>
        {alert.message}
      </Alert>
    </Snackbar>
  );
};

export default AlertComponent;

