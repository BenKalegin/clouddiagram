import { selectorFamily } from "recoil";
import { DiagramId, elementsAtom } from "../diagramEditor/diagramEditorModel";
import { StructureDiagramState } from "../structureDiagram/structureDiagramState";

export interface FlowchartDiagramState extends StructureDiagramState {}

export const flowchartDiagramSelector = selectorFamily<FlowchartDiagramState, DiagramId>({
    key: "flowchartDiagram",
    get: (id) => ({ get }) => get(elementsAtom(id)) as FlowchartDiagramState,
    set: (id) => ({ set }, newValue) => {
        set(elementsAtom(id), newValue);
    }
});
