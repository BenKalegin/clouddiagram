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
import {selectedElementsAtom} from "../diagramEditor/diagramEditorModel";
import {ElementType} from "../../package/packageModel";
import {NodeProperties} from "../classDiagram/NodeProperties";
import {LifelineProperties} from "../sequenceDiagram/LifelineProperties";

export const PropertiesEditor = () => {
    const selectedElement = useRecoilValue(selectedElementsAtom)[0]
    const kind = selectedElement?.type
    return (
        <>
            <Divider/>
            {kind === ElementType.ClassNode && <NodeProperties nodeId={selectedElement.id}/>}
            {kind === ElementType.SequenceLifeLine && <LifelineProperties lifelineId={selectedElement.id}/>}
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
