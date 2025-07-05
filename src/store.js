import {combineReducers, configureStore} from '@reduxjs/toolkit';
import {logout, reducer as authReducer} from './auth';
import {reducer as layoutReducer} from './layout';
import {api as storyApi} from './stories';
import {api as bildApi} from './bilder';
import {api as userApi} from './users';
import {api as textApi} from './texte';

const appReducer = combineReducers({
    auth: authReducer,
    layout: layoutReducer,
    [storyApi.reducerPath]: storyApi.reducer,
    [bildApi.reducerPath]: bildApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [textApi.reducerPath]: textApi.reducer
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
});

