import {Bounds, ConnectorPlacement, Coordinate, Diagram} from "../../common/model";
import {DiagramElement, ElementType, Id} from "../../package/packageModel";
import {DefaultValue, RecoilState, RecoilValue, selectorFamily} from "recoil";
import {elementsAtom, generateId} from "../diagramEditor/diagramEditorModel";
import {DiagramId} from "../classDiagram/model";
import {activeDiagramIdAtom} from "../diagramTabs/DiagramTabs";
import {ElementMovePhase} from "../diagramEditor/diagramEditorSlice";

export const lifelineHeadY = 30;
export const lifelineDefaultWidth = 100;
export const lifelineDefaultHeight = 60;
const activationWidth = 10;

export type LifelineId = Id;
export type ActivationId = Id;
export type MessageId = Id;


export interface ActivationState extends DiagramElement {
    start: number;
    length: number;
    placement: Bounds;
}

export interface LifelinePlacement{
    headBounds: Bounds;
    lifelineEnd: number;
}

export interface LifelineState extends DiagramElement {
    activations: ActivationState[]
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

export interface MessagePlacement extends ConnectorPlacement {
}

export interface MessageState extends DiagramElement {
    kind: MessageKind
    sourceActivation: Id
    targetActivation: Id
    sourceActivationOffset: number
    placement: MessagePlacement
}

export interface SequenceDiagramState extends Diagram {
    lifelines: {[id: LifelineId]: LifelineState}
    messages: {[id: MessageId]: MessageState}
    //activations: {[id: string]: ActivationPlacement }
}

export const moveLifeline = (placement: LifelinePlacement, newX: number) => {
    return {...placement, headBounds: {...placement.headBounds, x: newX}}
}

export const resizeLifeline = (placement: LifelinePlacement, newWidth: number) => {
    return {...placement, headBounds: {...placement.headBounds, width: Math.max(10, newWidth)}}
}

export const placeActivation = (activation: ActivationState, lifelinePlacement: LifelinePlacement): Bounds => {
    return {
        x: lifelinePlacement.headBounds.x + lifelinePlacement.headBounds.width / 2 - activationWidth / 2,
        y: lifelinePlacement.headBounds.y + lifelinePlacement.headBounds.height + 2 /* shadow*/ + activation.start,
        width: activationWidth,
        height: activation.length
    }
}

export const messagePlacement = (source: ActivationState, target: ActivationState, messageOffset: number): MessagePlacement => {
    return {
        x: source.placement.x + source.placement.width,
        y: source.placement.y + messageOffset,
        points: [0, 0, target.placement.x - source.placement.x - source.placement.width, 0],
    }
}

export function handleSequenceMoveElement(get: <T>(a: RecoilValue<T>) => T, set: <T>(s: RecoilState<T>, u: (((currVal: T) => T) | T)) => void, phase: ElementMovePhase, elementId: Id, currentPointerPos: Coordinate, startPointerPos: Coordinate, startNodePos: Coordinate) {
    const diagramId = get(activeDiagramIdAtom);
    const diagram = get(elementsAtom(diagramId)) as SequenceDiagramState;

    const newPlacement = moveLifeline(diagram.lifelines[elementId].placement, currentPointerPos.x - startPointerPos.x + startNodePos.x)
    const newDiagram = {...diagram, lifelines: {...diagram.lifelines, [elementId]: {...diagram.lifelines[elementId], placement: newPlacement}}}
    set(elementsAtom(diagramId), newDiagram)
}



export function handleSequenceDropFromLibrary(get: <T>(a: RecoilValue<T>) => T, set: <T>(s: RecoilState<T>, u: (((currVal: T) => T) | T)) => void, droppedAt: Coordinate, name: string) {

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

    return Object.values(activations).find(a =>
        a.placement.x - tolerance <= mousePos.x &&
        a.placement.x + a.placement.width + tolerance >= mousePos.x &&
        a.placement.y - tolerance <= mousePos.y &&
        a.placement.y + a.placement.height + tolerance >= mousePos.y
    )
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

export const activationPlacementSelector = selectorFamily<Bounds, {activationId: Id, lifelineId: Id, diagramId: DiagramId}>({
    key: 'activationPlacement',
    get: ({activationId, lifelineId, diagramId}) => ({get}) => {
        const lifeline = get(lifelineSelector({lifelineId, diagramId}));
        const lifelineBounds = get(lifelinePlacementSelector({lifelineId, diagramId}));
        const activation = lifeline.activations.find(a => a.id === activationId);
        return placeActivation(activation!, lifelineBounds)
    }
})

