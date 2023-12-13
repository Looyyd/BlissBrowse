import {Box, TextareaAutosize} from "@mui/material";
import React from "react";

type TextEditBoxProps = {
  textAreaValue: string;
  handleTextAreaChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  id: string;
}

export const TextEditBox: React.FC<TextEditBoxProps> = ({textAreaValue, handleTextAreaChange, id}) => {

  return (
        <Box
        component={TextareaAutosize}
        value={textAreaValue}
        onChange={handleTextAreaChange}
        id={id}
        sx={(theme) => ({
          width: '100%',
          minHeight: '100px',
          padding: '12px',
          borderRadius: '4px',
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
          background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
          color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)',
          '&:focus': {
            borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)',
            outline: 'none'
          }
        })}
      />
  )
}
