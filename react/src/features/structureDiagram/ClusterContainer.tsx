import React from "react";
import {Group, Rect, Text} from "react-konva";
import {ClusterPlacement} from "./structureDiagramState";

const LABEL_HEIGHT = 22;
const LABEL_FONT_SIZE = 12;
const BORDER_RADIUS = 6;
const FILL_OPACITY = 0.08;
const STROKE_OPACITY = 0.45;
const STROKE_WIDTH = 1.5;
const CLUSTER_FILL = "rgb(120,160,220)";
const CLUSTER_STROKE = "rgb(100,140,210)";

interface ClusterContainerProps {
    cluster: ClusterPlacement;
}

export const ClusterContainer = ({ cluster }: ClusterContainerProps) => {
    const { x, y, width, height } = cluster.bounds;
    return (
        <Group listening={false}>
            <Rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill={CLUSTER_FILL}
                opacity={FILL_OPACITY}
                cornerRadius={BORDER_RADIUS}
                listening={false}
            />
            <Rect
                x={x}
                y={y}
                width={width}
                height={height}
                stroke={CLUSTER_STROKE}
                strokeWidth={STROKE_WIDTH}
                opacity={STROKE_OPACITY}
                cornerRadius={BORDER_RADIUS}
                listening={false}
            />
            <Rect
                x={x}
                y={y}
                width={width}
                height={LABEL_HEIGHT}
                fill={CLUSTER_FILL}
                opacity={0.18}
                cornerRadius={[BORDER_RADIUS, BORDER_RADIUS, 0, 0]}
                listening={false}
            />
            <Text
                x={x}
                y={y}
                width={width}
                height={LABEL_HEIGHT}
                text={cluster.label}
                fontSize={LABEL_FONT_SIZE}
                fontStyle="bold"
                fill="white"
                opacity={0.75}
                align="center"
                verticalAlign="middle"
                listening={false}
            />
        </Group>
    );
};
