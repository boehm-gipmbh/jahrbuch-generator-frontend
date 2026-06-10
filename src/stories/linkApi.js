import {createApi} from '@reduxjs/toolkit/query/react';
import {authBaseQuery} from '../auth';

export const linkApi = createApi({
  reducerPath: 'storyItemLinks',
  baseQuery: authBaseQuery({path: 'story-items/link'}),
  tagTypes: ['Link'],
  endpoints: builder => ({
    getLinksByStory: builder.query({
      query: storyId => `/by-story/${storyId}`,
      providesTags: ['Link'],
    }),
    addLink: builder.mutation({
      query: ({textId, bildId}) => ({url: '/', method: 'POST', body: {textId, bildId}}),
      invalidatesTags: ['Link'],
    }),
    removeLink: builder.mutation({
      query: ({textId, bildId}) => ({url: '/', method: 'DELETE', body: {textId, bildId}}),
      invalidatesTags: ['Link'],
    }),
  }),
});