import {Bounds, DiagramElement, DiagramState, Id} from "../../common/Model";
import {WritableDraft} from "immer/dist/internal";

export interface ActivationState extends DiagramElement{
    start: number;
    length: number;
}

interface LifelinePlacement {
    headBounds: Bounds;
    lifelineEnd: number;
}

export interface LifelineState extends DiagramElement{
    activations: ActivationState[]
    placement: LifelinePlacement;
    title: string;
}

export enum MessageKind {
    Call,
    Return,
    Self,
    Recursive,
    Create,
    Destroy
}

export interface MessagePlacement {
    x: number;
    y: number;
    points: number[];
}

export interface MessageState extends DiagramElement {
    kind: MessageKind
    sourceActivation: Id
    targetActivation: Id
    sourceActivationOffset: number
    placement: MessagePlacement
}

export interface SequenceDiagramState extends DiagramState{
    lifelines:  { [id: Id]: LifelineState}
    messages:  { [id: Id]: MessageState}
    activations: { [id: Id]: ActivationState}
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


export function resizeLifeline(diagram: WritableDraft<SequenceDiagramState>, deltaBounds: Bounds, elementId: Id) {
    const lifeline = diagram.lifelines[elementId]
    lifeline.placement.headBounds = lifelinePlacementAfterResize(lifeline.placement, deltaBounds)
}

export const messagePlacement = (message: MessageState, source: ActivationState, target: ActivationState): MessagePlacement => {
    return {
        x: source.
    }
}