import {
    Get,
    Set
} from "../diagramEditor/diagramEditorSlice";
import {Action} from "@reduxjs/toolkit";
import {StructureDiagramHandler} from "../structureDiagram/structureDiagramHandler";

class ClassDiagramHandler extends StructureDiagramHandler {
    handleAction(action: Action, get: Get, set: Set): void {
        super.handleAction(action, get, set);
    }
}

export const classDiagramEditor = new ClassDiagramHandler();

