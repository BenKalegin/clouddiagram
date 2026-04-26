import { StructureDiagramState } from "./structureDiagram/structureDiagramState";
import { SequenceDiagramState } from "./sequenceDiagram/sequenceDiagramModel";
import { DiagramElement, Id } from "../package/packageModel";
import { DeploymentDiagramState } from "./deploymentDiagram/deploymentDaigramModel";
export declare const elements: {
    [id: Id]: DiagramElement;
};
export declare const getClassDemoDiagram: (id: string, title: string) => StructureDiagramState;
export declare const getDeploymentDemoDiagram: (id: string, title: string) => DeploymentDiagramState;
export declare const getSequenceDemoDiagram: () => SequenceDiagramState;
//# sourceMappingURL=demo.d.ts.map