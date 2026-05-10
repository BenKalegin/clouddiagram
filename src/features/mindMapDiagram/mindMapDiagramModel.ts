import {atom} from "jotai";
import {atomFamily} from "jotai-family";
import {DiagramId, elementsAtom} from "../diagramEditor/diagramEditorModel";
import {StructureDiagramState} from "../structureDiagram/structureDiagramState";

export interface MindMapDiagramState extends StructureDiagramState {}

export const mindMapDiagramSelector = atomFamily((id: DiagramId) =>
    atom(
        (get) => get(elementsAtom(id)) as MindMapDiagramState,
        (_get, set, newValue: MindMapDiagramState) => {
            set(elementsAtom(id), newValue);
        }
    )
);
