import React, {FC, useContext} from "react";
import {Rect, Text} from "react-konva";
import {NodeContentProps} from "./NodeContentProps";
import {AppLayoutContext} from "../../app/AppModel";
import {
    adjustColorSchemaForTheme,
} from "../../common/colors/colorTransform";

export const NodeContentNoIconRect: FC<NodeContentProps> = ({
      node,
      placement,
      shadowEnabled
  }) => {

    const { appLayout } = useContext(AppLayoutContext);
    const colorSchema = adjustColorSchemaForTheme(node.colorSchema, appLayout.darkMode);

    return (
        <>
            <Rect
                fill={colorSchema.fillColor}
                stroke={colorSchema.strokeColor}
                {...placement.bounds}
                cornerRadius={4}
                shadowEnabled={shadowEnabled}
                shadowColor={'black'}
                shadowBlur={3}
                shadowOffset={{x: 2, y: 2}}
                shadowOpacity={0.4}
                listening={false}  // No longer needs to listen for events
            />

            <Text
                {...placement.bounds}
                fill={colorSchema.textColor}
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
