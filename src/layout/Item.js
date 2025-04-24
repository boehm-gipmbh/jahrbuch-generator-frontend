import {ListItemButton, ListItemIcon, ListItemText, Tooltip} from "@mui/material";
import {useMatch} from "react-router-dom";

const Item = ({Icon, iconSize, title, to,
                  disableTooltip=false}) => {
    const match = Boolean(useMatch(to));
    return (
        <ListItemButton component={Link} to={to}
                        selected={match}>
            {Icon && <Tooltip title={title} placement='right'
                              disableHoverListener={disableTooltip}>
                <ListItemIcon><Icon fontSize={iconSize}/>
                </ListItemIcon>
            </Tooltip>
            }
            <ListItemText primary={title}/>
        </ListItemButton>
    )
};