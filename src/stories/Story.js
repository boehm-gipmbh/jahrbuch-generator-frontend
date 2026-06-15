import React, {useState, useRef, useEffect} from 'react';
import {useDispatch} from 'react-redux';
import {useParams} from 'react-router-dom';
import {
    Box, Button, Container, Divider, IconButton, Menu, MenuItem, Paper, TextField,
    ToggleButton, ToggleButtonGroup, Tooltip, Typography
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import LibraryAddIcon from '@mui/icons-material/LibraryAdd';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import AutoAwesomeMosaicIcon from '@mui/icons-material/AutoAwesomeMosaic';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ImageIcon from '@mui/icons-material/Image';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import '../App.css';
import {api as texteApi} from '../texte/api';
import {api as bilderApi} from '../bilder/api';
import {api as videoApi} from '../videos/api';
import {Layout, newText} from '../layout';
import {api as storyApi} from './api.js';
import {BilderUploadDialog} from '../bilder/BilderUploadDialog';
import {VideoUploadDialog} from '../videos/VideoUploadDialog';
import {
    DndContext, DragOverlay, closestCenter,
    PointerSensor, useSensor, useSensors, useDroppable
} from '@dnd-kit/core';
import {SortableContext, arrayMove, verticalListSortingStrategy, useSortable} from '@dnd-kit/sortable';
import {restrictToVerticalAxis, restrictToWindowEdges} from '@dnd-kit/modifiers';
import {CSS} from '@dnd-kit/utilities';
import {PreviewBildCard} from '../bilder/PreviewBildCard';
import {PreviewTextCard} from '../texte/PreviewTextCard';
import {PreviewVideoCard} from '../videos/PreviewVideoCard';
import {PendingItemsDrawer} from './PendingItemsDrawer';
import AuthImage from '../bilder/AuthImage';
import {BackgroundImagePicker} from '../pdf/BackgroundImagePicker';
import {ClusterButton} from './ClusterButton';
import {clusterColor} from './clusterColor';

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('de-DE') : '';

// Custom collision for tree view: item drag → only tree-* targets; cluster drag → only cluster-* targets
const treeCollision = (args) => {
    const activeId = args.active.id?.toString() ?? '';
    const prefix = activeId.startsWith('cluster-') ? 'cluster-' : 'tree-';
    return closestCenter({
        ...args,
        droppableContainers: args.droppableContainers.filter(c => c.id.toString().startsWith(prefix)),
    });
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
    const [updateBild] = bilderApi.endpoints.updateBild.useMutation();
    const [deleteBild] = bilderApi.endpoints.deleteBild.useMutation();
    const [bilderSetComplete] = bilderApi.endpoints.setComplete.useMutation();
    const [setHauptbild] = bilderApi.endpoints.setHauptbild.useMutation();
    const [updateText] = texteApi.endpoints.updateText.useMutation();
    const [deleteText] = texteApi.endpoints.deleteText.useMutation();
    const [texteSetComplete] = texteApi.endpoints.setComplete.useMutation();

    const [editField, setEditField] = useState(null); // 'title' | 'description' | null
    const [editValue, setEditValue] = useState('');
    const [menuAnchor, setMenuAnchor] = useState(null);

    const accent = clusterColor(item.clusterId);
    const border = accent ? `4px solid ${accent}` : isHero ? '4px solid #f59e0b' : '4px solid transparent';
    const isComplete = Boolean(item.complete);

    const startEdit = (field, e) => {
        e.stopPropagation();
        if (isComplete) return;
        setEditField(field);
        setEditValue(item[field] ?? '');
    };

    const commitEdit = () => {
        if (editField && editValue !== (item[editField] ?? '')) {
            if (type === 'bild') updateBild({...item, [editField]: editValue});
            else updateText({...item, [editField]: editValue});
        }
        setEditField(null);
    };

    const handleKeyDown = (e) => {
        if (editField === 'title' && e.key === 'Enter') { e.preventDefault(); commitEdit(); }
        if (e.key === 'Escape') { setEditField(null); }
    };

    const handleToggleComplete = () => {
        setMenuAnchor(null);
        if (type === 'bild') bilderSetComplete({bild: item, complete: !isComplete});
        else texteSetComplete({text: item, complete: !isComplete});
    };

    const handleDelete = () => {
        setMenuAnchor(null);
        if (type === 'bild') deleteBild(item);
        else deleteText(item);
    };

    return (
        <Paper variant="outlined" sx={{
            display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 1.5,
            borderLeft: border, borderRadius: 1.5, position: 'relative',
            opacity: isComplete ? 0.55 : 1,
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
                    {isHero && <StarIcon sx={{fontSize: 14, color: '#f59e0b', flexShrink: 0}}/>}
                    {type === 'bild' && !isHero && <ImageIcon sx={{fontSize: 14, color: 'text.disabled', flexShrink: 0}}/>}
                    {type === 'text' && <TextSnippetIcon sx={{fontSize: 14, color: 'text.disabled', flexShrink: 0}}/>}
                    {editField === 'title' ? (
                        <TextField
                            size="small" variant="standard" fullWidth autoFocus
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={handleKeyDown}
                            inputProps={{style: {fontSize: '0.875rem', fontWeight: isHero ? 'bold' : 'normal'}}}
                            onClick={e => e.stopPropagation()}
                        />
                    ) : (
                        <Typography
                            variant="body2" fontWeight={isHero ? 'bold' : 'normal'} noWrap
                            onClick={e => startEdit('title', e)}
                            sx={!isComplete ? {cursor: 'text', '&:hover': {color: 'primary.main'}} : {}}
                        >
                            {item.title || (type === 'bild' ? 'Kein Titel' : '(kein Titel)')}
                        </Typography>
                    )}
                </Box>
                {(editField === 'description' || item.description) && (
                    editField === 'description' ? (
                        <TextField
                            size="small" variant="standard" fullWidth multiline autoFocus
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={handleKeyDown}
                            inputProps={{style: {fontSize: '0.75rem'}}}
                            onClick={e => e.stopPropagation()}
                            sx={{mt: 0.25}}
                        />
                    ) : (
                        <Typography
                            variant="caption" color="text.secondary"
                            onClick={e => startEdit('description', e)}
                            sx={{
                                display: '-webkit-box', WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                ...(!isComplete ? {cursor: 'text', '&:hover': {color: 'text.primary'}} : {}),
                            }}
                        >
                            {item.description}
                        </Typography>
                    )
                )}
                {!item.description && editField !== 'description' && !isComplete && (
                    <Typography
                        variant="caption" color="text.disabled"
                        onClick={e => startEdit('description', e)}
                        sx={{cursor: 'text', '&:hover': {color: 'text.secondary'}}}
                    >
                        Beschreibung hinzufügen…
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
                <IconButton size="small" onClick={e => { e.stopPropagation(); setMenuAnchor(e.currentTarget); }}>
                    <MoreVertIcon fontSize="small"/>
                </IconButton>
                <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}
                      anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
                      transformOrigin={{vertical: 'top', horizontal: 'right'}}>
                    <MenuItem onClick={handleToggleComplete} dense>
                        {isComplete
                            ? <><RadioButtonUncheckedIcon fontSize="small" sx={{mr: 1}}/> Als offen markieren</>
                            : <><TaskAltIcon fontSize="small" sx={{mr: 1}}/> Als fertig markieren</>
                        }
                    </MenuItem>
                    <Divider/>
                    <MenuItem onClick={handleDelete} dense sx={{color: 'error.main'}}>
                        <DeleteOutlineIcon fontSize="small" sx={{mr: 1}}/> Löschen
                    </MenuItem>
                </Menu>
            </Box>
        </Paper>
    );
};

const buildTreeGroups = (bildItems, textItems) => {
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
    const clusterGroups = [...clusterMap.entries()]
        .sort(([, a], [, b]) => {
            const firstPos = g => Math.min(...[...g.heroes, ...g.children].map(i => i.item.storyPosition ?? 0));
            return firstPos(a) - firstPos(b);
        });
    const clusteredKeys = new Set();
    clusterGroups.forEach(([, g]) => {
        g.heroes.forEach(h => clusteredKeys.add(`bild-${h.item.id}`));
        g.children.forEach(c => clusteredKeys.add(`${c.type}-${c.item.id}`));
    });
    const soloItems = [
        ...bildItems.filter(i => !clusteredKeys.has(`bild-${i.item.id}`)).map(i => ({type: 'bild', item: i.item})),
        ...textItems.filter(i => !clusteredKeys.has(`text-${i.item.id}`)).map(i => ({type: 'text', item: i.item})),
    ].sort((a, b) => (a.item.storyPosition ?? 0) - (b.item.storyPosition ?? 0));
    return {clusterGroups, soloItems};
};

const SortableClusterBlock = ({cid, accent, children}) => {
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} =
        useSortable({id: `cluster-${cid}`});
    return (
        <Box ref={setNodeRef} sx={{transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0 : 1}}>
            <Box sx={{borderLeft: `3px solid ${accent}`, pl: 1.5}}>
                <Tooltip title="Cluster verschieben">
                    <Box {...attributes} {...listeners} sx={{
                        cursor: 'grab', display: 'inline-flex', alignItems: 'center',
                        color: accent, opacity: 0.35, mb: 0.25, '&:hover': {opacity: 0.75},
                    }}>
                        <DragIndicatorIcon sx={{fontSize: 13}}/>
                    </Box>
                </Tooltip>
                {children}
            </Box>
        </Box>
    );
};

const SortableTreeItemCard = ({type, item, storyBilder, storyTexte, isHero}) => {
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({id: `tree-${type}-${item.id}`});
    return (
        <Box ref={setNodeRef} style={{transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0 : 1}}
             {...attributes} {...listeners}>
            <TreeItemCard type={type} item={item} storyBilder={storyBilder} storyTexte={storyTexte} isHero={isHero}/>
        </Box>
    );
};

const StoryTreeView = ({clusterGroups, soloItems, storyBilder, storyTexte}) => {
    const hasContent = clusterGroups.length > 0 || soloItems.length > 0;
    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 1.5}}>
            <SortableContext items={clusterGroups.map(([cid]) => `cluster-${cid}`)} strategy={verticalListSortingStrategy}>
                {clusterGroups.map(([cid, {heroes, children: clChildren}]) => {
                    const accent = clusterColor(cid) ?? '#f59e0b';
                    const allClusterItems = [
                        ...heroes.map(i => ({...i, isHero: true})),
                        ...clChildren.map(i => ({...i, isHero: false})),
                    ].sort((a, b) => (a.item.storyPosition ?? 0) - (b.item.storyPosition ?? 0));
                    const itemIds = allClusterItems.map(({type, item}) => `tree-${type}-${item.id}`);
                    return (
                        <SortableClusterBlock key={`cluster-${cid}`} cid={cid} accent={accent}>
                            <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                                <Box sx={{display: 'flex', flexDirection: 'column', gap: 0.75}}>
                                    {allClusterItems.map(({type, item, isHero}) => (
                                        <SortableTreeItemCard key={`tree-${type}-${item.id}`} type={type} item={item}
                                            isHero={isHero} storyBilder={storyBilder} storyTexte={storyTexte}/>
                                    ))}
                                </Box>
                            </SortableContext>
                        </SortableClusterBlock>
                    );
                })}
            </SortableContext>
            {soloItems.length > 0 && clusterGroups.length > 0 && (
                <Box sx={{borderTop: '1px solid', borderColor: 'divider', pt: 1.5, mt: 0.5}}/>
            )}
            {soloItems.length > 0 && (
                <SortableContext items={soloItems.map(({type, item}) => `tree-${type}-${item.id}`)} strategy={verticalListSortingStrategy}>
                    <Box sx={{display: 'flex', flexDirection: 'column', gap: 0.75}}>
                        {soloItems.map(({type, item}) => (
                            <SortableTreeItemCard key={`tree-${type}-${item.id}`} type={type} item={item}
                                storyBilder={storyBilder} storyTexte={storyTexte}/>
                        ))}
                    </Box>
                </SortableContext>
            )}
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
    const is2col = layout === '2col';

    const treeGroups = isTree
        ? buildTreeGroups(activeItems.filter(i => i.type === 'bild'), activeItems.filter(i => i.type === 'text'))
        : {clusterGroups: [], soloItems: []};

    const handleDragStart = ({active}) => {
        updateDragItems([...serverItems]);
        const canonicalId = active.id.toString().replace(/^(tree-|cluster-)/, '');
        setActiveItem(serverItems.find(i => i.id === canonicalId) || null);
    };

    const handleDragEnd = ({active, over}) => {
        const current = dragItemsRef.current || [...serverItems];
        setActiveItem(null);

        if (!over) {
            updateDragItems(null);
            return;
        }

        if (isTree) {
            const activeIdStr = active.id.toString();
            const overIdStr = over.id.toString();

            if (activeIdStr.startsWith('cluster-')) {
                // --- CLUSTER DRAG: move entire cluster block ---
                const activeCid = Number(activeIdStr.replace('cluster-', ''));
                let overCid;
                if (overIdStr.startsWith('cluster-')) {
                    overCid = Number(overIdStr.replace('cluster-', ''));
                } else {
                    const overCanonical = overIdStr.replace(/^tree-/, '');
                    const overEntry = current.find(i => i.id === overCanonical);
                    const raw = overEntry?.item.clusterId;
                    overCid = raw != null ? Number(raw) : null;
                }
                if (overCid == null || overCid === activeCid) { updateDragItems(null); return; }

                // Build cluster order from current items
                const cMap = new Map();
                current.filter(i => i.type !== 'video').forEach(i => {
                    const cid = i.item.clusterId != null ? Number(i.item.clusterId) : null;
                    if (cid == null) return;
                    if (!cMap.has(cid)) cMap.set(cid, []);
                    cMap.get(cid).push(i);
                });
                const cidsSorted = [...cMap.entries()]
                    .sort(([, a], [, b]) =>
                        Math.min(...a.map(i => i.item.storyPosition ?? 0)) -
                        Math.min(...b.map(i => i.item.storyPosition ?? 0))
                    ).map(([cid]) => cid);
                const oldIdx = cidsSorted.indexOf(activeCid);
                const newIdx = cidsSorted.indexOf(overCid);
                if (oldIdx === -1 || newIdx === -1) { updateDragItems(null); return; }

                const newClusterOrder = arrayMove(cidsSorted, oldIdx, newIdx);
                const clusteredSet = new Set([...cMap.values()].flat().map(i => i.id));
                const soloInOrder = current.filter(i => i.type !== 'video' && !clusteredSet.has(i.id))
                    .sort((a, b) => (a.item.storyPosition ?? 0) - (b.item.storyPosition ?? 0));
                const orderedItems = [
                    ...newClusterOrder.flatMap(cid =>
                        (cMap.get(cid) ?? []).sort((a, b) => (a.item.storyPosition ?? 0) - (b.item.storyPosition ?? 0))
                    ),
                    ...soloInOrder,
                ];
                let pos = 0;
                const optimisticOrdered = orderedItems.map(i => ({...i, item: {...i.item, storyPosition: pos++}}));
                pendingReorderRef.current = true;
                updateDragItems([...optimisticOrdered, ...current.filter(i => i.type === 'video')]);
                reorderStory({
                    storyId: story.id,
                    items: optimisticOrdered.map(i => ({type: i.type, id: i.item.id, column: 0})),
                }).unwrap()
                    .then(() => {
                        pendingReorderRef.current = false;
                        dispatch(bilderApi.util.invalidateTags(['Bild']));
                        dispatch(texteApi.util.invalidateTags(['Text']));
                    })
                    .catch(() => {
                        pendingReorderRef.current = false;
                        updateDragItems(null);
                    });
                return;

            } else if (activeIdStr.startsWith('tree-')) {
                // --- ITEM DRAG: reorder within or across clusters (position only, no clusterId change) ---
                const canonicalActiveId = activeIdStr.replace(/^tree-/, '');
                const canonicalOverId = overIdStr.startsWith('tree-') ? overIdStr.replace(/^tree-/, '') : null;
                if (!canonicalOverId || canonicalActiveId === canonicalOverId) { updateDragItems(null); return; }

                // Flat position reorder among all tree items
                const treeItems = current.filter(i => i.type !== 'video')
                    .sort((a, b) => (a.item.storyPosition ?? 0) - (b.item.storyPosition ?? 0));
                const oldIndex = treeItems.findIndex(i => i.id === canonicalActiveId);
                const newIndex = treeItems.findIndex(i => i.id === canonicalOverId);
                if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) { updateDragItems(null); return; }

                let reorderedTree = arrayMove(treeItems, oldIndex, newIndex);
                let pos = 0;
                reorderedTree = reorderedTree.map(item => ({...item, item: {...item.item, storyPosition: pos++}}));

                pendingReorderRef.current = true;
                updateDragItems([...reorderedTree, ...current.filter(i => i.type === 'video')]);
                reorderStory({
                    storyId: story.id,
                    items: reorderedTree.map(i => ({type: i.type, id: i.item.id, column: 0})),
                }).unwrap()
                    .then(() => {
                        pendingReorderRef.current = false;
                        dispatch(bilderApi.util.invalidateTags(['Bild']));
                        dispatch(texteApi.util.invalidateTags(['Text']));
                    })
                    .catch(() => {
                        pendingReorderRef.current = false;
                        updateDragItems(null);
                    });
                return;
            }

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
                        <ToggleButton value="2col"><Tooltip title="2-Spalten Vorschau"><ViewColumnIcon fontSize="small"/></Tooltip></ToggleButton>
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
                    <DndContext
                        sensors={sensors}
                        collisionDetection={treeCollision}
                        modifiers={[restrictToVerticalAxis]}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onDragCancel={handleDragCancel}
                    >
                        <StoryTreeView
                            clusterGroups={treeGroups.clusterGroups}
                            soloItems={treeGroups.soloItems}
                            storyBilder={bildItems.map(i => i.item)}
                            storyTexte={textItems.map(i => i.item)}
                        />
                        <DragOverlay dropAnimation={null}>
                            {activeItem ? (
                                <Box sx={{opacity: 0.85, pointerEvents: 'none'}}>
                                    <TreeItemCard type={activeItem.type} item={activeItem.item}
                                        storyBilder={bildItems.map(i => i.item)}
                                        storyTexte={textItems.map(i => i.item)}/>
                                </Box>
                            ) : (
                                <Box sx={{bgcolor: 'background.paper', border: '1px solid',
                                    borderColor: 'divider', borderRadius: 1.5, p: 1, opacity: 0.85}}>
                                    <Typography variant="body2" color="text.secondary">Cluster</Typography>
                                </Box>
                            )}
                        </DragOverlay>
                    </DndContext>
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
                })() : is2col ? (
                    <Box sx={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2}}>
                        {Array.from({length: 2}).map((_, colIdx) => {
                            const colItems = colSorted(serverItems, colIdx, 2);
                            return (
                                <Box key={colIdx} sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                                    {colItems.map(({type, id, item}) => (
                                        <Box key={id}>
                                            {type === 'bild'
                                                ? <PreviewBildCard bild={item} story={story}
                                                    storiesLoaded={storiesLoaded} stories={storiesData || []}
                                                    onSetComplete={(args) => setBildComplete(args)}
                                                    storyBilder={bildItems.map(i => i.item)}
                                                    storyTexte={textItems.map(i => i.item)}/>
                                                : type === 'text'
                                                    ? <PreviewTextCard text={item} story={story}
                                                        storiesLoaded={storiesLoaded} stories={storiesData || []}
                                                        onSetComplete={(args) => setTextComplete(args)}
                                                        storyBilder={bildItems.map(i => i.item)}
                                                        storyTexte={textItems.map(i => i.item)}/>
                                                    : <PreviewVideoCard video={item} story={story}
                                                        storiesLoaded={storiesLoaded} stories={storiesData || []}/>
                                            }
                                        </Box>
                                    ))}
                                </Box>
                            );
                        })}
                    </Box>
                ) : null}
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
