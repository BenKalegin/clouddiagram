import {ElementType} from "../../package/packageModel";

export const structureLikeDiagramTypes = [
    ElementType.ClassDiagram,
    ElementType.DeploymentDiagram,
    ElementType.ErDiagram,
    ElementType.FlowchartDiagram,
    ElementType.GanttDiagram,
    ElementType.MindMapDiagram,
] as const;

export function isStructureLikeDiagramType(type: ElementType): boolean {
    return structureLikeDiagramTypes.includes(type as typeof structureLikeDiagramTypes[number]);
}
