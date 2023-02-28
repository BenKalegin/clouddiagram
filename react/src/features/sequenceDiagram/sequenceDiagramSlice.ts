import {Action} from "@reduxjs/toolkit";
import {
    DiagramEditor,
    dropFromPaletteAction,
    elementMoveAction,
    elementResizeAction, Get, Set
} from "../diagramEditor/diagramEditorSlice";
import {
    activationRenderSelector,
    findTargetActivation,
    handleSequenceDropFromLibrary,
    handleSequenceMoveElement,
    handleSequenceResizeElement, sequenceDiagramSelector, SequenceDiagramState
} from "./sequenceDiagramModel";
import {Coordinate} from "../../common/model";
import {elementsAtom, linkingAtom} from "../diagramEditor/diagramEditorModel";
import {activeDiagramIdAtom} from "../diagramTabs/DiagramTabs";
import {snapToBounds} from "../../common/Geometry/snap";


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
        const [targetActivationId, targetBounds] = findTargetActivation(get, diagram.activations, diagramPos, diagramId);
        linking.targetElement = targetActivationId;
        if (targetActivationId && targetBounds) {
            return snapToBounds(diagramPos, targetBounds);
        }
        return undefined;
    }
}

export const sequenceDiagramEditor = new SequenceDiagramEditor();

//         connectExisting: (editor) => {
//             const linking = current(editor).linking!
//             autoConnectActivations(editor.diagram, linking.sourceElement, linking.targetElement!, 10);
//         },
//
//
//     },
// })

