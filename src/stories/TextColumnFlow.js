import {Box} from '@mui/material';
import {PreviewTextCard} from '../texte/PreviewTextCard';

// Echter zweispaltiger Textfluss für freie (nicht geclusterte, nicht-Hero) Texte –
// Pendant zu PdfService.renderTextColumnFlow: Karten füllen die linke Spalte zuerst
// vollständig, bevor sie in die rechte Spalte überlaufen (column-fill: auto).
// Im Gegensatz zum PDF (das auch mitten im Absatz umbrechen kann) wird hier pro
// Karte nicht gesplittet (break-inside: avoid-column) – das genaue Umbruchverhalten
// von iText lässt sich im Browser nicht 1:1 nachbilden.
export const TextColumnFlow = ({texte, story, storiesLoaded, stories, onSetComplete, storyBilder = [], storyTexte = []}) => {
    if (texte.length === 0) return null;
    return (
        <Box sx={{
            columnCount: 2,
            columnGap: '16px',
            columnFill: 'auto',
        }}>
            {texte.map(text => (
                <Box key={text.id} sx={{breakInside: 'avoid-column', mb: 2}}>
                    <PreviewTextCard text={text} story={story}
                        storiesLoaded={storiesLoaded} stories={stories}
                        onSetComplete={onSetComplete}
                        storyBilder={storyBilder} storyTexte={storyTexte}/>
                </Box>
            ))}
        </Box>
    );
};
