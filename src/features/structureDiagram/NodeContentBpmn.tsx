import React from "react";
import {Circle, Line, Path, Rect} from "react-konva";
import {BpmnElementKind, BpmnEventDefinition, ColorSchema, NodeState} from "../../package/packageModel";
import {Bounds} from "../../common/model";
import {RichText} from "../../common/canvas/RichText";

/**
 * BPMN-specific Konva renderer for flow nodes (events, activities, gateways,
 * artifacts). Dispatched from NodeContentNoIconRect when node.bpmnNode is
 * present. Mirrors the SVG vocabulary in doodles-svg/bpmn.ts:
 *  - events: circle with ring weight (start=thin, intermediate=double,
 *    end=thick) + inner glyph (envelope/clock/terminate dot)
 *  - gateways: diamond with marker (X/+/O/pentagon for event-based)
 *  - activities: rounded rect; CallActivity has thicker border
 *
 * Pool/Lane (containers) are handled in NodeContentContainer.tsx via
 * node.bpmnNode.isHorizontal — not here.
 */

const STROKE_EVENT_START = 1.5;
const STROKE_EVENT_INTERMEDIATE_OUTER = 1.5;
const STROKE_EVENT_INTERMEDIATE_INNER = 1.5;
const STROKE_EVENT_END = 3;
const STROKE_GATEWAY = 1.5;
const STROKE_TASK = 1.5;
const STROKE_TASK_CALL_ACTIVITY = 3;
const STROKE_GLYPH = 1.5;
const EVENT_INTERMEDIATE_INNER_GAP = 3;
const EVENT_GLYPH_SCALE = 0.55;
const GATEWAY_GLYPH_SCALE = 0.5;
const TASK_CORNER_RADIUS = 8;

const EVENT_KINDS: ReadonlySet<string> = new Set([
    BpmnElementKind.StartEvent,
    BpmnElementKind.EndEvent,
    BpmnElementKind.IntermediateThrowEvent,
    BpmnElementKind.IntermediateCatchEvent,
]);

const GATEWAY_KINDS: ReadonlySet<string> = new Set([
    BpmnElementKind.ExclusiveGateway,
    BpmnElementKind.ParallelGateway,
    BpmnElementKind.InclusiveGateway,
    BpmnElementKind.EventBasedGateway,
]);

const ACTIVITY_KINDS: ReadonlySet<string> = new Set([
    BpmnElementKind.Task,
    BpmnElementKind.UserTask,
    BpmnElementKind.ServiceTask,
    BpmnElementKind.Subprocess,
    BpmnElementKind.CallActivity,
]);

export function isBpmnFlowNode(node: NodeState): boolean {
    const bpmn = node.bpmnNode;
    if (!bpmn) return false;
    return EVENT_KINDS.has(bpmn.kind) || GATEWAY_KINDS.has(bpmn.kind) || ACTIVITY_KINDS.has(bpmn.kind);
}

export function renderBpmnFlowNode(
    node: NodeState,
    bounds: Bounds,
    colorSchema: ColorSchema,
    shadowEnabled: boolean,
): React.ReactElement {
    const bpmn = node.bpmnNode!;
    if (EVENT_KINDS.has(bpmn.kind)) return renderEvent(node, bounds, colorSchema, shadowEnabled);
    if (GATEWAY_KINDS.has(bpmn.kind)) return renderGateway(node, bounds, colorSchema, shadowEnabled);
    return renderActivity(node, bounds, colorSchema, shadowEnabled);
}

// ── Event ──────────────────────────────────────────────────────────────────

function renderEvent(
    node: NodeState,
    bounds: Bounds,
    colorSchema: ColorSchema,
    shadowEnabled: boolean,
): React.ReactElement {
    const kind = node.bpmnNode!.kind;
    const eventDef = node.bpmnNode?.eventDefinition;
    const cx = bounds.x + bounds.width / 2;
    const cy = bounds.y + bounds.height / 2;
    const r = Math.min(bounds.width, bounds.height) / 2;
    return (
        <>
            {renderEventRings(kind, cx, cy, r, colorSchema, shadowEnabled)}
            {eventDef && eventDef !== BpmnEventDefinition.None && renderEventGlyph(eventDef, cx, cy, r, colorSchema)}
            {renderCenteredLabelBelow(node.text, cx, cy + r, colorSchema)}
        </>
    );
}

function renderEventRings(
    kind: string,
    cx: number,
    cy: number,
    r: number,
    colorSchema: ColorSchema,
    shadowEnabled: boolean,
): React.ReactElement {
    if (kind === BpmnElementKind.StartEvent) {
        return (
            <Circle
                x={cx}
                y={cy}
                radius={r}
                fill={colorSchema.fillColor}
                stroke={colorSchema.strokeColor}
                strokeWidth={STROKE_EVENT_START}
                shadowEnabled={shadowEnabled}
                shadowColor="black"
                shadowBlur={3}
                shadowOffset={{x: 2, y: 2}}
                shadowOpacity={0.4}
                listening={false}
            />
        );
    }
    if (kind === BpmnElementKind.EndEvent) {
        return (
            <Circle
                x={cx}
                y={cy}
                radius={r}
                fill={colorSchema.fillColor}
                stroke={colorSchema.strokeColor}
                strokeWidth={STROKE_EVENT_END}
                shadowEnabled={shadowEnabled}
                shadowColor="black"
                shadowBlur={3}
                shadowOffset={{x: 2, y: 2}}
                shadowOpacity={0.4}
                listening={false}
            />
        );
    }
    const inner = r - EVENT_INTERMEDIATE_INNER_GAP;
    return (
        <>
            <Circle
                x={cx}
                y={cy}
                radius={r}
                fill={colorSchema.fillColor}
                stroke={colorSchema.strokeColor}
                strokeWidth={STROKE_EVENT_INTERMEDIATE_OUTER}
                shadowEnabled={shadowEnabled}
                shadowColor="black"
                shadowBlur={3}
                shadowOffset={{x: 2, y: 2}}
                shadowOpacity={0.4}
                listening={false}
            />
            <Circle
                x={cx}
                y={cy}
                radius={inner}
                fill={undefined}
                stroke={colorSchema.strokeColor}
                strokeWidth={STROKE_EVENT_INTERMEDIATE_INNER}
                listening={false}
            />
        </>
    );
}

function renderEventGlyph(
    def: string,
    cx: number,
    cy: number,
    r: number,
    colorSchema: ColorSchema,
): React.ReactElement | null {
    const g = r * EVENT_GLYPH_SCALE;
    switch (def) {
        case BpmnEventDefinition.Message: return envelopeGlyph(cx, cy, g, colorSchema);
        case BpmnEventDefinition.Timer: return clockGlyph(cx, cy, g, colorSchema);
        case BpmnEventDefinition.Terminate:
            return <Circle x={cx} y={cy} radius={g} fill={colorSchema.strokeColor} listening={false} />;
        default: return null;
    }
}

function envelopeGlyph(cx: number, cy: number, half: number, colorSchema: ColorSchema): React.ReactElement {
    const x = cx - half;
    const y = cy - half * 0.7;
    const w = half * 2;
    const h = half * 1.4;
    const flap = `M${x} ${y} L${cx} ${y + h * 0.55} L${x + w} ${y}`;
    return (
        <>
            <Rect x={x} y={y} width={w} height={h} stroke={colorSchema.strokeColor} strokeWidth={STROKE_GLYPH} listening={false} />
            <Path data={flap} stroke={colorSchema.strokeColor} strokeWidth={STROKE_GLYPH} listening={false} />
        </>
    );
}

function clockGlyph(cx: number, cy: number, r: number, colorSchema: ColorSchema): React.ReactElement {
    return (
        <>
            <Circle x={cx} y={cy} radius={r} stroke={colorSchema.strokeColor} strokeWidth={STROKE_GLYPH} listening={false} />
            <Line points={[cx, cy, cx, cy - r * 0.55]} stroke={colorSchema.strokeColor} strokeWidth={STROKE_GLYPH} listening={false} />
            <Line points={[cx, cy, cx + r * 0.55, cy]} stroke={colorSchema.strokeColor} strokeWidth={STROKE_GLYPH} listening={false} />
        </>
    );
}

// ── Gateway ────────────────────────────────────────────────────────────────

function renderGateway(
    node: NodeState,
    bounds: Bounds,
    colorSchema: ColorSchema,
    shadowEnabled: boolean,
): React.ReactElement {
    const kind = node.bpmnNode!.kind;
    const cx = bounds.x + bounds.width / 2;
    const cy = bounds.y + bounds.height / 2;
    const half = Math.min(bounds.width, bounds.height) / 2;
    return (
        <>
            <Line
                points={[cx, cy - half, cx + half, cy, cx, cy + half, cx - half, cy]}
                closed
                fill={colorSchema.fillColor}
                stroke={colorSchema.strokeColor}
                strokeWidth={STROKE_GATEWAY}
                shadowEnabled={shadowEnabled}
                shadowColor="black"
                shadowBlur={3}
                shadowOffset={{x: 2, y: 2}}
                shadowOpacity={0.4}
                listening={false}
            />
            {renderGatewayGlyph(kind, cx, cy, half, colorSchema)}
            {node.text && renderCenteredLabelBelow(node.text, cx, cy + half, colorSchema)}
        </>
    );
}

function renderGatewayGlyph(
    kind: string,
    cx: number,
    cy: number,
    half: number,
    colorSchema: ColorSchema,
): React.ReactElement | null {
    const g = half * GATEWAY_GLYPH_SCALE;
    const stroke = colorSchema.strokeColor;
    const sw = STROKE_GLYPH * 1.5;
    switch (kind) {
        case BpmnElementKind.ExclusiveGateway:
            return (
                <>
                    <Line points={[cx - g * 0.7, cy - g * 0.7, cx + g * 0.7, cy + g * 0.7]} stroke={stroke} strokeWidth={sw} listening={false} />
                    <Line points={[cx - g * 0.7, cy + g * 0.7, cx + g * 0.7, cy - g * 0.7]} stroke={stroke} strokeWidth={sw} listening={false} />
                </>
            );
        case BpmnElementKind.ParallelGateway:
            return (
                <>
                    <Line points={[cx - g, cy, cx + g, cy]} stroke={stroke} strokeWidth={sw} listening={false} />
                    <Line points={[cx, cy - g, cx, cy + g]} stroke={stroke} strokeWidth={sw} listening={false} />
                </>
            );
        case BpmnElementKind.InclusiveGateway:
            return <Circle x={cx} y={cy} radius={g} stroke={stroke} strokeWidth={sw} listening={false} />;
        case BpmnElementKind.EventBasedGateway:
            return renderPentagon(cx, cy, g, stroke, sw);
        default:
            return null;
    }
}

function renderPentagon(cx: number, cy: number, r: number, stroke: string, sw: number): React.ReactElement {
    const points: number[] = [];
    for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        points.push(cx + r * Math.cos(a), cy + r * Math.sin(a));
    }
    return <Line points={points} closed stroke={stroke} strokeWidth={sw} listening={false} />;
}

// ── Activity ───────────────────────────────────────────────────────────────

function renderActivity(
    node: NodeState,
    bounds: Bounds,
    colorSchema: ColorSchema,
    shadowEnabled: boolean,
): React.ReactElement {
    const kind = node.bpmnNode!.kind;
    const strokeWidth = kind === BpmnElementKind.CallActivity ? STROKE_TASK_CALL_ACTIVITY : STROKE_TASK;
    return (
        <>
            <Rect
                x={bounds.x}
                y={bounds.y}
                width={bounds.width}
                height={bounds.height}
                cornerRadius={TASK_CORNER_RADIUS}
                fill={colorSchema.fillColor}
                stroke={colorSchema.strokeColor}
                strokeWidth={strokeWidth}
                shadowEnabled={shadowEnabled}
                shadowColor="black"
                shadowBlur={3}
                shadowOffset={{x: 2, y: 2}}
                shadowOpacity={0.4}
                listening={false}
            />
            <RichText
                {...bounds}
                fill={colorSchema.textColor}
                fontSize={14}
                align="center"
                verticalAlign="middle"
                text={node.text}
                draggable={false}
                listening={false}
                preventDefault={true}
            />
        </>
    );
}

// ── Label below a shape (events + gateways) ────────────────────────────────

const LABEL_BELOW_GAP = 6;
const LABEL_BELOW_HEIGHT = 18;
const LABEL_BELOW_HALF_WIDTH = 60;

function renderCenteredLabelBelow(
    text: string,
    cx: number,
    bottomY: number,
    colorSchema: ColorSchema,
): React.ReactElement | null {
    if (!text) return null;
    return (
        <RichText
            x={cx - LABEL_BELOW_HALF_WIDTH}
            y={bottomY + LABEL_BELOW_GAP}
            width={LABEL_BELOW_HALF_WIDTH * 2}
            height={LABEL_BELOW_HEIGHT}
            fill={colorSchema.textColor}
            fontSize={12}
            align="center"
            verticalAlign="top"
            text={text}
            draggable={false}
            listening={false}
            preventDefault={true}
        />
    );
}
