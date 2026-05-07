import React, { useContext, useRef, useState } from "react";
import { Circle, Group, Rect, RegularPolygon } from "react-konva";
import Konva from "konva";
import { useAtomValue } from "jotai";
import { Bounds, Coordinate } from "../../common/model";
import { ColorSchema, ElementType, NodeState, PortAlignment } from "../../package/packageModel";
import {
    elementsAtom,
    linkingAtom,
    SourcePortHint,
} from "../diagramEditor/diagramEditorModel";
import {
    elementSelectedAction,
    linkingAction,
    LinkingPhase,
    screenToCanvas,
    useDispatch,
} from "../diagramEditor/diagramEditorSlice";
import { structureDiagramSelector } from "./structureDiagramModel";
import { NodeId } from "./structureDiagramState";
import { DiagramId } from "../diagramEditor/diagramEditorModel";
import { adjustColorSchemaForTheme } from "../../common/colors/colorTransform";
import { AppLayoutContext } from "../../editor/editorLayout";
import KonvaEventObject = Konva.KonvaEventObject;

const EDGE_THICKNESS = 12;
const MIN_GAP = 15;

function computeSnapCandidates(existingRatios: number[]): number[] {
    if (existingRatios.length === 0) return [25, 50, 75];
    const sorted = [...existingRatios].sort((a, b) => a - b);
    const boundaries = [0, ...sorted, 100];
    const candidates: number[] = [];
    for (let i = 0; i < boundaries.length - 1; i++) {
        const gap = boundaries[i + 1] - boundaries[i];
        if (gap >= MIN_GAP) {
            candidates.push((boundaries[i] + boundaries[i + 1]) / 2);
        }
    }
    return candidates.length > 0 ? candidates : [50];
}

function snapToNearest(mouseRatio: number, candidates: number[]): number {
    return candidates.reduce((best, c) =>
        Math.abs(c - mouseRatio) < Math.abs(best - mouseRatio) ? c : best
    );
}

function ghostCenter(bounds: Bounds, alignment: PortAlignment, ratio: number): Coordinate {
    switch (alignment) {
        case PortAlignment.Top:    return { x: bounds.x + bounds.width * ratio / 100, y: bounds.y };
        case PortAlignment.Bottom: return { x: bounds.x + bounds.width * ratio / 100, y: bounds.y + bounds.height };
        case PortAlignment.Left:   return { x: bounds.x, y: bounds.y + bounds.height * ratio / 100 };
        case PortAlignment.Right:  return { x: bounds.x + bounds.width, y: bounds.y + bounds.height * ratio / 100 };
    }
}

// Offset from port circle center to arrow triangle center (circle r=4, gap=2, triangle inradius=2)
const ARROW_OFFSET = 8;

function arrowCenter(center: Coordinate, alignment: PortAlignment): Coordinate {
    switch (alignment) {
        case PortAlignment.Top:    return { x: center.x, y: center.y - ARROW_OFFSET };
        case PortAlignment.Bottom: return { x: center.x, y: center.y + ARROW_OFFSET };
        case PortAlignment.Left:   return { x: center.x - ARROW_OFFSET, y: center.y };
        case PortAlignment.Right:  return { x: center.x + ARROW_OFFSET, y: center.y };
    }
}

// RegularPolygon rotation so the apex points away from the node
function arrowRotation(alignment: PortAlignment): number {
    switch (alignment) {
        case PortAlignment.Top:    return 0;
        case PortAlignment.Bottom: return 180;
        case PortAlignment.Left:   return 270;
        case PortAlignment.Right:  return 90;
    }
}

interface GhostState {
    alignment: PortAlignment;
    ratio: number;
}

interface EdgeZoneProps {
    alignment: PortAlignment;
    zoneBounds: Bounds;
    nodeBounds: Bounds;
    existingRatios: number[];
    onGhostChange: (ghost: GhostState | undefined) => void;
    nodeId: NodeId;
    disabled: boolean;
}

const EdgeZone = ({ alignment, zoneBounds, nodeBounds, existingRatios, onGhostChange, nodeId, disabled }: EdgeZoneProps) => {
    const dispatch = useDispatch();
    const ghostRef = useRef<GhostState | undefined>(undefined);

    const computeGhost = (canvasPos: Coordinate): GhostState => {
        const mouseRatio = (alignment === PortAlignment.Top || alignment === PortAlignment.Bottom)
            ? ((canvasPos.x - nodeBounds.x) / nodeBounds.width) * 100
            : ((canvasPos.y - nodeBounds.y) / nodeBounds.height) * 100;
        const ratio = snapToNearest(Math.max(0, Math.min(100, mouseRatio)), computeSnapCandidates(existingRatios));
        return { alignment, ratio };
    };

    const handleMouseEnter = (e: KonvaEventObject<MouseEvent>) => {
        if (disabled) return;
        const stage = e.target.getStage();
        if (stage) stage.container().style.cursor = 'crosshair';
    };

    const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
        if (disabled) return;
        const ghost = computeGhost(screenToCanvas(e));
        ghostRef.current = ghost;
        onGhostChange(ghost);
    };

    const handleMouseLeave = (e: KonvaEventObject<MouseEvent>) => {
        ghostRef.current = undefined;
        onGhostChange(undefined);
        const stage = e.target.getStage();
        if (stage) stage.container().style.cursor = 'default';
    };

    const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
        e.cancelBubble = true;
        if (disabled) return;
        const ghost = ghostRef.current ?? computeGhost(screenToCanvas(e));
        const hint: SourcePortHint = { alignment: ghost.alignment, edgePosRatio: ghost.ratio };
        const mousePos = { x: e.evt.x, y: e.evt.y };
        const canvasPos = screenToCanvas(e);
        dispatch(elementSelectedAction({
            element: { id: nodeId, type: ElementType.ClassNode },
            shiftKey: false,
            ctrlKey: false,
        }));
        dispatch(linkingAction({
            elementId: nodeId,
            mousePos,
            diagramPos: canvasPos,
            phase: LinkingPhase.start,
            shiftKey: e.evt.shiftKey,
            ctrlKey: e.evt.ctrlKey,
            sourcePortHint: hint,
        }));
    };

    return (
        <Rect
            {...zoneBounds}
            fill="transparent"
            onMouseEnter={handleMouseEnter}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseDown={handleMouseDown}
            listening={true}
        />
    );
};

interface NodeEdgeHoverZonesProps {
    nodeId: NodeId;
    diagramId: DiagramId;
    bounds: Bounds;
    colorSchema: ColorSchema;
    onActiveChange?: (active: boolean) => void;
}

export const NodeEdgeHoverZones = ({ nodeId, diagramId, bounds, colorSchema, onActiveChange }: NodeEdgeHoverZonesProps) => {
    const [ghost, setGhost] = useState<GhostState | undefined>(undefined);
    const linking = useAtomValue(linkingAtom);

    const setGhostWithCallback = (next: GhostState | undefined) => {
        setGhost(next);
        onActiveChange?.(next !== undefined);
    };
    const node = useAtomValue(elementsAtom(nodeId)) as NodeState;
    const diagram = useAtomValue(structureDiagramSelector(diagramId));
    const { appLayout } = useContext(AppLayoutContext);

    const themedSchema = adjustColorSchemaForTheme(colorSchema, appLayout.darkMode);

    // Disable ghost port hints while any linking drag is in progress
    const disabled = linking?.drawing === true;

    const portsByAlignment: Record<PortAlignment, number[]> = {
        [PortAlignment.Top]: [],
        [PortAlignment.Bottom]: [],
        [PortAlignment.Left]: [],
        [PortAlignment.Right]: [],
    };
    node.ports.forEach(portId => {
        const placement = diagram.ports[portId];
        if (placement) portsByAlignment[placement.alignment].push(placement.edgePosRatio);
    });

    const half = EDGE_THICKNESS / 2;
    const edges: Array<{ alignment: PortAlignment; zoneBounds: Bounds }> = [
        { alignment: PortAlignment.Top,    zoneBounds: { x: bounds.x, y: bounds.y - half, width: bounds.width, height: EDGE_THICKNESS } },
        { alignment: PortAlignment.Bottom, zoneBounds: { x: bounds.x, y: bounds.y + bounds.height - half, width: bounds.width, height: EDGE_THICKNESS } },
        { alignment: PortAlignment.Left,   zoneBounds: { x: bounds.x - half, y: bounds.y, width: EDGE_THICKNESS, height: bounds.height } },
        { alignment: PortAlignment.Right,  zoneBounds: { x: bounds.x + bounds.width - half, y: bounds.y, width: EDGE_THICKNESS, height: bounds.height } },
    ];

    const center = ghost && !disabled ? ghostCenter(bounds, ghost.alignment, ghost.ratio) : undefined;

    return (
        <Group>
            {edges.map(({ alignment, zoneBounds }) => (
                <EdgeZone
                    key={alignment}
                    alignment={alignment}
                    zoneBounds={zoneBounds}
                    nodeBounds={bounds}
                    existingRatios={portsByAlignment[alignment]}
                    onGhostChange={setGhostWithCallback}
                    nodeId={nodeId}
                    disabled={disabled}
                />
            ))}
            {center && ghost && (
                <>
                    <Circle
                        x={center.x}
                        y={center.y}
                        radius={4}
                        fill={themedSchema.strokeColor}
                        opacity={0.5}
                        listening={false}
                    />
                    <RegularPolygon
                        x={arrowCenter(center, ghost.alignment).x}
                        y={arrowCenter(center, ghost.alignment).y}
                        sides={3}
                        radius={4}
                        rotation={arrowRotation(ghost.alignment)}
                        fill={themedSchema.strokeColor}
                        opacity={0.5}
                        listening={false}
                    />
                </>
            )}
        </Group>
    );
};
