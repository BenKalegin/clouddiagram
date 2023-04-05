import {
    DiagramEditor,
    dropFromPaletteAction, elementCommandAction,
    elementMoveAction,
    elementPropertyChangedAction,
    elementResizeAction,
    Get,
    propertiesDialogAction,
    Set
} from "../diagramEditor/diagramEditorSlice";
import {
    addNewElementAt,
    addNodeAndConnect,
    autoConnectNodes, ClassDiagramState, findNodeAtPos, findPortAtPos, handleClassCommand,
    handleClassElementPropertyChanged,
    moveElement,
    nodePropertiesDialog,
    resizeElement
} from "./classDiagramModel";
import {Action} from "@reduxjs/toolkit";
import {Coordinate} from "../../common/model";
import {DiagramElement, ElementType, Id, ElementRef} from "../../package/packageModel";
import {elementsAtom} from "../diagramEditor/diagramEditorModel";
import {activeDiagramIdAtom} from "../diagramTabs/DiagramTabs";
import {snapToBounds} from "../../common/Geometry/snap";

class ClassDiagramEditor implements DiagramEditor {
    handleAction(action: Action, get: Get, set: Set): void {
        if (dropFromPaletteAction.match(action)) {
            addNewElementAt(get, set, action.payload.droppedAt, action.payload.name);
        }else if(elementMoveAction.match(action)){
            const {element, currentPointerPos, startNodePos, startPointerPos} = action.payload;
            moveElement(get, set, element, currentPointerPos, startPointerPos, startNodePos);
        }else if(elementResizeAction.match(action)){
            const {elementId, suggestedBounds} = action.payload;
            resizeElement(get, set, elementId, suggestedBounds);
        }else if(propertiesDialogAction.match(action)) {
            const {elementId, dialogResult} = action.payload;
            nodePropertiesDialog(get, set, elementId, dialogResult);
        }else if (elementPropertyChangedAction.match(action)) {
            const {elements, propertyName, value} = action.payload;
            handleClassElementPropertyChanged(get, set, elements, propertyName, value);
        }else if(elementCommandAction.match(action)) {
            const {elements, command} = action.payload;
        handleClassCommand(get, set, elements, command)
        }
    }

    snapToElements(get: Get, diagramPos: Coordinate): [Coordinate, DiagramElement] | undefined {
        const diagramId = get(activeDiagramIdAtom);
        const [targetPortId, targetBounds] = findPortAtPos(get, diagramPos, diagramId, 3);
        if (targetPortId && targetBounds) {
            return [snapToBounds(diagramPos, targetBounds), {id: targetPortId, type: ElementType.ClassPort}]
        }
        const [targetNodeId, targetNodeBounds] = findNodeAtPos(get, diagramPos, diagramId, 3);
        if(targetNodeId && targetNodeBounds){
            return [snapToBounds(diagramPos, targetNodeBounds), {id: targetNodeId, type: ElementType.ClassNode}]
        }
        return undefined;

    }

    connectNodes(get: Get, set: Set, sourceId: Id, target: ElementRef, diagramPos: Coordinate): void {
        autoConnectNodes(get, set, sourceId, target);
    }

    createAndConnectTo(get: Get, set: Set, name: string): void {
        addNodeAndConnect(get, set, name)
    }

    getElement(get: Get, ref: ElementRef, diagram: ClassDiagramState): DiagramElement {
        switch (ref.type)
        {
            case ElementType.ClassNode: return get(elementsAtom(ref.id));
            case ElementType.ClassLink: return get(elementsAtom(ref.id));

            default:
                throw new Error(`Unknown element type: ${ref.type}`);
        }
    }

}

export const classDiagramEditor = new ClassDiagramEditor();

