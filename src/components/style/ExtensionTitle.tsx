import * as React from 'react';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import {EXTENSION_NAME} from "../../constants";

const StyledTypography = styled(Typography)({
  textAlign: 'center',
  textDecoration: 'underline',
  color: "black",//hardcoded black because it appeared white in tooltip
});

function ExtensionTitle() {
  return (
    <StyledTypography  variant="h5">
      {EXTENSION_NAME}
    </StyledTypography>
  );
}

export default ExtensionTitle;