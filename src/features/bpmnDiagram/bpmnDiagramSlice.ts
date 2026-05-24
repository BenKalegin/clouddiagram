import {Action} from "@reduxjs/toolkit";
import {Get, Set} from "../diagramEditor/diagramEditorSlice";
import {StructureDiagramHandler} from "../structureDiagram/structureDiagramHandler";

/**
 * BPMN command handler. Inherits from StructureDiagramHandler — Phase 2b
 * delegates all operations to the structure-diagram baseline. BPMN-specific
 * constraints (lane-bounded reparenting, message-flow validation) layer onto
 * this in subsequent phases.
 */
class BpmnDiagramHandler extends StructureDiagramHandler {
    handleAction(action: Action, get: Get, set: Set): void {
        super.handleAction(action, get, set);
    }
}

export const bpmnDiagramEditor = new BpmnDiagramHandler();
