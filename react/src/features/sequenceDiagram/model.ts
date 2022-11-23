import {DiagramElement, DiagramState, Id} from "../../common/Model";

export interface Lifeline extends DiagramElement{
    title: string;
}

export interface SequenceDiagramState extends DiagramState{
    lifelines:  { [id: Id]: Lifeline}
}

