import {Node} from "./Node";
import React from "react";
import {Layer} from 'react-konva';
import {Link} from "./Link";
import {useRecoilValue} from "recoil";
import {DiagramId} from "../diagramEditor/diagramEditorModel";
import {EmptyDiagramHint} from "../diagramEditor/EmptyDiagramHint";
import {Note} from "../commonComponents/Note";
import {structureDiagramSelector} from "./structureDiagramModel";

export const StructureDiagramEditor = ({diagramId}: {diagramId: DiagramId}) => {
    const diagram = useRecoilValue(structureDiagramSelector(diagramId))

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
