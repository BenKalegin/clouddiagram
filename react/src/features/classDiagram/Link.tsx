import React from "react";
import {Path} from "react-konva";
import {DiagramId, LinkId, linkRenderSelector, NodeId} from "./model";
import {useRecoilValue} from "recoil";

export const Link = ({linkId, nodeId, diagramId}: {linkId: LinkId, nodeId: NodeId, diagramId: DiagramId}) => {
    const render = useRecoilValue(linkRenderSelector({linkId, nodeId, diagramId}))
    return (
        <>
            {render.svgPath.map((pathData, index) =>
                <Path
                    key={index}
                    data={pathData}
                    fill={undefined}
                    strokeWidth={1.4}
                    stroke={"brown"}
                />
            )}
        </>
    );
}
