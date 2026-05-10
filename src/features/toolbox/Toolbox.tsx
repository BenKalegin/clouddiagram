import React from "react";
import {
    Collapse,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    ListSubheader,
} from "@mui/material";
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import {GalleryItem, galleryGroups} from "./models";
import {iconRegistry} from "../graphics/graphicsReader";

export const Toolbox = () => {
    const [open, setOpen] = React.useState<{ [key: string]: boolean }>({});

    const handleClick = (key: string) => {
        setOpen(open => ({...open, [key]: !open[key]}));
    };

    function getItem(item: GalleryItem) {
        const iconUrl = item.icon !== undefined ? iconRegistry[item.icon] : undefined;
        return <ListItemButton
            key={item.key}
            onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "all";
                e.dataTransfer.dropEffect = "copy";
                e.dataTransfer.items.add(JSON.stringify(item), "application/json");
            }}
            draggable={true}
        >
            <ListItemIcon sx={{minWidth: 36}}>
                {iconUrl && <img src={iconUrl} alt="" style={{ width: 24, height: 24 }} />}
            </ListItemIcon>
            <ListItemText
                primary={item.name}
                primaryTypographyProps={{
                    fontSize: 15,
                    fontWeight: 'lighter',
                    lineHeight: '14px',
                    mb: '0px',
                }}/>
        </ListItemButton>;
    }

    return (
        <List
            sx={{width: '100%', maxWidth: 360, minWidth: 180, bgcolor: 'background.paper'}}
            component="nav"
            aria-labelledby="nested-list-subheader"
            subheader={
                <ListSubheader component="div" id="library-subheader">
                    Component Library
                </ListSubheader>
            }
        >
            {galleryGroups.map(group => (
                    <React.Fragment key={group.key}>
                        <ListItemButton disableRipple onClick={() => handleClick(group.key)}>
                            <ListItemText primary={group.name}/>
                            <ListItemIcon
                                sx={{minWidth: 26}}
                            >
                                {open[group.key] ? <ExpandLess/> : <ExpandMore/>}
                            </ListItemIcon>
                        </ListItemButton>
                        <Collapse
                            in={open[group.key]}
                            timeout="auto"
                            unmountOnExit
                        >
                            <List component="div" disablePadding>
                                {group.items.map(item => getItem(item))}
                            </List>
                        </Collapse>
                    </React.Fragment>
                )
            )}
        </List>
    )
}

