import React, {useState} from 'react';
import {Chip, ListItemIcon, Menu, MenuItem} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
import {api} from '../users';

export const GroupSwitcher = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const {data: user} = api.endpoints.getSelf.useQuery();
    const [setActiveGroup] = api.endpoints.setActiveGroup.useMutation();
    const [clearActiveGroup] = api.endpoints.clearActiveGroup.useMutation();

    const groups = user?.groups ?? [];
    const activeGroup = user?.activeGroup ?? null;

    if (groups.length === 0) return null;

    const switchGroup = (groupId) => {
        setAnchorEl(null);
        const action = groupId == null ? clearActiveGroup() : setActiveGroup(groupId);
        action.then(() => window.location.reload());
    };

    return (
        <>
            <Chip
                icon={activeGroup ? <GroupsIcon/> : <PersonIcon/>}
                label={activeGroup ? activeGroup.name : 'Persönlich'}
                onClick={e => setAnchorEl(e.currentTarget)}
                variant="outlined"
                sx={{color: 'inherit', borderColor: 'rgba(255,255,255,0.6)', mx: 1,
                    '& .MuiChip-icon': {color: 'inherit'}}}
            />
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                <MenuItem onClick={() => switchGroup(null)}>
                    <ListItemIcon>
                        {!activeGroup ? <CheckIcon fontSize="small"/> : <PersonIcon fontSize="small"/>}
                    </ListItemIcon>
                    Persönlich
                </MenuItem>
                {groups.map(g => (
                    <MenuItem key={g.id} onClick={() => switchGroup(g.id)}>
                        <ListItemIcon>
                            {activeGroup?.id === g.id ? <CheckIcon fontSize="small"/> : <GroupsIcon fontSize="small"/>}
                        </ListItemIcon>
                        {g.name}
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
};
