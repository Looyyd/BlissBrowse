import React, {useEffect, useState} from 'react';
import {ListNamesDataStore, WordListDataStore} from "../modules/wordLists";
import {InputLabel, Button, TextareaAutosize, Container, Box, SelectChangeEvent} from '@mui/material';
import ListSelector from "./ListSelector";




const WordlistsContent = () => {
  const listNamesDataStore = new ListNamesDataStore();
  const [lists,] = listNamesDataStore.useData([]);
  const [selectedList, setSelectedList] = useState<string>("");
  const [, setWords] = useState<string[]>([]);
  const [textAreaValue, setTextAreaValue] = useState<string>("");


  useEffect(() => {
    const fetchListContent = async (list: string) => {
      const dataStore = new WordListDataStore(list)
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

  const saveWords = () => {
    const newWords = textAreaValue.split('\n');
    const list = selectedList;
    if (!list) return;
    const dataStore = new WordListDataStore(list);
    dataStore.syncedSet(newWords);
  };

  return (
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
        <Box
          component={TextareaAutosize}
          value={textAreaValue}
          onChange={handleTextAreaChange}
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

  );
};



export default WordlistsContent;

