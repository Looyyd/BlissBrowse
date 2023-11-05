import React, {useState} from 'react';
import {
  Box,
  TextareaAutosize,
  Button,
  Container
} from '@mui/material';
import {BlacklistDatastore} from "../../modules/hostname";
import {useAlert} from "../AlertContext";



const BlacklistedSites = () => {
  const blacklistDataStore = new BlacklistDatastore();
  const [blacklist,] = blacklistDataStore.useData();
  const [textAreaValue, setTextAreaValue] = useState<string>("");
  const {showAlert} = useAlert();

  React.useEffect(() => {
    if (blacklist) {
      setTextAreaValue(blacklist.join('\n'));
    }
  }, [blacklist]);
  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextAreaValue(e.target.value);
  };

  const saveHostnames = () => {
    const newBlacklist = textAreaValue.split('\n');
    const dataStore = new BlacklistDatastore();
    dataStore.syncedSet(newBlacklist).then(() => {
      showAlert('success', 'Blacklist updated successfully!');
    });
  };


  return (
    <Container>
      <Box display="flex" flexDirection="column" alignItems="start" gap={2}>
      <Button variant="contained" color="primary" onClick={saveHostnames} id="hostname-save">
        Save
      </Button>
      <Box
        component={TextareaAutosize}
        value={textAreaValue}
        onChange={handleTextAreaChange}
        id={"hostnameBlacklistEditorTextArea"}
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
export default BlacklistedSites;


