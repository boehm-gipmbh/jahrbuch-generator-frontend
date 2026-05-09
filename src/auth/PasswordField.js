import React, {useState} from 'react';
import {IconButton, InputAdornment, TextField} from '@mui/material';
import {Visibility, VisibilityOff} from '@mui/icons-material';

export const PasswordField = (props) => {
  const [show, setShow] = useState(false);
  return (
    <TextField
      {...props}
      type={show ? 'text' : 'password'}
      InputProps={{
        ...props.InputProps,
        endAdornment: (
          <InputAdornment position="end">
            <IconButton onClick={() => setShow(s => !s)} edge="end" size="small" tabIndex={-1}>
              {show ? <VisibilityOff/> : <Visibility/>}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
};
