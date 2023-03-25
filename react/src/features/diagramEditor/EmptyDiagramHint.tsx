import {Text} from "react-konva";
import React from "react";

export const EmptyDiagramHint = () => {
    return (
        <Text
            y={50}
            x={50}
            fontSize={14}
            lineHeight={1.5}
            opacity={0.4}
            align={"left"}
            text={"Your diagram is empty. You can \n\n- drag component from the library, \n- load demo example diagram \n- click on the plus button \n- start free drawing and follow suggestions \n- import diagram from the external  storage"}
            draggable={false}
            listening={false}
            preventDefault={true}
        />
    )
};
