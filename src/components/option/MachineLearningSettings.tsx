import React from "react";
import NewMLSubjectForm from "../popup/NewMLSubjectForm";
import {Box, Container} from "@mui/material";
import MLSubjectList from "./MLSubjectList";


const MachineLearningSettings = () => {

  return (
    <Container>
      <NewMLSubjectForm />
      {/* separator */}
      <Box sx={{height: 20}}/>
      {/* separator */}
      <MLSubjectList />
    </Container>
  )
}

export default MachineLearningSettings;