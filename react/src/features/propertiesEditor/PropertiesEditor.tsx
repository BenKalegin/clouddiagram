import {Box, Button, Divider, FormControlLabel, ListItem, Switch, TextField} from "@mui/material";
import List from "@mui/material/List";
import React from "react";
import {useRecoilValue} from "recoil";
import {selectedElementsSelector, selectedRefsSelector} from "../diagramEditor/diagramEditorModel";
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



export const PropertiesEditor = () => {
    const diagramId = useRecoilValue(activeDiagramIdAtom)
    const selectedIds = useRecoilValue(selectedRefsSelector(diagramId))
    const selectedElements = new Map(useRecoilValue(selectedElementsSelector(diagramId)).map(e => [e.id, e]))

    const selectedKinds = [...new Set(selectedIds.map(element => element.type))]
    const dispatch = useDispatch()


    const properties = selectedKinds
        .flatMap(kind => getPropertyList(kind).map<PropAndKind>(prop => ({kind, prop: prop})))
        .filter(({prop}) => prop.supportMultiEdit || selectedIds.length === 1)

    const commands = selectedKinds
        .flatMap(kind => getActionList(kind).map<CommandAndKind>(action => ({kind, command: action})))
        .filter(({command}) => command.supportMultiEdit || selectedIds.length === 1)

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

    function BooleanPropertyEditor(p: PropAndKind, value: boolean, updateProps: (value: any) => void) {
        return <FormControlLabel control={
            <Switch
                checked={value}
                onChange={e => updateProps(e.target.checked)}
            />
        } label={p.prop.label}
        />;
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
                {p.prop.type === PropertyType.Boolean && BooleanPropertyEditor(p, value as boolean, updateProps)}
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
