import React from 'react';
import {AppBar, IconButton, Toolbar, Tooltip, Typography} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import {UserIcon} from "./UserIcon";
import {GroupSwitcher} from "./GroupSwitcher";
import {api} from '../users';

export const TopBar = ({goHome, newText, toggleDrawer}) => {
  const {data: user} = api.endpoints.getSelf.useQuery();
  const title = user?.activeGroup?.name ?? 'Jahrbuch-Generator';

  return (
    <AppBar
      position='fixed'
      sx={{
        zIndex: theme => theme.zIndex.drawer + 1
      }}
    >
      <Toolbar>
        <IconButton
          size='large'
          edge='start'
          color='inherit'
          aria-label='menu'
          onClick={toggleDrawer}
        >
          <MenuIcon />
        </IconButton>
        <Tooltip title='Home'>
          <IconButton
            color='inherit'
            onClick={goHome}
          >
            <HomeOutlinedIcon />
          </IconButton>
        </Tooltip>
        <Typography variant='h6' component='div' sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        <GroupSwitcher />
        <Tooltip title='Quick Add'>
          <IconButton
            color='inherit'
            onClick={newText}
          >
            <AddIcon />
          </IconButton>
        </Tooltip>
        <UserIcon />
      </Toolbar>
    </AppBar>
  );
};

