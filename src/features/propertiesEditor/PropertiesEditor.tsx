import { Button, SelectField, Switch, TextareaField, TextField } from "@benkalegin/ui26";
import { useAtomValue } from "jotai";
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
import {getErAttributesText} from "../erDiagram/erDiagramUtils";
import {getPieSlicesText} from "../pieChartDiagram/pieChartDiagramUtils";
import "./PropertiesEditor.css";


export const PropertiesEditor = () => {
    const diagramId = useAtomValue(activeDiagramIdAtom);
    const diagramKind = useAtomValue(diagramKindSelector(diagramId));
    const selectedIds = useAtomValue(selectedRefsSelector(diagramId));
    const selectedElements = new Map(useAtomValue(selectedElementsSelector(diagramId)).map(e => [e.id, e]));

    const selectedKinds = [...new Set(selectedIds.map(element => element.type))];
    const dispatch = useDispatch();


    const properties = selectedKinds
        .flatMap(kind => getPropertyList(kind, diagramKind).map<PropAndKind>(prop => ({ kind, prop })))
        .filter(({ prop }) => prop.supportMultiEdit || selectedIds.length === 1);

    const commands = selectedKinds
        .flatMap(kind => getActionList(kind).map<CommandAndKind>(action => ({ kind, command: action })))
        .filter(({ command }) => command.supportMultiEdit || selectedIds.length === 1);

    const getPropertyValue = (property: PropAndKind): any => {
        const { kind, prop } = property;
        const elementsOfAKind = selectedIds.filter(element => element.type === kind);
        const values: any[] = elementsOfAKind.map(element => {
            const obj: any = selectedElements.get(element.id);
            return getObjectPropertyValue(obj, prop.name);
        });
        return values.every(value => value === values[0]) ? values[0] : undefined;
    };

    const StringPropertyEditor = (p: PropAndKind, value: string, updateProps: (v: any) => void) => (
        <TextField
            label={p.prop.label}
            value={value || ""}
            onChange={updateProps}
        />
    );

    const MultilineStringPropertyEditor = (p: PropAndKind, value: string, updateProps: (v: any) => void) => (
        <TextareaField
            label={p.prop.label}
            value={value || ""}
            onChange={updateProps}
            rows={4}
        />
    );

    const NumberPropertyEditor = (p: PropAndKind, value: number | undefined, updateProps: (v: any) => void) => (
        <TextField
            label={p.prop.label}
            type="number"
            value={value === undefined ? "" : String(value)}
            onChange={(s) => updateProps(s === "" ? undefined : Number(s))}
        />
    );

    const BooleanPropertyEditor = (p: PropAndKind, value: boolean, updateProps: (v: any) => void) => (
        <Switch
            checked={value}
            onChange={updateProps}
            label={p.prop.label}
        />
    );

    const SelectPropertyEditor = (p: PropAndKind, value: string | undefined, updateProps: (v: any) => void) => (
        <SelectField
            label={p.prop.label}
            value={value ?? ""}
            onChange={updateProps}
            options={(p.prop.options ?? []).map(option => ({
                value: option ?? "",
                label: option || "Not set"
            }))}
        />
    );

    const PropertiesSection = properties.map((p, i) => {
        const value = getPropertyValue(p);
        const updateProps = (v: any) => {
            dispatch(elementPropertyChangedAction({
                elements: selectedIds.filter(element => element.type === p.kind),
                propertyName: p.prop.name,
                value: v
            }));
        };

        return (
            <div className="properties-row" key={i}>
                {p.prop.type === PropertyType.String && StringPropertyEditor(p, value as string, updateProps)}
                {p.prop.type === PropertyType.MultilineString && MultilineStringPropertyEditor(p, value as string, updateProps)}
                {p.prop.type === PropertyType.Number && NumberPropertyEditor(p, value as number | undefined, updateProps)}
                {p.prop.type === PropertyType.Boolean && BooleanPropertyEditor(p, value as boolean, updateProps)}
                {p.prop.type === PropertyType.Select && SelectPropertyEditor(p, value as string | undefined, updateProps)}
                {p.prop.type === PropertyType.ColorSchema && value != null && <ColorSchemaPropertyEditor propAndKind={p} value={value as ColorSchema} updateProps={updateProps} />}
                {p.prop.type === PropertyType.ShapeLayout && <NodeLayoutPropertyEditor propAndKind={p} value={value as CustomShape} updateProps={updateProps} />}
                {p.prop.type === PropertyType.LineStyle && <LineStylePropertyEditor propAndKind={p} value={value as LineStyle} updateProps={updateProps} />}
                {p.prop.type === PropertyType.RouteStyle && <LinkStylePropertyEditor propAndKind={p} value={value as RouteStyle} updateProps={updateProps} />}
                {p.prop.type === PropertyType.TipStyle && <TipStylePropertyEditor propAndKind={p} value={value as TipStyle} updateProps={updateProps} />}
            </div>
        );
    });

    const actionsSection = (
        <ul className="properties-actions">
            {commands.map((a, i) => (
                <li key={i} className="properties-actions__item">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dispatch(elementCommandAction({ elements: selectedIds, command: a.command.kind }))}
                    >
                        {a.command.label}
                    </Button>
                </li>
            ))}
        </ul>
    );

    return (
        <>
            {PropertiesSection}
            {actionsSection}
        </>
    );
};

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
    if (propertyName === "erAttributes") {
        return getErAttributesText(obj);
    }
    if (propertyName === "pieSlices") {
        return obj.pie ? getPieSlicesText(obj.pie.slices) : undefined;
    }

    return propertyName
        .split(".")
        .reduce((value, key) => value?.[key], obj);
}
