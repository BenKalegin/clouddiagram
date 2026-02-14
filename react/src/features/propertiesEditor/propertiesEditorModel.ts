import {
    ElementType,
    HasColorSchema,
} from "../../package/packageModel";

export enum PropertyType {
    String,
    Boolean,
    ColorSchema,
    ShapeLayout,
    LineStyle,
    RouteStyle,
    TipStyle,
}

export type PropAndKind = {kind: ElementType, prop: PropertyDefinition}

export interface PropertyDefinition {
    name: string;
    label: string;
    type: PropertyType;
    supportMultiEdit: boolean;
}

export enum Command {
    Delete = "delete",
    AddReturnMessage = "add-return-message",
    ReverseMessage = "reverse-message",
    SelectNextLeft = "select-next-left",
    SelectNextRight = "select-next-right",
    SelectNextUp = "select-next-up",
    SelectNextDown = "select-next-down",
}

export interface CommandDefinition {
    kind: Command;
    label: string;
    supportMultiEdit: boolean;
}

// Property definitions
export const textProp : PropertyDefinition = {name: "text", label: "Text", type: PropertyType.String, supportMultiEdit: false};
export const colorSchemaProp : PropertyDefinition = {name: "colorSchema" as keyof HasColorSchema, label: "Colors", type: PropertyType.ColorSchema, supportMultiEdit: true}
export const shapeLayoutProp : PropertyDefinition = {name: "customShape", label: "Shape Layout", type: PropertyType.ShapeLayout, supportMultiEdit: true}
export const lineStyleProp: PropertyDefinition = {name: "lineStyle", label: "Line Style", type: PropertyType.LineStyle, supportMultiEdit: true}
export const linkStyleProp: PropertyDefinition = {name: "routeStyle", label: "Route", type: PropertyType.RouteStyle, supportMultiEdit: true}
export const tipStyleProp1: PropertyDefinition = {name: "tipStyle1", label: "Start tip", type: PropertyType.TipStyle, supportMultiEdit: true}
export const tipStyleProp2: PropertyDefinition = {name: "tipStyle2", label: "End tip", type: PropertyType.TipStyle, supportMultiEdit: true}

export function getPropertyList(type: ElementType, diagramType?: ElementType): PropertyDefinition[] {
    switch (type) {
        case ElementType.ClassNode:
            return [textProp, colorSchemaProp, shapeLayoutProp];
        case ElementType.ClassLink:
            if (diagramType === ElementType.FlowchartDiagram) {
                // Flowcharts keep links directional by design.
                return [textProp, colorSchemaProp, linkStyleProp];
            }
            return [textProp, colorSchemaProp, linkStyleProp, tipStyleProp1, tipStyleProp2];
        case ElementType.SequenceLifeLine:
            return [{name: "title", label: "Title", type: PropertyType.String, supportMultiEdit: false}, colorSchemaProp];
        case ElementType.SequenceMessage:
            return [
                textProp, lineStyleProp,
                {name: "isReturn", label: "Is Return", type: PropertyType.Boolean, supportMultiEdit: false},
                {name: "isAsync", label: "Is Asynchronous", type: PropertyType.Boolean, supportMultiEdit: false},
            ];
        case ElementType.Note:
            return [textProp, colorSchemaProp];
        default:
            return [];
    }
}

export type CommandAndKind = {kind: ElementType, command: CommandDefinition}

export const deleteCommand = {label: "Delete", kind: Command.Delete, supportMultiEdit: true};

export function getActionList(type: ElementType): CommandDefinition[] {
    switch (type) {
        case ElementType.Note:
            return [deleteCommand];
        case ElementType.ClassNode:
        case ElementType.DeploymentNode:
        case ElementType.ClassLink:
        case ElementType.DeploymentLink:
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
