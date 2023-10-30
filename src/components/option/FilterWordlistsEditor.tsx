import React, {SyntheticEvent, useEffect, useState} from 'react';
import {ListNamesDataStore, FilterListDataStore} from "../../modules/wordLists";
import {
  InputLabel,
  Button,
  TextareaAutosize,
  Container,
  Box,
  SelectChangeEvent,
  SnackbarCloseReason, Snackbar, Alert
} from '@mui/material';
import ListSelector from "../ListSelector";




const FilterWordlistsEditor = () => {
  const listNamesDataStore = new ListNamesDataStore();
  const [lists,] = listNamesDataStore.useData();
  const [selectedList, setSelectedList] = useState<string>("");
  const [, setWords] = useState<string[]>([]);
  const [textAreaValue, setTextAreaValue] = useState<string>("");
  const [openFeedbackAlert, setOpenFeedbackAlert] = useState(false);

  const [urlSelectedList, setUrlSelectedList] = useState<string>("");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const list = urlParams.get('list');
    if (list) {
      //TODO: this selected list shit is used because a refresh was causing simpler logic to fail,
      // still would be nice to make this better
      // and to remove the url parameters
      setUrlSelectedList(list);
    }
  }, []);

  useEffect(() => {
  const isListSelectedFromURL = urlSelectedList !== "";
  const areListsAvailable = lists && lists.length > 0;
  const isURLListValid = lists && lists.includes(urlSelectedList);
  const isListNotSelected = selectedList === "";

  if (isListSelectedFromURL && areListsAvailable && isURLListValid && isListNotSelected) {
    setSelectedList(urlSelectedList);
  }
}, [urlSelectedList, lists, selectedList]);




  const handleFeedbackAlertClose = (event: Event | SyntheticEvent<Element, Event>, reason: SnackbarCloseReason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenFeedbackAlert(false);
  };

  useEffect(() => {
    const fetchListContent = async (list: string) => {
      const dataStore = new FilterListDataStore(list)
      const fetchedWords = await dataStore.get();
      setWords(fetchedWords);
      setTextAreaValue(fetchedWords.join('\n'));
    }
    fetchListContent(selectedList);

  }, [selectedList]);

  const handleListChange = async (event: SelectChangeEvent<unknown>) => {
    const list = event.target.value as string;
    setSelectedList(list);
  };

  const handleTextAreaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextAreaValue(event.target.value);
  };

  const deleteSelectedList = () => {
    //TODO: confirm dialog
    const list = selectedList;
    if (!list) return;
    listNamesDataStore.deleteList(list).then(() => {
      setSelectedList("");
    });
  }

  const saveWords = () => {
    const newWords = textAreaValue.split('\n');
    const list = selectedList;
    if (!list) return;
    const dataStore = new FilterListDataStore(list);
    dataStore.syncedSet(newWords).then(() => {
      //TODO: more precise feedback(failed to save, etc)
      setOpenFeedbackAlert(true);
    });
  };

  return (
    <>
      <Snackbar
        open={openFeedbackAlert}
        autoHideDuration={3000}
        onClose={handleFeedbackAlertClose}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Words saved successfully!
        </Alert>
      </Snackbar>
      <Container>
        <Box display="flex" flexDirection="column" alignItems="start" gap={2}>
          <InputLabel id="wordlist-label">Wordlist</InputLabel>
          <ListSelector
            lists={lists}
            onListChange={handleListChange}
            value={selectedList}
          />
          <Button variant="contained" color="primary" onClick={saveWords}>
            Save
          </Button>
          <Button variant="contained" color="error" onClick={deleteSelectedList}>
            Delete List
          </Button>
          <Box
            component={TextareaAutosize}
            value={textAreaValue}
            onChange={handleTextAreaChange}
            id={"filterWordlistsEditorTextArea"}
            sx={(theme) => ({
              width: '100%',
              minHeight: '100px',
              padding: '12px',
              borderRadius: '4px',
              borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
              background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
              color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)',
              '&:focus': {
                borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)',
                outline: 'none'
              }
            })}
          />
        </Box>
      </Container>
    </>

  );
};



export default FilterWordlistsEditor;

