import React from 'react';
import {Chip} from '@mui/material';

export const StoryChip = ({text, size, onDelete}) => Boolean(text?.story) && (
  <Chip
    label={text.story.name}
    size={size}
    onDelete={!text.complete ? onDelete : undefined}
  />
);
