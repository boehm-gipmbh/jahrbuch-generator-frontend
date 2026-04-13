import React, {useEffect, useState} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {useNavigate} from 'react-router-dom';
import {
    Alert, Box, Collapse, IconButton, Toolbar
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import {newText, newBild, toggleDrawer, openNewStory} from './';
import {TopBar} from './TopBar';
import {MainDrawer} from './MainDrawer';
import {api, NewStoryDialog} from '../stories';
import {EditBild} from '../bilder';
import {EditText} from '../texte';
import {ChangePasswordDialog} from "../users/ChangePasswordDialog";
import {api as usersApi} from '../users';
import {DndContext} from '@dnd-kit/core';

const daysUntil = (dateStr) => {
    if (!dateStr) return null;
    return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
};

const ExpiryWarning = () => {
    const {data: self} = usersApi.endpoints.getSelf.useQuery();
    const [dismissed, setDismissed] = useState(false);
    const days = daysUntil(self?.invitationExpiresAt);
    if (dismissed || days === null || days > 14) return null;
    const isExpired = days <= 0;
    return (
        <Collapse in>
            <Alert
                severity={isExpired ? 'error' : 'warning'}
                action={
                    <IconButton size="small" onClick={() => setDismissed(true)}>
                        <CloseIcon fontSize="small"/>
                    </IconButton>
                }
                sx={{borderRadius: 0, mb: 0}}
            >
                {isExpired
                    ? 'Dein Einladungszugang ist abgelaufen. Bitte wende dich an einen Administrator.'
                    : `Dein Einladungszugang läuft in ${days} Tag${days === 1 ? '' : 'en'} ab.`}
            </Alert>
        </Collapse>
    );
};

export const Layout = ({children}) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const jwt = useSelector(state => state.auth.jwt);
    useEffect(() => {
        if (!jwt) {
            navigate('/login');
        }
    }, [navigate, jwt]);
    const drawerOpen = useSelector(state => state.layout.drawerOpen);
    const doToggleDrawer = () => dispatch(toggleDrawer());
    const {data: stories} = api.endpoints.getStories.useQuery(undefined, {pollingInterval: 10000});
    const doOpenNewStory = () => dispatch(openNewStory());
    return (
    <DndContext>
        <Box sx={{display: 'flex'}}>
            <TopBar
                goHome={() => navigate('/')}
                newBild={() => dispatch(newBild())}
                newText={() => dispatch(newText())}
                toggleDrawer={doToggleDrawer} drawerOpen={drawerOpen}
            />
            <MainDrawer
                toggleDrawer={doToggleDrawer} drawerOpen={drawerOpen}
                openNewStory={doOpenNewStory} stories={stories}
            />
            <Box sx={{flex: 1}}>
                <Toolbar />
                <ExpiryWarning />
                <Box component='main'>
                    {children}
                </Box>
            </Box>
            <EditBild />
            <EditText />
            <NewStoryDialog />
            <ChangePasswordDialog />
        </Box>
    </DndContext>
    );
};