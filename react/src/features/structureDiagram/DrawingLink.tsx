import {Path} from "react-konva";
import React from "react";
import {useRecoilValue} from "recoil";
import {drawingLinkRenderSelector} from "./structureDiagramHandler";

export const DrawingLink = () => {


    const placement = useRecoilValue(drawingLinkRenderSelector);
    return (
        <>
            {placement.svgPath.map((pathData, index) =>
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

};
