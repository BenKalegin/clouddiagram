import React from "react";
import {Path} from "react-konva";
import {DiagramId, LinkId, linkRenderSelector} from "./model";
import {useRecoilValue} from "recoil";

export const Link = ({linkId, diagramId}: {linkId: LinkId, diagramId: DiagramId}) => {

    const render = useRecoilValue(linkRenderSelector({linkId, diagramId}))
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
