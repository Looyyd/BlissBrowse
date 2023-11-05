import React, { createContext, useContext, useState, ReactNode, FunctionComponent } from 'react';

// Define the type for the alert object
type AlertType = 'success' | 'info' | 'warning' | 'error';

interface AlertState {
  open: boolean;
  type: AlertType;
  message: string;
}

// Define the context type
interface AlertContextType {
  alert: AlertState;
  showAlert: (type: AlertType, message: string) => void;
  closeAlert: () => void;
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
  const [alert, setAlert] = useState<AlertState>({ open: false, type: 'success', message: '' });

  const showAlert = (type: AlertType, message: string) => {
    setAlert({ open: true, type, message });
  };

  const closeAlert = () => {
    setAlert((prev) => ({ ...prev, open: false }));
  };

  return (
    <AlertContext.Provider value={{ alert, showAlert, closeAlert }}>
      {children}
    </AlertContext.Provider>
  );
};
