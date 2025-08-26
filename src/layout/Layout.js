import React, {useEffect} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {useNavigate} from 'react-router-dom';
import {
    Box, Toolbar
} from '@mui/material';
import {newText, newBild, toggleDrawer, openNewStory} from './';
import {TopBar} from './TopBar';
import {MainDrawer} from './MainDrawer';
import {api, NewStoryDialog} from '../stories';
import {EditBild} from '../bilder';
import {EditText} from '../texte';
import {ChangePasswordDialog} from "../users/ChangePasswordDialog";

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
                <Box component='main'>
                    {children}
                </Box>
            </Box>
            <EditBild />
            <EditText />
            <NewStoryDialog />
            {/*<ChangePasswordDialog />*/}
        </Box>
    );
};