import {DiagramElement, Id, HasColorSchema} from "../../package/packageModel";
import {atom} from "jotai";
import {atomFamily} from "jotai-family";
import {Bounds, Diagram} from "../../common/model";
import {DiagramId, elementsAtom} from "../diagramEditor/diagramEditorModel";

export type NoteId = Id

export interface NoteState extends DiagramElement, HasColorSchema {
    text: string
    bounds: Bounds
}

interface NoteSelectorParam {
    noteId: NoteId;
    diagramId: DiagramId;
}

export const noteSelector = atomFamily(
    (param: NoteSelectorParam) =>
        atom((get) => {
            const diagram = get(elementsAtom(param.diagramId)) as Diagram;
            return diagram.notes[param.noteId];
        }),
    (a, b) => a.noteId === b.noteId && a.diagramId === b.diagramId
);
