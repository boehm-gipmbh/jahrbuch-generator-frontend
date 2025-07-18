import React, {useState} from 'react';
import {IconButton, ListItemIcon, Menu, MenuItem} from '@mui/material';
import TrafficIcon from '@mui/icons-material/Traffic';

const colorMap = {
    1: '#d32f2f',   // rot
    2: '#fbc02d',   // gelb
    3: '#388e3c'    // grün
};

const texteMap = {
    1: 'keine Freigabe',   // rot
    2: 'evtl. Freigabe',   // gelb
    3: 'Freigabe erteilt'    // grün
};


export const Priority = ({priority}) => Boolean(priority) ?
  <TrafficIcon sx={{ color: colorMap[priority] }}/> :
  <TrafficIcon sx={{ color: colorMap[3] }}/>;  // default to green if no priority is set

export const EditTextPriority = ({priority, setPriority, disabled}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);
  const onClick = val => () => {
    setPriority(val);
    setAnchorEl(null);
  }
  return (
    <>
      <IconButton
        disabled={disabled}
        onClick={event => setAnchorEl(event.currentTarget)}
      >
        <Priority priority={priority} />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={() => setAnchorEl(null)}
      >
        {[...Array(3).keys()].map(i => i + 1).map(p =>
          <MenuItem key={p} onClick={onClick(p)}>
            <ListItemIcon>
              <TrafficIcon sx={{ color: colorMap[p] }} />
            </ListItemIcon>
              {texteMap[p]}
          </MenuItem>
        )}
        {/*<MenuItem onClick={onClick(null)}>*/}
        {/*  <ListItemIcon>*/}
        {/*    <FlagOutlinedIcon />*/}
        {/*  </ListItemIcon>*/}
        {/*  No Priority*/}
        {/*</MenuItem>*/}
      </Menu>
    </>
  );
};
