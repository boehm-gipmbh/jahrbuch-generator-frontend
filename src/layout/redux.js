import {createSlice} from '@reduxjs/toolkit';

const layoutSlice = createSlice({
    name: 'layout',
    initialState: {
        changePasswordOpen: false,
        drawerOpen: true,
        newStoryOpen: false,
        openText: undefined,
        openBild: undefined
    },
    reducers: {
        openChangePassword: state => {
            state.changePasswordOpen = true;
        },
        closeChangePassword: state => {
            state.changePasswordOpen = false;
        },
        openNewStory: state => {
            state.newStoryOpen = true;
        },
        closeNewStory: state => {
            state.newStoryOpen = false;
        },
        newText: (state, action = {}) => {
            state.openText = {
                title: '',
                description: '',
                ...action.payload ?? {}
            };
        },
        clearOpenText: state => {
            state.openText = undefined;
        },
        setOpenText: (state, action) => {
            state.openText = action.payload;
        },
        newBild: (state, action = {}) => {
            state.openBild = {
                title: '',
                description: '',
                ...action.payload ?? {}
            };
        },
        clearOpenBild: state => {
            state.openBild = undefined;
        },
        setOpenBild: (state, action) => {
            state.openBild = action.payload;
        },
        toggleDrawer: state => {
            state.drawerOpen = !state.drawerOpen;
        }
    }
});

export const {
    closeChangePassword,
    openChangePassword,
    toggleDrawer,
    closeNewStory,
    openNewStory,
    clearOpenText,
    newText,
    setOpenText,
    clearOpenBild,
    newBild,
    setOpenBild
} = layoutSlice.actions;
export const {reducer} = layoutSlice;
