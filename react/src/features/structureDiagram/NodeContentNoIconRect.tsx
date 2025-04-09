import React, {FC, useContext} from "react";
import {Rect, Text} from "react-konva";
import {NodeContentProps} from "./NodeContentProps";
import {AppLayoutContext} from "../../app/AppModel";
import {convertColorForDarkTheme} from "../../common/colors/darktheme";

export const NodeContentNoIconRect: FC<NodeContentProps> = ({
      node,
      placement,
      eventHandlers,
      shadowEnabled
  }) => {

    const { appLayout } = useContext(AppLayoutContext);

    return (
        <>
            <Rect
                {...eventHandlers}
                fill={appLayout.darkMode ? convertColorForDarkTheme(node.colorSchema.fillColor) :  node.colorSchema.fillColor}
                stroke={appLayout.darkMode ?  convertColorForDarkTheme( node.colorSchema.strokeColor) : node.colorSchema.strokeColor}
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
