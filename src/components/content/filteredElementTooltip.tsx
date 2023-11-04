import Box from "@mui/material/Box";
import {Typography} from "@mui/material";
import React from "react";

export const FilteredElementTooltip = () => {
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
        typography: 'body2'
      }}
    >
      <Typography color="text.primary">{"Hello World"}</Typography>
    </Box>
  );
};