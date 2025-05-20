import React from 'react';
import {Chip} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';

export const CompleteChip = ({bild}) => Boolean(task?.complete) && (
  <Chip
    icon={<CheckIcon />}
    color='success'
    label={new Date(bild.complete).toLocaleDateString()} variant='outlined'
  />
);
