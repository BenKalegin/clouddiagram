import React, {FC} from "react";
import {Image, Rect, Text} from "react-konva";
import {NodeContentProps} from "./NodeContentProps";

export const NodeContentTopLeftIcon: FC<NodeContentProps> = ({
      node,
      placement,
      eventHandlers,
      shadowEnabled,
      image
  }) => {

    return (
        <>
            <Rect
                {...eventHandlers}
                fill={node.shapeStyle.fillColor}
                stroke={node.shapeStyle.strokeColor}
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

            {node.customShape?.pictureId && (
                <Image
                    {...eventHandlers}
                    image={image}
                    x={placement.bounds.x + 4}
                    y={placement.bounds.y  + 4}
                    width={placement.bounds.height / 3}
                    height={placement.bounds.height / 3}
                />
            )}

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
