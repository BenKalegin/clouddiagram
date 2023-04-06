import {Action} from "@reduxjs/toolkit";
import {
    DiagramEditor,
    dropFromPaletteAction, elementCommandAction,
    elementMoveAction,
    elementPropertyChangedAction,
    elementResizeAction,
    Get,
    Set
} from "../diagramEditor/diagramEditorSlice";
import {
    autoConnectActivations,
    createLifelineAndConnectTo,
    findActivationAtPos, findLifelineAtPos, handleSequenceCommand,
    handleSequenceDropFromLibrary,
    handleSequenceElementPropertyChanged,
    handleSequenceMoveElement,
    handleSequenceResizeElement,
    SequenceDiagramState
} from "./sequenceDiagramModel";
import {Coordinate, Diagram} from "../../common/model";
import {activeDiagramIdAtom} from "../diagramTabs/DiagramTabs";
import {snapToBounds} from "../../common/Geometry/snap";
import {DiagramElement, ElementType, Id, ElementRef} from "../../package/packageModel";


class SequenceDiagramEditor implements DiagramEditor {
    handleAction(action: Action, get: Get, set: Set): void {
        if (dropFromPaletteAction.match(action)) {
            const {name, droppedAt, kind} = action.payload;
            handleSequenceDropFromLibrary(get, set, droppedAt, name, kind);
        }
        else if (elementMoveAction.match(action)) {
            const {currentPointerPos, phase, startNodePos, startPointerPos, element} = action.payload;
            handleSequenceMoveElement(get, set, phase, element, currentPointerPos, startPointerPos, startNodePos);
        }
        else if (elementResizeAction.match(action)) {
            const {phase, element, suggestedBounds} = action.payload;
            handleSequenceResizeElement(get, set, phase, element, suggestedBounds);
        }else if (elementPropertyChangedAction.match(action)) {
            const {elements, propertyName, value} = action.payload;
            handleSequenceElementPropertyChanged(get, set, elements, propertyName, value);
        }else if(elementCommandAction.match(action)) {
            const {elements, command} = action.payload;
            handleSequenceCommand(get, set, elements, command)
        }
    }

    snapToElements(get: Get, diagramPos: Coordinate): [Coordinate, DiagramElement] | undefined {
        const diagramId = get(activeDiagramIdAtom);
        const [targetActivationId, targetBounds] = findActivationAtPos(get, diagramPos, diagramId, 3);
        if (targetActivationId && targetBounds) {
            return [snapToBounds(diagramPos, targetBounds), {id: targetActivationId, type: ElementType.SequenceActivation}]
        }
        const [targetLifelineId, targetLifelineBounds] = findLifelineAtPos(get, diagramPos, diagramId, 3);
        if(targetLifelineId && targetLifelineBounds){
            return [snapToBounds(diagramPos, targetLifelineBounds), {id: targetLifelineId, type: ElementType.SequenceLifeLine}]
        }
        return undefined;
    }

    connectNodes(get: Get, set: Set, sourceId: Id, targetId: ElementRef, diagramPos: Coordinate): void {
        autoConnectActivations(get, set, sourceId, targetId, diagramPos);
    }
    createAndConnectTo(get: Get, set: Set, name: string): void {
        createLifelineAndConnectTo(get, set, name);
    }

    getElement(get: Get, ref: ElementRef, diagram: Diagram): DiagramElement {
        switch (ref.type) {
            case ElementType.SequenceLifeLine: return (diagram as SequenceDiagramState).lifelines[ref.id]
            case ElementType.SequenceActivation: return (diagram as SequenceDiagramState).activations[ref.id]
            case ElementType.SequenceMessage: return (diagram as SequenceDiagramState).messages[ref.id]
            default:
                throw new Error(`Unknown element type: ${ref.type}`)
        }
    }
}

export const sequenceDiagramEditor = new SequenceDiagramEditor();

