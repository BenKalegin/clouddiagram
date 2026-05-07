import {DiagramId} from "../diagramEditor/diagramEditorModel";
import {StructureDiagramEditor} from "../structureDiagram/StructureDiagramEditor";

export const MindMapDiagramEditor = ({diagramId}: {diagramId: DiagramId}) => {
    return <StructureDiagramEditor diagramId={diagramId}/>;
};
