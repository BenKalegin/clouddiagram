import {Bounds, DiagramElement, DiagramState, Id} from "../../common/Model";
import {WritableDraft} from "immer/dist/internal";

interface LifelinePlacement {
    headBounds: Bounds;
    outlineBounds: Bounds;
    lifelineEnd: number;
}

export interface LifelineState extends DiagramElement{
    placement: LifelinePlacement;
    title: string;
}

export interface SequenceDiagramState extends DiagramState{
    lifelines:  { [id: Id]: LifelineState}
}

export const lifelinePlacementAfterResize = (placement: LifelinePlacement, deltaBounds: Bounds) => {
    const headBounds = {
        x: placement.headBounds.x + deltaBounds.x,
        y: placement.headBounds.y,
        // set minimal value
        width: Math.max(10, placement.headBounds.width + deltaBounds.width),
        height: placement.headBounds.height
    }

    const outlineBounds = {
        ...headBounds, height: placement.lifelineEnd
    }

    return {headBounds, outlineBounds}
}


export function resizeLifeline(diagram: WritableDraft<SequenceDiagramState>, deltaBounds: Bounds, elementId: Id) {
    const lifeline = diagram.lifelines[elementId]
    const placement = lifelinePlacementAfterResize(lifeline.placement, deltaBounds)
    lifeline.placement.headBounds = placement.headBounds
    lifeline.placement.outlineBounds = placement.outlineBounds

}
