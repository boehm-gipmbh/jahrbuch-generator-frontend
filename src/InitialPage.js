import {Layout} from "./layout";
import {Typography} from "@mui/material";
import {api} from './bilder/api';
import { RowsPhotoAlbum } from "react-photo-album";
import "react-photo-album/rows.css";

export const InitialPage = () => {

    const {data} = api.endpoints.getBilder.useQuery(undefined, {pollingInterval: 10000});
    const allPhotos = data
        ? Array.from(data)
            .map(bild => ({
                src: bild.pfad.replace(/^.*\/captures\//, '/captures/'),
                alt: bild.beschreibung || '',
                width: bild.breite || 100,
                height: bild.hoehe || 75
            }))
        : [];


       return <Layout>
        <Typography variant='h4'>
            40 Jahre ABI - Feier / OHG Jahrgang 1985
        </Typography>
        <RowsPhotoAlbum photos={allPhotos}
        targetRowHeight={150}
        />
    </Layout>
};