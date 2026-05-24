import React, {FC} from "react";
import {Group, Line, Rect, Text} from "react-konva";
import {BpmnElementKind, NodeState} from "../../package/packageModel";
import {NodeContentProps} from "./NodeContentProps";

const LABEL_HEIGHT = 22;
const LABEL_FONT_SIZE = 12;
const BORDER_RADIUS = 6;
const FILL_OPACITY = 0.08;
const STROKE_OPACITY = 0.45;
const STROKE_WIDTH = 1.5;
const CLUSTER_FILL = "rgb(120,160,220)";
const CLUSTER_STROKE = "rgb(100,140,210)";

const HOVER_STROKE = "rgb(140,200,255)";
const HOVER_STROKE_WIDTH = 2.5;

// BPMN pool/lane title band.
const BPMN_BAND_WIDTH = 24;
const BPMN_BAND_FONT_SIZE = 13;
const BPMN_BAND_STROKE_OPACITY = 0.6;

export const NodeContentContainer: FC<NodeContentProps> = ({node, placement, shadowEnabled}) => {
    if (isBpmnContainer(node)) return <BpmnContainer node={node} placement={placement} shadowEnabled={shadowEnabled} />;
    return <GenericContainer node={node} placement={placement} shadowEnabled={shadowEnabled} />;
};

function isBpmnContainer(node: NodeState): boolean {
    const bpmn = node.bpmnNode;
    return bpmn !== undefined && (bpmn.kind === BpmnElementKind.Pool || bpmn.kind === BpmnElementKind.Lane);
}

// ── BPMN Pool / Lane ───────────────────────────────────────────────────────

const BpmnContainer: FC<NodeContentProps> = ({node, placement, shadowEnabled}) => {
    const {x, y, width, height} = placement.bounds;
    const horizontal = node.bpmnNode?.isHorizontal ?? true;
    return (
        <Group listening={false}>
            <Rect
                x={x} y={y} width={width} height={height}
                stroke={shadowEnabled ? HOVER_STROKE : CLUSTER_STROKE}
                strokeWidth={shadowEnabled ? HOVER_STROKE_WIDTH : STROKE_WIDTH}
                opacity={shadowEnabled ? 1 : BPMN_BAND_STROKE_OPACITY}
                shadowColor={shadowEnabled ? "rgb(100,180,255)" : undefined}
                shadowBlur={shadowEnabled ? 14 : 0}
                shadowOpacity={shadowEnabled ? 0.7 : 0}
                listening={false}
            />
            {horizontal
                ? <HorizontalLabelBand x={x} y={y} width={width} height={height} text={node.text ?? ""} />
                : <VerticalLabelBand x={x} y={y} width={width} height={height} text={node.text ?? ""} />}
        </Group>
    );
};

interface BandProps {
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
}

// Horizontal pool: vertical title band on the left edge; pool body to its right.
const HorizontalLabelBand: FC<BandProps> = ({x, y, width: _width, height, text}) => {
    const bandX = x + BPMN_BAND_WIDTH;
    const labelCx = x + BPMN_BAND_WIDTH / 2;
    const labelCy = y + height / 2;
    return (
        <>
            <Line points={[bandX, y, bandX, y + height]}
                stroke={CLUSTER_STROKE} strokeWidth={STROKE_WIDTH}
                opacity={BPMN_BAND_STROKE_OPACITY} listening={false} />
            <Text
                x={labelCx - height / 2}
                y={labelCy - BPMN_BAND_WIDTH / 2}
                width={height}
                height={BPMN_BAND_WIDTH}
                text={text}
                fontSize={BPMN_BAND_FONT_SIZE}
                fontStyle="bold"
                fill="rgb(60,80,120)"
                align="center"
                verticalAlign="middle"
                rotation={-90}
                offsetX={0}
                offsetY={0}
                listening={false}
            />
        </>
    );
};

// Vertical pool: horizontal title band along the top; pool body below.
const VerticalLabelBand: FC<BandProps> = ({x, y, width, height: _height, text}) => {
    const bandBottomY = y + BPMN_BAND_WIDTH;
    return (
        <>
            <Line points={[x, bandBottomY, x + width, bandBottomY]}
                stroke={CLUSTER_STROKE} strokeWidth={STROKE_WIDTH}
                opacity={BPMN_BAND_STROKE_OPACITY} listening={false} />
            <Text
                x={x}
                y={y}
                width={width}
                height={BPMN_BAND_WIDTH}
                text={text}
                fontSize={BPMN_BAND_FONT_SIZE}
                fontStyle="bold"
                fill="rgb(60,80,120)"
                align="center"
                verticalAlign="middle"
                listening={false}
            />
        </>
    );
};

// ── Generic container (existing visual) ────────────────────────────────────

const GenericContainer: FC<NodeContentProps> = ({node, placement, shadowEnabled}) => {
    const {x, y, width, height} = placement.bounds;
    return (
        <Group listening={false}>
            <Rect x={x} y={y} width={width} height={height}
                fill={CLUSTER_FILL} opacity={FILL_OPACITY} cornerRadius={BORDER_RADIUS} listening={false} />
            <Rect x={x} y={y} width={width} height={height}
                stroke={shadowEnabled ? HOVER_STROKE : CLUSTER_STROKE}
                strokeWidth={shadowEnabled ? HOVER_STROKE_WIDTH : STROKE_WIDTH}
                opacity={shadowEnabled ? 1 : STROKE_OPACITY}
                shadowColor={shadowEnabled ? "rgb(100,180,255)" : undefined}
                shadowBlur={shadowEnabled ? 14 : 0}
                shadowOpacity={shadowEnabled ? 0.7 : 0}
                cornerRadius={BORDER_RADIUS} listening={false} />
            <Rect x={x} y={y} width={width} height={LABEL_HEIGHT}
                fill={CLUSTER_FILL} opacity={0.18}
                cornerRadius={[BORDER_RADIUS, BORDER_RADIUS, 0, 0]} listening={false} />
            <Text x={x} y={y} width={width} height={LABEL_HEIGHT}
                text={node.text ?? ""}
                fontSize={LABEL_FONT_SIZE} fontStyle="bold"
                fill="white" opacity={0.75}
                align="center" verticalAlign="middle" listening={false} />
        </Group>
    );
};
