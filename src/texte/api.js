import {createApi} from '@reduxjs/toolkit/query/react';
import {authBaseQuery} from '../auth';

export const api = createApi({
  reducerPath: 'texte',
  baseQuery: authBaseQuery({path: 'texte'}),
  tagTypes: ['Text'],
  endpoints: builder => ({
    getTexte: builder.query({
      query: () => '/',
      providesTags: ['Texte'],
    }),
    addTexte: builder.mutation({
      query: text => ({
        url: '/',
        method: 'POST',
        body: text
      }),
      invalidatesTags: ['Text'],
    }),
    updateText: builder.mutation({
      query: text => ({
        url: `/${text.id}`,
        method: 'PUT',
        body: text
      }),
      invalidatesTags: ['Text'],
    }),
    deleteText: builder.mutation({
      query: text => ({
        url: `/${text.id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Text']
    }),
    setComplete: builder.mutation({
      query: ({text, complete}) => ({
        url: `/${text.id}/complete`,
        method: 'PUT',
        body: JSON.stringify(complete)
      }),
      invalidatesTags: ['Text'],
    })
  })
});
