import {Bounds, DiagramElement, DiagramState, Id} from "../../common/Model";
import {WritableDraft} from "immer/dist/internal";

interface LifelineActivation {
    start: number;
    length: number;
}

interface LifelinePlacement {
    headBounds: Bounds;
    lifelineEnd: number;
}

export interface LifelineState extends DiagramElement{
    activations: LifelineActivation[]
    placement: LifelinePlacement;
    title: string;
}

export interface SequenceDiagramState extends DiagramState{
    lifelines:  { [id: Id]: LifelineState}
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
