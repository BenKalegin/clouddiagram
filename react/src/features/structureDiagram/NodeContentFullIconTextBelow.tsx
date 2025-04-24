import React, {FC, useContext} from "react";
import {Image, Text} from "react-konva";
import {NodeContentProps} from "./NodeContentProps";
import {AppLayoutContext} from "../../app/appModel";
import {adjustColorSchemaForTheme} from "../../common/colors/colorTransform";
import {Bounds} from "../../common/model";

export const NodeContentFullIconTextBelow: FC<NodeContentProps> = ({
      node,
      placement,
      image
  }) => {

    const { appLayout } = useContext(AppLayoutContext);
    const colorSchema = adjustColorSchemaForTheme(node.colorSchema, appLayout.darkMode);

    let imageBounds: Bounds = placement.bounds
    if (image) {
        if (image) {
            const aspectRatio = image.width / image.height;
            const maxWidth = placement.bounds.width;
            const maxHeight = placement.bounds.height// - 14; // Reserve space for text (fontSize: 14)

            if (maxWidth / aspectRatio <= maxHeight) {
                imageBounds = {
                    x: placement.bounds.x,
                    y: placement.bounds.y,
                    width: maxWidth,
                    height: maxWidth / aspectRatio
                };
            } else {
                imageBounds = {
                    x: placement.bounds.x + (placement.bounds.width - maxHeight * aspectRatio) / 2,
                    y: placement.bounds.y,
                    width: maxHeight * aspectRatio,
                    height: maxHeight
                };
            }
        }
    }
    return (
        <>
            {image  && (
                <Image
                    image={image}
                    {...imageBounds}
                    listening={false}  // No longer needs to listen for events
                />
            )}

            <Text
                {...placement.bounds}
                fontSize={14}
                fill={colorSchema.textColor}
                align={"center"}
                verticalAlign={"center"}
                text={node.text}
                draggable={false}
                listening={false}
                preventDefault={true}
                x={placement.bounds.x}
                y={placement.bounds.y + imageBounds.height}
                width={placement.bounds.width}
                //height={textHeight}
            />
        </>
    );
};
