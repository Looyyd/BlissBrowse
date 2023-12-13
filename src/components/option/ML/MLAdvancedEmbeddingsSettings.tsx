import React, {useEffect, useState} from 'react';
import {
  Button,
  FormControl, FormControlLabel,
  InputLabel,
  MenuItem,
  Select, Switch,
  TextField,
} from "@mui/material";
import {EmbeddingCalculationMethod, MLSubject} from "../../../modules/ml/mlTypes";
import {SelectChangeEvent} from "@mui/material/Select/SelectInput";
import SelectFromEnum from "../../style/SelectFromEnum";



interface MLAdvancedEmbeddingsSettingsProps {
  mlSubject: MLSubject;
  setMLSubject: (subject: MLSubject) => void;
}

const MLAdvancedEmbeddingsSettings: React.FC<MLAdvancedEmbeddingsSettingsProps> = ({ mlSubject, setMLSubject }) => {
  const [localMLSubject, setLocalMLSubject] = useState(mlSubject);

  useEffect(() => {
    setLocalMLSubject(mlSubject);
  }, [mlSubject]);

  const hasThreshold = localMLSubject.embeddingSettings?.threshold !== undefined;
  const [useDefaultThreshold, setUseDefaultThreshold] = useState(!hasThreshold);
  const [threshold, setThreshold] = useState(localMLSubject.embeddingSettings?.threshold?.toString() || '');

  const handleSentenceChange = (index: number, newValue: string) => {
    const newSentences = [...(localMLSubject.sentences || [])];
    newSentences[index] = newValue;
    setLocalMLSubject({ ...localMLSubject, sentences: newSentences });
  };

  const handleAddSentence = () => {
    const newSentences = [...(localMLSubject.sentences || []), ''];
    //TODO: could do something more efficient than removing the embeddings, but this hsould be fine for now since it's cheap
    const newSubject = {...localMLSubject, sentences: newSentences, sentencesEmbeddings: undefined, embeddingAverage: undefined} as MLSubject;
    setLocalMLSubject(newSubject);
  };

  const handleDeleteSentence = (index: number) => {
    const newSentences = [...(localMLSubject.sentences || [])];
    newSentences.splice(index, 1);
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

  const handleCalculationMethodChange = (event: SelectChangeEvent<string>) => {
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
    setMLSubject(localMLSubject);
  };


  return (
    <div>
      {localMLSubject.sentences?.map((sentence, index) => (
        <div key={sentence}>
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
        <SelectFromEnum
          enumObj={EmbeddingCalculationMethod}
          onChange={handleCalculationMethodChange}
          value={localMLSubject.embeddingSettings?.calculationMethod || 'default'}
          includeDefault={true}
        />
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
