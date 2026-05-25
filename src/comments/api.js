import {createApi} from '@reduxjs/toolkit/query/react';
import {authBaseQuery} from '../auth';

export const api = createApi({
    reducerPath: 'comments',
    baseQuery: authBaseQuery({path: 'comments'}),
    tagTypes: ['Comment'],
    endpoints: builder => ({
        getComments: builder.query({
            query: ({targetType, targetId}) => `/${targetType}/${targetId}`,
            providesTags: (result, error, {targetType, targetId}) =>
                [{type: 'Comment', id: `${targetType}-${targetId}`}],
        }),
        addComment: builder.mutation({
            query: ({targetType, targetId, content, parentId}) => ({
                url: `/${targetType}/${targetId}`,
                method: 'POST',
                body: {content, parentId: parentId ?? null},
            }),
            invalidatesTags: (result, error, {targetType, targetId}) =>
                [{type: 'Comment', id: `${targetType}-${targetId}`}],
        }),
        deleteComment: builder.mutation({
            query: ({commentId, targetType, targetId}) => ({
                url: `/${commentId}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, {targetType, targetId}) =>
                [{type: 'Comment', id: `${targetType}-${targetId}`}],
        }),
    }),
});
