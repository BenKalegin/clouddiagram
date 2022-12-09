import {Bounds, ConnectorPlacement, Coordinate, DiagramElement, DiagramState, Id} from "../../common/Model";
import {WritableDraft} from "immer/dist/internal";

export const lifelineHeadY = 30;
export const lifelineDefaultWidth = 100;
export const lifelineDefaultHeight = 60;
const activationWidth = 10;

export interface ActivationState extends DiagramElement {
    start: number;
    length: number;
    placement: Bounds;
}

interface LifelinePlacement{
    headBounds: Bounds;
    lifelineEnd: number;
}

export interface LifelineState extends DiagramElement {
    activations: Id[]
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

export interface SequenceDiagramState extends DiagramState {
    lifelines: { [id: Id]: LifelineState }
    messages: { [id: Id]: MessageState }
    activations: { [id: Id]: ActivationState }
}

export const lifelinePlacementAfterResize = (placement: LifelinePlacement, deltaBounds: Bounds) => {
    return {
        x: placement.headBounds.x + deltaBounds.x,
        y: placement.headBounds.y,
        // set minimal value
        width: Math.max(10, placement.headBounds.width + deltaBounds.width),
        height: placement.headBounds.height
    }
}


export const activationPlacement = (activation: ActivationState, lifelinePlacement: LifelinePlacement): Bounds => {
    return {
        x: lifelinePlacement.headBounds.x + lifelinePlacement.headBounds.width / 2 - activationWidth / 2,
        y: lifelinePlacement.headBounds.y + lifelinePlacement.headBounds.height + 2 /* shadow*/ + activation.start,
        width: activationWidth,
        height: activation.length
    }
}

export const messagePlacement = (message: MessageState, source: ActivationState, target: ActivationState): MessagePlacement => {
    return {
        x: source.placement.x + source.placement.width,
        y: source.placement.y,
        points: [0, 0, target.placement.x - source.placement.x - source.placement.width, 0],
    }
}


export function resizeLifeline(diagram: WritableDraft<SequenceDiagramState>, deltaBounds: Bounds, elementId: Id) {
    const lifeline = diagram.lifelines[elementId]
    lifeline.placement.headBounds = lifelinePlacementAfterResize(lifeline.placement, deltaBounds)
    lifeline.activations.forEach(activationId => {
        const activation = diagram.activations[activationId]
        activation.placement = activationPlacement(activation, lifeline.placement)
    })
    const messages = Object.values(diagram.messages).filter(
        message => lifeline.activations.includes(message.sourceActivation) || lifeline.activations.includes(message.targetActivation))
    messages.forEach(message => {
        message.placement = messagePlacement(message, diagram.activations[message.sourceActivation], diagram.activations[message.targetActivation])
    })
}


export function handleSequenceDropFromLibrary(diagram: WritableDraft<SequenceDiagramState>, id: string, droppedAt: Coordinate, name: string) {

    diagram.lifelines[id] = {
        id,
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
    }
}

export function lifelinePoints(headBounds: Bounds, lifelineEnd: number): number[] {
    return [
        headBounds.width/2,
        headBounds.height + 2 /* shadow*/,
        headBounds.width/2,
        headBounds.y + lifelineEnd
    ];

}
