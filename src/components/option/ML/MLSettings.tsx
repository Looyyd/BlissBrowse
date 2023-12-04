import React from "react";
import NewMLSubjectForm from "../../popup/NewMLSubjectForm";
import {Box, Container} from "@mui/material";
import MLSubjectList from "./MLSubjectList";
import MLInferenceSettings from "./MLInferenceSettings";
import MLBudget from "./MLBudget";


const MLSettings = () => {

  return (
    <Container>
      <NewMLSubjectForm />
      {/* separator */}
      <Box sx={{height: 20}}/>
      {/* separator */}
      <MLSubjectList />
      <Box sx={{height: 20}}/>
      <MLInferenceSettings />
      <Box sx={{height: 20}}/>
      <MLBudget />
    </Container>
  )
}

export default MLSettings;