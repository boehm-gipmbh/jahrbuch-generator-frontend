import React from 'react';
import {Chip} from '@mui/material';

export const StoryChip = ({bild, size, onDelete}) => Boolean(bild?.story) && (
  <Chip
    label={bild.story.name}
    size={size}
    onDelete={!bild.complete ? onDelete : undefined}
  />
);
