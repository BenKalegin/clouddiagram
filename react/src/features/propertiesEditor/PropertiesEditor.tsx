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
import {elementsAtom, selectedElementsSelector} from "../diagramEditor/diagramEditorModel";
import {DiagramElement, ElementType, Id} from "../../package/packageModel";
import {activeDiagramIdAtom} from "../diagramTabs/DiagramTabs";
import {
    elementPropertyChangedAction,
    useDispatch,
    useElementsSelector
} from "../diagramEditor/diagramEditorSlice";
import {Diagram} from "../../common/model";


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
    const diagram = useRecoilValue(elementsAtom(diagramId)) as Diagram;
    const selectedIds = useRecoilValue(selectedElementsSelector(diagramId))
    const elementSelector = useElementsSelector()
    let selectedElements: Map<Id, DiagramElement>
    elementSelector(diagram, selectedIds, el => selectedElements = new Map(el.map(e => [e.id, e])))

    const selectedKinds = [...new Set(selectedIds.map(element => element.type))]
    const dispatch = useDispatch()

    type PropAndKind = {kind: ElementType, prop: PropertyDefinition}
    const properties = selectedKinds
        .flatMap(kind => getPropertyList(kind).map<PropAndKind>(prop => ({kind, prop: prop})))
        .filter(({kind, prop}) => prop.supportMultiEdit || selectedIds.length === 1)


    const getPropertyValue = (property: PropAndKind): any => {
        const {kind, prop} = property;
        const elementsOfAKind = selectedIds.filter(element => element.type === kind)

        const values: any[] = elementsOfAKind.map(element => {
            const obj: any = selectedElements.get(element.id)
            return obj[prop.name];
        })

        if (values.every(value => value === values[0])) {
            return values[0]
        }
        else {
            return undefined
        }

    }

    return (
        <>
            <Divider/>
            {properties.map((p,i) => (
                <Box display="flex" flexDirection="column" p={2}  key={i}>
                    <TextField
                        label={p.prop.name}
                        variant="outlined"
                        size="small"
                        value={getPropertyValue(p)}
                        onChange={e => dispatch(elementPropertyChangedAction({
                            elements: selectedIds.filter(element => element.type === p.kind),
                            propertyName: p.prop.name,
                            value: e.target.value
                        }))}
                    />
                </Box>

            ))}



            {/*{kind === ElementType.ClassNode && <NodeProperties nodeId={selectedElement!.id}/>}*/}
            {/*{kind === ElementType.SequenceLifeLine && <LifelineProperties lifelineId={selectedElement!.id}/>}*/}
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
