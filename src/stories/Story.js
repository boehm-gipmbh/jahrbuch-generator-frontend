import React, {useState, useRef, useEffect} from 'react';
import {useDispatch} from 'react-redux';
import {useParams} from 'react-router-dom';
import {
    Box, Button, Container, Paper, ToggleButton, ToggleButtonGroup, Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ViewAgendaIcon from '@mui/icons-material/ViewAgenda';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import GridViewIcon from '@mui/icons-material/GridView';
import '../App.css';
import {api as texteApi} from '../texte/api';
import {api as bilderApi} from '../bilder/api';
import {Layout, newText, setOpenBild, setOpenText} from '../layout';
import {api as storyApi} from './api.js';
import {BilderUploadDialog} from '../bilder/BilderUploadDialog';
import {
    DndContext, DragOverlay, closestCenter, closestCorners, pointerWithin, rectIntersection,
    PointerSensor, useSensor, useSensors, useDroppable
} from '@dnd-kit/core';
import {SortableContext, arrayMove, verticalListSortingStrategy} from '@dnd-kit/sortable';
import {restrictToVerticalAxis} from '@dnd-kit/modifiers';
import {SortableBildCard} from '../bilder/SortableBildCard';
import {SortableTextCard} from '../texte/SortableTextCard';
import AuthImage from '../bilder/AuthImage';

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

const LAYOUT_KEY = (storyId) => `story-layout-${storyId}`;

// Returns column-sorted items for a given column index
const colSorted = (items, colIdx) =>
    items
        .filter(i => (i.item.storyColumn ?? 0) === colIdx)
        .sort((a, b) => (a.item.storyPosition ?? 0) - (b.item.storyPosition ?? 0));

// Splits items into a per-column map
const toColMap = (items, columnCount) => {
    const map = {};
    for (let c = 0; c < columnCount; c++) map[c] = colSorted(items, c);
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

    const savedLayout = storyId ? (localStorage.getItem(LAYOUT_KEY(storyId)) || '1col') : '1col';
    const [layout, setLayout] = useState(savedLayout);
    const handleLayout = (_, newLayout) => {
        if (!newLayout) return;
        setLayout(newLayout);
        if (storyId) localStorage.setItem(LAYOUT_KEY(storyId), newLayout);
    };

    const dispatch = useDispatch();
    const {data: texteData} = texteApi.endpoints.getTexte.useQuery(undefined, {pollingInterval: 10000});
    const {data: bilderData} = bilderApi.endpoints.getBilder.useQuery(undefined, {pollingInterval: 10000});
    const [setTextComplete] = texteApi.endpoints.setComplete.useMutation();
    const [setBildComplete] = bilderApi.endpoints.setComplete.useMutation();
    const [deleteBild] = bilderApi.endpoints.deleteBild.useMutation();
    const [deleteText] = texteApi.endpoints.deleteText.useMutation();
    const [reorderStory] = storyApi.endpoints.reorderStory.useMutation();
    const [triggerCapture] = bilderApi.endpoints.triggerCapture.useMutation();
    const {data: capturesConfig} = bilderApi.endpoints.getCapturesConfig.useQuery();

    const sensors = useSensors(useSensor(PointerSensor, {activationConstraint: {distance: 8}}));

    const [dragItems, setDragItems] = useState(null);
    const dragItemsRef = useRef(null);
    const pendingReorderRef = useRef(false);
    const pointerYRef = useRef(0);

    // Clear optimistic state when server data arrives (only when not actively dragging and no reorder pending)
    useEffect(() => {
        if (activeItem === null && !pendingReorderRef.current) updateDragItems(null);
    }, [texteData, bilderData]); // eslint-disable-line react-hooks/exhaustive-deps
    const [activeItem, setActiveItem] = useState(null);

    const updateDragItems = (val) => {
        dragItemsRef.current = val;
        setDragItems(val);
    };

    const bildItems = bilderData
        ? Array.from(bilderData).filter(filterBild).map(b => ({type: 'bild', id: `bild-${b.id}`, item: b}))
        : [];
    const textItems = texteData
        ? Array.from(texteData).filter(filterText).map(t => ({type: 'text', id: `text-${t.id}`, item: t}))
        : [];
    const serverItems = [...bildItems, ...textItems];
    const activeItems = dragItems || serverItems;

    const is1col = layout === '1col';
    const columnCount = layout === '2col' ? 2 : layout === 'grid' ? 3 : 1;

    const itemsSorted1col = [...activeItems].sort((a, b) => {
        const colDiff = (a.item.storyColumn ?? 0) - (b.item.storyColumn ?? 0);
        if (colDiff !== 0) return colDiff;
        return (a.item.storyPosition ?? 0) - (b.item.storyPosition ?? 0);
    });

    const renderCard = (type, id, item) => type === 'bild' ? (
        <SortableBildCard
            key={id}
            bild={item}
            story={story}
            onClickBild={(b) => dispatch(setOpenBild(b))}
            onSetComplete={(args) => setBildComplete(args)}
            onDeleteBild={(b) => deleteBild(b).unwrap()
                .then(() => dispatch(bilderApi.util.invalidateTags(['Bild'])))
                .catch(e => console.error(e))}
        />
    ) : (
        <SortableTextCard
            key={id}
            text={item}
            story={story}
            onClickText={(t) => dispatch(setOpenText(t))}
            onSetComplete={(args) => setTextComplete(args)}
            onDeleteText={(t) => deleteText(t).unwrap()
                .then(() => dispatch(texteApi.util.invalidateTags(['Text'])))
                .catch(e => console.error(e))}
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

    const handleDragOver = ({active, over}) => {
        if (!over || is1col) return;
        const current = dragItemsRef.current || [...serverItems];

        let overColumn;
        if (over.id.toString().startsWith('col-')) {
            overColumn = parseInt(over.id.replace('col-', ''));
        } else {
            overColumn = current.find(i => i.id === over.id)?.item.storyColumn ?? 0;
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
                const originalColumn = serverItems.find(i => i.id === active.id)?.item.storyColumn ?? 0;
                const isCrossColumn = originalColumn !== overColumn;
                // Use dragged card center for both cases — more intuitive than pointer Y at grab-handle
                // Cross-column: 0.5 threshold; same-column: 0.55 (slight bias toward "after" for drag-down)
                const draggedCenter = (active.rect.current.translated?.top ?? 0) + (active.rect.current.translated?.height ?? 0) / 2;
                const threshold = isCrossColumn ? 0.5 : 0.55;
                const overThreshold = over.rect.top + over.rect.height * threshold;
                const insertIdx = draggedCenter > overThreshold ? overIdx + 1 : overIdx;
                colMap[overColumn] = [
                    ...colMap[overColumn].slice(0, insertIdx),
                    updated,
                    ...colMap[overColumn].slice(insertIdx)
                ];
            } else if (colMap[overColumn].length > 0) {
                // Pointer over column background (not on any item): top padding → position 0, bottom area → append
                const pointerY = pointerYRef.current;
                const insertAtStart = pointerY < over.rect.top + 50;
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
                })
                .catch((err) => {
                    pendingReorderRef.current = false;
                    updateDragItems(null);
                });
        } else {
            updateDragItems(null);
        }
    };

    const handleDragCancel = () => {
        updateDragItems(null);
        setActiveItem(null);
    };

    return <Layout>
        <Container sx={{mt: theme => theme.spacing(2)}}>
            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2}}>
                <Typography component="h2" variant="h6" color="primary">
                    {title}
                </Typography>
                <ToggleButtonGroup value={layout} exclusive onChange={handleLayout} size="small">
                    <ToggleButton value="1col"><ViewAgendaIcon fontSize="small"/></ToggleButton>
                    <ToggleButton value="2col"><ViewColumnIcon fontSize="small"/></ToggleButton>
                    <ToggleButton value="grid"><GridViewIcon fontSize="small"/></ToggleButton>
                </ToggleButtonGroup>
            </Box>

            <Box sx={{mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap'}}>
                <Button startIcon={<AddIcon/>} onClick={() => dispatch(newText({story: story}))}>
                    Erinnerung hinzufügen
                </Button>
                {capturesConfig?.enabled && (
                    <Button startIcon={<AddIcon/>} onClick={() => triggerCapture()}>
                        Fotoaufnahme
                    </Button>
                )}
                <BilderUploadDialog story={story}/>
            </Box>

            <Paper sx={{p: 2}}>
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
                                const colItems = colSorted(activeItems, colIdx);
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
                                ) : (
                                    <pre className="wrap-pre" style={{margin: 0}}>
                                        {activeItem.item.description}
                                    </pre>
                                )}
                            </Paper>
                        )}
                    </DragOverlay>
                </DndContext>
            </Paper>
        </Container>
    </Layout>;
};
