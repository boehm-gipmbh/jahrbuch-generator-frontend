import {useState} from 'react';
import {Badge, IconButton, Popover, List, ListItem, ListItemText, Typography, Box, Button, Divider, Tooltip} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import {api} from './api';

const targetLabel = (type) => ({BILD: 'Bild', TEXT: 'Text', VIDEO: 'Video', COMMENT: 'Kommentar'}[type] ?? type);

const notificationText = (n) => n.type === 'REPORT_WITHDRAWN'
    ? <><strong>{n.reporterName}</strong> hat die Meldung für einen {targetLabel(n.targetType)} zurückgezogen</>
    : <><strong>{n.reporterName}</strong> hat einen {targetLabel(n.targetType)} gemeldet</>;

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'
}) : '';

export const NotificationBell = () => {
    const [anchor, setAnchor] = useState(null);
    const {data: notifications = []} = api.endpoints.getUnread.useQuery();
    const [markRead] = api.endpoints.markRead.useMutation();
    const [markAllRead] = api.endpoints.markAllRead.useMutation();

    const count = notifications.length;
    const open = Boolean(anchor);

    return (
        <>
            <Tooltip title="Meldungen">
                <IconButton color="inherit" onClick={e => setAnchor(e.currentTarget)}>
                    <Badge badgeContent={count || null} color="error">
                        {count > 0 ? <NotificationsIcon/> : <NotificationsNoneIcon/>}
                    </Badge>
                </IconButton>
            </Tooltip>

            <Popover
                open={open}
                anchorEl={anchor}
                onClose={() => setAnchor(null)}
                anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
                transformOrigin={{vertical: 'top', horizontal: 'right'}}
            >
                <Box sx={{width: 320, maxHeight: 400, overflow: 'auto'}}>
                    <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1}}>
                        <Typography variant="subtitle2">Meldungen</Typography>
                        {count > 0 && (
                            <Button size="small" onClick={() => markAllRead()}>
                                Alle gelesen
                            </Button>
                        )}
                    </Box>
                    <Divider/>
                    {count === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{p: 2, textAlign: 'center'}}>
                            Keine neuen Meldungen
                        </Typography>
                    ) : (
                        <List dense disablePadding>
                            {notifications.map(n => (
                                <ListItem
                                    key={n.id}
                                    secondaryAction={
                                        <Button size="small" onClick={() => markRead(n.id)}>
                                            Gelesen
                                        </Button>
                                    }
                                >
                                    <ListItemText
                                        primary={
                                            <Typography variant="body2">
                                                {notificationText(n)}
                                            </Typography>
                                        }
                                        secondary={
                                            <>
                                                {n.message && (
                                                    <Typography variant="caption" display="block" sx={{fontStyle: 'italic', mb: 0.25}}>
                                                        „{n.message}"
                                                    </Typography>
                                                )}
                                                {fmtDate(n.createdAt)}
                                            </>
                                        }
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Box>
            </Popover>
        </>
    );
};
