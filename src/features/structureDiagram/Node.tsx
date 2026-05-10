import React, {FC, useContext, useState} from "react";
import {Port} from "./Port";
import {NodeEdgeHoverZones} from "./NodeEdgeHoverZones";
import {Scaffold} from "../scaffold/Scaffold";
import {DrawingLink} from "./DrawingLink";
import {atom, useAtomValue} from "jotai";
import {atomFamily} from "jotai-family";
import {DiagramId, dragReparentAtom, elementsAtom, isElementFocusedAtom, isElementSelectedAtom, isLiveElement, linkingAtom} from "../diagramEditor/diagramEditorModel";
import {ElementType, FlowchartNodeKind, NodeState, PictureLayout} from "../../package/packageModel";
import {NodeContentTopLeftIcon} from "./NodeContentTopLeftIcon";
import {iconRegistry, iconRegistryDark} from "../graphics/graphicsReader";
import {AppLayoutContext} from "../../editor/editorLayout";
import useImage from "use-image";
import {NodeContentFullIconTextBelow} from "./NodeContentFullIconTextBelow";
import {NodeContentNoIconRect} from "./NodeContentNoIconRect";
import {NodeContentContainer} from "./NodeContentContainer";
import {NodeId, NodePlacement} from "./structureDiagramState";
import {structureDiagramSelector} from "./structureDiagramModel";
import {Background} from "../scaffold/Background";
import {inflate} from "../../common/model";

export interface NodeProps {
    nodeId: NodeId
    diagramId: DiagramId
}

interface NodePlacementParam {
    nodeId: NodeId;
    diagramId: DiagramId;
}

export const nodePlacement = atomFamily(
    (param: NodePlacementParam) =>
        atom(
            (get) => {
                const diagram = get(structureDiagramSelector(param.diagramId));
                return diagram.nodes[param.nodeId];
            },
            (get, set, newValue: NodePlacement) => {
                const diagram = get(structureDiagramSelector(param.diagramId));
                set(structureDiagramSelector(param.diagramId), {
                    ...diagram,
                    nodes: {...diagram.nodes, [param.nodeId]: newValue}
                });
            }
        ),
    (a, b) => a.nodeId === b.nodeId && a.diagramId === b.diagramId
);

export const Node: FC<NodeProps> = React.memo(({nodeId, diagramId}) => {
    const node = useAtomValue(elementsAtom(nodeId)) as NodeState
    const placement = useAtomValue(nodePlacement({nodeId, diagramId}))
    const isSelected = useAtomValue(isElementSelectedAtom({elementId: nodeId, diagramId}))
    const isFocused = useAtomValue(isElementFocusedAtom({elementId: nodeId, diagramId}))
    const linking = useAtomValue(linkingAtom)
    const dragReparent = useAtomValue(dragReparentAtom)
    const {appLayout} = useContext(AppLayoutContext);
    const shapeId = node?.customShape?.pictureId
    const iconUrl = shapeId !== undefined
        ? (appLayout.darkMode ? iconRegistryDark[shapeId] : undefined) ?? iconRegistry[shapeId]
        : undefined
    const [image] = useImage(iconUrl || '');
    const [edgeHoverActive, setEdgeHoverActive] = useState(false);

    if (!isLiveElement(node) || !placement) return null;

    const linkingTarget = linking?.targetElement;
    const linkingSource = linking?.sourceElement;
    const element = {id: nodeId, type: node.type};
    const layout = node.customShape?.layout ?? PictureLayout.NoIconRect
    const contentComponents = {
        [PictureLayout.TopLeftCorner]: NodeContentTopLeftIcon,
        [PictureLayout.NoIconRect]: NodeContentNoIconRect,
        [PictureLayout.FullIconTextBelow]: NodeContentFullIconTextBelow,
    };

    const isContainer = node.type === ElementType.Cluster;
    const Component = isContainer
        ? NodeContentContainer
        : contentComponents[layout as keyof typeof contentComponents];

    const shadowEnabled = nodeId === linkingTarget?.id || nodeId === linkingSource || nodeId === dragReparent?.targetContainerId;
    const inflatedBounds = inflate(placement.bounds, 12, 12);

    return (
        <React.Fragment>
            {/* Always render the Background for dragging */}
            <Background
                origin={element}
                backgroundBounds={inflatedBounds}
                nodeBounds={placement.bounds}
                diagramId={diagramId}
            />

            {Component && (
                <Component
                    node={node}
                    image={image}
                    placement={placement}
                    shadowEnabled={shadowEnabled}
                />
            )}

            {isSelected && !edgeHoverActive && (
                <Scaffold
                    element={element}
                    bounds={placement.bounds}
                    isFocused={isFocused}
                    isLinking={linking?.drawing === true}
                    excludeDiagonalResize={node.ganttTask !== undefined}
                    excludeVerticalResize={node.ganttTask !== undefined}
                    linkingDrawing={<DrawingLink/>}
                    showLinkButton={false}
                />
            )}

            {node.flowchartKind !== FlowchartNodeKind.MindMapTopic && (node.ports ?? []).map((port, index) =>
                <Port
                    key={index}
                    portId={port}
                    nodeId={nodeId}
                    diagramId={diagramId}
                    colorSchema={node.colorSchema}
                />
            )}

            <NodeEdgeHoverZones
                nodeId={nodeId}
                diagramId={diagramId}
                bounds={placement.bounds}
                colorSchema={node.colorSchema}
                onActiveChange={setEdgeHoverActive}
            />
        </React.Fragment>
    );
});
