import React from "react";
import {DiagramId} from "../diagramEditor/diagramEditorModel";
import {StructureDiagramEditor} from "../structureDiagram/StructureDiagramEditor";

export const DeploymentDiagramEditor = ({diagramId}: {diagramId: DiagramId}) => {
    return <StructureDiagramEditor diagramId={diagramId}/>
};
