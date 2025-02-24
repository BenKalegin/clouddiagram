import {
    elementCommandAction,
    elementPropertyChangedAction,
    Get,
    propertiesDialogAction,
    Set
} from "../diagramEditor/diagramEditorSlice";
import {
    handleClassCommand,
    handleClassElementPropertyChanged,
    nodePropertiesDialog
} from "./classDiagramModel";
import {Action} from "@reduxjs/toolkit";
import {StructureDiagramEditor} from "../structureDiagram/structureDiagramEditor";

class ClassDiagramEditor extends StructureDiagramEditor {
    handleAction(action: Action, get: Get, set: Set): void {
        if(propertiesDialogAction.match(action)) {
            const {elementId, dialogResult} = action.payload;
            nodePropertiesDialog(get, set, elementId, dialogResult);
        }else if (elementPropertyChangedAction.match(action)) {
            const {elements, propertyName, value} = action.payload;
            handleClassElementPropertyChanged(get, set, elements, propertyName, value);
        }else if(elementCommandAction.match(action)) {
            const {elements, command} = action.payload;
        handleClassCommand(get, set, elements, command)
        }else {
            super.handleAction(action, get, set);
        }
    }
}

export const classDiagramEditor = new ClassDiagramEditor();

