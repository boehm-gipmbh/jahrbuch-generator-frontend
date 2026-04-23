import {createApi} from '@reduxjs/toolkit/query/react';
import {authBaseQuery} from '../auth';

export const api = createApi({
  reducerPath: 'groups',
  baseQuery: authBaseQuery({path: 'groups'}),
  tagTypes: ['Group'],
  endpoints: builder => ({
    getGroups: builder.query({
      query: () => '/',
      providesTags: ['Group']
    }),
    setupFotobox: builder.mutation({
      query: ({groupName, validFrom, validTo}) => ({
        url: '/fotobox-setup',
        method: 'POST',
        body: {groupName, validFrom, validTo}
      }),
      invalidatesTags: ['Group']
    }),
    generateFotoboxToken: builder.mutation({
      query: ({id, validFrom, validTo}) => ({
        url: `/${id}/fotobox-token`,
        method: 'POST',
        body: {validFrom, validTo}
      })
    })
  })
});
