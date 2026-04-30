import {ElementType} from "../../package/packageModel";

export const structureLikeDiagramTypes = [
    ElementType.ClassDiagram,
    ElementType.DeploymentDiagram,
    ElementType.ErDiagram,
    ElementType.FlowchartDiagram,
    ElementType.GanttDiagram
] as const;

export function isStructureLikeDiagramType(type: ElementType): boolean {
    return structureLikeDiagramTypes.includes(type as typeof structureLikeDiagramTypes[number]);
}
