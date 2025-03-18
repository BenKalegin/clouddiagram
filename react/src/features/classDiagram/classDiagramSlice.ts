import {
    Get,
    propertiesDialogAction,
    Set
} from "../diagramEditor/diagramEditorSlice";
import {Action} from "@reduxjs/toolkit";
import {StructureDiagramHandler} from "../structureDiagram/structureDiagramHandler";
import {nodePropertiesDialog} from "../structureDiagram/structureDiagramModel";

class ClassDiagramHandler extends StructureDiagramHandler {
    handleAction(action: Action, get: Get, set: Set): void {
        if(propertiesDialogAction.match(action)) {
            const {dialogResult} = action.payload;
            nodePropertiesDialog(get, set, dialogResult);
        }else {
            super.handleAction(action, get, set);
        }
    }
}

export const classDiagramEditor = new ClassDiagramHandler();

