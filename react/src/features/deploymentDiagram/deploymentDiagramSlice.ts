import {StructureDiagramHandler} from "../structureDiagram/structureDiagramHandler";
import {Action} from "@reduxjs/toolkit";
import {Get, Set} from "../diagramEditor/diagramEditorSlice";

class DeploymentDiagramHandler extends StructureDiagramHandler {

    handleAction(action: Action, get: Get, set: Set) {
        super.handleAction(action, get, set);
    }
}

export const deploymentDiagramEditor = new DeploymentDiagramHandler();

