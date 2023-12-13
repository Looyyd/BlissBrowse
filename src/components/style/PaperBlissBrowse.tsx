import React from "react";
import {Paper} from "@mui/material";

interface props {
  children: React.ReactNode;
}

const PaperBlissBrowse: React.FC<props> = ({children}) => {
  return (
    <Paper style={{
      padding: "20px",
      margin: "20px",
      //border: '2px solid #000',
      boxShadow: "0px 0px 10px rgba(0,0,0,0.5)"
    }}>
      {children}
    </Paper>
  )
};

export default PaperBlissBrowse;