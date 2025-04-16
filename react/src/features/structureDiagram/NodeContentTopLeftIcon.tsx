import React, {FC} from "react";
import {Image, Rect, Text} from "react-konva";
import {NodeContentProps} from "./NodeContentProps";

export const NodeContentTopLeftIcon: FC<NodeContentProps> = ({
      node,
      placement,
      shadowEnabled,
      image
  }) => {

    return (
        <>
            <Rect
                fill={node.colorSchema.fillColor}
                stroke={node.colorSchema.strokeColor}
                {...placement.bounds}
                cornerRadius={4}
                shadowEnabled={shadowEnabled}
                shadowColor={'black'}
                shadowBlur={3}
                shadowOffset={{x: 2, y: 2}}
                shadowOpacity={0.4}
                listening={false}  // No longer needs to listen for events
            />

            {node.customShape?.pictureId && (
                <Image
                    image={image}
                    x={placement.bounds.x + 4}
                    y={placement.bounds.y  + 4}
                    width={placement.bounds.height / 3}
                    height={placement.bounds.height / 3}
                    listening={false}  // No longer needs to listen for events
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
