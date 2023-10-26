import React, {useEffect, useState} from 'react';
import { createRoot } from 'react-dom/client';
import ListsDisplay from "./components/ListsDisplay";
import DisableWebsiteButton from "./components/DisableWebsiteButton";
import CustomWordForm from "./components/CustomWordForm";
import NewListForm from "./components/NewListForm";
import OpenOptionsButton from "./components/OpenOptionsButton";
import {ColorTheme} from "./modules/types";
import {DEFAULT_COLOR_THEME} from "./constants";
import {getColorTheme} from "./modules/settings";
import {createTheme, ThemeProvider} from "@mui/material";


const Popup: React.FC = () => {
  const [colorTheme, setColorTheme] = useState<ColorTheme>(DEFAULT_COLOR_THEME);
  useEffect(() => {
    async function init() {
      const fethedTheme= await getColorTheme();
      setColorTheme(fethedTheme);
    }
    init();
  }, []);

  const darkMode = colorTheme === ColorTheme.DARK;
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
    },
  });

  return (
    <ThemeProvider theme={theme}>
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
