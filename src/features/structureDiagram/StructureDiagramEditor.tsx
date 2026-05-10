import {Node} from "./Node";
import React from "react";
import {Link} from "./Link";
import {atom, useAtomValue} from "jotai";
import {atomFamily} from "jotai-family";
import {DiagramId, elementsAtom} from "../diagramEditor/diagramEditorModel";
import {EmptyDiagramHint} from "../diagramEditor/EmptyDiagramHint";
import {Note} from "../commonComponents/Note";
import {structureDiagramSelector} from "./structureDiagramModel";
import {VirtualizedLayer, VirtualizedItem} from "../../common/components/VirtualizedLayer";
import {NodeState} from "../../package/packageModel";
import {DiagramId as DiagramIdType} from "../diagramEditor/diagramEditorModel";

const sortedNodeIdsSelector = atomFamily((diagramId: DiagramIdType) =>
    atom((get) => {
        const diagram = get(structureDiagramSelector(diagramId));
        const ids = Object.keys(diagram.nodes);
        const parentOf = new Map<string, string>();
        for (const id of ids) {
            const el = get(elementsAtom(id)) as NodeState;
            if (el?.memberNodeIds) {
                for (const childId of el.memberNodeIds) {
                    parentOf.set(childId, id);
                }
            }
        }
        const depth = (id: string, visited = new Set<string>()): number => {
            if (visited.has(id)) return 0;
            visited.add(id);
            const p = parentOf.get(id);
            return p ? 1 + depth(p, visited) : 0;
        };
        return [...ids].sort((a, b) => depth(a) - depth(b));
    })
);

export const StructureDiagramEditor = ({diagramId}: {diagramId: DiagramId}) => {
    const diagram = useAtomValue(structureDiagramSelector(diagramId))
    const sortedNodeIds = useAtomValue(sortedNodeIdsSelector(diagramId))

    const notes = Object.values(diagram.notes);
    const linkIds = Object.keys(diagram.links);

    return (
        <VirtualizedLayer>
            {sortedNodeIds.map((id) => {
                const node = diagram.nodes[id];
                if (!node) return null;
                return (
                    <VirtualizedItem
                        key={id}
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
            {(sortedNodeIds.length === 0) && (linkIds.length === 0) && <EmptyDiagramHint/> }
        </VirtualizedLayer>
    )
};
