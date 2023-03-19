import {Box, Button, Divider, FormControlLabel, Switch, TextField} from "@mui/material";
import List from "@mui/material/List";
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
    String,
    Boolean,
}

interface PropertyDefinition {
    name: string;
    label: string;
    type: PropertyType;
    supportMultiEdit: boolean;
}

export enum ActionKind {
    StrokeStyle = "stroke-style",
    FillStyle = "fill-style",
}

interface ActionDefinition {
    kind: ActionKind;
    label: string;
    supportMultiEdit: boolean;
}

// TODO split by features
const textProp = {name: "text", label: "Text", type: PropertyType.String, supportMultiEdit: false};
function getPropertyList(type: ElementType): PropertyDefinition[] {
    switch (type) {
        case ElementType.ClassNode:
            return [textProp];
        case ElementType.SequenceLifeLine:
            return [{name: "title", label: "Title", type: PropertyType.String, supportMultiEdit: false}];
        case ElementType.SequenceMessage:
            return [
                textProp,
                {name: "isReturn", label: "Is Return", type: PropertyType.Boolean, supportMultiEdit: false}
            ];
        default:
            return [];
    }
}

type ActionAndKind = {kind: ElementType, action: ActionDefinition}

const strokeStyle = {label: "Stroke Style", kind: ActionKind.StrokeStyle, supportMultiEdit: true};
function getActionList(type: ElementType): ActionDefinition[] {
    switch (type) {
        case ElementType.ClassNode:
            return [strokeStyle];
        case ElementType.SequenceLifeLine:
            return [strokeStyle];
        case ElementType.SequenceMessage:
            return [strokeStyle];
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

    const actions = selectedKinds
        .flatMap(kind => getActionList(kind).map<ActionAndKind>(action => ({kind, action})))
        .filter(({kind, action}) => action.supportMultiEdit || selectedIds.length === 1)

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
                    {p.prop.type === PropertyType.String &&
                    <TextField
                        label={p.prop.label}
                        variant="outlined"
                        size="small"
                        value={getPropertyValue(p) || ""}
                        onChange={e => dispatch(elementPropertyChangedAction({
                            elements: selectedIds.filter(element => element.type === p.kind),
                            propertyName: p.prop.name,
                            value: e.target.value
                        }))}
                    />}
                    {p.prop.type === PropertyType.Boolean &&
                        <FormControlLabel control={
                            <Switch
                                checked={getPropertyValue(p) === true}
                                onChange={e => dispatch(elementPropertyChangedAction({
                                    elements: selectedIds.filter(element => element.type === p.kind),
                                    propertyName: p.prop.name,
                                    value: e.target.checked
                                }))}
                            />
                        } label={p.prop.label}
                        />
                    }
                </Box>

            ))}

            <Divider/>
            <List>
                {actions.map((a,i) => (
                    <Button variant="text" key={i} size="small">{a.action.label}</Button>
                ))}
            </List>
        </>
    );
}
