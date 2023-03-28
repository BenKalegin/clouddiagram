import {Box, Button, Divider, FormControlLabel, ListItem, Switch, TextField} from "@mui/material";
import List from "@mui/material/List";
import React from "react";
import {useRecoilValue} from "recoil";
import {selectedElementsSelector, selectedRefsSelector} from "../diagramEditor/diagramEditorModel";
import {ElementType} from "../../package/packageModel";
import {activeDiagramIdAtom} from "../diagramTabs/DiagramTabs";
import {
    elementPropertyChangedAction, elementCommandAction,
    useDispatch
} from "../diagramEditor/diagramEditorSlice";


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

export enum Command {
    Delete = "delete",
    AddReturnMessage = "add-return-message",
    ReverseMessage = "reverse-message",
}

interface CommandDefinition {
    kind: Command;
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

type CommandAndKind = {kind: ElementType, command: CommandDefinition}

const deleteCommand = {label: "Delete", kind: Command.Delete, supportMultiEdit: true};
function getActionList(type: ElementType): CommandDefinition[] {
    switch (type) {
        case ElementType.ClassNode:
            return [deleteCommand];
        case ElementType.SequenceLifeLine:
            return [deleteCommand];
        case ElementType.SequenceMessage:
            return [deleteCommand,
                {label: "Add Return Message", kind: Command.AddReturnMessage, supportMultiEdit: false},
                {label: "Reverse Message", kind: Command.ReverseMessage, supportMultiEdit: false},
            ];
        default:
            return [];
    }
}

export const PropertiesEditor = () => {
    const diagramId = useRecoilValue(activeDiagramIdAtom)
    const selectedIds = useRecoilValue(selectedRefsSelector(diagramId))
    const selectedElements = new Map(useRecoilValue(selectedElementsSelector(diagramId)).map(e => [e.id, e]))

    const selectedKinds = [...new Set(selectedIds.map(element => element.type))]
    const dispatch = useDispatch()

    type PropAndKind = {kind: ElementType, prop: PropertyDefinition}
    const properties = selectedKinds
        .flatMap(kind => getPropertyList(kind).map<PropAndKind>(prop => ({kind, prop: prop})))
        .filter(({kind, prop}) => prop.supportMultiEdit || selectedIds.length === 1)

    const commands = selectedKinds
        .flatMap(kind => getActionList(kind).map<CommandAndKind>(action => ({kind, command: action})))
        .filter(({kind, command}) => command.supportMultiEdit || selectedIds.length === 1)

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

    const PropertiesSection = properties.map((p, i) => (
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

    ));

    const actionsSection = <List>
        {commands.map((a,i) => (
            <ListItem key={i}>
                <Button variant="text" size="small" onClick={() => dispatch(elementCommandAction({
                    elements: selectedIds, command: a.command.kind}))}>
                    {a.command.label}
                </Button>
            </ListItem>
        ))}
    </List>;

    return (
        <>
            <Divider/>
            {PropertiesSection}

            <Divider/>
            {actionsSection}
        </>
    );
}
