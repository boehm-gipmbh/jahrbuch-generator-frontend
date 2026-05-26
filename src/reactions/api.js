import {createApi} from '@reduxjs/toolkit/query/react';
import {authBaseQuery} from '../auth';

export const api = createApi({
    reducerPath: 'reactions',
    baseQuery: authBaseQuery({path: 'reactions'}),
    tagTypes: ['Reaction'],
    endpoints: builder => ({
        getCounts: builder.query({
            query: ({targetType, targetId}) => `/${targetType}/${targetId}`,
            providesTags: (result, error, {targetType, targetId}) =>
                [{type: 'Reaction', id: `${targetType}-${targetId}`}],
        }),
        toggleReaction: builder.mutation({
            query: ({targetType, targetId, reactionType, message}) => ({
                url: `/${targetType}/${targetId}/${reactionType}`,
                method: 'POST',
                body: {message: message ?? null},
            }),
            invalidatesTags: (result, error, {targetType, targetId}) =>
                [{type: 'Reaction', id: `${targetType}-${targetId}`}],
        }),
    }),
});
