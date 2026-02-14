import React, {FC, useContext} from "react";
import {Line, Rect, Text} from "react-konva";
import {NodeContentProps} from "./NodeContentProps";
import {AppLayoutContext} from "../../app/appModel";
import {
    adjustColorSchemaForTheme,
} from "../../common/colors/colorTransform";
import {FlowchartNodeKind} from "../../package/packageModel";

export const NodeContentNoIconRect: FC<NodeContentProps> = ({
      node,
      placement,
      shadowEnabled
  }) => {

    const { appLayout } = useContext(AppLayoutContext);
    const colorSchema = adjustColorSchemaForTheme(node.colorSchema, appLayout.darkMode);
    const kind = node.flowchartKind ?? FlowchartNodeKind.Process;

    const isDecision = kind === FlowchartNodeKind.Decision;
    const isInputOutput = kind === FlowchartNodeKind.InputOutput;
    const isTerminator = kind === FlowchartNodeKind.Terminator;
    const isC4 = kind === FlowchartNodeKind.C4Person
        || kind === FlowchartNodeKind.C4System
        || kind === FlowchartNodeKind.C4Container
        || kind === FlowchartNodeKind.C4Component;

    const shape = (() => {
        if (isDecision) {
            const {x, y, width, height} = placement.bounds;
            const cx = x + width / 2;
            const cy = y + height / 2;
            return (
                <Line
                    points={[cx, y, x + width, cy, cx, y + height, x, cy]}
                    closed
                    fill={colorSchema.fillColor}
                    stroke={colorSchema.strokeColor}
                    shadowEnabled={shadowEnabled}
                    shadowColor={"black"}
                    shadowBlur={3}
                    shadowOffset={{x: 2, y: 2}}
                    shadowOpacity={0.4}
                    listening={false}
                />
            );
        }

        if (isInputOutput) {
            const {x, y, width, height} = placement.bounds;
            const skew = Math.min(width * 0.18, 22);
            return (
                <Line
                    points={[x + skew, y, x + width, y, x + width - skew, y + height, x, y + height]}
                    closed
                    fill={colorSchema.fillColor}
                    stroke={colorSchema.strokeColor}
                    shadowEnabled={shadowEnabled}
                    shadowColor={"black"}
                    shadowBlur={3}
                    shadowOffset={{x: 2, y: 2}}
                    shadowOpacity={0.4}
                    listening={false}
                />
            );
        }

        return (
            <Rect
                fill={colorSchema.fillColor}
                stroke={colorSchema.strokeColor}
                {...placement.bounds}
                cornerRadius={isTerminator ? 26 : (isC4 ? 10 : 4)}
                dash={isC4 ? [6, 3] : undefined}
                shadowEnabled={shadowEnabled}
                shadowColor={"black"}
                shadowBlur={3}
                shadowOffset={{x: 2, y: 2}}
                shadowOpacity={0.4}
                draggable={false}
                listening={false}
            />
        );
    })();

    return (
        <>
            {shape}

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
