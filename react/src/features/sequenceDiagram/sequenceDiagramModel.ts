import {Bounds, Coordinate, Diagram} from "../../common/model";
import {DiagramElement, ElementType, Id} from "../../package/packageModel";
import {DefaultValue, selectorFamily} from "recoil";
import {ConnectorRender, DiagramId, elementsAtom, generateId} from "../diagramEditor/diagramEditorModel";
import {activeDiagramIdAtom} from "../diagramTabs/DiagramTabs";
import {ElementMoveResizePhase, Get, Set} from "../diagramEditor/diagramEditorSlice";

export const lifelineHeadY = 30;
export const lifelineDefaultWidth = 100;
export const lifelineDefaultHeight = 60;
const activationWidth = 10;

export type LifelineId = Id;
export type ActivationId = Id;
export type MessageId = Id;


export interface ActivationPlacement {
}

export interface ActivationState extends DiagramElement {
    start: number;
    length: number;
    lifelineId: LifelineId;
    placement: ActivationPlacement;
}

export interface ActivationRender {
    bounds: Bounds;
}

export interface LifelinePlacement{
    headBounds: Bounds;
    lifelineEnd: number;
}

export interface LifelineState extends DiagramElement {
    activations: ActivationId[]
    placement: LifelinePlacement;
    title: string;
}

export enum MessageKind {
    Call,
    /*
        Return,
        Self,
        Recursive,
        Create,
        Destroy
    */
}

export interface MessageRender extends ConnectorRender {
}

export interface MessagePlacement {
    //cornerStyle: CornerStyle;
}

export interface MessageState extends DiagramElement {
    kind: MessageKind
    activation1: Id
    activation2: Id
    sourceActivationOffset: number
    placement: MessagePlacement
}

export interface SequenceDiagramState extends Diagram {
    lifelines: {[id: LifelineId]: LifelineState}
    messages: {[id: MessageId]: MessageState}
    activations: {[id: ActivationId]: ActivationState}
}


export const renderActivation = (activation: ActivationState, lifelinePlacement: LifelinePlacement): ActivationRender => {
    return {
        bounds:
            {
                x: lifelinePlacement.headBounds.x + lifelinePlacement.headBounds.width / 2 - activationWidth / 2,
                y: lifelinePlacement.headBounds.y + lifelinePlacement.headBounds.height + 2 /* shadow*/ + activation.start,
                width: activationWidth,
                height: activation.length
            }
    }
}

export const renderMessage = (activation1: ActivationRender, activation2: ActivationRender, messageOffset: number): MessageRender => {
    return {
        x: activation1.bounds.x + activation1.bounds.width,
        y: activation1.bounds.y + messageOffset,
        points: [0, 0, activation2.bounds.x - activation1.bounds.x - activation1.bounds.width, 0],
    }
}


export function handleSequenceMoveElement(get: Get, set: Set, phase: ElementMoveResizePhase, elementId: Id, currentPointerPos: Coordinate, startPointerPos: Coordinate, startNodePos: Coordinate) {
    const diagramId = get(activeDiagramIdAtom);
    const diagram = get(elementsAtom(diagramId)) as SequenceDiagramState;

    const newPlacement = {...(diagram.lifelines[elementId].placement),
        headBounds: {
            ...diagram.lifelines[elementId].placement.headBounds,
            x: currentPointerPos.x - startPointerPos.x + startNodePos.x,
            y: startNodePos.y

        }
    }
    const newDiagram = {...diagram, lifelines: {...diagram.lifelines, [elementId]: {...diagram.lifelines[elementId], placement: newPlacement}}}
    set(elementsAtom(diagramId), newDiagram)
}

export function handleSequenceResizeElement(get: Get, set: Set, phase: ElementMoveResizePhase, elementId: Id, suggestedBounds: Bounds) {
    const diagramId = get(activeDiagramIdAtom);
    const diagram = get(elementsAtom(diagramId)) as SequenceDiagramState;
    const placement = diagram.lifelines[elementId].placement
    const width = Math.max(10, suggestedBounds.width);
    const headBounds = {...placement.headBounds, width: width, x: suggestedBounds.x};
    const newPlacement = {...placement, headBounds: headBounds}
    const newDiagram = {...diagram, lifelines: {...diagram.lifelines, [elementId]: {...diagram.lifelines[elementId], placement: newPlacement}}}
    set(elementsAtom(diagramId), newDiagram)
}



export function handleSequenceDropFromLibrary(get: Get, set: Set, droppedAt: Coordinate, name: string) {

    const diagramId = get(activeDiagramIdAtom);
    const newLifeline: LifelineState = {
        type: ElementType.SequenceLifeLine,
        id: generateId(),
        title: name,
        placement: {
            headBounds: {
                x: droppedAt.x - lifelineDefaultWidth / 2,
                y: lifelineHeadY,
                width: lifelineDefaultWidth,
                height: lifelineDefaultHeight
            },
            lifelineEnd: 100
        },
        activations: []
    };

    set(elementsAtom(newLifeline.id), newLifeline)

    const diagram = get(elementsAtom(diagramId)) as SequenceDiagramState;
    const updatedDiagram = {...diagram , lifelines: {...diagram.lifelines, [newLifeline.id]: newLifeline}}
    set(elementsAtom(diagramId), updatedDiagram)
}

export function lifelinePoints(headBounds: Bounds, lifelineEnd: number): number[] {
    return [
        headBounds.width/2,
        headBounds.height + 2 /* shadow*/,
        headBounds.width/2,
        headBounds.y + lifelineEnd
    ];

}

export function findTargetActivation(activations:  {[id: string]: ActivationState}, mousePos: Coordinate) : ActivationState | undefined {
    const tolerance = 3

    return undefined;
    // return Object.values(activations).find(a =>
    //     a.placement.x - tolerance <= mousePos.x &&
    //     a.placement.x + a.placement.width + tolerance >= mousePos.x &&
    //     a.placement.y - tolerance <= mousePos.y &&
    //     a.placement.y + a.placement.height + tolerance >= mousePos.y
    // )
}

// export function autoConnectActivations(diagram: WritableDraft<SequenceDiagramState>, sourceId: Id, targetId: Id, sourceOffset: number) {
//     const messageId = "message_" + sourceId + "_" + targetId
//     diagram.messages[messageId] = {
//         id: messageId,
//         kind: MessageKind.Call,
//         sourceActivation: sourceId,
//         targetActivation: targetId,
//         sourceActivationOffset: sourceOffset
//     } as MessageState
// }

export const sequenceDiagramSelector = selectorFamily<SequenceDiagramState, DiagramId>({
    key: 'sequenceDiagram',
    get: (id) => ({get}) => {
        return get(elementsAtom(id)) as SequenceDiagramState;
    },

    set: (id) => ({get, set}, newValue) => {
        set(elementsAtom(id), newValue)
    }
})

export const lifelineSelector = selectorFamily<LifelineState, {lifelineId: Id, diagramId: DiagramId}>({
    key: 'lifeline',
    get: ({lifelineId, diagramId}) => ({get}) => {
        const diagram = get(sequenceDiagramSelector(diagramId));
        return diagram.lifelines[lifelineId];
    }
})

export const lifelinePlacementSelector = selectorFamily<LifelinePlacement, {lifelineId: Id, diagramId: DiagramId}>({
    key: 'lifelinePlacement',
    get: ({lifelineId, diagramId}) => ({get}) => {
        const lifeline = get(lifelineSelector({lifelineId, diagramId}));
        return lifeline.placement;
    },
    set: ({lifelineId, diagramId}) => ({get, set}, newValue) => {
        const diagram = get(sequenceDiagramSelector(diagramId))
        if (!(newValue instanceof DefaultValue)) {
            set(sequenceDiagramSelector(diagramId), { ...diagram, lifelines: {...diagram.lifelines, [lifelineId] : {...diagram.lifelines[lifelineId], placement: newValue}}});
        }
    }
})

export const activationSelector = selectorFamily<ActivationState, {activationId: Id, diagramId: DiagramId}>({
    key: 'activationPlacement',
    get: ({activationId, diagramId}) => ({get}) => {
        const diagram = get(elementsAtom(diagramId)) as SequenceDiagramState;
        return diagram.activations[activationId];
    }
})

export const activationRenderSelector = selectorFamily<ActivationRender, {activationId: Id, diagramId: DiagramId}>({
    key: 'activationPlacement',
    get: ({activationId, diagramId}) => ({get}) => {
        const activation = get(activationSelector({activationId, diagramId}));
        const lifelineBounds = get(lifelinePlacementSelector({lifelineId: activation.lifelineId, diagramId}));
        return renderActivation(activation!, lifelineBounds)
    }
})

export const messageSelector = selectorFamily<MessageState, {messageId: MessageId, diagramId: DiagramId}>({
    key: 'message',
    get: ({messageId, diagramId}) => ({get}) => {
        const diagram = get(elementsAtom(diagramId)) as SequenceDiagramState;
        return diagram.messages[messageId];
    }
})

export const messageRenderSelector = selectorFamily<MessageRender, {messageId: MessageId, diagramId: DiagramId}>({
    key: 'linkPlacement',
    get: ({messageId, diagramId}) => ({get}) => {
        const message = get(messageSelector({messageId, diagramId}));
        const activation1 = get(activationRenderSelector({activationId: message.activation1, diagramId: diagramId}));
        const activation2 = get(activationRenderSelector({activationId: message.activation2, diagramId: diagramId}));
        return renderMessage(activation1, activation2, message.sourceActivationOffset);
    }
})
