import {Box, Button, Divider, FormControlLabel, ListItem, MenuItem, Switch, TextField} from "@mui/material";
import List from "@mui/material/List";
import React from "react";
import {useAtomValue} from "jotai";
import {diagramKindSelector, selectedElementsSelector, selectedRefsSelector} from "../diagramEditor/diagramEditorModel";
import {
    ColorSchema,
    CustomShape,
    LineStyle,
    RouteStyle,
    TipStyle
} from "../../package/packageModel";
import {activeDiagramIdAtom} from "../diagramTabs/diagramTabsModel";
import {elementCommandAction, elementPropertyChangedAction, useDispatch} from "../diagramEditor/diagramEditorSlice";
import {ColorSchemaPropertyEditor} from "./ColorSchemaPropertyEditor";
import {LineStylePropertyEditor} from "./LineStylePropertyEditor";
import {NodeLayoutPropertyEditor} from "./NodeLayoutPropertyEditor";
import {LinkStylePropertyEditor} from "./LinkStylePropertyEditor";
import {TipStylePropertyEditor} from "./TipStylePropertyEditor";
import {
    CommandAndKind,
    getActionList,
    getPropertyList,
    PropAndKind,
    PropertyType
} from "./propertiesEditorModel";
import {getGanttTaskDurationDays} from "../ganttDiagram/ganttDiagramUtils";
import {getClassFieldsText, getClassMethodsText} from "../classDiagram/classDiagramUtils";



export const PropertiesEditor = () => {
    const diagramId = useAtomValue(activeDiagramIdAtom)
    const diagramKind = useAtomValue(diagramKindSelector(diagramId))
    const selectedIds = useAtomValue(selectedRefsSelector(diagramId))
    const selectedElements = new Map(useAtomValue(selectedElementsSelector(diagramId)).map(e => [e.id, e]))

    const selectedKinds = [...new Set(selectedIds.map(element => element.type))]
    const dispatch = useDispatch()


    const properties = selectedKinds
        .flatMap(kind => getPropertyList(kind, diagramKind).map<PropAndKind>(prop => ({kind, prop: prop})))
        .filter(({prop}) => prop.supportMultiEdit || selectedIds.length === 1)

    const commands = selectedKinds
        .flatMap(kind => getActionList(kind).map<CommandAndKind>(action => ({kind, command: action})))
        .filter(({command}) => command.supportMultiEdit || selectedIds.length === 1)

    const getPropertyValue = (property: PropAndKind): any => {
        const {kind, prop} = property;
        const elementsOfAKind = selectedIds.filter(element => element.type === kind)

        const values: any[] = elementsOfAKind.map(element => {
            const obj: any = selectedElements.get(element.id)
            return getObjectPropertyValue(obj, prop.name);
        })

        if (values.every(value => value === values[0])) {
            return values[0]
        }
        else {
            return undefined
        }
    }

    function StringPropertyEditor(p: PropAndKind, value: string, updateProps: (value: any) => void) {
        return (
            <TextField
                label={p.prop.label}
                variant="outlined"
                size="small"
                value={value || ""}
                onChange={e => updateProps(e.target.value)}
            /> )
    }

    function MultilineStringPropertyEditor(p: PropAndKind, value: string, updateProps: (value: any) => void) {
        return (
            <TextField
                label={p.prop.label}
                variant="outlined"
                size="small"
                value={value || ""}
                multiline
                minRows={4}
                onChange={e => updateProps(e.target.value)}
            /> )
    }

    function NumberPropertyEditor(p: PropAndKind, value: number | undefined, updateProps: (value: any) => void) {
        return (
            <TextField
                label={p.prop.label}
                variant="outlined"
                size="small"
                type="number"
                value={value ?? ""}
                onChange={e => updateProps(e.target.value === "" ? undefined : Number(e.target.value))}
            /> )
    }

    function BooleanPropertyEditor(p: PropAndKind, value: boolean, updateProps: (value: any) => void) {
        return <FormControlLabel control={
            <Switch
                checked={value}
                onChange={e => updateProps(e.target.checked)}
            />
        } label={p.prop.label}
        />;
    }

    function SelectPropertyEditor(p: PropAndKind, value: string | undefined, updateProps: (value: any) => void) {
        return (
            <TextField
                select
                label={p.prop.label}
                variant="outlined"
                size="small"
                value={value ?? ""}
                onChange={e => updateProps(e.target.value)}
            >
                {(p.prop.options ?? []).map(option =>
                    <MenuItem key={option || "none"} value={option}>{option || "Not set"}</MenuItem>
                )}
            </TextField>
        );
    }

    const PropertiesSection = properties.map((p, i) => {
        const value = getPropertyValue(p)
        function updateProps(value: any) {
            dispatch(elementPropertyChangedAction({
                elements: selectedIds.filter(element => element.type === p.kind),
                propertyName: p.prop.name,
                value
            }))}

        return (
            <Box display="flex" flexDirection="column" p={2} key={i}>
                {p.prop.type === PropertyType.String && StringPropertyEditor(p, value as string, updateProps)}
                {p.prop.type === PropertyType.MultilineString && MultilineStringPropertyEditor(p, value as string, updateProps)}
                {p.prop.type === PropertyType.Number && NumberPropertyEditor(p, value as number | undefined, updateProps)}
                {p.prop.type === PropertyType.Boolean && BooleanPropertyEditor(p, value as boolean, updateProps)}
                {p.prop.type === PropertyType.Select && SelectPropertyEditor(p, value as string | undefined, updateProps)}
                {p.prop.type === PropertyType.ColorSchema && <ColorSchemaPropertyEditor propAndKind={p} value = {value as ColorSchema} updateProps={updateProps}/>}
                {p.prop.type === PropertyType.ShapeLayout && <NodeLayoutPropertyEditor propAndKind={p} value = {value as CustomShape} updateProps={updateProps}/>}
                {p.prop.type === PropertyType.LineStyle && <LineStylePropertyEditor propAndKind={p} value = {value as LineStyle} updateProps={updateProps}/>}
                {p.prop.type === PropertyType.RouteStyle && <LinkStylePropertyEditor propAndKind={p} value = {value as RouteStyle} updateProps={updateProps}/>}
                {p.prop.type === PropertyType.TipStyle && <TipStylePropertyEditor propAndKind={p} value = {value as TipStyle} updateProps={updateProps}/>}
            </Box>

        );
    });

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

function getObjectPropertyValue(obj: any, propertyName: string): any {
    if (!obj) return undefined;
    if (propertyName === "ganttTask.durationDays") {
        return obj.ganttTask ? getGanttTaskDurationDays(obj.ganttTask) : undefined;
    }
    if (propertyName === "classFields") {
        return getClassFieldsText(obj);
    }
    if (propertyName === "classMethods") {
        return getClassMethodsText(obj);
    }

    return propertyName
        .split(".")
        .reduce((value, key) => value?.[key], obj);
}
