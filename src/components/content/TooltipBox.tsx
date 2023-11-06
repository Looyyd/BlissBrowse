import React, { ReactNode } from "react";
import {Box} from "@mui/material";


interface TooltipBoxProps {
  children: ReactNode;
}

const TooltipBox: React.FC<TooltipBoxProps> = ({ children }) => {
  return (
    <Box
      className="tooltip-content-react"
      sx={{
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'grey.300',
        p: 1,
        borderRadius: 2,
        boxShadow: 3,
        typography: 'body2',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {children}
    </Box>
  );
};

export default TooltipBox;