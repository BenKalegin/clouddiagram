import { ElementType } from "../../package/packageModel";
export declare enum PropertyType {
    String = 0,
    Boolean = 1,
    ColorSchema = 2,
    ShapeLayout = 3,
    LineStyle = 4,
    RouteStyle = 5,
    TipStyle = 6
}
export type PropAndKind = {
    kind: ElementType;
    prop: PropertyDefinition;
};
export interface PropertyDefinition {
    name: string;
    label: string;
    type: PropertyType;
    supportMultiEdit: boolean;
}
export declare enum Command {
    Delete = "delete",
    AddReturnMessage = "add-return-message",
    ReverseMessage = "reverse-message",
    SelectNextLeft = "select-next-left",
    SelectNextRight = "select-next-right",
    SelectNextUp = "select-next-up",
    SelectNextDown = "select-next-down"
}
export interface CommandDefinition {
    kind: Command;
    label: string;
    supportMultiEdit: boolean;
}
export declare const textProp: PropertyDefinition;
export declare const colorSchemaProp: PropertyDefinition;
export declare const shapeLayoutProp: PropertyDefinition;
export declare const lineStyleProp: PropertyDefinition;
export declare const linkStyleProp: PropertyDefinition;
export declare const tipStyleProp1: PropertyDefinition;
export declare const tipStyleProp2: PropertyDefinition;
export declare function getPropertyList(type: ElementType, diagramType?: ElementType): PropertyDefinition[];
export type CommandAndKind = {
    kind: ElementType;
    command: CommandDefinition;
};
export declare const deleteCommand: {
    label: string;
    kind: Command;
    supportMultiEdit: boolean;
};
export declare function getActionList(type: ElementType): CommandDefinition[];
//# sourceMappingURL=propertiesEditorModel.d.ts.map