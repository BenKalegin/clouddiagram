import {StructureDiagramEditor} from "../structureDiagram/structureDiagramEditor";
import {Action} from "@reduxjs/toolkit";
import {Get, Set} from "../diagramEditor/diagramEditorSlice";

class DeploymentDiagramEditor extends StructureDiagramEditor {

    handleAction(action: Action, get: Get, set: Set) {
        super.handleAction(action, get, set);
    }
}

export const deploymentDiagramEditor = new DeploymentDiagramEditor();

