import React from "react";
import {createRoot} from 'react-dom/client';
import TabContainer from "./components/option/OptionsTabContainer";
import {ColorThemeStore} from "./modules/settings";
import {ColorTheme} from "./modules/types";
import {createTheme, CssBaseline, ThemeProvider} from "@mui/material";
import AlertComponent from "./components/AlertComponent";
import {AlertProvider} from "./components/AlertContext";
import {lightTheme} from "./themes";
import {DataStoreProvider} from "./components/DataStoreContext";


const App: React.FC = () => {
  const colorThemeStore = new ColorThemeStore();
  const [colorTheme,] = colorThemeStore.useData(colorThemeStore.get());


  const darkMode = colorTheme === ColorTheme.DARK;
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
    },
  });

  return (
    <>
      <CssBaseline />
      <TabContainer />
    </>
  );
};

// Using createRoot API
const root = document.getElementById('root');
if (root) {
  const rootContainer = createRoot(root);
  rootContainer.render(
    <React.StrictMode>
      <DataStoreProvider>
        <ThemeProvider theme={lightTheme}>
          <AlertProvider>
            <AlertComponent />
            <App />
          </AlertProvider>
        </ThemeProvider>
      </DataStoreProvider>
    </React.StrictMode>
  );
}



