import React from 'react';
import {useDataStore} from "../../DataStoreContext";
import {useDataFromStore} from "../../../modules/datastore";
import {Button, List, ListItem, ListItemText, Paper, Typography} from "@mui/material";
import {useAlert} from "../../AlertContext";
import {Delete} from "@mui/icons-material";





const MLSubjectList = () => {
  const { subjectsDataStore } = useDataStore();
  const [subjects] = useDataFromStore(subjectsDataStore);
  const { showAlert } = useAlert();

  const deleteSubject = async (subjectDescription: string) => {
    const key = subjectDescription;
    try {
      await subjectsDataStore.clearKey(key);
      showAlert('success', 'Subject deleted successfully');
    } catch (e) {
      showAlert('error', 'An error occurred while deleting the subject');
      console.error('Error deleting subject:', e);
    }
  }

  if (subjects === null) {
    return (
        <div>No subjects yet</div>
    )
  } else {
    return (
      <Paper style={{
          padding: '20px',
          margin: '20px',
          //border: '2px solid #000', // Adjust color and width as needed
          boxShadow: '0px 0px 10px rgba(0,0,0,0.5)' // Adjust shadow to make it more visible
        }} >
        <Typography variant="h5" style={{ marginBottom: '1rem' }}>Your Subjects</Typography>
        <List>
          {Object.keys(subjects).map((subjectDescription) => (
            <ListItem key={subjectDescription} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <ListItemText primary={<Typography variant="subtitle1" style={{ fontWeight: 'bold' }}>{subjectDescription}</Typography>} />
              <Button
                variant="contained"
                color="error"
                onClick={() => deleteSubject(subjectDescription)}
                startIcon={<Delete style={{ fontSize: 'small' }} />}
              >
                Delete
              </Button>
            </ListItem>
          ))}
        </List>
      </Paper>
    )
  }
};

export default MLSubjectList;
