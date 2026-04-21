import {createApi} from '@reduxjs/toolkit/query/react';
import {authBaseQuery} from '../auth';

export const api = createApi({
    reducerPath: 'videos',
    baseQuery: authBaseQuery({path: 'videos'}),
    tagTypes: ['Video'],
    endpoints: builder => ({
        uploadVideo: builder.mutation({
            query: formData => ({
                url: '/upload',
                method: 'POST',
                body: formData,
                formData: true,
            }),
            invalidatesTags: ['Video'],
        }),
        getVideos: builder.query({
            query: () => '/',
            providesTags: ['Video'],
        }),
        updateVideo: builder.mutation({
            query: video => ({
                url: `/${video.id}`,
                method: 'PUT',
                body: video,
            }),
            invalidatesTags: ['Video'],
        }),
        setComplete: builder.mutation({
            query: ({video, complete}) => ({
                url: `/${video.id}/complete`,
                method: 'PUT',
                body: JSON.stringify(complete),
                headers: {'Content-Type': 'application/json'},
            }),
            invalidatesTags: ['Video'],
        }),
        deleteVideo: builder.mutation({
            query: video => ({
                url: `/${video.id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Video'],
        }),
    }),
});