import React, {useState} from 'react';
import {useDispatch} from 'react-redux';
import {Divider, IconButton, ListItemIcon, ListSubheader, Menu, MenuItem, Tooltip} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CheckIcon from '@mui/icons-material/Check';
import GroupsIcon from '@mui/icons-material/Groups';
import KeyIcon from '@mui/icons-material/Key';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import {logout} from '../auth';
import {api} from '../users';
import {openChangePassword} from './redux';

export const UserIcon = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const menuOpen = Boolean(anchorEl);
    const closeMenu = () => setAnchorEl(null);
    const dispatch = useDispatch();
    const {data} = api.endpoints.getSelf.useQuery();
    const [setActiveGroup] = api.endpoints.setActiveGroup.useMutation();
    const [clearActiveGroup] = api.endpoints.clearActiveGroup.useMutation();
    const SHOW_CHANGE_PASSWORD_BUTTON = true;

    const switchGroup = (groupId) => {
        closeMenu();
        const action = groupId == null ? clearActiveGroup() : setActiveGroup(groupId);
        action.then(() => window.location.reload());
    };

    const groups = data?.groups ?? [];
    const activeGroupId = data?.activeGroup?.id ?? null;

    return (
        <>
            <Tooltip title='Profile'>
                <IconButton color='inherit' onClick={event => setAnchorEl(event.currentTarget)}>
                    <AccountCircleIcon/>
                </IconButton>
            </Tooltip>
            <Menu
                anchorEl={anchorEl}
                open={menuOpen}
                onClose={closeMenu}
            >
                {data && <MenuItem disabled>{data.name}</MenuItem>}
                {SHOW_CHANGE_PASSWORD_BUTTON && (
                    <MenuItem onClick={() => {
                        dispatch(openChangePassword());
                        closeMenu();
                    }}>
                        <ListItemIcon>
                            <KeyIcon/>
                        </ListItemIcon>
                        Change Password
                    </MenuItem>
                )}
                {groups.length > 0 && (
                    <>
                        <Divider/>
                        <ListSubheader>Ansicht</ListSubheader>
                        <MenuItem onClick={() => switchGroup(null)}>
                            <ListItemIcon>
                                {activeGroupId == null ? <CheckIcon fontSize="small"/> : <PersonIcon fontSize="small"/>}
                            </ListItemIcon>
                            Persönlich
                        </MenuItem>
                        {groups.map(g => (
                            <MenuItem key={g.id} onClick={() => switchGroup(g.id)}>
                                <ListItemIcon>
                                    {activeGroupId === g.id ? <CheckIcon fontSize="small"/> : <GroupsIcon fontSize="small"/>}
                                </ListItemIcon>
                                {g.name}
                            </MenuItem>
                        ))}
                    </>
                )}
                <Divider/>
                <MenuItem onClick={() => dispatch(logout())}>
                    <ListItemIcon>
                        <LogoutIcon/>
                    </ListItemIcon>
                    Logout
                </MenuItem>
            </Menu>
        </>
    );
};
