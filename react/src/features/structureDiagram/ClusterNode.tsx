import React from "react";
import {Group, Rect, Text} from "react-konva";
import {atom, useAtomValue} from "jotai";
import {atomFamily} from "jotai-family";
import {DiagramId, selectedRefsSelector} from "../diagramEditor/diagramEditorModel";
import {ElementType} from "../../package/packageModel";
import {structureDiagramSelector} from "./structureDiagramModel";
import {Background} from "../scaffold/Background";
import {FocusFrame} from "../scaffold/FocusFrame";
import {ResizeHandles} from "../scaffold/ResizeHandle";
import {inflate} from "../../common/model";

const LABEL_HEIGHT = 22;
const LABEL_FONT_SIZE = 12;
const BORDER_RADIUS = 6;
const FILL_OPACITY = 0.08;
const STROKE_OPACITY = 0.45;
const STROKE_WIDTH = 1.5;
const CLUSTER_FILL = "rgb(120,160,220)";
const CLUSTER_STROKE = "rgb(100,140,210)";

interface ClusterNodeProps {
    clusterId: string;
    diagramId: DiagramId;
}

const clusterPlacementAtom = atomFamily(
    (param: {clusterId: string; diagramId: DiagramId}) =>
        atom((get) => {
            const diagram = get(structureDiagramSelector(param.diagramId));
            return diagram.clusters?.[param.clusterId];
        }),
    (a, b) => a.clusterId === b.clusterId && a.diagramId === b.diagramId
);

export const ClusterNode = ({clusterId, diagramId}: ClusterNodeProps) => {
    const cluster = useAtomValue(clusterPlacementAtom({clusterId, diagramId}));
    const selectedElements = useAtomValue(selectedRefsSelector(diagramId));
    const isSelected = selectedElements.map(e => e.id).includes(clusterId);
    const isFocused = selectedElements.length > 0 && selectedElements.at(-1)?.id === clusterId;

    if (!cluster) return null;

    const {x, y, width, height} = cluster.bounds;
    const element = {id: clusterId, type: ElementType.Cluster};
    const inflatedBounds = inflate(cluster.bounds, 12, 12);

    return (
        <React.Fragment>
            <Background
                origin={element}
                backgroundBounds={inflatedBounds}
                nodeBounds={cluster.bounds}
                diagramId={diagramId}
            />
            <Group listening={false}>
                <Rect
                    x={x} y={y} width={width} height={height}
                    fill={CLUSTER_FILL} opacity={FILL_OPACITY}
                    cornerRadius={BORDER_RADIUS} listening={false}
                />
                <Rect
                    x={x} y={y} width={width} height={height}
                    stroke={CLUSTER_STROKE} strokeWidth={STROKE_WIDTH}
                    opacity={STROKE_OPACITY} cornerRadius={BORDER_RADIUS}
                    listening={false}
                />
                <Rect
                    x={x} y={y} width={width} height={LABEL_HEIGHT}
                    fill={CLUSTER_FILL} opacity={0.18}
                    cornerRadius={[BORDER_RADIUS, BORDER_RADIUS, 0, 0]}
                    listening={false}
                />
                <Text
                    x={x} y={y} width={width} height={LABEL_HEIGHT}
                    text={cluster.label}
                    fontSize={LABEL_FONT_SIZE} fontStyle="bold"
                    fill="white" opacity={0.75}
                    align="center" verticalAlign="middle"
                    listening={false}
                />
            </Group>
            {isSelected && (
                <>
                    {isFocused && (
                        <ResizeHandles
                            perimeterBounds={inflatedBounds}
                            nodeBounds={cluster.bounds}
                            element={element}
                        />
                    )}
                    <FocusFrame bounds={inflatedBounds} />
                </>
            )}
        </React.Fragment>
    );
};
