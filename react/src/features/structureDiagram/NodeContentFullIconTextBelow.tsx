import React, {FC, useContext} from "react";
import {Image, Text} from "react-konva";
import {NodeContentProps} from "./NodeContentProps";
import {AppLayoutContext} from "../../app/AppModel";
import {adjustColorSchemaForTheme} from "../../common/colors/colorTransform";

export const NodeContentFullIconTextBelow: FC<NodeContentProps> = ({
      node,
      placement,
      image
  }) => {

    const { appLayout } = useContext(AppLayoutContext);
    const colorSchema = adjustColorSchemaForTheme(node.colorSchema, appLayout.darkMode);

    const iconWidth = placement.bounds.width;
    const iconPadding = 0;
    const iconHeight = placement.bounds.height;
    return (
        <>
            {node.customShape?.pictureId && (
                <Image
                    image={image}
                    x={placement.bounds.x + iconPadding}
                    y={placement.bounds.y}
                    width={iconWidth }
                    height={iconHeight}
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
                y={placement.bounds.y + iconHeight}
                width={placement.bounds.width}
                //height={textHeight}
            />
        </>
    );
};
