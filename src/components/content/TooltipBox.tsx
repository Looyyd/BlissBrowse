import React, { ReactNode } from "react";
import {Box, ThemeProvider} from "@mui/material";
import {lightTheme} from "../../themes";


interface TooltipBoxProps {
  children: ReactNode;
}

const TooltipBox: React.FC<TooltipBoxProps> = ({ children }) => {
  return (
    <ThemeProvider theme={lightTheme}>
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
    </ThemeProvider>
  );
};

export default TooltipBox;