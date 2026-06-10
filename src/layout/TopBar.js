import React, {useState} from 'react';
import {AppBar, IconButton, Toolbar, Tooltip, Typography} from '@mui/material';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import GroupsIcon from '@mui/icons-material/Groups';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import {useNavigate} from 'react-router-dom';
import {UserIcon} from "./UserIcon";
import {GroupSwitcher} from "./GroupSwitcher";
import {api} from '../users';
import {PdfExportDialog} from '../pdf/PdfExportDialog';
import {NotificationBell} from '../notifications/NotificationBell';

export const TopBar = ({goHome, toggleDrawer}) => {
  const {data: user} = api.endpoints.getSelf.useQuery();
  const title = user?.activeGroup?.name ?? 'Jahrbuch-Generator';
  const navigate = useNavigate();
  const isAdmin = user?.roles?.includes('admin');
  const isGroupAdmin = user?.roles?.includes('group-admin');
  const managesActiveGroup = user?.managedGroups?.some(g => g.id === user?.activeGroup?.id);
  const showInvitations = isAdmin || (isGroupAdmin && managesActiveGroup);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);

  return (
    <>
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
            <IconButton color='inherit' onClick={() => setPdfDialogOpen(true)}>
              <PictureAsPdfIcon />
            </IconButton>
          </Tooltip>
        )}
        {(isGroupAdmin || isAdmin) && <NotificationBell />}
        {showInvitations && (
          <Tooltip title='Einladungen'>
            <IconButton color='inherit' onClick={() => navigate('/invitations')}>
              <PeopleOutlineIcon />
            </IconButton>
          </Tooltip>
        )}
        {(isAdmin || isGroupAdmin) && (
          <Tooltip title='Gruppen'>
            <IconButton color='inherit' onClick={() => navigate('/groups')}>
              <GroupsIcon />
            </IconButton>
          </Tooltip>
        )}
        <UserIcon />
      </Toolbar>
    </AppBar>

    {pdfDialogOpen && user?.activeGroup && (
      <PdfExportDialog
        gruppe={user.activeGroup}
        onClose={() => setPdfDialogOpen(false)}
        isGroupAdmin={isGroupAdmin || isAdmin}
      />
    )}
  </>
  );
};

