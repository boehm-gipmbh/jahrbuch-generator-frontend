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
            query: ({targetType, targetId, reactionType}) => ({
                url: `/${targetType}/${targetId}/${reactionType}`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, {targetType, targetId}) =>
                [{type: 'Reaction', id: `${targetType}-${targetId}`}],
        }),
    }),
});
