import { Get, Set } from "../diagramEditor/diagramEditorSlice";
import { Action } from "@reduxjs/toolkit";
import { StructureDiagramHandler } from "../structureDiagram/structureDiagramHandler";
declare class ClassDiagramHandler extends StructureDiagramHandler {
    handleAction(action: Action, get: Get, set: Set): void;
}
export declare const classDiagramEditor: ClassDiagramHandler;
export {};
//# sourceMappingURL=classDiagramSlice.d.ts.map