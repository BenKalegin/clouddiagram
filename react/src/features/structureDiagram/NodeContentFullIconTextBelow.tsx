import React, {FC} from "react";
import {Image, Text} from "react-konva";
import {NodeContentProps} from "./NodeContentProps";

export const NodeContentFullIconTextBelow: FC<NodeContentProps> = ({
      node,
      placement,
      eventHandlers,
      image
  }) => {

    const iconWidth = placement.bounds.width;
    const iconPadding = 0;
    const iconHeight = placement.bounds.height;
    return (
        <>
            {node.customShape?.pictureId && (
                <Image
                    {...eventHandlers}
                    image={image}
                    x={placement.bounds.x + iconPadding}
                    y={placement.bounds.y}
                    width={iconWidth }
                    height={iconHeight}
                />
            )}

            <Text
                {...placement.bounds}
                fontSize={14}
                align={"center"}
                verticalAlign={"center"}
                text={node.text}
                draggable={false}
                listening={false}
                preventDefault={true}
                x={placement.bounds.x}
                y={placement.bounds.y + iconHeight}
                width={placement.bounds.width}
                //height={textHeight}
            />
        </>
    );
};
