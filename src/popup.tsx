import React from 'react';
import { createRoot } from 'react-dom/client';
import ListsDisplay from "./components/ListsDisplay";
import DisableWebsiteButton from "./components/DisableWebsiteButton";
import CustomWordForm from "./components/CustomWordForm";
import NewListForm from "./components/NewListForm";
import OpenOptionsButton from "./components/OpenOptionsButton";
import {ColorTheme} from "./modules/types";
import {createTheme, CssBaseline, ThemeProvider} from "@mui/material";
import {ColorThemeStore} from "./modules/settings";


const Popup: React.FC = () => {
  const colorThemeStore = new ColorThemeStore();
  const colorTheme = colorThemeStore.get();

  const darkMode = colorTheme === ColorTheme.DARK;
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <OpenOptionsButton/>
      <DisableWebsiteButton />
      <CustomWordForm />
      <NewListForm />
      <ListsDisplay />
    </ThemeProvider>
  );
};

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <>
      <React.StrictMode>
        <Popup/>
      </React.StrictMode>
    </>
  );
}
