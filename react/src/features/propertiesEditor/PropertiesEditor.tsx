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
import {selectedElementsSelector} from "../diagramEditor/diagramEditorModel";
import {ElementType} from "../../package/packageModel";
import {NodeProperties} from "../classDiagram/NodeProperties";
import {LifelineProperties} from "../sequenceDiagram/LifelineProperties";
import {activeDiagramIdAtom} from "../diagramTabs/DiagramTabs";

export const PropertiesEditor = () => {
    const diagramId = useRecoilValue(activeDiagramIdAtom)
    const selectedElements = useRecoilValue(selectedElementsSelector(diagramId))
    const selectedElement = selectedElements.length > 0 ? selectedElements.at(-1) : undefined
    const kind = selectedElement?.type
    return (
        <>
            <Divider/>
            {kind === ElementType.ClassNode && <NodeProperties nodeId={selectedElement!.id}/>}
            {kind === ElementType.SequenceLifeLine && <LifelineProperties lifelineId={selectedElement!.id}/>}
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
