// AlertComponent.js
import React from 'react';
import { useAlert } from './AlertContext';
import { Snackbar, Alert } from '@mui/material';

/* Component that displays a snackbar alert when the alert context is updated */
const AlertComponent = () => {
  const { alerts, closeAlert } = useAlert();

    return (
    <div style={{ position: 'fixed', bottom: 0, right: 0, zIndex: 1000, maxWidth: '100%' }}>
      {alerts.map((alert, index) => (
        <Snackbar
          key={index}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          open={alert.open}
          autoHideDuration={3000}
          onClose={() => closeAlert(index)}
          style={{ marginBottom: `${index * 70}px` }} // Adjust spacing between alerts
        >
          <Alert
            onClose={() => closeAlert(index)}
            severity={alert.type}
            sx={{ width: '100%' }}
          >
            {alert.message}
          </Alert>
        </Snackbar>
      ))}
    </div>
  );

};

export default AlertComponent;


