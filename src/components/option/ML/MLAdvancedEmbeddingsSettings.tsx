import React, {useEffect, useState} from 'react';
import {
  Button,
  FormControl, FormControlLabel,
  InputLabel,
  MenuItem, Radio,
  Select, Switch,
  TextField,
} from "@mui/material";
import {DEFAULT_EMBEDDING_SETTINGS, EmbeddingCalculationMethod, MLSubject} from "../../../modules/ml/mlTypes";
import {SelectChangeEvent} from "@mui/material/Select/SelectInput";


const possibleCalculationMethods = Object.keys(EmbeddingCalculationMethod);
possibleCalculationMethods.push('default');

interface MLAdvancedEmbeddingsSettingsProps {
  mlSubject: MLSubject;
  setMLSubject: (subject: MLSubject) => void;
}

const MLAdvancedEmbeddingsSettings: React.FC<MLAdvancedEmbeddingsSettingsProps> = ({ mlSubject, setMLSubject }) => {
  const [localMLSubject, setLocalMLSubject] = useState(mlSubject);

  useEffect(() => {
    setLocalMLSubject(mlSubject); // Update local state when mlSubject prop changes
  }, [mlSubject]);

  const hasThreshold = localMLSubject.embeddingSettings?.threshold !== undefined;
  const [useDefaultThreshold, setUseDefaultThreshold] = useState(!hasThreshold);
  const [threshold, setThreshold] = useState(localMLSubject.embeddingSettings?.threshold?.toString() || '');

  const handleSentenceChange = (index: number, newValue: string) => {
    const newSentences = [...(localMLSubject.sentences || [])];
    newSentences[index] = newValue;
    setLocalMLSubject({ ...localMLSubject, sentences: newSentences });
  };

  /*
  const handleThresholdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSettings = { ...localMLSubject.embeddingSettings, threshold: Number(event.target.value) };
    setLocalMLSubject({ ...localMLSubject, embeddingSettings: newSettings });
  };
  */
  const handleAddSentence = () => {
    const newSentences = [...(localMLSubject.sentences || []), '']; // Add an empty string as a new sentence
    //TODO: could do something more efficient than removing the embeddings, but this hsould be fine for now since it's cheap
    const newSubject = {...localMLSubject, sentences: newSentences, sentencesEmbeddings: undefined, embeddingAverage: undefined} as MLSubject;
    setLocalMLSubject(newSubject);
  };

  const handleDeleteSentence = (index: number) => {
    const newSentences = [...(localMLSubject.sentences || [])];
    newSentences.splice(index, 1); // Remove the sentence at the specified index
    //TODO: could do something more efficient than removing the embeddings, but this hsould be fine for now since it's cheap
    const newSubject = {...localMLSubject, sentences: newSentences, sentencesEmbeddings: undefined, embeddingAverage: undefined};
    setLocalMLSubject(newSubject);
  };

  const handleThresholdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newThresholdValue = event.target.value;

    // Update the local threshold state to reflect the user's input
    setThreshold(newThresholdValue);

    const newThreshold = newThresholdValue === '' ? undefined : Number(newThresholdValue);
    const newSettings = { ...localMLSubject.embeddingSettings, threshold: newThreshold };
    setLocalMLSubject({ ...localMLSubject, embeddingSettings: newSettings });
  };

  const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUseDefaultThreshold(event.target.checked);
    if (!event.target.checked) {
      setThreshold('');
    } else {
      const newSettings = { ...localMLSubject.embeddingSettings, threshold: undefined };
      setLocalMLSubject({ ...localMLSubject, embeddingSettings: newSettings });
    }
  };

  const handleCalculationMethodChange = (event: SelectChangeEvent<EmbeddingCalculationMethod | "default">) => {
    if(event.target.value === 'default') {
      const newSettings = { ...localMLSubject.embeddingSettings, calculationMethod: undefined };
      setLocalMLSubject({ ...localMLSubject, embeddingSettings: newSettings });
      return;
    }
    const newMethod = event.target.value as EmbeddingCalculationMethod;
    const newSettings = { ...localMLSubject.embeddingSettings, calculationMethod: newMethod };
    setLocalMLSubject({ ...localMLSubject, embeddingSettings: newSettings });
  };

  const handleSave = () => {
    setMLSubject(localMLSubject); // Update parent state with local state
  };


  return (
    <div>
      {localMLSubject.sentences?.map((sentence, index) => (
        <div key={index}>
          <TextField
            label={`Sentence ${index + 1}`}
            value={sentence}
            onChange={(e) => handleSentenceChange(index, e.target.value)}
            fullWidth
            margin="normal"
          />
          <Button onClick={() => handleDeleteSentence(index)} color="error" variant="contained">
            Delete Sentence {index + 1}
          </Button>
        </div>
      ))}
      <Button onClick={handleAddSentence} color="success" variant="contained">
        Add Sentence
      </Button>

      <FormControl fullWidth margin="normal">
        <InputLabel>Calculation Method</InputLabel>
        <Select
          value={localMLSubject.embeddingSettings?.calculationMethod || 'default'}
          onChange={handleCalculationMethodChange}
        >
          {possibleCalculationMethods.map((method) => (
            <MenuItem key={method} value={method}>
              {method}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <div>
        <FormControlLabel
          control={
            <Switch
              checked={useDefaultThreshold}
              onChange={handleRadioChange}
              name="use-default-threshold"
            />
          }
          label="Use Default Threshold"
        />
        <TextField
          label="Threshold"
          type="number"
          value={threshold}
          onChange={handleThresholdChange}
          fullWidth
          margin="normal"
          disabled={useDefaultThreshold}
        />
      </div>
      <Button onClick={handleSave} color="primary" variant="contained">
        Save Changes
      </Button>
    </div>
  );
};

export default MLAdvancedEmbeddingsSettings;
