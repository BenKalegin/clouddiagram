import {DiagramElement, Id, ShapeStyle} from "../../package/packageModel";
import {selectorFamily} from "recoil";
import {Bounds, Diagram} from "../../common/model";
import {DiagramId, elementsAtom} from "../diagramEditor/diagramEditorModel";

export type NoteId = Id

export interface NoteState extends DiagramElement {
    text: string
    bounds: Bounds
    shapeStyle: ShapeStyle
}

export const noteSelector = selectorFamily<NoteState, {noteId: NoteId, diagramId: DiagramId}> ({
    key: 'noteSelector',
    get: ({noteId, diagramId}) => ({get}) => {
        const diagram = get(elementsAtom((diagramId))) as Diagram
        return diagram.notes[noteId]
    }
})
