import {Node} from "./Node";
import React from "react";
import {Link} from "./Link";
import {useRecoilValue} from "recoil";
import {DiagramId} from "../diagramEditor/diagramEditorModel";
import {EmptyDiagramHint} from "../diagramEditor/EmptyDiagramHint";
import {Note} from "../commonComponents/Note";
import {structureDiagramSelector} from "./structureDiagramModel";
import {VirtualizedLayer, VirtualizedItem} from "../../common/components/VirtualizedLayer";

export const StructureDiagramEditor = ({diagramId}: {diagramId: DiagramId}) => {
    const diagram = useRecoilValue(structureDiagramSelector(diagramId))

    const nodeIds = Object.keys(diagram.nodes);
    const notes = Object.values(diagram.notes);
    const linkIds = Object.keys(diagram.links);

    return (
        <VirtualizedLayer>
            {nodeIds.map((id, i) => {
                const node = diagram.nodes[id];
                return (
                    <VirtualizedItem
                        key={i}
                        getBounds={() => node.bounds}
                    >
                        <Node
                            diagramId={diagramId}
                            nodeId={id}
                        />
                    </VirtualizedItem>
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
                <VirtualizedItem
                    key={i}
                    getBounds={() => note.bounds}
                >
                    <Note
                        noteId={note.id}
                        diagramId={diagramId}
                    />
                </VirtualizedItem>
            )}
            {(nodeIds.length === 0) && (linkIds.length === 0) && <EmptyDiagramHint/> }
        </VirtualizedLayer>
    )
};
