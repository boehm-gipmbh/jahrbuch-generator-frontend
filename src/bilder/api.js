import {createApi} from '@reduxjs/toolkit/query/react';
import {authBaseQuery} from '../auth';

export const api = createApi({
        reducerPath: 'bilder',
        baseQuery: authBaseQuery({path: 'bilder'}),
        tagTypes: ['Bild'],
        endpoints: builder => ({
            uploadBild: builder.mutation({
                query: formData => ({
                    url: '/upload',
                    method: 'POST',
                    body: formData,
                    formData: true,
                }),
                invalidatesTags: ['Bild'],
            }),
            getBilder: builder.query({
                query: () => '/',
                providesTags: ['Bild'],
            }),

            // Neuer Endpunkt für einzelnes Bild
            getBildById: builder.query({
                query: (bildId) => `bilder/${bildId}`,
                providesTags: (result, error, bildId) =>
                    result ? [{ type: 'Bild', id: bildId }] : []
            }),
            triggerCapture: builder.mutation({
                query: () => ({
                    url: 'https://elsie-preperusal-overpresumptuously.ngrok-free.dev/api/v1/bilder/capture',
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
                }),
            getUploadConfig:
                builder.query({
                    query: () => '/uploadconfig',
                    providesTags: ['Bild'],
                }),
            getCapturesConfig:
                builder.query({
                    query: () => '/capture/config',
                    providesTags: ['Bild'],
                }),
            rotateBild: builder.mutation({
                query: ({bildId, degrees}) => ({
                    url: `/${bildId}/rotate`,
                    method: 'POST',
                    body: {degrees},
                }),
                invalidatesTags: ['Bild'],
            }),
        })
    })
    // Exportiere die generierte Hook
export const { useGetBilderQuery, useGetBildByIdQuery, /* andere Hooks */ } = api;
;
