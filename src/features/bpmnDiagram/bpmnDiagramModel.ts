import {atom} from "jotai";
import {atomFamily} from "jotai-family";
import {DiagramId, elementsAtom} from "../diagramEditor/diagramEditorModel";
import {StructureDiagramState} from "../structureDiagram/structureDiagramState";

/**
 * BPMN diagrams reuse StructureDiagramState as their underlying placement
 * model. BPMN-specific visuals are driven by per-node and per-link
 * discriminators (NodeState.bpmnNode, LinkState.bpmnFlow) added to
 * doodles-core. Containers (pools/lanes) are Cluster nodes with their bpmnNode
 * field marking them as BPMN-flavoured and supplying orientation.
 */
export interface BpmnDiagramState extends StructureDiagramState {}

export const bpmnDiagramSelector = atomFamily((id: DiagramId) =>
    atom(
        (get) => get(elementsAtom(id)) as BpmnDiagramState,
        (_get, set, newValue: BpmnDiagramState) => {
            set(elementsAtom(id), newValue);
        }
    )
);
