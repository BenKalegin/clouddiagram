import {Text} from "react-konva";
import React from "react";

export const EmptyDiagramHint = () => {
    return (
        <Text
            y={50}
            x={50}
            fontSize={14}
            opacity={0.4}
            align={"center"}
            text={"Your diagram is empty. Drag component from the palette or click on the plus button to add a new class"}
            draggable={false}
            listening={false}
            preventDefault={true}
        />
    )
};
