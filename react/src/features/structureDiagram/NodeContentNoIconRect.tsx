import React, {FC} from "react";
import {Rect, Text} from "react-konva";
import {NodeContentProps} from "./NodeContentProps";

export const NodeContentNoIconRect: FC<NodeContentProps> = ({
      node,
      placement,
      eventHandlers,
      shadowEnabled
  }) => {

    return (
        <>
            <Rect
                {...eventHandlers}
                fill={node.colorSchema.fillColor}
                stroke={node.colorSchema.strokeColor}
                {...placement.bounds}
                cornerRadius={4}
                cursor={"crosshair"}
                draggable={true}
                shadowEnabled={shadowEnabled}
                shadowColor={'black'}
                shadowBlur={3}
                shadowOffset={{x: 2, y: 2}}
                shadowOpacity={0.4}
            />

            <Text
                {...placement.bounds}
                fontSize={14}
                align={"center"}
                verticalAlign={"middle"}
                text={node.text}
                draggable={false}
                listening={false}
                preventDefault={true}
            />
        </>
    );
};
