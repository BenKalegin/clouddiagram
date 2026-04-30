import {DiagramId} from "../diagramEditor/diagramEditorModel";
import {StructureDiagramEditor} from "../structureDiagram/StructureDiagramEditor";

export const ErDiagramEditor = ({diagramId}: {diagramId: DiagramId}) => {
    return <StructureDiagramEditor diagramId={diagramId}/>;
};
