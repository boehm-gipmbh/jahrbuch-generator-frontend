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
      query: ({groupName, validFrom, validTo, recipientEmail}) => ({
        url: '/fotobox-setup',
        method: 'POST',
        body: {groupName, validFrom, validTo, ...(recipientEmail && {recipientEmail})}
      }),
      invalidatesTags: ['Group']
    }),
    generateFotoboxToken: builder.mutation({
      query: ({id, validFrom, validTo, recipientEmail}) => ({
        url: `/${id}/fotobox-token`,
        method: 'POST',
        body: {validFrom, validTo, ...(recipientEmail && {recipientEmail})}
      })
    }),
    revokeToken: builder.mutation({
      query: ({id}) => ({
        url: `/${id}/fotobox-token`,
        method: 'DELETE'
      })
    })
  })
});
