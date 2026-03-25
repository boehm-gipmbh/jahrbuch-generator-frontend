import React, {useState} from 'react';
import {useDispatch} from 'react-redux';
import {
    Box, Button, Container, Paper, Typography, Table, TableBody, TableCell, TableRow,
    Tooltip, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import ImageIcon from '@mui/icons-material/Image';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import {Layout} from '../layout';
import {api as bilderApi} from '../bilder/api';
import {api as texteApi} from '../texte/api';

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

export const Papierkorb = () => {
    const dispatch = useDispatch();
    const {data: bilderDeleted = []} = bilderApi.endpoints.getPapierkorb.useQuery();
    const {data: texteDeleted = []} = texteApi.endpoints.getPapierkorb.useQuery();
    const [restoreBild] = bilderApi.endpoints.restoreBild.useMutation();
    const [hardDeleteBild] = bilderApi.endpoints.hardDeleteBild.useMutation();
    const [restoreText] = texteApi.endpoints.restoreText.useMutation();
    const [hardDeleteText] = texteApi.endpoints.hardDeleteText.useMutation();

    const [confirmItem, setConfirmItem] = useState(null); // {type: 'bild'|'text', item}

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
                        <Table size="small">
                            <TableBody>
                                {bilderDeleted.map(bild => (
                                    <TableRow key={`bild-${bild.id}`}>
                                        <TableCell sx={{width: 32}}>
                                            <Tooltip title="Bild"><ImageIcon fontSize="small" color="action"/></Tooltip>
                                        </TableCell>
                                        <TableCell>{bild.title || 'Kein Titel'}</TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="Wiederherstellen">
                                                <IconButton size="small" onClick={() =>
                                                    restoreBild(bild).unwrap()
                                                        .then(() => dispatch(bilderApi.util.invalidateTags(['Bild'])))
                                                        .catch(e => console.error(e))}>
                                                    <RestoreIcon fontSize="small"/>
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Endgültig löschen">
                                                <IconButton size="small" color="error"
                                                    onClick={() => setConfirmItem({type: 'bild', item: bild})}>
                                                    <DeleteForeverIcon fontSize="small"/>
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {texteDeleted.map(text => (
                                    <TableRow key={`text-${text.id}`}>
                                        <TableCell sx={{width: 32}}>
                                            <Tooltip title="Text"><TextSnippetIcon fontSize="small" color="action"/></Tooltip>
                                        </TableCell>
                                        <TableCell>{text.title || 'Kein Titel'}</TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="Wiederherstellen">
                                                <IconButton size="small" onClick={() =>
                                                    restoreText(text).unwrap()
                                                        .then(() => dispatch(texteApi.util.invalidateTags(['Text'])))
                                                        .catch(e => console.error(e))}>
                                                    <RestoreIcon fontSize="small"/>
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Endgültig löschen">
                                                <IconButton size="small" color="error"
                                                    onClick={() => setConfirmItem({type: 'text', item: text})}>
                                                    <DeleteForeverIcon fontSize="small"/>
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </Paper>
            </Container>

            <ConfirmDialog
                open={Boolean(confirmItem)}
                title="Endgültig löschen?"
                text={`"${confirmItem?.item?.title || 'Eintrag'}" wird unwiderruflich gelöscht — inkl. Bilddatei.`}
                onConfirm={handleHardDelete}
                onCancel={() => setConfirmItem(null)}
            />
        </Layout>
    );
};
