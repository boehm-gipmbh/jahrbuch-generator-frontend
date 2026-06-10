import {createApi} from '@reduxjs/toolkit/query/react';
import {authBaseQuery} from '../auth';

export const clusterApi = createApi({
    reducerPath: 'clusters',
    baseQuery: authBaseQuery({path: 'clusters'}),
    tagTypes: ['Bild', 'Text'],
    endpoints: (builder) => ({
        linkItems: builder.mutation({
            query: ({typeA, idA, typeB, idB}) => ({
                url: '/link',
                method: 'POST',
                body: {typeA, idA, typeB, idB},
            }),
            invalidatesTags: ['Bild', 'Text'],
        }),
        unlinkItem: builder.mutation({
            query: ({type, id}) => ({
                url: '/unlink',
                method: 'DELETE',
                body: {type, id},
            }),
            invalidatesTags: ['Bild', 'Text'],
        }),
    }),
});

export const {useLinkItemsMutation, useUnlinkItemMutation} = clusterApi;