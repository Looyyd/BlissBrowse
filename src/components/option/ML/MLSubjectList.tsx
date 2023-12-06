import React, {useEffect} from 'react';
import {useDataStore} from "../../DataStoreContext";
import {useDataFromStore} from "../../../modules/datastore";
import {Button, List, ListItem, ListItemText, MenuItem, Paper, Select, Typography} from "@mui/material";
import {useAlert} from "../../AlertContext";
import {Delete} from "@mui/icons-material";
import {FilterAction} from "../../../modules/types";
import {MLFilterMethod, MLSubject, SubjectsStore} from "../../../modules/ml/mlTypes";
import {SelectChangeEvent} from "@mui/material/Select/SelectInput";



const possibleFilterActions = Object.keys(FilterAction);
possibleFilterActions.push('default');

const possibleFilterMethods = Object.keys(MLFilterMethod);
possibleFilterMethods.push('default');

const MLSubjectList = () => {
  const { subjectsDataStore } = useDataStore();
  const [subjectsKeyValueStore] = useDataFromStore(subjectsDataStore);
  const { showAlert } = useAlert();
  const [ subjects, setSubjects ] = React.useState<MLSubject[]>([]);


  useEffect(() => {
    if(subjectsKeyValueStore === null) {
      return;
    }
    const sub = Object.values(subjectsKeyValueStore).map((keyValue) => {
      return keyValue.value;
    });
    setSubjects(sub);
  }, [subjectsKeyValueStore]);



  const deleteSubject = async (subjectDescription: string) => {
    const key = subjectDescription;
    try {
      await subjectsDataStore.clearKey(key);
      //hack because i don't know why the stat wasn't updating
      // the subject was being removed but then readded, but locally because disapeared on refersh
      setSubjects(subjects.filter((subject) => subject.description !== subjectDescription));
      showAlert('success', 'Subject deleted successfully');
    } catch (e) {
      showAlert('error', 'An error occurred while deleting the subject');
      console.error('Error deleting subject:', e);
    }
  }

  const changeDefaultAction = async (subject: MLSubject, event: SelectChangeEvent<unknown>) => {
    let action: string | undefined = event.target.value as string;
    if(action === 'default') {
      action = undefined;
    }
    const newSubject : MLSubject = {...subject, filterAction: action as FilterAction};
    try {
      await subjectsDataStore.set(subject.description, newSubject);
      showAlert('success', 'Default action updated successfully!');
    } catch (e) {
      showAlert('error', 'An error occurred while updating the default action');
    }
  }

  const changeDefaultFilterMethod = async (subject: MLSubject, event: SelectChangeEvent<unknown>) => {
    let method: string | undefined = event.target.value as string;
    if(method === 'default') {
      method = undefined;
    }
    const newSubject : MLSubject = {...subject, filterMethod: method as MLFilterMethod};
    try {
      await subjectsDataStore.set(subject.description, newSubject);
      showAlert('success', 'Default filter method updated successfully!');
    } catch (e) {
      showAlert('error', 'An error occurred while updating the default filter method');
    }
  }

  if (subjectsKeyValueStore === null) {
    return (
        <div>No subjects yet</div>
    )
  } else {
    return (
      <Paper style={{
          padding: '20px',
          margin: '20px',
          boxShadow: '0px 0px 10px rgba(0,0,0,0.5)'
        }}>
        <Typography variant="h5" style={{ marginBottom: '1rem' }}>Your Subjects</Typography>
        <List>
          {subjects.map((subject) => {
            const subjectDescription = subject.description;
            return (
              <ListItem key={subject.description} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <ListItemText primary={<Typography variant="subtitle1" style={{ fontWeight: 'bold' }}>{subjectDescription}</Typography>} />


                <Typography variant="subtitle1" style={{ marginRight: '1rem' }}>Filter Method:</Typography>
                <Select
                  value={subject?.filterMethod || 'default'}
                  onChange={(event) => changeDefaultFilterMethod(subject, event)}
                  style={{ marginRight: '1rem' }}
                >
                  {possibleFilterMethods.map((action) => (
                    <MenuItem key={action} value={action}>{action}</MenuItem>
                  ))}
                </Select>

                <Typography variant="subtitle1" style={{ marginRight: '1rem' }}>Filter Action:</Typography>
                <Select
                  value={subject?.filterAction || 'default'}
                  onChange={(event) => changeDefaultAction(subject, event)}
                  style={{ marginRight: '1rem' }}
                >
                  {possibleFilterActions.map((action) => (
                    <MenuItem key={action} value={action}>{action}</MenuItem>
                  ))}
                </Select>

                <Button
                  variant="contained"
                  color="error"
                  onClick={() => deleteSubject(subjectDescription)}
                  startIcon={<Delete style={{ fontSize: 'small' }} />}
                >
                  Delete
                </Button>
              </ListItem>
            )
          })}
        </List>
      </Paper>
    )
  }
};

export default MLSubjectList;
