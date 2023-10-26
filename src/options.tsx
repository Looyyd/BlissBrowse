import React, {useEffect, useState} from "react";
import {createRoot} from 'react-dom/client';
import TabContainer from "./components/OptionsTabContainer";
import {getColorTheme} from "./modules/settings";
import {ColorTheme} from "./modules/types";
import {DEFAULT_COLOR_THEME} from "./constants";
import {createTheme, CssBaseline, ThemeProvider} from "@mui/material";


const App: React.FC = () => {
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



