import React, {useEffect, useState} from 'react';
import {getLists, getSavedWordsFromList, saveList} from "../modules/wordLists";
import {InputLabel, Button, TextareaAutosize, Container, Box, SelectChangeEvent} from '@mui/material';
import ListSelector from "./ListSelector";




const WordlistsContent = () => {
  const [lists, setLists] = useState<string[]>([]);
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [words, setWords] = useState<string[]>([]);
  const [textAreaValue, setTextAreaValue] = useState<string>("");

  const setNewList = async (list: string) => {
    setSelectedList(list);
    const fetchedWords = await getSavedWordsFromList(list);
    setWords(fetchedWords);
    setTextAreaValue(fetchedWords.join('\n'));
  }

  useEffect(() => {
    async function fetchData() {
      const lists = await getLists();
      setLists(lists);
      if (lists.length > 0) {
        await setNewList(lists[0]);
      }
    }
    fetchData();
  }, []);

  const handleListChange = async (event: SelectChangeEvent<unknown>) => {
    const list = event.target.value as string;
    await setNewList(list);
  };

  const handleTextAreaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextAreaValue(event.target.value);
  };

  const saveWords = () => {
    const newWords = textAreaValue.split('\n');
    const list = selectedList;
    if (!list) return;
    saveList(newWords, list);
  };

  return (
    <Container>
      <Box display="flex" flexDirection="column" alignItems="start" gap={2}>
        <InputLabel id="wordlist-label">Wordlist</InputLabel>
        <ListSelector lists={lists} onListChange={handleListChange}/>
        <Button variant="contained" color="primary" onClick={saveWords}>
          Save
        </Button>
        <Box
          component={TextareaAutosize}
          value={textAreaValue}
          onChange={handleTextAreaChange}
          sx={{
            width: '100%',
            minHeight: '100px',
            padding: '12px',
            borderRadius: '4px',
            borderColor: 'rgba(0, 0, 0, 0.23)',
            '&:focus': {
              borderColor: 'rgba(0, 0, 0, 0.87)',
              outline: 'none'
            }
          }}
        />
      </Box>
    </Container>

  );
};



export default WordlistsContent;

