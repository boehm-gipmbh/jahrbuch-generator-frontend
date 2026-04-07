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
      invalidatesTags: ['User']
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
    deleteInvitation: builder.mutation({
      query: id => ({
        url: `/invitations/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Invitation']
    })
  })
});
