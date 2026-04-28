import React, {FC} from "react";
import {Port} from "./Port";
import {Scaffold} from "../scaffold/Scaffold";
import {DrawingLink} from "./DrawingLink";
import {atom, useAtomValue} from "jotai";
import {atomFamily} from "jotai/utils";
import {DiagramId, elementsAtom, linkingAtom, selectedRefsSelector} from "../diagramEditor/diagramEditorModel";
import {ElementType, NodeState, PictureLayout} from "../../package/packageModel";
import {NodeContentTopLeftIcon} from "./NodeContentTopLeftIcon";
import {iconRegistry} from "../graphics/graphicsReader";
import useImage from "use-image";
import {NodeContentFullIconTextBelow} from "./NodeContentFullIconTextBelow";
import {NodeContentNoIconRect} from "./NodeContentNoIconRect";
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

export const Node: FC<NodeProps> = ({nodeId, diagramId}) => {
    const node = useAtomValue(elementsAtom(nodeId)) as NodeState
    const placement = useAtomValue(nodePlacement({nodeId, diagramId}))

    const selectedElements = useAtomValue(selectedRefsSelector(diagramId))
    const isSelected = selectedElements.map(e => e.id).includes(nodeId);
    const isFocused = selectedElements.length > 0 && selectedElements.at(-1)?.id === nodeId;

    const linking = useAtomValue(linkingAtom)
    const linkingTarget = linking?.targetElement;
    const linkingSource = linking?.sourceElement;
    const element = {id: nodeId, type: ElementType.ClassNode};

    const shapeId = node.customShape?.pictureId
    const iconUrl = shapeId !== undefined ? iconRegistry[shapeId] : undefined
    const layout = node.customShape?.layout ?? PictureLayout.NoIconRect
    const [image] = useImage(iconUrl || '');
    const contentComponents = {
        [PictureLayout.TopLeftCorner]: NodeContentTopLeftIcon,
        [PictureLayout.NoIconRect]: NodeContentNoIconRect,
        [PictureLayout.FullIconTextBelow]: NodeContentFullIconTextBelow,
    };

    const Component = contentComponents[layout as keyof typeof contentComponents];

    const shadowEnabled = nodeId === linkingTarget?.id || nodeId === linkingSource;
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

            {isSelected && (
                <Scaffold
                    element={element}
                    bounds={placement.bounds}
                    isFocused={isFocused}
                    isLinking={linking?.drawing === true}
                    excludeDiagonalResize={node.ganttTask !== undefined}
                    excludeVerticalResize={node.ganttTask !== undefined}
                    linkingDrawing={<DrawingLink/>}
                />
            )}

            {node.ports.map((port, index) =>
                <Port
                    key={index}
                    portId={port}
                    nodeId={nodeId}
                    diagramId={diagramId}
                    colorSchema={node.colorSchema}
                />
            )}
        </React.Fragment>
    );
}
