import {atom} from "jotai";
import {atomFamily} from "jotai/utils";
import {DiagramId, elementsAtom} from "../diagramEditor/diagramEditorModel";
import {StructureDiagramState} from "../structureDiagram/structureDiagramState";

export interface FlowchartDiagramState extends StructureDiagramState {}

export const flowchartDiagramSelector = atomFamily((id: DiagramId) =>
    atom(
        (get) => get(elementsAtom(id)) as FlowchartDiagramState,
        (_get, set, newValue: FlowchartDiagramState) => {
            set(elementsAtom(id), newValue);
        }
    )
);
