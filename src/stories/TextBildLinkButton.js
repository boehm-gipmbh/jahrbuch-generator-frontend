import {useState} from 'react';
import {Box, IconButton, Popover, Typography, List, ListItemButton, ListItemText, Tooltip, Divider, CircularProgress} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import CheckIcon from '@mui/icons-material/Check';
import {linkApi} from './linkApi';

/**
 * mode="bild"  → zeigt Texte der Story, verlinkt bild.id mit text.id
 * mode="text"  → zeigt Bilder der Story, verlinkt text.id mit bild.id
 */
export const TextBildLinkButton = ({mode, ownId, storyId, storyTexte = [], storyBilder = [], size = 'small'}) => {
  const [anchor, setAnchor] = useState(null);
  const {data: links = [], isLoading} = linkApi.endpoints.getLinksByStory.useQuery(storyId, {skip: !storyId});
  const [addLink] = linkApi.endpoints.addLink.useMutation();
  const [removeLink] = linkApi.endpoints.removeLink.useMutation();

  const isLinked = (otherId) => {
    if (mode === 'bild') return links.some(l => l.bildId === ownId && l.textId === otherId);
    return links.some(l => l.textId === ownId && l.bildId === otherId);
  };

  const toggle = (otherId) => {
    const params = mode === 'bild'
      ? {bildId: ownId, textId: otherId}
      : {textId: ownId, bildId: otherId};
    if (isLinked(otherId)) removeLink(params);
    else addLink(params);
  };

  const linkedCount = mode === 'bild'
    ? links.filter(l => l.bildId === ownId).length
    : links.filter(l => l.textId === ownId).length;

  const items = mode === 'bild' ? storyTexte : storyBilder;
  const label = mode === 'bild' ? 'Mit Text verlinken' : 'Mit Bild verlinken';

  if (!storyId || items.length === 0) return null;

  return (
    <>
      <Tooltip title={label}>
        <IconButton size={size} onClick={e => setAnchor(e.currentTarget)}
          sx={{color: linkedCount > 0 ? 'primary.main' : 'text.disabled'}}>
          {linkedCount > 0 ? <LinkIcon fontSize="small"/> : <LinkOffIcon fontSize="small"/>}
          {linkedCount > 0 && (
            <Typography variant="caption" sx={{fontSize: 9, lineHeight: 1, ml: 0.25}}>{linkedCount}</Typography>
          )}
        </IconButton>
      </Tooltip>

      <Popover open={Boolean(anchor)} anchorEl={anchor} onClose={() => setAnchor(null)}
        anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}>
        <Box sx={{p: 1, minWidth: 200, maxWidth: 280}}>
          <Typography variant="caption" color="text.secondary" sx={{px: 1}}>{label}</Typography>
          <Divider sx={{my: 0.5}}/>
          {isLoading ? (
            <Box sx={{display: 'flex', justifyContent: 'center', py: 1}}><CircularProgress size={20}/></Box>
          ) : (
            <List dense disablePadding>
              {items.map(item => {
                const itemId = item.id;
                const linked = isLinked(itemId);
                const label = mode === 'bild'
                  ? (item.titel || item.title || `Text #${itemId}`)
                  : (item.title || item.pfad?.split('/').pop() || `Bild #${itemId}`);
                return (
                  <ListItemButton key={itemId} onClick={() => toggle(itemId)} dense
                    sx={{borderRadius: 1, py: 0.25}}>
                    {linked && <CheckIcon fontSize="small" sx={{mr: 1, color: 'primary.main', flexShrink: 0}}/>}
                    <ListItemText
                      primary={<Typography variant="body2" noWrap>{label}</Typography>}
                      sx={{ml: linked ? 0 : 3}}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          )}
        </Box>
      </Popover>
    </>
  );
};