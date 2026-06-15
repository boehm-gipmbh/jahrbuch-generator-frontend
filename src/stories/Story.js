import React, {useState, useRef, useEffect} from 'react';
import {useDispatch} from 'react-redux';
import {useParams} from 'react-router-dom';
import {
    Box, Button, Container, IconButton, Paper, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import LibraryAddIcon from '@mui/icons-material/LibraryAdd';
import ViewAgendaIcon from '@mui/icons-material/ViewAgenda';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import GridViewIcon from '@mui/icons-material/GridView';
import AutoAwesomeMosaicIcon from '@mui/icons-material/AutoAwesomeMosaic';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ImageIcon from '@mui/icons-material/Image';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import '../App.css';
import {api as texteApi} from '../texte/api';
import {api as bilderApi} from '../bilder/api';
import {api as videoApi} from '../videos/api';
import {Layout, newText} from '../layout';
import {api as storyApi} from './api.js';
import {BilderUploadDialog} from '../bilder/BilderUploadDialog';
import {VideoUploadDialog} from '../videos/VideoUploadDialog';
import {SortableVideoCard} from '../videos/SortableVideoCard';
import {
    DndContext, DragOverlay, closestCenter, closestCorners, pointerWithin, rectIntersection,
    PointerSensor, useSensor, useSensors, useDroppable
} from '@dnd-kit/core';
import {SortableContext, arrayMove, verticalListSortingStrategy, useSortable} from '@dnd-kit/sortable';
import {restrictToVerticalAxis, restrictToWindowEdges} from '@dnd-kit/modifiers';
import {CSS} from '@dnd-kit/utilities';
import {SortableBildCard} from '../bilder/SortableBildCard';
import {SortableTextCard} from '../texte/SortableTextCard';
import {PendingItemsDrawer} from './PendingItemsDrawer';
import AuthImage from '../bilder/AuthImage';
import {BackgroundImagePicker} from '../pdf/BackgroundImagePicker';
import {ClusterButton} from './ClusterButton';
import {clusterColor} from './clusterColor';

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('de-DE') : '';

const multiColCollision = (args) => {
    const activeId = args.active.id;
    // Primary: pointer within a droppable (reliable for columns)
    const pointerHits = pointerWithin(args).filter(h => h.id !== activeId);
    if (pointerHits.length > 0) {
        // Prefer item hits over column hits so position can be computed precisely
        const itemHits = pointerHits.filter(h => !h.id.toString().startsWith('col-'));
        return itemHits.length > 0 ? itemHits : pointerHits;
    }
    // Fallback: dragged rect overlaps with a droppable (generous hit area for tall cards)
    const rectHits = rectIntersection(args).filter(h => h.id !== activeId);
    if (rectHits.length > 0) return rectHits;
    return closestCorners(args).filter(h => h.id !== activeId);
};


// Returns column-sorted items for a given column index.
// Groups items with the same clusterId together (at the position of the first cluster member).
// Items without a cluster stay in place.
const groupByClusters = (sortedItems) => {
    const seen = new Set();
    const result = [];
    for (const item of sortedItems) {
        const cid = item.item.clusterId ?? null;
        if (cid == null) {
            result.push(item);
        } else if (!seen.has(cid)) {
            seen.add(cid);
            sortedItems.filter(i => (i.item.clusterId ?? null) === cid).forEach(i => result.push(i));
        }
    }
    return result;
};

// Items whose storyColumn >= columnCount are clamped into the last column
// so they don't disappear when switching from a wider to a narrower layout.
const colSorted = (items, colIdx, columnCount) =>
    groupByClusters(
        items
            .filter(i => {
                const col = i.item.storyColumn ?? 0;
                const effective = columnCount != null ? Math.min(col, columnCount - 1) : col;
                return effective === colIdx;
            })
            .sort((a, b) => (a.item.storyPosition ?? 0) - (b.item.storyPosition ?? 0))
    );

// Splits items into a per-column map
const toColMap = (items, columnCount) => {
    const map = {};
    for (let c = 0; c < columnCount; c++) map[c] = colSorted(items, c, columnCount);
    return map;
};

// Flattens colMap col0…colN into a flat array
const flattenColMap = (colMap, columnCount) => {
    const result = [];
    for (let c = 0; c < columnCount; c++) result.push(...(colMap[c] || []));
    return result;
};

const DroppableColumn = ({id, children}) => {
    const {setNodeRef, isOver} = useDroppable({id});
    return (
        <Box
            ref={setNodeRef}
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                minHeight: 80,
                p: 1,
                borderRadius: 1,
                outline: '2px dashed',
                outlineColor: isOver ? 'primary.light' : 'transparent',
                transition: 'outline-color 0.15s',
            }}
        >
            {children}
        </Box>
    );
};

const ScrapbookDropZone = ({id, label, color, children}) => {
    const {setNodeRef, isOver} = useDroppable({id});
    return (
        <Box ref={setNodeRef} sx={{mb: 3}}>
            <Box sx={{display: 'flex', alignItems: 'center', gap: 1, mb: 1.5}}>
                <Box sx={{height: 3, width: 32, borderRadius: 2, bgcolor: color}}/>
                <Typography variant="overline" sx={{color, fontWeight: 'bold', lineHeight: 1}}>
                    {label}
                </Typography>
                <Box sx={{flex: 1, height: 1, bgcolor: 'divider'}}/>
            </Box>
            <Box
                sx={{
                    minHeight: 80,
                    borderRadius: 2,
                    p: 1,
                    outline: '2px dashed',
                    outlineColor: isOver ? color : 'transparent',
                    transition: 'outline-color 0.15s',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: 2,
                    alignItems: 'start',
                }}
            >
                {children}
            </Box>
        </Box>
    );
};

const ScrapbookBildCard = ({bild, onToggleHero, storyBilder = [], storyTexte = []}) => {
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({id: `scrap-${bild.id}`});
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };
    const accent = clusterColor(bild.clusterId);
    return (
        <Box ref={setNodeRef} style={style} sx={{position: 'relative'}}>
            <Box {...attributes} {...listeners} sx={{cursor: 'grab'}}>
                <AuthImage
                    src={bild.pfad?.startsWith('/') ? `/api/bilder/extern${bild.pfad}` : bild.pfad}
                    alt={bild.title || ''}
                    thumb
                    style={{
                        width: '100%', height: 140, objectFit: 'cover', display: 'block',
                        borderRadius: 6,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
                        borderLeft: accent ? `4px solid ${accent}` : undefined,
                    }}
                />
                <Typography variant="caption" sx={{
                    display: 'block', textAlign: 'center', mt: 0.5,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                    {bild.title || '–'}
                </Typography>
            </Box>
            {/* Hero toggle */}
            <Box
                onClick={(e) => { e.stopPropagation(); onToggleHero(bild); }}
                sx={{
                    position: 'absolute', top: 4, right: 4, zIndex: 1,
                    bgcolor: bild.hauptbild ? 'warning.main' : 'rgba(255,255,255,0.85)',
                    borderRadius: '50%', width: 26, height: 26,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', boxShadow: 1,
                    '&:hover': {bgcolor: bild.hauptbild ? 'warning.dark' : 'rgba(255,255,255,1)', transform: 'scale(1.15)'},
                    transition: 'transform 0.1s, background-color 0.1s',
                }}
            >
                {bild.hauptbild
                    ? <StarIcon sx={{fontSize: 16, color: 'white'}}/>
                    : <StarBorderIcon sx={{fontSize: 16, color: 'text.secondary'}}/>
                }
            </Box>
            {/* Cluster button */}
            <Box sx={{position: 'absolute', bottom: 22, right: 2, zIndex: 1,
                bgcolor: 'rgba(255,255,255,0.85)', borderRadius: '50%', boxShadow: 1}}>
                <ClusterButton mode="bild" item={bild} storyBilder={storyBilder} storyTexte={storyTexte}/>
            </Box>
        </Box>
    );
};

const ScrapbookTextCard = ({text, storyBilder = [], storyTexte = []}) => {
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({id: `scrap-text-${text.id}`});
    const style = {transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1};
    const accent = clusterColor(text.clusterId);
    return (
        <Box ref={setNodeRef} style={style} sx={{position: 'relative'}}>
            <Box {...attributes} {...listeners} sx={{cursor: 'grab'}}>
                <Paper variant="outlined" sx={{
                    p: 1.5, borderRadius: 1.5, minHeight: 64,
                    borderLeft: accent ? `4px solid ${accent}` : undefined,
                }}>
                    <Typography variant="caption" fontWeight="bold" sx={{
                        display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                        {text.title || '(kein Titel)'}
                    </Typography>
                    {text.description && (
                        <Typography variant="caption" color="text.secondary" sx={{
                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                        }}>
                            {text.description}
                        </Typography>
                    )}
                </Paper>
            </Box>
            <Box sx={{position: 'absolute', bottom: 2, right: 2, zIndex: 1,
                bgcolor: 'rgba(255,255,255,0.85)', borderRadius: '50%', boxShadow: 1}}>
                <ClusterButton mode="text" item={text} storyBilder={storyBilder} storyTexte={storyTexte}/>
            </Box>
        </Box>
    );
};

const TreeItemCard = ({type, item, storyBilder, storyTexte, isHero = false}) => {
    const [setHauptbild] = bilderApi.endpoints.setHauptbild.useMutation();
    const accent = clusterColor(item.clusterId);
    const border = accent ? `4px solid ${accent}` : isHero ? '4px solid #f59e0b' : '4px solid transparent';
    return (
        <Paper variant="outlined" sx={{
            display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 1.5,
            borderLeft: border, borderRadius: 1.5, position: 'relative',
        }}>
            {type === 'bild' ? (
                <AuthImage
                    src={item.pfad?.startsWith('/') ? `/api/bilder/extern${item.pfad}` : item.pfad}
                    alt={item.title || ''} thumb
                    style={{width: 56, height: 56, objectFit: 'cover', borderRadius: 4, flexShrink: 0}}
                />
            ) : (
                <Box sx={{width: 56, height: 56, borderRadius: 1, bgcolor: 'action.hover',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
                    <TextSnippetIcon fontSize="small" color="action"/>
                </Box>
            )}
            <Box sx={{flex: 1, minWidth: 0}}>
                <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5}}>
                    {isHero && <StarIcon sx={{fontSize: 14, color: '#f59e0b'}}/>}
                    {type === 'bild' && !isHero && <ImageIcon sx={{fontSize: 14, color: 'text.disabled'}}/>}
                    {type === 'text' && <TextSnippetIcon sx={{fontSize: 14, color: 'text.disabled'}}/>}
                    <Typography variant="body2" fontWeight={isHero ? 'bold' : 'normal'} noWrap>
                        {item.title || (type === 'bild' ? 'Kein Titel' : '(kein Titel)')}
                    </Typography>
                </Box>
                {item.description && (
                    <Typography variant="caption" color="text.secondary" sx={{
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                        {item.description}
                    </Typography>
                )}
            </Box>
            <Box sx={{flexShrink: 0, display: 'flex', alignItems: 'center'}}>
                {type === 'bild' && (
                    <Tooltip title={item.hauptbild ? 'Hero entfernen' : 'Als Hero setzen'}>
                        <IconButton size="small" onClick={() => setHauptbild({bild: item, hauptbild: !item.hauptbild})}
                            sx={{color: item.hauptbild ? 'warning.main' : 'action.disabled'}}>
                            {item.hauptbild ? <StarIcon fontSize="small"/> : <StarBorderIcon fontSize="small"/>}
                        </IconButton>
                    </Tooltip>
                )}
                <ClusterButton mode={type} item={item} storyBilder={storyBilder} storyTexte={storyTexte}/>
            </Box>
        </Paper>
    );
};

const StoryTreeView = ({bildItems, textItems, storyBilder, storyTexte}) => {
    // Group items by clusterId; each cluster has heroes (root) and children
    // Normalize clusterId to Number to avoid string/number key collisions in Map
    const clusterMap = new Map();
    bildItems.forEach(i => {
        const raw = i.item.clusterId;
        if (raw == null) return;
        const cid = Number(raw);
        if (!clusterMap.has(cid)) clusterMap.set(cid, {heroes: [], children: []});
        const g = clusterMap.get(cid);
        if (i.item.hauptbild) g.heroes.push({type: 'bild', item: i.item});
        else g.children.push({type: 'bild', item: i.item});
    });
    textItems.forEach(i => {
        const raw = i.item.clusterId;
        if (raw == null) return;
        const cid = Number(raw);
        if (!clusterMap.has(cid)) clusterMap.set(cid, {heroes: [], children: []});
        clusterMap.get(cid).children.push({type: 'text', item: i.item});
    });

    // All clusters sorted by earliest item position (hero first, then child)
    const clusterGroups = [...clusterMap.entries()]
        .sort(([, a], [, b]) => {
            const firstPos = g => Math.min(...[...g.heroes, ...g.children].map(i => i.item.storyPosition ?? 0));
            return firstPos(a) - firstPos(b);
        });

    // Items in any cluster are already accounted for
    const clusteredKeys = new Set();
    clusterGroups.forEach(([, g]) => {
        g.heroes.forEach(h => clusteredKeys.add(`bild-${h.item.id}`));
        g.children.forEach(c => clusteredKeys.add(`${c.type}-${c.item.id}`));
    });

    const soloItems = [
        ...bildItems.filter(i => !clusteredKeys.has(`bild-${i.item.id}`)).map(i => ({type: 'bild', item: i.item})),
        ...textItems.filter(i => !clusteredKeys.has(`text-${i.item.id}`)).map(i => ({type: 'text', item: i.item})),
    ].sort((a, b) => (a.item.storyPosition ?? 0) - (b.item.storyPosition ?? 0));

    const hasContent = clusterGroups.length > 0 || soloItems.length > 0;

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 1.5}}>
            {clusterGroups.map(([cid, {heroes, children}]) => {
                const accent = clusterColor(cid) ?? '#f59e0b';
                return (
                    <Box key={`cluster-${cid}`} sx={{borderLeft: `3px solid ${accent}`, pl: 1.5}}>
                        {heroes.length > 0 && (
                            <Box sx={{display: 'flex', flexDirection: 'column', gap: 0.75}}>
                                {heroes.map(({item}) => (
                                    <TreeItemCard key={`bild-${item.id}`} type="bild" item={item} isHero
                                        storyBilder={storyBilder} storyTexte={storyTexte}/>
                                ))}
                            </Box>
                        )}
                        {children.length > 0 && (
                            <Box sx={{ml: heroes.length > 0 ? 2 : 0, mt: heroes.length > 0 ? 0.75 : 0,
                                display: 'flex', flexDirection: 'column', gap: 0.75}}>
                                {children.map(({type, item}) => (
                                    <TreeItemCard key={`${type}-${item.id}`} type={type} item={item}
                                        storyBilder={storyBilder} storyTexte={storyTexte}/>
                                ))}
                            </Box>
                        )}
                    </Box>
                );
            })}
            {soloItems.length > 0 && clusterGroups.length > 0 && (
                <Box sx={{borderTop: '1px solid', borderColor: 'divider', pt: 1.5, mt: 0.5}}/>
            )}
            {soloItems.map(({type, item}) => (
                <TreeItemCard key={`solo-${type}-${item.id}`} type={type} item={item}
                    storyBilder={storyBilder} storyTexte={storyTexte}/>
            ))}
            {!hasContent && (
                <Typography variant="body2" color="text.disabled" sx={{p: 2, textAlign: 'center'}}>
                    Keine Items in dieser Story
                </Typography>
            )}
        </Box>
    );
};

export const Story = ({title = 'Deine Geschichte', filterText = () => false, filterBild = () => false}) => {
    const {storyId} = useParams();
    const {story} = storyApi.endpoints.getStories.useQuery(undefined, {
        selectFromResult: ({data}) => ({story: data?.find(s => s.id === parseInt(storyId))})
    });
    if (Boolean(story)) {
        title = story?.name;
        filterText = text => text.story?.id === story.id;
        filterBild = bild => bild.story?.id === story.id;
    }

    const [layout, setLayout] = useState('2col');
    useEffect(() => { if (story?.layout) setLayout(story.layout); }, [story?.layout]); // eslint-disable-line react-hooks/exhaustive-deps
    const [updateStory] = storyApi.endpoints.updateStory.useMutation();
    const [setHauptbild] = bilderApi.endpoints.setHauptbild.useMutation();
    const handleLayout = (_, newLayout) => {
        if (!newLayout) return;
        setLayout(newLayout);
        if (story) updateStory({...story, layout: newLayout});
    };

    const [editingName, setEditingName] = useState(false);
    const [nameValue, setNameValue] = useState('');
    const nameInputRef = useRef(null);

    const startEditName = () => {
        setNameValue(story?.name ?? '');
        setEditingName(true);
    };
    const commitName = () => {
        const trimmed = nameValue.trim();
        if (trimmed && trimmed !== story?.name) {
            updateStory({...story, name: trimmed});
        }
        setEditingName(false);
    };
    const cancelName = () => setEditingName(false);

    useEffect(() => {
        if (editingName) nameInputRef.current?.focus();
    }, [editingName]);
    const handleToggleHero = (bild) => {
        setHauptbild({bild, hauptbild: !bild.hauptbild});
    };

    const dispatch = useDispatch();
    const {data: texteData} = texteApi.endpoints.getTexte.useQuery(undefined, {pollingInterval: 10000});
    const {data: bilderData} = bilderApi.endpoints.getBilder.useQuery(undefined, {pollingInterval: 10000});
    const {data: videoData} = videoApi.endpoints.getVideos.useQuery(undefined, {pollingInterval: 10000});

    const storyBilder = bilderData?.filter(b => b.story?.id === story?.id) ?? [];
    const parsedBackground = React.useMemo(() => {
        if (!story?.background) return null;
        try {
            const bg = JSON.parse(story.background);
            const bild = bilderData?.find(b => b.id === bg.bildId);
            return bild ? {...bg, pfad: bild.pfad} : bg;
        } catch { return null; }
    }, [story?.background, bilderData]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleBackgroundChange = (value) => {
        if (!story) return;
        const bg = value ? {bildId: value.bildId, opacity: value.opacity, tint: value.tint, offsetX: value.offsetX ?? 0, offsetY: value.offsetY ?? 0, zoom: value.zoom || 1, outpaintedPfad: value.outpaintedPfad ?? null} : null;
        updateStory({...story, background: bg ? JSON.stringify(bg) : null});
    };
    const [deleteVideo] = videoApi.endpoints.deleteVideo.useMutation();
    const [setVideoComplete] = videoApi.endpoints.setComplete.useMutation();
    const [updateVideo] = videoApi.endpoints.updateVideo.useMutation();
    const {data: storiesData, isSuccess: storiesLoaded} = storyApi.endpoints.getStories.useQuery(undefined);
    const [setTextComplete] = texteApi.endpoints.setComplete.useMutation();
    const [setBildComplete] = bilderApi.endpoints.setComplete.useMutation();
    const [updateBild] = bilderApi.endpoints.updateBild.useMutation();
    const [updateText] = texteApi.endpoints.updateText.useMutation();
    const [reorderStory] = storyApi.endpoints.reorderStory.useMutation();
    const [triggerCapture] = bilderApi.endpoints.triggerCapture.useMutation();
    const {data: capturesConfig} = bilderApi.endpoints.getCapturesConfig.useQuery();

    const sensors = useSensors(useSensor(PointerSensor, {activationConstraint: {distance: 5}}));

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [dragItems, setDragItems] = useState(null);
    const dragItemsRef = useRef(null);
    const pendingReorderRef = useRef(false);
    const pointerYRef = useRef(0);

    // Clear optimistic state when server data arrives (only when not actively dragging and no reorder pending)
    useEffect(() => {
        if (activeItem === null && !pendingReorderRef.current) updateDragItems(null);
    }, [texteData, bilderData, videoData]); // eslint-disable-line react-hooks/exhaustive-deps
    const [activeItem, setActiveItem] = useState(null);

    const updateDragItems = (val) => {
        dragItemsRef.current = val;
        setDragItems(val);
    };

    const filterVideo = video => video.story?.id === story?.id && !video.deleted;

    const bildItems = bilderData
        ? Array.from(bilderData).filter(filterBild).map(b => ({type: 'bild', id: `bild-${b.id}`, item: b}))
        : [];
    const textItems = texteData
        ? Array.from(texteData).filter(filterText).map(t => ({type: 'text', id: `text-${t.id}`, item: t}))
        : [];
    const videoItems = videoData
        ? Array.from(videoData).filter(filterVideo).map(v => ({type: 'video', id: `video-${v.id}`, item: v}))
        : [];
    const serverItems = [...bildItems, ...textItems, ...videoItems];
    const activeItems = dragItems || serverItems;

    const isScrapbook = layout === 'scrapbook';
    const isTree = layout === 'tree';
    const is1col = layout === '1col';
    const columnCount = layout === '2col' ? 2 : layout === 'grid' ? 3 : 1;

    const itemsSorted1col = groupByClusters([...activeItems].sort((a, b) => {
        const colDiff = (a.item.storyColumn ?? 0) - (b.item.storyColumn ?? 0);
        if (colDiff !== 0) return colDiff;
        return (a.item.storyPosition ?? 0) - (b.item.storyPosition ?? 0);
    }));

    const renderCard = (type, id, item) => type === 'video' ? (
        <SortableVideoCard
            key={id}
            video={item}
            story={story}
            storiesLoaded={storiesLoaded}
            stories={storiesData || []}
            onSetComplete={(args) => setVideoComplete(args)}
            onUpdate={(v) => updateVideo(v).unwrap()
                .then(() => dispatch(videoApi.util.invalidateTags(['Video'])))
                .catch(e => console.error(e))}
            onDelete={() => deleteVideo(item).unwrap()
                .then(() => dispatch(videoApi.util.invalidateTags(['Video'])))
                .catch(e => console.error(e))}
        />
    ) : type === 'bild' ? (
        <SortableBildCard
            key={id}
            bild={item}
            story={story}
            storiesLoaded={storiesLoaded}
            stories={storiesData || []}
            onSetComplete={(args) => setBildComplete(args)}
            storyBilder={bildItems.map(i => i.item)}
            storyTexte={textItems.map(i => i.item)}
        />
    ) : (
        <SortableTextCard
            key={id}
            text={item}
            story={story}
            storiesLoaded={storiesLoaded}
            stories={storiesData || []}
            onSetComplete={(args) => setTextComplete(args)}
            storyBilder={bildItems.map(i => i.item)}
            storyTexte={textItems.map(i => i.item)}
        />
    );

    const handleDragStart = ({active, activatorEvent}) => {
        pointerYRef.current = activatorEvent?.clientY ?? 0;
        updateDragItems([...serverItems]);
        setActiveItem(serverItems.find(i => i.id === active.id) || null);
    };

    const handleDragMove = ({activatorEvent, delta}) => {
        pointerYRef.current = (activatorEvent?.clientY ?? 0) + (delta?.y ?? 0);
    };

    const handleDragOver = ({active, over, collisions}) => {
        if (!over || is1col) return;
        const current = dragItemsRef.current || [...serverItems];

        // Prefer a col-X hit from the full collisions list — it uses pointer-within
        // boundaries and is more reliable than the primary over.id (which may be a
        // card whose storyColumn in dragItems is stale after a previous over-event).
        const colCollision = collisions?.find(c => c.id.toString().startsWith('col-'));
        let overColumn;
        if (colCollision) {
            overColumn = parseInt(colCollision.id.replace('col-', ''));
        } else if (over.id.toString().startsWith('col-')) {
            overColumn = parseInt(over.id.replace('col-', ''));
        } else {
            // Last resort: use server column of the over-item (not dragItems, to avoid
            // stale state cascading into the wrong column)
            overColumn = serverItems.find(i => i.id === over.id)?.item.storyColumn
                ?? current.find(i => i.id === over.id)?.item.storyColumn
                ?? 0;
        }

        const activeIdx = current.findIndex(i => i.id === active.id);
        if (activeIdx === -1) return;
        if ((current[activeIdx].item.storyColumn ?? 0) === overColumn) return;

        updateDragItems(current.map((item, idx) =>
            idx === activeIdx ? {...item, item: {...item.item, storyColumn: overColumn}} : item
        ));
    };

    const handleDragEnd = ({active, over}) => {
        const current = dragItemsRef.current || [...serverItems];
        setActiveItem(null);

        if (!over) {
            updateDragItems(null);
            return;
        }

        let reordered;

        if (is1col) {
            if (active.id === over.id) return;
            const sorted = [...current].sort((a, b) => {
                const colDiff = (a.item.storyColumn ?? 0) - (b.item.storyColumn ?? 0);
                if (colDiff !== 0) return colDiff;
                return (a.item.storyPosition ?? 0) - (b.item.storyPosition ?? 0);
            });
            const oldIndex = sorted.findIndex(i => i.id === active.id);
            const newIndex = sorted.findIndex(i => i.id === over.id);
            if (oldIndex === newIndex) return;
            reordered = arrayMove(sorted, oldIndex, newIndex);
        } else {
            // Target column = what handleDragOver set in dragItems (user's intention)
            const activeEntry = current.find(i => i.id === active.id);
            const overColumn = activeEntry?.item.storyColumn ?? 0;

            // Build per-column sorted arrays, remove active from all columns
            const colMap = toColMap(current, columnCount);
            for (let c = 0; c < columnCount; c++) {
                colMap[c] = colMap[c].filter(i => i.id !== active.id);
            }

            const updated = {...activeEntry, item: {...activeEntry.item, storyColumn: overColumn}};

            // Position within target column: use over.id only if it's in the target column
            const overItemInTarget = !over.id.toString().startsWith('col-') &&
                colMap[overColumn].some(i => i.id === over.id);

            if (overItemInTarget) {
                const overIdx = colMap[overColumn].findIndex(i => i.id === over.id);
                // Use pointer Y at drop — more reliable than dragged card center when cards are tall
                // (card center can be far from the pointer when dragging across long distances).
                const overThreshold = over.rect.top + over.rect.height * 0.5;
                const insertIdx = pointerYRef.current > overThreshold ? overIdx + 1 : overIdx;
                colMap[overColumn] = [
                    ...colMap[overColumn].slice(0, insertIdx),
                    updated,
                    ...colMap[overColumn].slice(insertIdx)
                ];
            } else if (colMap[overColumn].length > 0) {
                // Pointer over column background (not on any item): use column midpoint to
                // decide prepend vs append — more robust than a fixed 50 px offset.
                const pointerY = pointerYRef.current;
                const colMidY = over.rect.top + over.rect.height / 2;
                const insertAtStart = pointerY < colMidY;
                colMap[overColumn] = insertAtStart
                    ? [updated, ...colMap[overColumn]]
                    : [...colMap[overColumn], updated];
            } else {
                colMap[overColumn] = [updated];
            }

            reordered = flattenColMap(colMap, columnCount);
        }

        // Update storyPosition optimistically so colSorted/itemsSorted1col display the correct order
        if (reordered) {
            const posCounters = {};
            reordered = reordered.map(item => {
                const col = item.item.storyColumn ?? 0;
                posCounters[col] = posCounters[col] ?? 0;
                return {...item, item: {...item.item, storyPosition: posCounters[col]++}};
            });
        }

        if (story && reordered) {
            // Optimistic: keep reordered state visible immediately
            pendingReorderRef.current = true;
            updateDragItems(reordered);
            reorderStory({
                storyId: story.id,
                items: reordered.map(i => ({type: i.type, id: i.item.id, column: i.item.storyColumn ?? 0}))
            }).unwrap()
                .then(() => {
                    pendingReorderRef.current = false;
                    dispatch(bilderApi.util.invalidateTags(['Bild']));
                    dispatch(texteApi.util.invalidateTags(['Text']));
                    dispatch(videoApi.util.invalidateTags(['Video']));
                })
                .catch((err) => {
                    pendingReorderRef.current = false;
                    updateDragItems(null);
                });
        } else {
            updateDragItems(null);
        }
    };

    const handleAssignToStory = (type, item) => {
        if (type === 'bild') {
            updateBild({...item, story: {id: story.id}}).unwrap()
                .then(() => dispatch(bilderApi.util.invalidateTags(['Bild'])))
                .catch(e => console.error(e));
        } else {
            updateText({...item, story: {id: story.id}}).unwrap()
                .then(() => dispatch(texteApi.util.invalidateTags(['Text'])))
                .catch(e => console.error(e));
        }
    };

    const handleDragCancel = () => {
        updateDragItems(null);
        setActiveItem(null);
    };

    return <Layout>
        <Container sx={{mt: theme => theme.spacing(2)}}>
            <Box sx={{position: 'sticky', top: {xs: 56, sm: 64}, zIndex: 'appBar', backgroundColor: 'background.default', pt: 1, pb: 1, mb: 1, boxShadow: '0 2px 4px rgba(0,0,0,0.08)'}}>
                <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1}}>
                    <Box>
                        {editingName ? (
                            <TextField
                                inputRef={nameInputRef}
                                value={nameValue}
                                onChange={e => setNameValue(e.target.value)}
                                onBlur={commitName}
                                onKeyDown={e => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') cancelName(); }}
                                size="small"
                                variant="standard"
                                InputProps={{sx: {fontSize: '1.25rem', fontWeight: 500, color: 'primary.main'}}}
                                sx={{minWidth: 200}}
                            />
                        ) : (
                            <Tooltip title="Namen bearbeiten">
                                <Typography
                                    component="h2" variant="h6" color="primary"
                                    onClick={startEditName}
                                    sx={{cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 0.5,
                                        '&:hover .edit-icon': {opacity: 1}}}
                                >
                                    {title}
                                    <EditIcon className="edit-icon" sx={{fontSize: 16, opacity: 0, transition: 'opacity 0.15s'}}/>
                                </Typography>
                            </Tooltip>
                        )}
                        {story && (story.user?.name || story.created) && (
                            <Typography variant="caption" color="text.disabled">
                                {[story.user?.name, fmtDate(story.created)].filter(Boolean).join(' · ')}
                            </Typography>
                        )}
                    </Box>
                    <ToggleButtonGroup value={layout} exclusive onChange={handleLayout} size="small">
                        <ToggleButton value="tree"><Tooltip title="StoryFlow (Baum-Ansicht)"><AccountTreeIcon fontSize="small"/></Tooltip></ToggleButton>
                        <ToggleButton value="scrapbook"><Tooltip title="Hero-Layout"><AutoAwesomeMosaicIcon fontSize="small"/></Tooltip></ToggleButton>
                        <ToggleButton value="1col"><Tooltip title="1 Spalte"><ViewAgendaIcon fontSize="small"/></Tooltip></ToggleButton>
                        <ToggleButton value="2col"><Tooltip title="2 Spalten"><ViewColumnIcon fontSize="small"/></Tooltip></ToggleButton>
                        <ToggleButton value="grid"><Tooltip title="3 Spalten"><GridViewIcon fontSize="small"/></Tooltip></ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                <Box sx={{display: 'flex', gap: 1, flexWrap: 'wrap'}}>
                    <Button startIcon={<AddIcon/>} onClick={() => dispatch(newText({story: story}))}>
                        Erinnerung hinzufügen
                    </Button>
                    {story && (
                        <Button startIcon={<LibraryAddIcon/>} onClick={() => setDrawerOpen(true)}>
                            Aus Bibliothek
                        </Button>
                    )}
                    {capturesConfig?.enabled && (
                        <Button startIcon={<AddIcon/>} onClick={() => triggerCapture()}>
                            Fotoaufnahme
                        </Button>
                    )}
                    <BilderUploadDialog story={story}/>
                    <VideoUploadDialog story={story}/>
                </Box>
                {story && (
                    <Box sx={{mt: 1}}>
                        <BackgroundImagePicker
                            label="PDF-Hintergrundbild"
                            value={parsedBackground}
                            onChange={handleBackgroundChange}
                            bilder={storyBilder}
                        />
                    </Box>
                )}
            </Box>

            <Paper sx={{p: 2}}>
                {isTree ? (
                    <StoryTreeView
                        bildItems={bildItems}
                        textItems={textItems}
                        storyBilder={bildItems.map(i => i.item)}
                        storyTexte={textItems.map(i => i.item)}
                    />
                ) : isScrapbook ? (() => {
                    const heroBilder = bildItems.filter(i => i.item.hauptbild).sort((a,b) => (a.item.storyPosition??0)-(b.item.storyPosition??0));
                    const gridBilder = bildItems.filter(i => !i.item.hauptbild).sort((a,b) => (a.item.storyPosition??0)-(b.item.storyPosition??0));
                    return (
                        <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToWindowEdges]}>
                            <ScrapbookDropZone id="zone-hero" label="Hero · Hauptbilder" color="#f59e0b">
                                <SortableContext items={heroBilder.map(i => `scrap-${i.item.id}`)} strategy={verticalListSortingStrategy}>
                                    {heroBilder.length === 0 && (
                                        <Typography variant="body2" color="text.disabled" sx={{p: 2, gridColumn: '1/-1'}}>
                                            Stern ★ an einem Bild klicken um es als Hero zu markieren
                                        </Typography>
                                    )}
                                    {heroBilder.map(({item}) => (
                                        <ScrapbookBildCard key={item.id} bild={item} onToggleHero={handleToggleHero}
                                            storyBilder={bildItems.map(i => i.item)} storyTexte={textItems.map(i => i.item)}/>
                                    ))}
                                </SortableContext>
                            </ScrapbookDropZone>
                            <ScrapbookDropZone id="zone-grid" label="Grid · Weitere Bilder" color="#6366f1">
                                <SortableContext items={gridBilder.map(i => `scrap-${i.item.id}`)} strategy={verticalListSortingStrategy}>
                                    {gridBilder.length === 0 && (
                                        <Typography variant="body2" color="text.disabled" sx={{p: 2, gridColumn: '1/-1'}}>
                                            Keine weiteren Bilder
                                        </Typography>
                                    )}
                                    {gridBilder.map(({item}) => (
                                        <ScrapbookBildCard key={item.id} bild={item} onToggleHero={handleToggleHero}
                                            storyBilder={bildItems.map(i => i.item)} storyTexte={textItems.map(i => i.item)}/>
                                    ))}
                                </SortableContext>
                            </ScrapbookDropZone>
                            <ScrapbookDropZone id="zone-texte" label="Texte" color="#10b981">
                                <SortableContext items={textItems.map(i => `scrap-text-${i.item.id}`)} strategy={verticalListSortingStrategy}>
                                    {textItems.length === 0 && (
                                        <Typography variant="body2" color="text.disabled" sx={{p: 2, gridColumn: '1/-1'}}>
                                            Keine Texte in dieser Story
                                        </Typography>
                                    )}
                                    {textItems.map(({item}) => (
                                        <ScrapbookTextCard key={item.id} text={item}
                                            storyBilder={bildItems.map(i => i.item)} storyTexte={textItems.map(i => i.item)}/>
                                    ))}
                                </SortableContext>
                            </ScrapbookDropZone>
                        </DndContext>
                    );
                })() : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={is1col ? closestCenter : multiColCollision}
                    modifiers={is1col ? [restrictToVerticalAxis] : []}
                    onDragStart={handleDragStart}
                    onDragMove={handleDragMove}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                    onDragCancel={handleDragCancel}
                >
                    {is1col ? (
                        <SortableContext
                            items={itemsSorted1col.map(i => i.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                                {itemsSorted1col.map(({type, id, item}) => (
                                    <Box key={id}>{renderCard(type, id, item)}</Box>
                                ))}
                            </Box>
                        </SortableContext>
                    ) : (
                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
                            gap: 2,
                        }}>
                            {Array.from({length: columnCount}).map((_, colIdx) => {
                                const colItems = colSorted(activeItems, colIdx, columnCount);
                                return (
                                    <SortableContext
                                        key={colIdx}
                                        items={colItems.map(i => i.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <DroppableColumn id={`col-${colIdx}`}>
                                            {colItems.map(({type, id, item}) => (
                                                <Box key={id}>{renderCard(type, id, item)}</Box>
                                            ))}
                                        </DroppableColumn>
                                    </SortableContext>
                                );
                            })}
                        </Box>
                    )}

                    <DragOverlay>
                        {activeItem && (
                            <Paper elevation={8} sx={{p: 2, opacity: 0.92, display: 'flex', flexDirection: 'column', position: 'relative'}}>
                                <Typography variant="subtitle1" color="primary"
                                            sx={{mb: 1, fontWeight: 'bold', textAlign: 'center', pt: 2}}>
                                    {activeItem.item.title || 'Kein Titel'}
                                </Typography>
                                {activeItem.type === 'bild' ? (
                                    <Box sx={{mb: 2}}>
                                        <AuthImage
                                            src={activeItem.item.pfad?.startsWith('/') ? `/api/bilder/extern${activeItem.item.pfad}` : activeItem.item.pfad}
                                            alt={activeItem.item.description || ''}
                                            thumb
                                            style={{width: '100%', height: 'auto', display: 'block'}}
                                        />
                                        {activeItem.item.description && (
                                            <pre className="wrap-pre" style={{margin: '8px 0 0 0'}}>
                                                {activeItem.item.description}
                                            </pre>
                                        )}
                                    </Box>
                                ) : activeItem.type === 'video' ? (
                                    <Box sx={{mb: 2, textAlign: 'center', color: 'text.secondary'}}>
                                        🎬 Video
                                    </Box>
                                ) : (
                                    <pre className="wrap-pre" style={{margin: 0}}>
                                        {activeItem.item.description}
                                    </pre>
                                )}
                            </Paper>
                        )}
                    </DragOverlay>
                </DndContext>
                )}
            </Paper>
        </Container>

        <PendingItemsDrawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            bilder={bilderData}
            texte={texteData}
            onAssign={(type, item) => {
                handleAssignToStory(type, item);
                setDrawerOpen(false);
            }}
        />
    </Layout>;
};
