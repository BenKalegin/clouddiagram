import {Action} from "@reduxjs/toolkit";
import {
    DiagramEditor,
    dropFromPaletteAction,
    elementMoveAction,
    elementResizeAction, Get, Set
} from "../diagramEditor/diagramEditorSlice";
import {
    autoConnectActivations,
    findActivationAtPos,
    handleSequenceDropFromLibrary,
    handleSequenceMoveElement,
    handleSequenceResizeElement, SequenceDiagramState
} from "./sequenceDiagramModel";
import {Coordinate} from "../../common/model";
import {elementsAtom, linkingAtom} from "../diagramEditor/diagramEditorModel";
import {activeDiagramIdAtom} from "../diagramTabs/DiagramTabs";
import {snapToBounds} from "../../common/Geometry/snap";
import {Id} from "../../package/packageModel";


class SequenceDiagramEditor implements DiagramEditor {
    handleAction(action: Action, get: Get, set: Set): void {
        if (dropFromPaletteAction.match(action)) {
            const {name, droppedAt} = action.payload;
            handleSequenceDropFromLibrary(get, set, droppedAt, name);
        }
        else if (elementMoveAction.match(action)) {
            const {currentPointerPos, phase, startNodePos, startPointerPos, elementId} = action.payload;
            handleSequenceMoveElement(get, set, phase, elementId, currentPointerPos, startPointerPos, startNodePos);
        }
        else if (elementResizeAction.match(action)) {
            const {phase, elementId, suggestedBounds} = action.payload;
            handleSequenceResizeElement(get, set, phase, elementId, suggestedBounds);
        }
    }

    snapToElements(get: Get, diagramPos: Coordinate): Coordinate | undefined {
        const linking = get(linkingAtom)!;
        const diagramId = get(activeDiagramIdAtom);
        const diagram = get(elementsAtom(diagramId)) as SequenceDiagramState;
        const [targetActivationId, targetBounds] = findActivationAtPos(get, diagram.activations, diagramPos, diagramId, 3);
        linking.targetElement = targetActivationId;
        if (targetActivationId && targetBounds) {
            return snapToBounds(diagramPos, targetBounds);
        }
        return undefined;
    }

    connectNodes(get: Get, set: Set, sourceId: Id, targetId: Id, diagramPos: Coordinate): void {
        autoConnectActivations(get, set, sourceId, targetId, diagramPos);
    }
}

export const sequenceDiagramEditor = new SequenceDiagramEditor();

