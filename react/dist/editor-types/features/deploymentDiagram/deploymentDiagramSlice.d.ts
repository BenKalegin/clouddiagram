import { StructureDiagramHandler } from "../structureDiagram/structureDiagramHandler";
import { Action } from "@reduxjs/toolkit";
import { Get, Set } from "../diagramEditor/diagramEditorSlice";
declare class DeploymentDiagramHandler extends StructureDiagramHandler {
    handleAction(action: Action, get: Get, set: Set): void;
}
export declare const deploymentDiagramEditor: DeploymentDiagramHandler;
export {};
//# sourceMappingURL=deploymentDiagramSlice.d.ts.map