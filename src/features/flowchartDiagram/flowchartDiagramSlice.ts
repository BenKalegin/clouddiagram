import { Action } from "@reduxjs/toolkit";
import { Get, Set } from "../diagramEditor/diagramEditorSlice";
import { StructureDiagramHandler } from "../structureDiagram/structureDiagramHandler";

class FlowchartDiagramHandler extends StructureDiagramHandler {
    handleAction(action: Action, get: Get, set: Set): void {
        super.handleAction(action, get, set);
    }
}

export const flowchartDiagramEditor = new FlowchartDiagramHandler();
