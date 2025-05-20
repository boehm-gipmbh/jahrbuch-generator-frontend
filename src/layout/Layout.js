import React, {useEffect} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {useNavigate} from 'react-router-dom';
import {
    Box, Toolbar
} from '@mui/material';
import {newTask, toggleDrawer} from './';
import {TopBar} from './TopBar';
import {MainDrawer} from './MainDrawer';
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
    // const {data: projects} = api.endpoints.getProjects.useQuery(undefined, {pollingInterval: 10000});
    // const doOpenNewProject = () => dispatch(openNewProject());
    return (
        <Box sx={{display: 'flex'}}>
            <TopBar
                goHome={() => navigate('/')}
                newTask={() => dispatch(newTask())}
                toggleDrawer={doToggleDrawer} drawerOpen={drawerOpen}
            />
            <MainDrawer
                toggleDrawer={doToggleDrawer} drawerOpen={drawerOpen}
            />
            <Box sx={{flex: 1}}>
                <Toolbar />
                <Box component='main'>
                    {children}
                </Box>
            </Box>
            <ChangePasswordDialog />
        </Box>
    );
};