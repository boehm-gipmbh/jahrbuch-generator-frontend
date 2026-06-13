import {createApi} from '@reduxjs/toolkit/query/react';
import {authBaseQuery} from '../auth';
import {api as bildApi} from '../bilder/api';
import {api as textApi} from '../texte/api';

const invalidateBilderTexte = async ({dispatch, queryFulfilled}) => {
    await queryFulfilled;
    dispatch(bildApi.util.invalidateTags(['Bild']));
    dispatch(textApi.util.invalidateTags(['Text']));
};

export const clusterApi = createApi({
    reducerPath: 'clusters',
    baseQuery: authBaseQuery({path: 'clusters'}),
    endpoints: (builder) => ({
        linkItems: builder.mutation({
            query: ({typeA, idA, typeB, idB}) => ({
                url: '/link',
                method: 'POST',
                body: {typeA, idA, typeB, idB},
            }),
            onQueryStarted: (_, api) => invalidateBilderTexte(api),
        }),
        unlinkItem: builder.mutation({
            query: ({type, id}) => ({
                url: '/unlink',
                method: 'DELETE',
                body: {type, id},
            }),
            onQueryStarted: (_, api) => invalidateBilderTexte(api),
        }),
    }),
});

export const {useLinkItemsMutation, useUnlinkItemMutation} = clusterApi;