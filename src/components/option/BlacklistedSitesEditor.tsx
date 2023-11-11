import React, {useState} from 'react';
import {
  Box,
  Button,
  Container,
  Typography
} from '@mui/material';
import {BlacklistDatastore} from "../../modules/hostname";
import {useAlert} from "../AlertContext";
import {TextEditBox} from "../TextEditBox";
import {Save} from "@mui/icons-material";
import InfoIcon from '@mui/icons-material/Info';



const blacklistDataStore = new BlacklistDatastore();

const BlacklistedSitesEditor = () => {
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
    dataStore.set(newBlacklist).then(() => {
      showAlert('success', 'Blacklist updated successfully!');
    });
  };


  return (
    <Container>
      <Box display="flex" flexDirection="column" alignItems="start" gap={2}>
        <Typography variant="body1" display="flex" alignItems="center" gap={1}>
          <InfoIcon color="primary" />
          This page displays websites on which you have disabled the extension.
        </Typography>
      <Button variant="contained" color="primary" onClick={saveHostnames} id="hostname-save" startIcon={<Save/>}>
        Save
      </Button>
      <TextEditBox textAreaValue={textAreaValue} handleTextAreaChange={handleTextAreaChange} id="hostnameBlacklistEditorTextArea"/>
      </Box>
    </Container>
  );
};
export default BlacklistedSitesEditor;


