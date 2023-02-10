import React from "react";
import {Path} from "react-konva";
import {LinkId, linkRenderSelector} from "./model";
import {useRecoilValue} from "recoil";
import {DiagramId} from "../diagramEditor/diagramEditorModel";

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
