import {Node} from "./Node";
import React from "react";
import {Layer} from 'react-konva';
import {Link} from "./Link";
import {classDiagramSelector} from "./classDiagramModel";
import {useRecoilValue} from "recoil";
import {DiagramId} from "../diagramEditor/diagramEditorModel";

export const ClassDiagramEditor = ({diagramId}: {diagramId: DiagramId}) => {
    const diagram = useRecoilValue(classDiagramSelector(diagramId))

    return (
        <Layer>
            {Object.keys(diagram.nodes).map((id, i) => {
                return (
                    <Node
                        key={i}
                        diagramId={diagramId}
                        nodeId={id}
                    />
                );
            })}
            {Object.keys(diagram.links).map((linkId, index) => {
                return (
                    <Link
                        key={index}
                        linkId={linkId}
                        diagramId={diagramId}
                    />
                )
            })}
        </Layer>
    )
};
