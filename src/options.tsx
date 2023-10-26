import React from "react";
import {createRoot} from 'react-dom/client';
import TabContainer from "./components/OptionsTabContainer";
import {getColorTheme} from "./modules/settings";
import {ColorTheme} from "./modules/types";
import {createTheme, CssBaseline, ThemeProvider} from "@mui/material";


const App: React.FC = () => {
  const colorTheme = getColorTheme();


  const darkMode = colorTheme === ColorTheme.DARK;
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <TabContainer />
    </ThemeProvider>
  );
};

// Using createRoot API
const root = document.getElementById('root');
if (root) {
  const rootContainer = createRoot(root);
  rootContainer.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}



