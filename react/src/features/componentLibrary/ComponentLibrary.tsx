import React from "react";
import {
    Collapse,
    List, ListItemButton, ListItemIcon, ListItemText,
    ListSubheader
} from "@mui/material";
import SendIcon from '@mui/icons-material/Send';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import {GalleryItem} from "./models";

const items: GalleryItem[] = [
    {key: 'class:class', name: 'Class'},
    {key: 'class:interface', name: 'Interface'},
    {key: 'class:data-type', name: 'Data Type'},
    {key: 'class:enum', name: 'Enumeration'},
    {key: 'class:primitive', name: 'Primitive'},
    {key: 'class:signal', name: 'Signal'},
    {key: 'class:association', name: 'Association'},
    {key: 'interaction:actor', name: 'Actor'},
    {key: 'interaction:lifeline', name: 'Lifeline'},
]


interface IGalleryGroup {
    name: string,
    key: string,
    items: GalleryItem[]
}

const groups: IGalleryGroup[] = [
    {
        name: "Class",
        key: "class",
        items: items.filter(item => item.key.startsWith("class:"))
    },
    {
        name: 'Interaction',
        key: 'interaction',
        items: items.filter(item => item.key.startsWith("interaction:"))
    },
];


export const ComponentLibrary = () => {
    const [open, setOpen] = React.useState<{ [key: string]: boolean }>({});

    const handleClick = (key: string) => {
        setOpen(open => ({...open, [key]: !open[key]}));
    };

    function getItem(item: GalleryItem) {
        return <ListItemButton key={item.key}
                               onDragStart={(e) => {
                                   e.dataTransfer.effectAllowed = "all";
                                   e.dataTransfer.dropEffect = "copy";
                                   e.dataTransfer.items.add(JSON.stringify(item), "application/json");
                               }
                               }
                               draggable={true}
        >
            <ListItemIcon>
                <SendIcon/>
            </ListItemIcon>
            <ListItemText primary={item.name}/>
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
            {groups.map(group => (
                    <React.Fragment key={group.key}>
                        <ListItemButton disableRipple onClick={() => handleClick(group.key)}>
                            <ListItemIcon
                                sx={{minWidth: 36}}
                            >
                                {open[group.key] ? <ExpandLess/> : <ExpandMore/>}
                            </ListItemIcon>
                            <ListItemText primary={group.name}/>
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

