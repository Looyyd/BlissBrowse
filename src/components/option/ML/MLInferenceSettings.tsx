import React, {useEffect, useState} from 'react';
import {useDataStore} from "../../DataStoreContext";
import {useDataFromStore} from "../../../modules/datastore";
import {useAlert} from "../../AlertContext";
import {Button, FormControl, InputLabel, MenuItem, Select, TextField, Typography} from "@mui/material";
import {SelectChangeEvent} from "@mui/material/Select/SelectInput";
import {Save} from "@mui/icons-material";
import {llmServerTypes} from "../../../modules/ml/mlTypes";
import PaperBlissBrowse from "../../style/PaperBlissBrowse";


//TODO: can remove hard-coded and get from type definition?
const llmServerTypes: llmServerTypes[] = ['openai', 'local', 'none'];
const embedServerTypes: llmServerTypes[] = ['openai', 'none'];


const MLInferenceSettings = () => {
  const { inferenceSettingsDataStore } = useDataStore();
  const [settings] = useDataFromStore(inferenceSettingsDataStore);
  const { showAlert } = useAlert();

  // Local state to manage form data
  const [localSettings, setLocalSettings] = useState(settings);
  // Add state hooks for field visibility
  const [showEmbedURL, setShowEmbedURL] = useState(false);
  const [showEmbedToken, setShowEmbedToken] = useState(false);
  const [showLLMURL, setShowLLMURL] = useState(false);
  const [showLLMToken, setShowLLMToken] = useState(false);

  useEffect(() => {
    if(localSettings === null) {
      return;
    }
    // Update visibility based on selection
    //setShowEmbedURL(localSettings.embedType === "no");
    setShowEmbedToken(localSettings.embedType === "openai");
    setShowLLMURL(localSettings.llmType === "local");
    setShowLLMToken(localSettings.llmType === "openai");
  }, [localSettings]);

  // Update local state when settings change
  useEffect(() => {
    console.log('settings changed:', settings)
    setLocalSettings(settings);
  }, [settings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if(localSettings === null) {
      return;
    }
    const { name, value } = e.target;
    setLocalSettings({ ...localSettings, [name]: value });
  };

  const handleSelectChange = (e: SelectChangeEvent<llmServerTypes>) => {
    if(localSettings === null) {
      return;
    }
    const name = e.target.name || '';
    const value = e.target.value as llmServerTypes;
    setLocalSettings({ ...localSettings, [name]: value });
  };

  // You will implement this function
  const handleSave = () => {
    // Implement save functionality
    if(localSettings === null) {
      return;
    }
    inferenceSettingsDataStore.set(localSettings).then(() => {
      showAlert("success", 'Settings saved successfully!');
    }).catch((e) => {
      showAlert("error", 'An error occurred while saving settings');
      console.error('Error saving settings:', e);
    });
  };

  if (settings === null || localSettings === null) {
    return (
        <div>Loading</div>
    )
  }

  return (
    <PaperBlissBrowse>
      <Typography variant="h5">Inference server settings</Typography>
      <Typography variant="h6">Machine Learning Embedding Inference Server Settings</Typography>
      <FormControl fullWidth margin="normal">
        <InputLabel>Type</InputLabel>
        <Select
          name="embedType"
          value={localSettings.embedType}
          onChange={handleSelectChange}
        >
          {embedServerTypes.map((type) => (
            <MenuItem key={type} value={type}>{type}</MenuItem>
          ))}
        </Select>
      </FormControl>
      {showEmbedURL && (
        <TextField
          label="URL"
          name="embedURL"
          value={localSettings.embedURL || ''}
          onChange={handleInputChange}
          fullWidth
          type="url"
          margin="normal"
        />
      )}
      {showEmbedToken && (
        <TextField
          label="Token"
          name="embedToken"
          value={localSettings.embedToken || ''}
          onChange={handleInputChange}
          fullWidth
          type="password"
          margin="normal"
        />
      )}
      <Typography variant="h6">Machine Learning LLM Inference Server Settings</Typography>
      <FormControl fullWidth margin="normal">
        <InputLabel>Type</InputLabel>
        <Select
          name="llmType"
          value={localSettings.llmType}
          onChange={handleSelectChange}
        >
          {llmServerTypes.map((type) => (
            <MenuItem key={type} value={type}>{type}</MenuItem>
          ))}
        </Select>
      </FormControl>
      {showLLMURL && (
        <TextField
          label="URL"
          name="llmURL"
          value={localSettings.llmURL || ''}
          onChange={handleInputChange}
          fullWidth
          type="url"
          margin="normal"
        />
      )}
      {showLLMToken && (
        <TextField
          label="Token"
          name="llmToken"
          value={localSettings.llmToken || ''}
          onChange={handleInputChange}
          fullWidth
          type="password"
          margin="normal"
        />
      )}
      <Button variant="contained" color="primary" onClick={handleSave} style={{ marginTop: '20px' }} startIcon={<Save/>}>
        Save
      </Button>
    </PaperBlissBrowse>
  );

};


export default MLInferenceSettings;
