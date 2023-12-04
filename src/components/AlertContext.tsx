import React, {createContext, useContext, useState, ReactNode, FunctionComponent, useEffect} from 'react';
import AlertComponent from "./AlertComponent";

// Define the type for the alert object
type AlertType = 'success' | 'info' | 'warning' | 'error';

interface AlertState {
  open: boolean;
  type: AlertType;
  message: string;
}

// Define the context type
interface AlertContextType {
  alerts: AlertState[];
  showAlert: (type: AlertType, message: string) => void;
  closeAlert: (number: number) => void;
}

// Create a context with a default value and typed correctly
const AlertContext = createContext<AlertContextType | undefined>(undefined);

interface AlertProviderProps {
  children: ReactNode;
}

// Custom hook must handle the case where context is undefined
export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider: FunctionComponent<AlertProviderProps> = ({ children }) => {
  // Use an array to store multiple alerts
  const [alerts, setAlerts] = useState<AlertState[]>([]);

  // Function to show a new alert
  const showAlert = (type: AlertType, message: string) => {
    setAlerts(prevAlerts => [...prevAlerts, { open: true, type, message }]);
  };

  // Function to close an alert
  // This function now removes the alert from the array
  const closeAlert = (index: number) => {
    setAlerts(prevAlerts => prevAlerts.filter((_, i) => i !== index));
  };

  // Optionally, you can add logic to automatically close alerts after a certain duration
  useEffect(() => {
    if (alerts.length > 0) {
      const timer = setTimeout(() => {
        closeAlert(0); // Automatically close the oldest alert
      }, 5000); // Adjust the time as needed

      return () => clearTimeout(timer);
    }
  }, [alerts]);

  return (
    <AlertContext.Provider value={{ alerts, showAlert, closeAlert }}>
      {children}
      {/* Render each alert. You can customize the rendering as needed */}
      <AlertComponent />
    </AlertContext.Provider>
  );
};

