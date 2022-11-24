import {Bounds, DiagramElement, DiagramState, Id} from "../../common/Model";

interface LifelinePlacement {
    headBounds: Bounds;
    lifelineEnd: number;
}

export interface LifelineState extends DiagramElement{
    placement: LifelinePlacement;
    title: string;
}

export interface SequenceDiagramState extends DiagramState{
    lifelines:  { [id: Id]: LifelineState}
}

