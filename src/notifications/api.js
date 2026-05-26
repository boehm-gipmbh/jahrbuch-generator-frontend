import {createApi} from '@reduxjs/toolkit/query/react';
import {authBaseQuery} from '../auth';

export const api = createApi({
    reducerPath: 'notifications',
    baseQuery: authBaseQuery({path: 'notifications'}),
    tagTypes: ['Notification'],
    endpoints: builder => ({
        getUnread: builder.query({
            query: () => '/',
            providesTags: ['Notification'],
        }),
        countUnread: builder.query({
            query: () => '/count',
            providesTags: ['Notification'],
        }),
        markRead: builder.mutation({
            query: (id) => ({url: `/${id}/read`, method: 'PUT'}),
            invalidatesTags: ['Notification'],
        }),
        markAllRead: builder.mutation({
            query: () => ({url: '/read-all', method: 'PUT'}),
            invalidatesTags: ['Notification'],
        }),
    }),
});
