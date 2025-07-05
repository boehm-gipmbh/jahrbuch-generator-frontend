import React, {useState} from 'react';
import {IconButton, ListItemIcon, Menu, MenuItem} from '@mui/material';
import CircleIcon from '@mui/icons-material/Circle';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import {api} from './api';

export const SelectStory = ({disabled, onSelectStory = () => {}}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);
  const {data: stories} = api.endpoints.getStories.useQuery(undefined);
  const onClick = story => () => {
    setAnchorEl(null);
    onSelectStory(story);
  }
  return (
    <>
      <IconButton
        disabled={disabled}
        onClick={event => setAnchorEl(event.currentTarget)}
      >
        <LocalOfferIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={() => setAnchorEl(null)}
      >
        {stories.map(p =>
          <MenuItem key={p.id} onClick={onClick(p)}>
            <ListItemIcon>
              <CircleIcon />
            </ListItemIcon>
            {p.name}
          </MenuItem>
        )}
      </Menu>
    </>
  );
}
