import {createTheme} from "@mui/material";


export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#72A3EF',
    },
    secondary: {
      main: "#425298",
    },
    info: {
      main: "#9E8576",
    },
    /*
    success: {
      main: "#257527",
    },
     */
    background: {
      default:  '#DFE8F4',
      paper: '#DFE8F4',
    },
  },
});
