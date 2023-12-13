import React, {useEffect, useState} from 'react';
import {useDataStore} from "../../DataStoreContext";
import {useDataFromStore} from "../../../modules/datastore";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Tooltip,
  Typography
} from "@mui/material";
import {useAlert} from "../../AlertContext";
import {Delete, Settings} from "@mui/icons-material";
import {FilterAction} from "../../../modules/types";
import {MLFilterMethod, MLSubject} from "../../../modules/ml/mlTypes";
import {SelectChangeEvent} from "@mui/material/Select/SelectInput";
import MLAdvancedEmbeddingsSettings from "./MLAdvancedEmbeddingsSettings";
import PaperBlissBrowse from "../../style/PaperBlissBrowse";
import SelectFromEnum from "../../style/SelectFromEnum";



const MLSubjectList = () => {
  const { subjectsDataStore } = useDataStore();
  const [subjectsKeyValueStore] = useDataFromStore(subjectsDataStore);
  const { showAlert } = useAlert();
  const [ subjects, setSubjects ] = React.useState<MLSubject[]>([]);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<null | MLSubject>(null);

  const openEditor = (subject: MLSubject) => {
    setSelectedSubject(subject);
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
  };


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
    try {
      await subjectsDataStore.clearKey(subjectDescription);
      // hack because i don't know why the stat wasn't updating
      // the subject was being removed but then readded, but locally because disapeared on refersh
      setSubjects(subjects.filter((subject) => subject.description !== subjectDescription));
      showAlert('success', 'Subject deleted successfully');
    } catch (e) {
      showAlert('error', 'An error occurred while deleting the subject');
      console.error('Error deleting subject:', e);
    }
  }

  const changeDefaultAction = async (subject: MLSubject, event: SelectChangeEvent<string>) => {
    let action : FilterAction | "default" | undefined = event.target.value as FilterAction | "default" ;
    if(action === 'default') {
      action = undefined;
    }
    const newSubject : MLSubject = {...subject, filterAction: action};
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
      <PaperBlissBrowse>
        <Typography variant="h5" style={{ marginBottom: '1rem' }}>Your Subjects</Typography>
        <List>
          {subjects.map((subject) => {
            const subjectDescription = subject.description;
            return (
              <ListItem key={subject.description} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <ListItemText primary={<Typography variant="subtitle1" style={{ fontWeight: 'bold' }}>{subjectDescription}</Typography>} />

                <Tooltip title="Open advanced embedding settings">
                  <IconButton onClick={() => openEditor(subject)} size="large">
                    <Settings />
                  </IconButton>
                </Tooltip>

                <Typography variant="subtitle1" style={{ marginRight: '1rem' }}>Filter Method:</Typography>
                <SelectFromEnum
                  enumObj={MLFilterMethod}
                  onChange={(event) => changeDefaultFilterMethod(subject, event)}
                  value={subject?.filterMethod || 'default'}
                  includeDefault={true}
                />

                <Typography variant="subtitle1" style={{ marginRight: '1rem' }}>Filter Action:</Typography>
                <SelectFromEnum
                  enumObj={FilterAction}
                  onChange={(event) => changeDefaultAction(subject, event)}
                  value={subject?.filterAction || 'default'}
                  includeDefault={true}
                />

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

        { selectedSubject && (
          <Dialog
            open={isEditorOpen}
            onClose={closeEditor}
            fullWidth={true}
            maxWidth="md"
          >
            <DialogTitle>Edit Subject</DialogTitle>
            <DialogContent>
                <MLAdvancedEmbeddingsSettings
                  mlSubject={selectedSubject}
                  setMLSubject={async (updatedSubject) => {
                    await subjectsDataStore.set(selectedSubject.description, updatedSubject);
                    closeEditor();
                  }}
                />
            </DialogContent>
            <DialogActions>
              <Button onClick={closeEditor}>Close</Button>
            </DialogActions>
          </Dialog>
        )}
      </PaperBlissBrowse>
    )
  }
};

export default MLSubjectList;
