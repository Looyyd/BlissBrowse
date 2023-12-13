import React, {useEffect, useState} from 'react';
import {
  Button,
  Container,
  Box,
  SelectChangeEvent, Typography, MenuItem, Select,
} from '@mui/material';
import ListSelector from "../ListSelector";
import {useAlert} from "../AlertContext";
import {TextEditBox} from "../style/TextEditBox";
import {Delete, Save} from "@mui/icons-material";
import NewListForm from "../popup/NewListForm";
import {useDataStore} from "../DataStoreContext";
import {FilterList, FilterListDataStore} from "../../modules/wordLists";
import {useDataFromStore} from "../../modules/datastore";
import {FilterAction} from "../../modules/types";
import PaperBlissBrowse from "../style/PaperBlissBrowse";




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
const useSelectedListData = (initialListName: string): [string, React.Dispatch<React.SetStateAction<string>>, string[], FilterList | null] => {
  const [selectedList, setSelectedList] = useState(initialListName);
  const [words, setWords] = useState<string[]>([]);
  const [filterList, setFilterList] = useState<FilterList | null>(null)

  useEffect(() => {
    if (!selectedList || selectedList === ""){
      setWords([]);
      return;
    }

    const fetchData = async () => {
      const dataStore = new FilterListDataStore(selectedList);
      const fetchedWords = await dataStore.getWordList();
      setWords(fetchedWords);
      const filterList = await dataStore.get();
      setFilterList(filterList);
    };

    fetchData();
  }, [selectedList]);

  return [selectedList, setSelectedList, words, filterList];
};


// Main component
const FilterWordlistsEditor = () => {
  const { listNamesDataStore } = useDataStore();
  const [lists] = useDataFromStore(listNamesDataStore);
  const urlSelectedList = useUrlParameter('list');
  const [selectedList, setSelectedList, words, selectedFilterList] = useSelectedListData(urlSelectedList);
  const [textAreaValue, setTextAreaValue] = useState(words.join('\n'));

  const possibleFilterActions = Object.keys(FilterAction);
  possibleFilterActions.push('default');
  const [selectedFilterAction, setSelectedFilterAction] = useState('' as string);

  useEffect(() => {
    if (!selectedFilterList) return;
    setSelectedFilterAction(selectedFilterList.filterAction || 'default');
  }, [selectedFilterList]);

  const { showAlert } = useAlert();

  useEffect(() => {
    if (!urlSelectedList) return;
      setSelectedList(urlSelectedList);
  }, [urlSelectedList]);

  useEffect(() => {
    setTextAreaValue(words.join('\n'));
  }, [words]);

  const handleFilterActionChange = async (event: SelectChangeEvent<unknown>) => {
    const action = event.target.value as string;
    setSelectedFilterAction(action);
    const datastore = new FilterListDataStore(selectedList);
    try{
      if (action === 'default') {
        await datastore.setFilterAction(undefined)
      } else {
        await datastore.setFilterAction(action as FilterAction);
      }
      showAlert('success', 'Filter action updated successfully!');
    } catch (e) {
      showAlert('error', 'An error occurred while updating the filter action');
    }
  }

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
        <PaperBlissBrowse>
          <NewListForm/>
        </PaperBlissBrowse>
        {/* separator */}
        <Box sx={{height: 20}}/>
        <PaperBlissBrowse>
          <Box display="flex" flexDirection="column" alignItems="start" gap={2}>
            <Typography variant="h5">Edit a list</Typography>
            <ListSelector
              lists={lists}
              onListChange={handleListChange}
              value={selectedList}
            />
            { selectedList && (
              <>
                <Typography variant="h5">Filter Action</Typography>
                <Select
                  onChange={handleFilterActionChange}
                  value={selectedFilterAction}
                >
                  {possibleFilterActions.map((action) => (
                    <MenuItem value={action}>{action}</MenuItem>
                  ))}
                </Select>
                <Button variant="contained" color="primary" onClick={saveWords} startIcon={<Save/>}>
                  Save
                </Button>
                <Button variant="contained" color="error" onClick={deleteSelectedList} startIcon={<Delete/>}>
                  Delete List
                </Button>
                <TextEditBox textAreaValue={textAreaValue} handleTextAreaChange={handleTextAreaChange} id={"filterWordlistsEditorTextArea"}/>
              </>
            )
            }
          </Box>
        </PaperBlissBrowse>
    </Container>
</>

  );
};



export default FilterWordlistsEditor;

