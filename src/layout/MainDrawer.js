import React from 'react';
import {Link, useMatch} from 'react-router-dom';
import {
    Box,
    Divider,
    Drawer, IconButton,
    List, ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import InboxIcon from '@mui/icons-material/Inbox';
import SnippetFolderIcon from '@mui/icons-material/SnippetFolder';
import CircleIcon from '@mui/icons-material/Circle';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckIcon from '@mui/icons-material/Check';
import PersonIcon from '@mui/icons-material/Person';
import {HasRole} from '../auth';

const Item = ({Icon, iconSize, title, to, disableTooltip = false}) => {
    const match = Boolean(useMatch(to));
    return (
        <ListItemButton component={Link} to={to} selected={match}>
            {Icon && <Tooltip title={title} placement='right' disableHoverListener={disableTooltip}>
                <ListItemIcon><Icon fontSize={iconSize}/></ListItemIcon>
            </Tooltip>
            }
            <ListItemText primary={title}/>
        </ListItemButton>
    )
};

const Stories = ({drawerOpen, openNewStory, stories}) => (
    <>
        <Divider/>
        <ListItem
            secondaryAction={drawerOpen &&
                <IconButton edge='end' onClick={openNewStory}>
                    <AddIcon/>
                </IconButton>
            }
        >
            <ListItemIcon><SnippetFolderIcon/></ListItemIcon>
            <ListItemText
                primaryTypographyProps={{fontWeight: 'medium'}}
            >
                Deine Stories
            </ListItemText>
        </ListItem>
        {Array.from(stories).map(s => (
            <Item
                key={s.id} disableTooltip={drawerOpen}
                Icon={CircleIcon} iconSize='small'
                title={s.name} to={`/bilder/story/${s.id}`}/>
        ))}
    </>
);

export const MainDrawer = ({drawerOpen, toggleDrawer, openNewStory, openNewBild, stories = [], bilder ={}}) => (
    <Drawer
        open={drawerOpen} onClose={toggleDrawer} variant='permanent'
        sx={{
            width: theme => drawerOpen ? theme.layout.drawerWidth : theme.spacing(7),
            '& .MuiDrawer-paper': theme => ({
                width: theme.layout.drawerWidth,
                ...(!drawerOpen && {
                    width: theme.spacing(7),
                    overflowX: 'hidden'
                })
            })
        }}
    >
        <Toolbar/>
        <Box sx={{overflow: drawerOpen ? 'auto' : 'hidden'}}>
            <List>
                <Item disableTooltip={drawerOpen} Icon={InboxIcon} title='Erinnerungen ohne Story' to='/texte/pending'/>
                {/*<Item disableTooltip={drawerOpen} Icon={CheckIcon} title='Completed' to='/texte/completed'/>*/}
                <Item disableTooltip={drawerOpen} Icon={AssignmentIcon} title='Alle Erinnerungen' to='/texte'/>

                <Divider/>
                <Item disableTooltip={drawerOpen} Icon={InboxIcon} title='Bilder ohne Story' to='/bilder/pending'/>
                {/*<Item disableTooltip={drawerOpen} Icon={CheckIcon} title='Completed' to='/bilder/completed'/>*/}
                <Item disableTooltip={drawerOpen} Icon={AssignmentIcon} title='Alle Bilder' to='/bilder'/>
                <Stories
                    drawerOpen={drawerOpen} openNewStory={openNewStory} stories={stories}
                />

                <HasRole role='admin'>
                    <Divider/>
                    <Item disableTooltip={drawerOpen} Icon={PersonIcon} title='Users' to='/users'/>
                </HasRole>
            </List>
        </Box>
    </Drawer>
);
