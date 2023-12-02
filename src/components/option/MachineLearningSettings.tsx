import React from "react";
import NewMLSubjectForm from "../popup/NewMLSubjectForm";
import {Box, Container} from "@mui/material";
import MLSubjectList from "./MLSubjectList";
import MLInferenceSettings from "./MLInferenceSettings";


const MachineLearningSettings = () => {

  return (
    <Container>
      <NewMLSubjectForm />
      {/* separator */}
      <Box sx={{height: 20}}/>
      {/* separator */}
      <MLSubjectList />
      <Box sx={{height: 20}}/>
      <MLInferenceSettings />
    </Container>
  )
}

export default MachineLearningSettings;