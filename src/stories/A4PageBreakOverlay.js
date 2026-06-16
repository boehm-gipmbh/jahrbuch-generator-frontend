import {useRef, useState, useEffect} from 'react';
import {Box, Typography} from '@mui/material';

// Muss zu Document(PageSize.A4) + doc.setMargins(40, 40, 50, 40) in PdfService.java passen.
const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;
const MARGIN_TOP_PT = 40, MARGIN_RIGHT_PT = 40, MARGIN_BOTTOM_PT = 50, MARGIN_LEFT_PT = 40;
const CONTENT_WIDTH_PT = A4_WIDTH_PT - MARGIN_LEFT_PT - MARGIN_RIGHT_PT;
const CONTENT_HEIGHT_PT = A4_HEIGHT_PT - MARGIN_TOP_PT - MARGIN_BOTTOM_PT;
const PAGE_RATIO = CONTENT_HEIGHT_PT / CONTENT_WIDTH_PT;

// Blendet gestrichelte Linien dort ein, wo im PDF (A4) ein Seitenumbruch wäre.
// Nur eine Annäherung – Re-Layout im PDF (Textfluss, Polaroid-Rotation) kann leicht abweichen.
export const A4PageBreakOverlay = ({children}) => {
    const ref = useRef(null);
    const [breaks, setBreaks] = useState([]);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const recompute = () => {
            const width = el.clientWidth;
            const height = el.scrollHeight;
            if (!width || !height) { setBreaks([]); return; }
            const pageHeightPx = width * PAGE_RATIO;
            const count = Math.floor(height / pageHeightPx);
            const next = [];
            for (let i = 1; i <= count; i++) next.push(i * pageHeightPx);
            setBreaks(next);
        };
        recompute();
        const ro = new ResizeObserver(recompute);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    return (
        <Box ref={ref} sx={{position: 'relative'}}>
            {children}
            {breaks.map((top, idx) => (
                <Box key={idx} sx={{
                    position: 'absolute', left: 0, right: 0, top,
                    borderTop: '2px dashed', borderColor: 'error.light',
                    pointerEvents: 'none', zIndex: 5,
                }}>
                    <Typography variant="caption" sx={{
                        position: 'absolute', right: 0, top: -9, transform: 'translateY(-100%)',
                        color: 'error.main', bgcolor: 'background.paper', px: 0.5, fontWeight: 'bold',
                        borderRadius: 0.5,
                    }}>
                        Seite {idx + 2} ↓
                    </Typography>
                </Box>
            ))}
        </Box>
    );
};
