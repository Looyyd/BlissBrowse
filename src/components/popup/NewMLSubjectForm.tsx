import React, {FormEvent, useState} from "react";
import {useDataStore} from "../DataStoreContext";
import {useAlert} from "../AlertContext";
import {Button, FormControl, TextField, Typography} from "@mui/material";
import {Add} from "@mui/icons-material";
import {createNewSubject} from "../../modules/ml";


const NewMLSubjectForm: React.FC = () => {
  const [subjectDescription, setSubjectDescription] = useState<string>('');
  const { showAlert } = useAlert();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!subjectDescription.trim()) {
      showAlert('warning', 'Please enter a subject description');
      return;
    }

    try {
      setSubjectDescription('');
      await createNewSubject(subjectDescription);
      showAlert('success', 'Subject created successfully!');
    } catch (error) {
      console.error('Error creating subject:', error);
      showAlert('error', 'Error creating subject');
    }
  };


  return (
    <>
      <Typography variant="h6">Create a new subject to filter</Typography>
      <form onSubmit={handleSubmit}>
        <FormControl fullWidth margin="normal">
          <TextField
            id="subjectDescriptionInputField"
            type="text"
            placeholder="Enter a subject description"
            value={subjectDescription}
            onChange={(e) => setSubjectDescription(e.target.value)}
            autoComplete="off"
          />
        </FormControl>

        <Button type="submit" variant="contained" color="primary" id="newSubjectSubmit" startIcon={<Add/>}>
          Add Subject
        </Button>
      </form>
    </>
  );
};

export default NewMLSubjectForm;
