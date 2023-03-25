import {Node} from "./Node";
import React from "react";
import {Layer} from 'react-konva';
import {Link} from "./Link";
import {classDiagramSelector} from "./classDiagramModel";
import {useRecoilValue} from "recoil";
import {DiagramId} from "../diagramEditor/diagramEditorModel";
import {EmptyDiagramHint} from "../diagramEditor/EmptyDiagramHint";

export const ClassDiagramEditor = ({diagramId}: {diagramId: DiagramId}) => {
    const diagram = useRecoilValue(classDiagramSelector(diagramId))

    const nodeIds = Object.keys(diagram.nodes);
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
            {(nodeIds.length === 0) && (linkIds.length === 0) && <EmptyDiagramHint/> }
        </Layer>
    )
};
