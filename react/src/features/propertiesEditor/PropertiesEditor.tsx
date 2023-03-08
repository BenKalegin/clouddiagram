import {Divider} from "@mui/material";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import InboxIcon from "@mui/icons-material/MoveToInbox";
import MailIcon from "@mui/icons-material/Mail";
import ListItemText from "@mui/material/ListItemText";
import React from "react";
import {useRecoilValue} from "recoil";
import {elementsAtom, selectedElementsAtom} from "../diagramEditor/diagramEditorModel";
import {ElementType, NodeState} from "../../package/packageModel";
import {NodeProperties} from "../classDiagram/NodeProperties";

export const PropertiesEditor = () => {
    const selectedElementId = useRecoilValue(selectedElementsAtom)[0];
    const selectedElement = useRecoilValue(elementsAtom(selectedElementId));
    const kind = selectedElement?.type;

    return (
        <>
            <Divider/>
            {kind === ElementType.ClassNode && <NodeProperties node={selectedElement! as NodeState}/>}
            <Divider/>
            <List>
                {["All mail", "Trash", "Spam"].map((text, index) => (
                    <ListItem key={text} disablePadding>
                        <ListItemButton>
                            <ListItemIcon>
                                {index % 2 === 0 ? <InboxIcon/> : <MailIcon/>}
                            </ListItemIcon>
                            <ListItemText primary={text}/>
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </>
    );
}
