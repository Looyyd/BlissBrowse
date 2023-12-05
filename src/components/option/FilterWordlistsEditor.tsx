import React, {useEffect, useState} from 'react';
import {
  Button,
  Container,
  Box,
  SelectChangeEvent, Typography,
} from '@mui/material';
import ListSelector from "../ListSelector";
import {useAlert} from "../AlertContext";
import {TextEditBox} from "../TextEditBox";
import {Delete, Save} from "@mui/icons-material";
import NewListForm from "../popup/NewListForm";
import {useDataStore} from "../DataStoreContext";
import {FilterListDataStore} from "../../modules/wordLists";
import {useDataFromStore} from "../../modules/datastore";




// Custom hook for managing URL parameters
const useUrlParameter = (param:string) => {
  const [paramValue, setParamValue] = useState("");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const value = urlParams.get(param);
    if (value) {
      setParamValue(value);
    }
  }, [param]);

  return paramValue;
};

// Custom hook for managing list selection and data
const useSelectedListData = (initialListName: string): [string, React.Dispatch<React.SetStateAction<string>>, string[]] => {
  const [selectedList, setSelectedList] = useState(initialListName);
  const [words, setWords] = useState<string[]>([]);

  useEffect(() => {
    if (!selectedList || selectedList === ""){
      setWords([]);
      return;
    }

    const fetchData = async () => {
      const dataStore = new FilterListDataStore(selectedList);
      const fetchedWords = await dataStore.getWordList();
      setWords(fetchedWords);
    };

    fetchData();
  }, [selectedList]);

  return [selectedList, setSelectedList, words];
};


// Main component
const FilterWordlistsEditor = () => {
  const { listNamesDataStore } = useDataStore();
  const [lists] = useDataFromStore(listNamesDataStore);
  const urlSelectedList = useUrlParameter('list');
  const [selectedList, setSelectedList, words] = useSelectedListData(urlSelectedList);
  const [textAreaValue, setTextAreaValue] = useState(words.join('\n'));
  const { showAlert } = useAlert();

  useEffect(() => {
    if (!urlSelectedList) return;
      setSelectedList(urlSelectedList);
  }, [urlSelectedList]);

  useEffect(() => {
    setTextAreaValue(words.join('\n'));
  }, [words]);

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
    listNamesDataStore.deleteList(list)
      .then(() => {
      setSelectedList("");
      showAlert('success', 'List deleted successfully!');
    })
      .catch((e) => {
        showAlert('error', 'An error occurred while deleting the list');
        console.error('Error deleting list:', e);
      });
  }

  const saveWords = () => {
    const rawNewWords = textAreaValue.split('\n');
    const newWords = rawNewWords.filter((word) => word.trim() !== '');
    const list = selectedList;
    if (!list){
      showAlert('warning', 'Please select a list before saving');
      return;
    }
    const dataStore = new FilterListDataStore(list);
    dataStore.setWordList(newWords).then(() => {
      showAlert('success', 'List updated successfully!');
    });
  };

  return (
    <>
      <Container>
        <NewListForm/>
        {/* separator */}
        <Box sx={{height: 20}}/>
        {/* separator */}
        <Box display="flex" flexDirection="column" alignItems="start" gap={2}>
          <Typography variant="h6">Edit a list</Typography>
          <ListSelector
            lists={lists}
            onListChange={handleListChange}
            value={selectedList}
          />
          <Button variant="contained" color="primary" onClick={saveWords} startIcon={<Save/>}>
            Save
          </Button>
          <Button variant="contained" color="error" onClick={deleteSelectedList} startIcon={<Delete/>}>
            Delete List
          </Button>
          <TextEditBox textAreaValue={textAreaValue} handleTextAreaChange={handleTextAreaChange} id={"filterWordlistsEditorTextArea"}/>
        </Box>
      </Container>
    </>

  );
};



export default FilterWordlistsEditor;

