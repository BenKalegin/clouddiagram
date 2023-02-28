import {
    dropFromPaletteAction,
    elementMoveAction,
    elementResizeAction, Get, Set,
    propertiesDialogAction, linkToNewDialogCompletedAction, DiagramEditor
} from "../diagramEditor/diagramEditorSlice";
import {
    addNewElementAt,
    addNodeAndConnect,
    moveElement,
    nodePropertiesDialog,
    resizeElement
} from "./classDiagramModel";
import {Action} from "@reduxjs/toolkit";
import {Coordinate} from "../../common/model";

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

}

export const classDiagramEditor = new ClassDiagramEditor();

//         connectExisting: (editor) => {
//             const linking = current(editor).linking!
//             autoConnectNodes(editor.diagram, linking.sourceElement, linking.targetElement!);

