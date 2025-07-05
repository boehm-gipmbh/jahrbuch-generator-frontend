import {createApi} from '@reduxjs/toolkit/query/react';
import {authBaseQuery} from '../auth';

export const api = createApi({
  reducerPath: 'stories',
  baseQuery: authBaseQuery({path: 'stories'}),
  tagTypes: ['Story'],
  endpoints: builder => ({
    getStories: builder.query({
      query: () => '/',
      providesTags: ['Story'],
    }),
    addStory: builder.mutation({
      query: story => ({
        url: '/',
        method: 'POST',
        body: story
      }),
      invalidatesTags: ['Story'],
    }),
    updateStory: builder.mutation({
      query: story => ({
        url: `/${story.id}`,
        method: 'PUT',
        body: story
      }),
      invalidatesTags: ['Story'],
    })
  })
});
