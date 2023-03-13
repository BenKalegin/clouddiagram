import {Box, Divider, TextField} from "@mui/material";
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
import {elementPropertyChangedAction} from "../diagramEditor/diagramEditorSlice";


enum PropertyType {
    String
}

interface PropertyDefinition {
    name: string;
    type: PropertyType;
    supportMultiEdit: boolean;
}

function getPropertyList(type: ElementType): PropertyDefinition[] {
    switch (type) {
        case ElementType.ClassNode:
            return [{name: "text", type: PropertyType.String, supportMultiEdit: false}];
        case ElementType.SequenceLifeLine:
            return [{name: "title", type: PropertyType.String, supportMultiEdit: false}];
        default:
            return [];
    }
}

export const PropertiesEditor = () => {
    const diagramId = useRecoilValue(activeDiagramIdAtom)
    const selectedElements = useRecoilValue(selectedElementsSelector(diagramId))
    const selectedKinds = [...new Set(selectedElements.map(element => element.type))]

    const properties = selectedKinds.flatMap(kind => [kind: kindgetPropertyList(kind))
        .filter(p => p.supportMultiEdit || selectedElements.length === 1)

    const getPropertyValue = (property: PropertyDefinition) => {
        const
    }

    const selectedElement = selectedElements.length > 0 ? selectedElements.at(-1) : undefined
    const kind = selectedElement?.type
    return (
        <>
            <Divider/>
            {properties.map((p,i) => (
                <Box display="flex" flexDirection="column" p={2}  key={i}>
                    <TextField
                        label={p.name}
                        variant="outlined"
                        size="small"
                        value={getPropertyValue(p)}
                        onChange={e => dispatch(elementPropertyChangedAction({
                            elements: [{id: nodeId, type: ElementType.ClassNode}],
                            propertyName: "text",
                            value: e.target.value
                        }))}
                    />
                </Box>

            ))}



            {kind === ElementType.ClassNode && <NodeProperties nodeId={selectedElement!.id}/>}
            {kind === ElementType.SequenceLifeLine && <LifelineProperties lifelineId={selectedElement!.id}/>}
            {kind === ElementType.SequenceMessage && <MessageProperties lifelineId={selectedElement!.id}/>}
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
