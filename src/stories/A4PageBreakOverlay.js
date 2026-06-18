import {Fragment, useRef, useState, useLayoutEffect, useCallback} from 'react';
import {Box, Typography} from '@mui/material';

// Muss zu Document(PageSize.A4) + doc.setMargins(40, 40, 50, 40) in PdfService.java passen.
const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;
const MARGIN_TOP_PT = 40, MARGIN_RIGHT_PT = 40, MARGIN_BOTTOM_PT = 50, MARGIN_LEFT_PT = 40;
const CONTENT_WIDTH_PT = A4_WIDTH_PT - MARGIN_LEFT_PT - MARGIN_RIGHT_PT;
const CONTENT_HEIGHT_PT = A4_HEIGHT_PT - MARGIN_TOP_PT - MARGIN_BOTTOM_PT;
const PAGE_RATIO = CONTENT_HEIGHT_PT / CONTENT_WIDTH_PT;
const GAP_PX = 20;
const BREAK_PADDING_PX = 28; // zusätzlicher Luftraum um die Umbruchlinie

// Reiht Segmente (Hero-Polaroids, 2-Spalten-Grid-Zeilen) untereinander an und
// verschiebt jedes Segment, das eine A4-Seitengrenze überschreiten würde, komplett
// auf die nächste Seite – mit gestrichelter Linie + Label an der Umbruchstelle.
// Nur eine Annäherung an den echten PDF-Textfluss (PdfService.java, A4).
export const A4PageBreakOverlay = ({segments}) => {
    const containerRef = useRef(null);
    const segRefs = useRef([]);
    const [layoutInfo, setLayoutInfo] = useState({breakBefore: [], pageOf: []});

    const recompute = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;
        const width = container.clientWidth;
        if (!width) return;
        const pageHeightPx = width * PAGE_RATIO;

        let cumulative = 0;
        let currentPage = 1;
        const breakBefore = [];
        const pageOf = [];
        segments.forEach((_, idx) => {
            const el = segRefs.current[idx];
            const h = el ? el.offsetHeight : 0;
            const gap = idx === 0 ? 0 : GAP_PX;
            const naiveCumulative = cumulative + gap;
            const remaining = pageHeightPx * currentPage - naiveCumulative;

            if (h > pageHeightPx) {
                // Segment ist größer als eine ganze Seite – kann nicht verschoben werden.
                breakBefore[idx] = null;
                cumulative = naiveCumulative + h;
                currentPage = Math.max(currentPage, Math.ceil(cumulative / pageHeightPx));
            } else if (remaining < h) {
                const extra = Math.max(remaining, 0) + BREAK_PADDING_PX;
                breakBefore[idx] = extra;
                currentPage += 1;
                cumulative = pageHeightPx * (currentPage - 1) + h;
            } else {
                breakBefore[idx] = null;
                cumulative = naiveCumulative + h;
            }
            pageOf[idx] = currentPage;
        });
        setLayoutInfo({breakBefore, pageOf});
    }, [segments]);

    useLayoutEffect(() => {
        recompute();
        const ro = new ResizeObserver(() => recompute());
        segRefs.current.forEach(el => el && ro.observe(el));
        if (containerRef.current) ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, [segments, recompute]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <Box ref={containerRef} sx={{display: 'flex', flexDirection: 'column'}}>
            {segments.map((seg, idx) => {
                const breakHeight = layoutInfo.breakBefore[idx];
                return (
                    <Fragment key={seg.key}>
                        {breakHeight != null && (
                            <Box sx={{height: breakHeight, position: 'relative', flexShrink: 0}}>
                                <Box sx={{
                                    position: 'absolute', top: '50%', left: 0, right: 0,
                                    borderTop: '2px dashed', borderColor: 'error.light',
                                }}>
                                    <Typography variant="caption" sx={{
                                        position: 'absolute', right: 0, top: 0, transform: 'translateY(-100%)',
                                        color: 'error.main', bgcolor: 'background.paper', px: 0.5,
                                        fontWeight: 'bold', borderRadius: 0.5,
                                    }}>
                                        Seite {layoutInfo.pageOf[idx]} ↓
                                    </Typography>
                                </Box>
                            </Box>
                        )}
                        <Box ref={el => { segRefs.current[idx] = el; }}
                             sx={{mt: idx === 0 || breakHeight != null ? 0 : `${GAP_PX}px`}}>
                            {seg.node}
                        </Box>
                    </Fragment>
                );
            })}
        </Box>
    );
};
