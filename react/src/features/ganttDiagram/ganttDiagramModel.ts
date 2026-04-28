import {atom} from "jotai";
import {atomFamily} from "jotai/utils";
import {DiagramId, elementsAtom} from "../diagramEditor/diagramEditorModel";
import {StructureDiagramState} from "../structureDiagram/structureDiagramState";

export interface GanttDiagramMetadata {
    dateFormat: string;
    chartStart: string;
}

export interface GanttDiagramState extends StructureDiagramState {
    gantt?: GanttDiagramMetadata;
}

export const ganttDiagramSelector = atomFamily((id: DiagramId) =>
    atom(
        (get) => get(elementsAtom(id)) as GanttDiagramState,
        (_get, set, newValue: GanttDiagramState) => {
            set(elementsAtom(id), newValue);
        }
    )
);
