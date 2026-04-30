import {
    ElementType,
    HasColorSchema,
} from "../../package/packageModel";

export enum PropertyType {
    String,
    MultilineString,
    Number,
    Boolean,
    Select,
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
    options?: string[];
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
export const classNameProp : PropertyDefinition = {name: "text", label: "Class", type: PropertyType.String, supportMultiEdit: false};
export const classAnnotationProp : PropertyDefinition = {name: "classAnnotation", label: "Annotation", type: PropertyType.String, supportMultiEdit: false};
export const classFieldsProp : PropertyDefinition = {name: "classFields", label: "Fields", type: PropertyType.MultilineString, supportMultiEdit: false};
export const classMethodsProp : PropertyDefinition = {name: "classMethods", label: "Methods", type: PropertyType.MultilineString, supportMultiEdit: false};
export const erEntityNameProp : PropertyDefinition = {name: "erEntity.entityId", label: "Entity", type: PropertyType.String, supportMultiEdit: false};
export const erEntityAliasProp : PropertyDefinition = {name: "erEntity.alias", label: "Alias", type: PropertyType.String, supportMultiEdit: false};
export const erAttributesProp : PropertyDefinition = {name: "erAttributes", label: "Attributes", type: PropertyType.MultilineString, supportMultiEdit: false};
export const erRelationshipLabelProp : PropertyDefinition = {name: "erRelationship.label", label: "Relationship", type: PropertyType.String, supportMultiEdit: false};
export const erSourceCardinalityProp : PropertyDefinition = {name: "erRelationship.sourceCardinality", label: "Source Cardinality", type: PropertyType.Select, supportMultiEdit: false, options: ["||", "|o", "}o", "}|"]};
export const erTargetCardinalityProp : PropertyDefinition = {name: "erRelationship.targetCardinality", label: "Target Cardinality", type: PropertyType.Select, supportMultiEdit: false, options: ["||", "|o", "}o", "}|"]};
export const erIdentifyingProp : PropertyDefinition = {name: "erRelationship.identifying", label: "Identifying", type: PropertyType.Boolean, supportMultiEdit: false};
export const pieTitleProp : PropertyDefinition = {name: "title", label: "Title", type: PropertyType.String, supportMultiEdit: false};
export const pieShowDataProp : PropertyDefinition = {name: "pie.showData", label: "Show Data", type: PropertyType.Boolean, supportMultiEdit: false};
export const pieTextPositionProp : PropertyDefinition = {name: "pie.textPosition", label: "Text Position", type: PropertyType.Number, supportMultiEdit: false};
export const pieSlicesProp : PropertyDefinition = {name: "pieSlices", label: "Slices", type: PropertyType.MultilineString, supportMultiEdit: false};
export const colorSchemaProp : PropertyDefinition = {name: "colorSchema" as keyof HasColorSchema, label: "Colors", type: PropertyType.ColorSchema, supportMultiEdit: true}
export const shapeLayoutProp : PropertyDefinition = {name: "customShape", label: "Shape Layout", type: PropertyType.ShapeLayout, supportMultiEdit: true}
export const lineStyleProp: PropertyDefinition = {name: "lineStyle", label: "Line Style", type: PropertyType.LineStyle, supportMultiEdit: true}
export const linkStyleProp: PropertyDefinition = {name: "routeStyle", label: "Route", type: PropertyType.RouteStyle, supportMultiEdit: true}
export const tipStyleProp1: PropertyDefinition = {name: "tipStyle1", label: "Start tip", type: PropertyType.TipStyle, supportMultiEdit: true}
export const tipStyleProp2: PropertyDefinition = {name: "tipStyle2", label: "End tip", type: PropertyType.TipStyle, supportMultiEdit: true}
export const ganttTaskLabelProp: PropertyDefinition = {name: "ganttTask.label", label: "Task", type: PropertyType.String, supportMultiEdit: false}
export const ganttTaskStartProp: PropertyDefinition = {name: "ganttTask.start", label: "Start", type: PropertyType.String, supportMultiEdit: false}
export const ganttTaskEndProp: PropertyDefinition = {name: "ganttTask.end", label: "End", type: PropertyType.String, supportMultiEdit: false}
export const ganttTaskDurationProp: PropertyDefinition = {name: "ganttTask.durationDays", label: "Duration (days)", type: PropertyType.Number, supportMultiEdit: false}
export const ganttTaskStatusProp: PropertyDefinition = {
    name: "ganttTask.status",
    label: "Status",
    type: PropertyType.Select,
    supportMultiEdit: true,
    options: ["", "active", "done", "crit", "milestone"]
}
export const ganttTaskSectionProp: PropertyDefinition = {name: "ganttTask.section", label: "Section", type: PropertyType.String, supportMultiEdit: false}

export function getPropertyList(type: ElementType, diagramType?: ElementType): PropertyDefinition[] {
    switch (type) {
        case ElementType.PieChartDiagram:
            return [pieTitleProp, pieShowDataProp, pieTextPositionProp, pieSlicesProp];
        case ElementType.ClassNode:
            if (diagramType === ElementType.GanttDiagram) {
                return [
                    ganttTaskLabelProp,
                    ganttTaskStartProp,
                    ganttTaskEndProp,
                    ganttTaskDurationProp,
                    ganttTaskStatusProp,
                    ganttTaskSectionProp,
                    colorSchemaProp
                ];
            }
            if (diagramType === ElementType.ClassDiagram) {
                return [classNameProp, classAnnotationProp, classFieldsProp, classMethodsProp, colorSchemaProp, shapeLayoutProp];
            }
            if (diagramType === ElementType.ErDiagram) {
                return [erEntityNameProp, erEntityAliasProp, erAttributesProp, colorSchemaProp];
            }
            return [textProp, colorSchemaProp, shapeLayoutProp];
        case ElementType.ClassLink:
            if (diagramType === ElementType.ErDiagram) {
                return [erRelationshipLabelProp, erSourceCardinalityProp, erTargetCardinalityProp, erIdentifyingProp, colorSchemaProp];
            }
            if (diagramType === ElementType.GanttDiagram) {
                return [textProp, colorSchemaProp, linkStyleProp];
            }
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
