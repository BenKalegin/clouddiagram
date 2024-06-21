import {Node} from "../structureDiagram/Node";
import React from "react";
import {Layer} from 'react-konva';
import {Link} from "../structureDiagram/Link";
import {useRecoilValue} from "recoil";
import {DiagramId} from "../diagramEditor/diagramEditorModel";
import {EmptyDiagramHint} from "../diagramEditor/EmptyDiagramHint";
import {Note} from "../commonComponents/Note";
import {deploymentDiagramSelector} from "./deploymentDaigramModel";

export const ClassDiagramEditor = ({diagramId}: {diagramId: DiagramId}) => {
    const diagram = useRecoilValue(deploymentDiagramSelector(diagramId))

    const nodeIds = Object.keys(diagram.nodes);
    const notes = Object.values(diagram.notes);
    const linkIds = Object.keys(diagram.links);

    return (
        <Layer>
            {nodeIds.map((id, i) => {
                return (
                    <Node
                        key={i}
                        diagramId={diagramId}
                        nodeId={id}
                    />
                );
            })}
            {linkIds.map((linkId, index) => {
                return (
                    <Link
                        key={index}
                        linkId={linkId}
                        diagramId={diagramId}
                    />
                )
            })}
            {notes.map((note, i) =>
                <Note
                    key={i}
                    noteId={note.id}
                    diagramId={diagramId}
                />)}
            {(nodeIds.length === 0) && (linkIds.length === 0) && <EmptyDiagramHint/> }
        </Layer>
    )
};
