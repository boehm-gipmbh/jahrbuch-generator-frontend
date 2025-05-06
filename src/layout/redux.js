import {createSlice} from '@reduxjs/toolkit';

const layoutSlice = createSlice({
    name: 'layout',
    initialState: {
        changePasswordOpen: false,
        drawerOpen: true,
        newProjectOpen: false,
    },
    reducers: {
        openChangePassword: state => {
            state.changePasswordOpen = true;
        },
        closeChangePassword: state => {
            state.changePasswordOpen = false;
        },
        toggleDrawer: state => {
            state.drawerOpen = !state.drawerOpen;
        },
        openNewProject: state => {
            state.newProjectOpen = true;
        },
        closeNewProject: state => {
            state.newProjectOpen = false;
        }
    }
});

export const {
    closeChangePassword,
    openChangePassword,
    toggleDrawer,
    closeNewProject,
    openNewProject
} = layoutSlice.actions;
export const {reducer} = layoutSlice;
