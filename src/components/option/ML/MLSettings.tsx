import React from "react";
import {Box, Container} from "@mui/material";
import MLSubjectList from "./MLSubjectList";
import MLInferenceSettings from "./MLInferenceSettings";
import MLBudget from "./MLBudget";
import PaperBlissBrowse from "../../style/PaperBlissBrowse";
import NewMLSubjectForm from "../../popup/NewMLSubjectForm";


const MLSettings = () => {

  return (
    <Container>
      <PaperBlissBrowse>
            <NewMLSubjectForm/>
      </PaperBlissBrowse>
      {/* separator */}
      <Box sx={{height: 20}}/>
      {/* separator */}
      <MLSubjectList/>
      <Box sx={{height: 20}}/>
      <MLInferenceSettings/>
      <Box sx={{height: 20}}/>
      <MLBudget/>
    </Container>
  )
}

export default MLSettings;