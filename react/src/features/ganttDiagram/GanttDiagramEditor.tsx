import { DiagramId } from "../diagramEditor/diagramEditorModel";
import { StructureDiagramEditor } from "../structureDiagram/StructureDiagramEditor";

export const GanttDiagramEditor = ({ diagramId }: { diagramId: DiagramId }) => {
    return <StructureDiagramEditor diagramId={diagramId} />;
};
