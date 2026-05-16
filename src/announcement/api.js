import {createApi} from '@reduxjs/toolkit/query/react';
import {authBaseQuery} from '../auth';

export const api = createApi({
  reducerPath: 'announcements',
  baseQuery: authBaseQuery({path: 'announcements'}),
  endpoints: builder => ({
    getAnnouncementHistory: builder.query({
      query: () => '/history',
      providesTags: ['AnnouncementHistory']
    }),
    previewRecipients: builder.mutation({
      query: request => ({url: '/preview-recipients', method: 'POST', body: request})
    }),
    sendAnnouncement: builder.mutation({
      query: request => ({url: '/send', method: 'POST', body: request}),
      invalidatesTags: ['AnnouncementHistory']
    })
  })
});

export const {
  useGetAnnouncementHistoryQuery,
  usePreviewRecipientsMutation,
  useSendAnnouncementMutation
} = api;
