import {createApi} from '@reduxjs/toolkit/query/react';
import {authBaseQuery} from '../auth';

export const api = createApi({
  reducerPath: 'announcements',
  baseQuery: authBaseQuery({path: 'announcements'}),
  endpoints: builder => ({
    previewRecipients: builder.mutation({
      query: request => ({url: '/preview-recipients', method: 'POST', body: request})
    }),
    sendAnnouncement: builder.mutation({
      query: request => ({url: '/send', method: 'POST', body: request})
    })
  })
});

export const {usePreviewRecipientsMutation, useSendAnnouncementMutation} = api;
