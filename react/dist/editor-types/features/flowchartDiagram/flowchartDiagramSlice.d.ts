import { Action } from "@reduxjs/toolkit";
import { Get, Set } from "../diagramEditor/diagramEditorSlice";
import { StructureDiagramHandler } from "../structureDiagram/structureDiagramHandler";
declare class FlowchartDiagramHandler extends StructureDiagramHandler {
    handleAction(action: Action, get: Get, set: Set): void;
}
export declare const flowchartDiagramEditor: FlowchartDiagramHandler;
export {};
//# sourceMappingURL=flowchartDiagramSlice.d.ts.map