import React, {useState} from 'react';
import {useDispatch} from 'react-redux';
import {
    Box, Button, Container, Paper, Typography,
    List, ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction,
    Tooltip, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
    Collapse
} from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import ImageIcon from '@mui/icons-material/Image';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {Layout} from '../layout';
import {api as bilderApi} from '../bilder/api';
import {api as texteApi} from '../texte/api';
import {api as storyApi} from '../stories';

const KEIN_STORY = '__kein_story__';

const ConfirmDialog = ({open, title, text, onConfirm, onCancel}) => (
    <Dialog open={open} onClose={onCancel}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
            <DialogContentText>{text}</DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button onClick={onCancel}>Abbrechen</Button>
            <Button onClick={onConfirm} color="error" variant="contained">Endgültig löschen</Button>
        </DialogActions>
    </Dialog>
);

const ItemRow = ({type, item, onRestore, onHardDelete}) => (
    <ListItem sx={{pl: 6}}>
        <ListItemIcon sx={{minWidth: 32}}>
            {type === 'bild'
                ? <ImageIcon fontSize="small" color="action"/>
                : <TextSnippetIcon fontSize="small" color="action"/>}
        </ListItemIcon>
        <ListItemText primary={item.title || 'Kein Titel'}
            primaryTypographyProps={{variant: 'body2'}}/>
        <ListItemSecondaryAction>
            <Tooltip title="Wiederherstellen">
                <IconButton size="small" aria-label="Wiederherstellen" onClick={() => onRestore(item)}>
                    <RestoreIcon fontSize="small"/>
                </IconButton>
            </Tooltip>
            <Tooltip title="Endgültig löschen">
                <IconButton size="small" color="error" aria-label="Endgültig löschen" onClick={() => onHardDelete(type, item)}>
                    <DeleteForeverIcon fontSize="small"/>
                </IconButton>
            </Tooltip>
        </ListItemSecondaryAction>
    </ListItem>
);

const StoryGroup = ({storyName, bilder, texte, onRestore, onHardDelete, onRestoreStory}) => {
    const [open, setOpen] = useState(true);
    const count = bilder.length + texte.length;
    const isReal = storyName !== KEIN_STORY;
    const label = isReal ? storyName : '(ohne Story)';

    return (
        <>
            <ListItem button onClick={() => setOpen(v => !v)} sx={{pl: 2}}>
                <ListItemIcon sx={{minWidth: 32}}>
                    {open ? <FolderOpenIcon fontSize="small" color="primary"/> : <FolderIcon fontSize="small" color="primary"/>}
                </ListItemIcon>
                <ListItemText
                    primary={label}
                    secondary={`${count} Einträge`}
                    primaryTypographyProps={{fontWeight: 'medium'}}
                />
                {isReal && (
                    <Box sx={{display: 'flex', gap: 0.5, mr: 1}} onClick={e => e.stopPropagation()}>
                        <Tooltip title="Story + Inhalt wiederherstellen">
                            <Button size="small" startIcon={<RestoreIcon/>}
                                aria-label="Story + Inhalt wiederherstellen"
                                onClick={() => onRestoreStory(storyName, true)}>
                                Mit Inhalt
                            </Button>
                        </Tooltip>
                        <Tooltip title="Nur Story wiederherstellen (Inhalte bleiben im Papierkorb)">
                            <Button size="small" variant="outlined"
                                aria-label="Nur Story wiederherstellen (Inhalte bleiben im Papierkorb)"
                                onClick={() => onRestoreStory(storyName, false)}>
                                Nur Story
                            </Button>
                        </Tooltip>
                    </Box>
                )}
                {open ? <ExpandMoreIcon fontSize="small"/> : <ChevronRightIcon fontSize="small"/>}
            </ListItem>
            <Collapse in={open}>
                <List dense disablePadding>
                    {bilder.map(b => (
                        <ItemRow key={`bild-${b.id}`} type="bild" item={b}
                            onRestore={() => onRestore('bild', b)}
                            onHardDelete={onHardDelete}/>
                    ))}
                    {texte.map(t => (
                        <ItemRow key={`text-${t.id}`} type="text" item={t}
                            onRestore={() => onRestore('text', t)}
                            onHardDelete={onHardDelete}/>
                    ))}
                </List>
            </Collapse>
        </>
    );
};

export const Papierkorb = () => {
    const dispatch = useDispatch();
    const {data: bilderDeleted = []} = bilderApi.endpoints.getPapierkorb.useQuery();
    const {data: texteDeleted = []} = texteApi.endpoints.getPapierkorb.useQuery();
    const [restoreBild] = bilderApi.endpoints.restoreBild.useMutation();
    const [hardDeleteBild] = bilderApi.endpoints.hardDeleteBild.useMutation();
    const [restoreText] = texteApi.endpoints.restoreText.useMutation();
    const [hardDeleteText] = texteApi.endpoints.hardDeleteText.useMutation();
    const [restoreStory] = storyApi.endpoints.restoreStory.useMutation();

    const [confirmItem, setConfirmItem] = useState(null); // {type, item}

    const handleRestore = (type, item) => {
        if (type === 'bild') {
            restoreBild(item).unwrap()
                .then(() => dispatch(bilderApi.util.invalidateTags(['Bild'])))
                .catch(e => console.error(e));
        } else {
            restoreText(item).unwrap()
                .then(() => dispatch(texteApi.util.invalidateTags(['Text'])))
                .catch(e => console.error(e));
        }
    };

    const handleRestoreStory = (name, withContent) => {
        restoreStory({name, withContent}).unwrap()
            .then(() => {
                dispatch(storyApi.util.invalidateTags(['Story']));
                if (withContent) {
                    dispatch(bilderApi.util.invalidateTags(['Bild']));
                    dispatch(texteApi.util.invalidateTags(['Text']));
                }
            })
            .catch(e => console.error(e));
    };

    const handleHardDelete = () => {
        if (!confirmItem) return;
        if (confirmItem.type === 'bild') {
            hardDeleteBild(confirmItem.item).unwrap()
                .then(() => dispatch(bilderApi.util.invalidateTags(['Bild'])))
                .catch(e => console.error(e));
        } else {
            hardDeleteText(confirmItem.item).unwrap()
                .then(() => dispatch(texteApi.util.invalidateTags(['Text'])))
                .catch(e => console.error(e));
        }
        setConfirmItem(null);
    };

    // Gruppieren nach deletedFromStoryName
    const groups = {};
    bilderDeleted.forEach(b => {
        const key = b.deletedFromStoryName || KEIN_STORY;
        if (!groups[key]) groups[key] = {bilder: [], texte: []};
        groups[key].bilder.push(b);
    });
    texteDeleted.forEach(t => {
        const key = t.deletedFromStoryName || KEIN_STORY;
        if (!groups[key]) groups[key] = {bilder: [], texte: []};
        groups[key].texte.push(t);
    });

    // Story-Gruppen zuerst, "ohne Story" zuletzt
    const sortedKeys = Object.keys(groups).sort((a, b) => {
        if (a === KEIN_STORY) return 1;
        if (b === KEIN_STORY) return -1;
        return a.localeCompare(b);
    });

    const isEmpty = bilderDeleted.length === 0 && texteDeleted.length === 0;

    return (
        <Layout>
            <Container sx={{mt: 2}}>
                <Paper sx={{p: 2}}>
                    <Typography component="h2" variant="h6" color="primary" gutterBottom>
                        Papierkorb
                    </Typography>
                    {isEmpty ? (
                        <Typography color="text.secondary" sx={{py: 4, textAlign: 'center'}}>
                            Papierkorb ist leer
                        </Typography>
                    ) : (
                        <List dense>
                            {sortedKeys.map(key => (
                                <StoryGroup
                                    key={key}
                                    storyName={key}
                                    bilder={groups[key].bilder}
                                    texte={groups[key].texte}
                                    onRestore={handleRestore}
                                    onHardDelete={(type, item) => setConfirmItem({type, item})}
                                    onRestoreStory={handleRestoreStory}
                                />
                            ))}
                        </List>
                    )}
                </Paper>
            </Container>

            <ConfirmDialog
                open={Boolean(confirmItem)}
                title="Endgültig löschen?"
                text={`„${confirmItem?.item?.title || 'Eintrag'}" wird unwiderruflich gelöscht — inkl. Bilddatei.`}
                onConfirm={handleHardDelete}
                onCancel={() => setConfirmItem(null)}
            />
        </Layout>
    );
};
