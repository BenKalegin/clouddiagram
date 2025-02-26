import {
    Get,
    propertiesDialogAction,
    Set
} from "../diagramEditor/diagramEditorSlice";
import {
    nodePropertiesDialog
} from "./classDiagramModel";
import {Action} from "@reduxjs/toolkit";
import {StructureDiagramEditor} from "../structureDiagram/structureDiagramEditor";

class ClassDiagramEditor extends StructureDiagramEditor {
    handleAction(action: Action, get: Get, set: Set): void {
        if(propertiesDialogAction.match(action)) {
            const {dialogResult} = action.payload;
            nodePropertiesDialog(get, set, dialogResult);
        }else {
            super.handleAction(action, get, set);
        }
    }
}

export const classDiagramEditor = new ClassDiagramEditor();

