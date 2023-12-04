import React from "react";
import NewMLSubjectForm from "../../popup/NewMLSubjectForm";
import {Box, Container, Paper} from "@mui/material";
import MLSubjectList from "./MLSubjectList";
import MLInferenceSettings from "./MLInferenceSettings";
import MLBudget from "./MLBudget";


const MLSettings = () => {

  return (
    <Container>
      <Paper style={{
        padding: '20px',
        margin: '20px',
        //border: '2px solid #000', // Adjust color and width as needed
        boxShadow: '0px 0px 10px rgba(0,0,0,0.5)' // Adjust shadow to make it more visible
      }} >
        <NewMLSubjectForm />
      </Paper>
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