import {createApi} from '@reduxjs/toolkit/query/react';
import {authBaseQuery} from '../auth';

export const api = createApi({
  reducerPath: 'users',
  baseQuery: authBaseQuery({path: 'users'}),
  tagTypes: ['User', 'Invitation'],
  endpoints: builder => ({
    getUser: builder.query({
      query: id => `/${id}`,
      providesTags: ['User']
    }),
    getUsers: builder.query({
      query: () => '/',
      providesTags: ['User']
    }),
    deleteUser: builder.mutation({
      query: user => ({
        url: `/${user.id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['User', 'Invitation']
    }),
    deactivateUser: builder.mutation({
      query: id => ({url: `/${id}/deactivate`, method: 'PUT'}),
      invalidatesTags: ['User', 'Invitation']
    }),
    reactivateUser: builder.mutation({
      query: id => ({url: `/${id}/reactivate`, method: 'PUT'}),
      invalidatesTags: ['User', 'Invitation']
    }),
    getSelf: builder.query({
      query: () => '/self',
      providesTags: ['User']
    }),
    changePassword: builder.mutation({
      query: passwordChange => ({
        url: `/self/password`,
        method: 'PUT',
        body: passwordChange
      })
    }),
    getInvitations: builder.query({
      query: () => '/invitations',
      providesTags: ['Invitation']
    }),
    createInvitation: builder.mutation({
      query: invitation => ({
        url: '/invitations',
        method: 'POST',
        body: invitation
      }),
      invalidatesTags: ['Invitation']
    }),
    deactivateInvitation: builder.mutation({
      query: id => ({
        url: `/invitations/${id}/deactivate`,
        method: 'PUT'
      }),
      invalidatesTags: ['Invitation']
    }),
    reactivateInvitation: builder.mutation({
      query: id => ({
        url: `/invitations/${id}/reactivate`,
        method: 'PUT'
      }),
      invalidatesTags: ['Invitation']
    }),
    deleteInvitation: builder.mutation({
      query: id => ({
        url: `/invitations/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Invitation']
    }),
    setActiveGroup: builder.mutation({
      query: groupId => ({
        url: `/self/active-group/${groupId}`,
        method: 'PUT'
      }),
      invalidatesTags: ['User']
    }),
    clearActiveGroup: builder.mutation({
      query: () => ({
        url: `/self/active-group`,
        method: 'DELETE'
      }),
      invalidatesTags: ['User']
    }),
    promoteUser: builder.mutation({
      query: ({id, groupId}) => ({url: `/${id}/promote/${groupId}`, method: 'PUT'}),
      invalidatesTags: ['User', 'Invitation']
    }),
    demoteUser: builder.mutation({
      query: id => ({url: `/${id}/demote`, method: 'PUT'}),
      invalidatesTags: ['User', 'Invitation']
    }),
    extendInvitation: builder.mutation({
      query: ({id, expiresAt}) => ({
        url: `/invitations/${id}/extend`,
        method: 'PUT',
        body: {expiresAt}
      }),
      invalidatesTags: ['Invitation']
    }),
    resendInvitation: builder.mutation({
      query: ({id, recipientEmail}) => ({
        url: `/invitations/${id}/resend`,
        method: 'POST',
        body: {recipientEmail}
      }),
      invalidatesTags: ['Invitation']
    }),
    sendReminder: builder.mutation({
      query: id => ({
        url: `/${id}/remind`,
        method: 'POST'
      }),
      invalidatesTags: ['User']
    }),
    getReminderStatus: builder.query({
      query: id => `/${id}/remind/status`
    }),
    getReminderSends: builder.query({
      query: id => `/${id}/remind/sends`,
      providesTags: ['User']
    }),
    getReminderSendStatus: builder.query({
      query: sendId => `/remind/sends/${sendId}/status`
    }),
    sendBatchInvitation: builder.mutation({
      query: body => ({
        url: '/invitations/batch',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Invitation']
    }),
    getSendStatus: builder.query({
      query: sendId => `/invitations/sends/${sendId}/status`
    }),
    updateSendEmail: builder.mutation({
      query: ({sendId, email}) => ({
        url: `/invitations/sends/${sendId}/email`,
        method: 'PUT',
        body: {email}
      }),
      invalidatesTags: ['Invitation']
    }),
    updateUserEmail: builder.mutation({
      query: ({id, email}) => ({
        url: `/${id}/email`,
        method: 'PUT',
        body: {email}
      }),
      invalidatesTags: ['User', 'Invitation']
    }),
    deleteSend: builder.mutation({
      query: sendId => ({
        url: `/invitations/sends/${sendId}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Invitation']
    }),
    updateUserInvitationExpiry: builder.mutation({
      query: ({id, expiresAt}) => ({
        url: `/${id}/invitation-expires`,
        method: 'PUT',
        body: {expiresAt}
      }),
      invalidatesTags: ['Invitation']
    })
  })
});
