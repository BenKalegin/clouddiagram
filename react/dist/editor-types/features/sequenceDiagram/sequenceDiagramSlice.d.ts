import { Action } from "@reduxjs/toolkit";
import { DiagramHandler, Get, Set } from "../diagramEditor/diagramEditorSlice";
import { Coordinate, Diagram } from "../../common/model";
import { DiagramElement, Id, ElementRef } from "../../package/packageModel";
declare class SequenceDiagramHandler implements DiagramHandler {
    handleAction(action: Action, get: Get, set: Set): void;
    snapToElements(get: Get, diagramPos: Coordinate): [Coordinate, DiagramElement] | undefined;
    connectNodes(get: Get, set: Set, sourceId: Id, targetId: ElementRef, diagramPos: Coordinate): void;
    createAndConnectTo(get: Get, set: Set, name: string): void;
    getElement(get: Get, ref: ElementRef, diagram: Diagram): DiagramElement;
}
export declare const sequenceDiagramEditor: SequenceDiagramHandler;
export {};
//# sourceMappingURL=sequenceDiagramSlice.d.ts.map