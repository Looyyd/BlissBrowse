import React from 'react';
import { createRoot } from 'react-dom/client';
import ListsDisplay from "./components/popup/ListsDisplay";
import DisableWebsiteButton from "./components/popup/DisableWebsiteButton";
import NewFilterWordForm from "./components/popup/NewFilterWordForm";
import NewListForm from "./components/popup/NewListForm";
import OpenOptionsButton from "./components/popup/OpenOptionsButton";
import {ColorTheme} from "./modules/types";
import {Box, Container, CssBaseline, ThemeProvider} from "@mui/material";
//import {ColorThemeStore} from "./modules/settings";
import {AlertProvider} from "./components/AlertContext";
import AlertComponent from "./components/AlertComponent";
import FeedbackButton from "./components/FeedbackButton";
import {lightTheme} from "./themes";
import ExtensionTitle from "./components/ExtensionTitle";
import {DataStoreProvider} from "./components/DataStoreContext";
import {useDataFromStore} from "./modules/datastore";
import {ML_FEATURES} from "./constants";
import NewMLSubjectForm from "./components/popup/NewMLSubjectForm";


const Popup: React.FC = () => {
  //const colorThemeStore = new ColorThemeStore();
  //const [colorTheme] = useDataFromStore(colorThemeStore);

  //const darkMode = colorTheme === ColorTheme.DARK;

  return (
      <Container >
        <CssBaseline />
        <ExtensionTitle />
        <Box display="flex" flexDirection="row" justifyContent="center" flexWrap="wrap">
          <FeedbackButton />
          <OpenOptionsButton/>
          <DisableWebsiteButton />
        </Box>
        <NewFilterWordForm />
        <NewListForm />
        {ML_FEATURES ? <NewMLSubjectForm />: <></> }
        <ListsDisplay />
      </Container>
  );
};

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <>
      <React.StrictMode>
        <DataStoreProvider>
          <ThemeProvider theme={lightTheme}>
            <AlertProvider>
              <AlertComponent />
              <Popup/>
            </AlertProvider>
          </ThemeProvider>
        </DataStoreProvider>
      </React.StrictMode>
    </>
  );
}
