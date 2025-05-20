import {createApi} from '@reduxjs/toolkit/query/react';
import {authBaseQuery} from '../auth';

export const api = createApi({
  reducerPath: 'bilder',
  baseQuery: authBaseQuery({path: 'bilder'}),
  tagTypes: ['Bild'],
  endpoints: builder => ({
    getBilder: builder.query({
      query: () => '/',
      providesTags: ['Bild'],
    }),
    addBild: builder.mutation({
      query: bild => ({
        url: '/',
        method: 'POST',
        body: bild
      }),
      invalidatesTags: ['Bild'],
    }),
    updateBild: builder.mutation({
      query: bild => ({
        url: `/${bild.id}`,
        method: 'PUT',
        body: bild
      }),
      invalidatesTags: ['Bild'],
    }),
    deleteBild: builder.mutation({
      query: bild => ({
        url: `/${bild.id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Bild']
    }),
    setProtect: builder.mutation({
      query: ({bild, protect}) => ({
        url: `/${bild.id}/protect`,
        method: 'PUT',
        body: JSON.stringify(protect)
      }),
      invalidatesTags: ['Bild'],
    })
  })
});
