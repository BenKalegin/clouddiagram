import React from "react";
import {Path} from "react-konva";
import {LinkId} from "../classDiagram/classDiagramModel";
import {useRecoilValue} from "recoil";
import {DiagramId} from "../diagramEditor/diagramEditorModel";
import {linkRenderSelector} from "./structureDiagramEditor";

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
