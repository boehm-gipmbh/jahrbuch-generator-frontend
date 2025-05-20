import React from 'react';
import {Chip} from '@mui/material';

export const ProjectChip = ({bild, size, onDelete}) => Boolean(bild?.project) && (
  <Chip
    label={bild.project.name}
    size={size}
    onDelete={!bild.protect ? onDelete : undefined}
  />
);
