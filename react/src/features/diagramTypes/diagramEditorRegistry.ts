import {ComponentType} from "react";
import {ElementType} from "../../package/packageModel";
import {DiagramId} from "../diagramEditor/diagramEditorModel";
import {ClassDiagramEditor} from "../classDiagram/ClassDiagramEditor";
import {DeploymentDiagramEditor} from "../deploymentDiagram/DeploymentDiagramEditor";
import {FlowchartDiagramEditor} from "../flowchartDiagram/FlowchartDiagramEditor";
import {GanttDiagramEditor} from "../ganttDiagram/GanttDiagramEditor";
import {SequenceDiagramEditor} from "../sequenceDiagram/SequenceDiagramEditor";

export interface DiagramEditorProps {
    diagramId: DiagramId;
}

const diagramEditorRegistry: Partial<Record<ElementType, ComponentType<DiagramEditorProps>>> = {
    [ElementType.ClassDiagram]: ClassDiagramEditor,
    [ElementType.DeploymentDiagram]: DeploymentDiagramEditor,
    [ElementType.FlowchartDiagram]: FlowchartDiagramEditor,
    [ElementType.GanttDiagram]: GanttDiagramEditor,
    [ElementType.SequenceDiagram]: SequenceDiagramEditor,
};

export function getDiagramEditor(type: ElementType): ComponentType<DiagramEditorProps> {
    const Editor = diagramEditorRegistry[type];
    if (!Editor) {
        throw new Error(`Unknown diagram kind: ${type}`);
    }
    return Editor;
}
