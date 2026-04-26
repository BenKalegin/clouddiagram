import { Bounds, Coordinate, Diagram } from "../../common/model";
import { ExportPhase, ImportPhase, Linking } from "./diagramEditorModel";
import { DiagramElement, ElementRef, ElementType, Id } from "../../package/packageModel";
import { RecoilState, RecoilValue } from "recoil";
import { Action } from "@reduxjs/toolkit";
import Konva from "konva";
import { TypeAndSubType } from "../diagramTabs/HtmlDrop";
import { ExportImportFormat } from "../export/exportFormats";
import { Command } from "../propertiesEditor/propertiesEditorModel";
import KonvaEventObject = Konva.KonvaEventObject;
export declare enum ElementMoveResizePhase {
    start = "start",
    move = "move",
    end = "end"
}
export declare const elementMoveAction: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    phase: ElementMoveResizePhase;
    element: ElementRef;
    currentPointerPos: Coordinate;
    startPointerPos: Coordinate;
    startNodePos: Coordinate;
}, string>;
export declare const elementResizeAction: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    element: ElementRef;
    phase: ElementMoveResizePhase;
    suggestedBounds: Bounds;
}, string>;
export declare const dropFromPaletteAction: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    droppedAt: Coordinate;
    name: string;
    kind: TypeAndSubType;
}, string>;
export declare enum LinkingPhase {
    start = "start",
    draw = "draw",
    end = "end"
}
export declare const linkingAction: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    elementId: Id;
    mousePos: Coordinate;
    diagramPos: Coordinate | undefined;
    phase: LinkingPhase;
    ctrlKey: boolean;
    shiftKey: boolean;
}, string>;
export declare const linkToNewDialogCompletedAction: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    success: boolean;
    selectedKey?: string | undefined;
    selectedName?: string | undefined;
}, string>;
export declare const elementSelectedAction: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    /**
     * selected element id or undefined if clicked on empty space
     */
    element: ElementRef | undefined;
    shiftKey: boolean;
    ctrlKey: boolean;
}, string>;
export declare const elementPropertyChangedAction: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    elements: ElementRef[];
    propertyName: string;
    value: any;
}, string>;
export declare const elementCommandAction: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    elements: ElementRef[];
    command: Command;
}, string>;
export declare const addDiagramTabAction: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    diagramKind: ElementType;
}, string>;
export declare const closeDiagramTabAction: import("@reduxjs/toolkit").ActionCreatorWithPayload<{}, string>;
export declare const exportDiagramTabAction: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    exportState: ExportPhase;
    format?: ExportImportFormat | undefined;
}, string>;
export declare const importDiagramTabAction: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    importState: ImportPhase;
    format?: ExportImportFormat | undefined;
    importedCode?: string | undefined;
}, string>;
export declare const showContextAction: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    elementId: Id;
    mousePos: Coordinate;
    diagramPos: Coordinate;
}, string>;
export declare const hideContextAction: import("@reduxjs/toolkit").ActionCreatorWithPayload<{}, string>;
export declare const updateDiagramDisplayAction: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    scale: number;
    offset: Coordinate;
}, string>;
export type Get = (<T>(a: RecoilValue<T>) => T);
export type Set = (<T>(s: RecoilState<T>, u: (((currVal: T) => T) | T)) => void);
export interface DiagramHandler {
    handleAction(action: Action, get: Get, set: Set): void;
    snapToElements(get: Get, diagramPos: Coordinate): [Coordinate, DiagramElement] | undefined;
    connectNodes(get: Get, set: Set, sourceId: Id, targetId: ElementRef, diagramPos: Coordinate): void;
    createAndConnectTo(get: Get, set: Set, name: string): void;
    getElement(get: Get, ref: ElementRef, diagram: Diagram): DiagramElement;
}
export declare function useDispatch(): (action: Action<any>) => void;
export declare function screenToCanvas(e: KonvaEventObject<DragEvent | MouseEvent>): Coordinate;
export declare function toDiagramPos(linking: Linking, screenPos: Coordinate): Coordinate;
export declare function exportDiagramTab(set: Set, exportState: ExportPhase, format: ExportImportFormat | undefined): void;
export declare function importDiagramTab(get: Get, set: Set, phase: ImportPhase, format: ExportImportFormat | undefined, code: string | undefined): void;
export declare function calculateDiagramBounds(diagram: Diagram): {
    width: number;
    height: number;
};
export declare const diagramEditors: Record<any, DiagramHandler>;
//# sourceMappingURL=diagramEditorSlice.d.ts.map