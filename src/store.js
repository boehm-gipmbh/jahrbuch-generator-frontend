import {combineReducers, configureStore} from '@reduxjs/toolkit';
import {logout, reducer as authReducer} from './auth';
import {reducer as layoutReducer} from './layout';
import {api as storyApi} from './stories';
import {api as bildApi} from './bilder';
import {api as userApi} from './users';
import {api as textApi} from './texte';
import {api as videoApi} from './videos/api';
import {api as groupApi} from './groups/api';
import {api as announcementApi} from './announcement/api';
import {api as reactionApi} from './reactions/api';
import {api as commentApi} from './comments/api';
import {api as notificationApi} from './notifications/api';

const appReducer = combineReducers({
    auth: authReducer,
    layout: layoutReducer,
    [storyApi.reducerPath]: storyApi.reducer,
    [bildApi.reducerPath]: bildApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [textApi.reducerPath]: textApi.reducer,
    [videoApi.reducerPath]: videoApi.reducer,
    [groupApi.reducerPath]: groupApi.reducer,
    [announcementApi.reducerPath]: announcementApi.reducer,
    [reactionApi.reducerPath]: reactionApi.reducer,
    [commentApi.reducerPath]: commentApi.reducer,
    [notificationApi.reducerPath]: notificationApi.reducer,
});

const rootReducer = (state, action) => {
    if (logout.match(action)) {
        state = undefined;
    }
    return appReducer(state, action);
};

export const store = configureStore({
    reducer: rootReducer,
    middleware: getDefaultMiddleware => getDefaultMiddleware()
        .concat(storyApi.middleware)
        .concat(bildApi.middleware)
        .concat(userApi.middleware)
        .concat(textApi.middleware)
        .concat(videoApi.middleware)
        .concat(groupApi.middleware)
        .concat(announcementApi.middleware)
        .concat(reactionApi.middleware)
        .concat(commentApi.middleware)
        .concat(notificationApi.middleware)
});

