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
            triggerCapture: builder.mutation({
                query: () => ({
                    url: '/capture',
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({"mainImgsettingsImageformat": "Small Fine JPEG"})
                }),
                invalidatesTags: ['Bild'],
            }),
            addBild: builder.mutation({
                query: bild => ({
                    url: '/',
                    method: 'POST',
                    body: bild
                }),
                invalidatesTags: ['Bild'],
            }),
            updateBild:
                builder.mutation({
                    query: bild => ({
                        url: `/${bild.id}`,
                        method: 'PUT',
                        body: bild
                    }),
                    invalidatesTags: ['Bild'],
                }),
            deleteBild:
                builder.mutation({
                    query: bild => ({
                        url: `/${bild.id}`,
                        method: 'DELETE'
                    }),
                    invalidatesTags: ['Bild']
                }),
            setComplete:
                builder.mutation({
                    query: ({bild, complete}) => ({
                        url: `/${bild.id}/complete`,
                        method: 'PUT',
                        body: JSON.stringify(complete)
                    }),
                    invalidatesTags: ['Bild'],
                })
        })
    })
;
