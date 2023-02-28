import {
    dropFromPaletteAction,
    elementMoveAction,
    elementResizeAction, Get, Set,
    propertiesDialogAction, linkToNewDialogCompletedAction, DiagramEditor
} from "../diagramEditor/diagramEditorSlice";
import {
    addNewElementAt,
    addNodeAndConnect, autoConnectNodes,
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
        }else if(propertiesDialogAction.match(action)){
            const {elementId, dialogResult} = action.payload;
            nodePropertiesDialog(get, set, elementId, dialogResult);
        }else if (linkToNewDialogCompletedAction.match(action)) {
            const {selectedName} = action.payload;
            addNodeAndConnect(get, set, selectedName ?? "new node")
        }
    }

    snapToElements(get: Get, diagramPos: Coordinate): Coordinate | undefined {
        return undefined;
    }

    connectNodes(get: Get, set: Set, sourceId: Id, targetId: Id): void {
        autoConnectNodes(get, set, sourceId, targetId);
    }

}

export const classDiagramEditor = new ClassDiagramEditor();

