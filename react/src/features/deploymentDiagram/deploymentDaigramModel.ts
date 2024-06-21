import {selectorFamily} from "recoil";
import {DiagramId, elementsAtom} from "../diagramEditor/diagramEditorModel";
import {StructureDiagramState} from "../structureDiagram/structureDiagramState";


export interface DeploymentDiagramState extends StructureDiagramState{
}

export const deploymentDiagramSelector = selectorFamily<DeploymentDiagramState, DiagramId>({
    key: 'deploymentDiagram',
    get: (id) => ({get}) => {
        return get(elementsAtom(id)) as DeploymentDiagramState;
    },
    set: (id) => ({set}, newValue) => {
        set(elementsAtom(id), newValue);
    }
})
