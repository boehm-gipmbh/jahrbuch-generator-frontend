import React from 'react';
import {AppBar, IconButton, Toolbar, Tooltip, Typography} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import GroupsIcon from '@mui/icons-material/Groups';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import {useNavigate} from 'react-router-dom';
import {useSelector} from 'react-redux';
import {UserIcon} from "./UserIcon";
import {GroupSwitcher} from "./GroupSwitcher";
import {api} from '../users';

const useJahrbuchDownload = () => {
  const jwt = useSelector(state => state.auth.jwt);
  return async (gruppe) => {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/pdf/${gruppe.id}`, {
      headers: {Authorization: `Bearer ${jwt}`}
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jahrbuch-${gruppe.name}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };
};

export const TopBar = ({goHome, newText, toggleDrawer}) => {
  const {data: user} = api.endpoints.getSelf.useQuery();
  const title = user?.activeGroup?.name ?? 'Jahrbuch-Generator';
  const navigate = useNavigate();
  const isAdmin = user?.roles?.includes('admin');
  const isGroupAdmin = user?.roles?.includes('group-admin');
  const managesActiveGroup = user?.managedGroups?.some(g => g.id === user?.activeGroup?.id);
  const showInvitations = isAdmin || (isGroupAdmin && managesActiveGroup);
  const downloadJahrbuch = useJahrbuchDownload();

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
        {user?.activeGroup && (
          <Tooltip title='Jahrbuch exportieren'>
            <IconButton color='inherit' onClick={() => downloadJahrbuch(user.activeGroup)}>
              <PictureAsPdfIcon />
            </IconButton>
          </Tooltip>
        )}
        {showInvitations && (
          <Tooltip title='Einladungen'>
            <IconButton color='inherit' onClick={() => navigate('/invitations')}>
              <PeopleOutlineIcon />
            </IconButton>
          </Tooltip>
        )}
        {isAdmin && (
          <Tooltip title='Gruppen'>
            <IconButton color='inherit' onClick={() => navigate('/groups')}>
              <GroupsIcon />
            </IconButton>
          </Tooltip>
        )}
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

