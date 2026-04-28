import {atom} from "jotai";
import {atomFamily} from "jotai/utils";
import {DiagramId, elementsAtom} from "../diagramEditor/diagramEditorModel";
import {StructureDiagramState} from "../structureDiagram/structureDiagramState";


export interface DeploymentDiagramState extends StructureDiagramState{
}

export const deploymentDiagramSelector = atomFamily((id: DiagramId) =>
    atom(
        (get) => get(elementsAtom(id)) as DeploymentDiagramState,
        (_get, set, newValue: DeploymentDiagramState) => {
            set(elementsAtom(id), newValue);
        }
    )
);
