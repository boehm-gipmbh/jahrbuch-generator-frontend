import React from 'react';
import {Chip} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';

export const CompleteChip = ({text}) => Boolean(text?.complete) && (
  <Chip
    icon={<CheckIcon />}
    color='success'
    label={new Date(text.complete).toLocaleDateString()} variant='outlined'
  />
);
