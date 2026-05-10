import {Path} from "react-konva";
import React from "react";
import {useAtomValue} from "jotai";
import {drawingLinkRenderSelector} from "./structureDiagramHandler";

export const DrawingLink = () => {


    const placement = useAtomValue(drawingLinkRenderSelector);
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
