import {
    dropFromPaletteAction,
    elementMoveAction,
    elementResizeAction, Get, Set,
    propertiesDialogAction, DiagramEditor, elementPropertyChangedAction
} from "../diagramEditor/diagramEditorSlice";
import {
    addNewElementAt, addNodeAndConnect,
    autoConnectNodes, handleClassElementPropertyChanged,
    moveElement,
    nodePropertiesDialog,
    resizeElement
} from "./classDiagramModel";
import {Action} from "@reduxjs/toolkit";
import {Coordinate} from "../../common/model";
import {Id} from "../../package/packageModel";

class ClassDiagramEditor implements DiagramEditor {
    handleAction(action: Action, get: Get, set: Set): void {
        if (dropFromPaletteAction.match(action)) {
            addNewElementAt(get, set, action.payload.droppedAt, action.payload.name);
        }else if(elementMoveAction.match(action)){
            const {elementId, currentPointerPos, startNodePos, startPointerPos} = action.payload;
            moveElement(get, set, elementId, currentPointerPos, startPointerPos, startNodePos);
        }else if(elementResizeAction.match(action)){
            const {elementId, suggestedBounds} = action.payload;
            resizeElement(get, set, elementId, suggestedBounds);
        }else if(propertiesDialogAction.match(action)) {
            const {elementId, dialogResult} = action.payload;
            nodePropertiesDialog(get, set, elementId, dialogResult);
        }else if (elementPropertyChangedAction.match(action)) {
            const {elements, propertyName, value} = action.payload;
            handleClassElementPropertyChanged(get, set, elements, propertyName, value);
        }
    }

    snapToElements(get: Get, diagramPos: Coordinate): Coordinate | undefined {
        return undefined;
    }

    connectNodes(get: Get, set: Set, sourceId: Id, targetId: Id, diagramPos: Coordinate): void {
        autoConnectNodes(get, set, sourceId, targetId);
    }

    createAndConnectTo(get: Get, set: Set, name: string): void {
        addNodeAndConnect(get, set, name)
    }
}

export const classDiagramEditor = new ClassDiagramEditor();

