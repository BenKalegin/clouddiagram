import React, {FC} from "react";
import {Port} from "./Port";
import {Scaffold} from "../scaffold/Scaffold";
import {DrawingLink} from "./DrawingLink";
import {DefaultValue, selectorFamily, useRecoilValue} from "recoil";
import {DiagramId, elementsAtom, linkingAtom, selectedRefsSelector} from "../diagramEditor/diagramEditorModel";
import {ElementType, NodeState, PictureLayout} from "../../package/packageModel";
import {useCustomDispatch} from "../diagramEditor/commonHandlers";
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

export const nodePlacement = selectorFamily<NodePlacement, { nodeId: NodeId, diagramId: DiagramId }>({
    key: 'placements',
    get: ({nodeId, diagramId}) => ({get}) => {
        const diagram = get(structureDiagramSelector(diagramId))
        return diagram.nodes[nodeId]
    },
    set: ({nodeId, diagramId}) => ({set, get}, newValue) => {
        const diagram = get(structureDiagramSelector(diagramId))
        if (!(newValue instanceof DefaultValue)) {
            set(structureDiagramSelector(diagramId), {...diagram, nodes: {...diagram.nodes, [nodeId]: newValue}})
        }
    }
})

export const Node: FC<NodeProps> = ({nodeId, diagramId}) => {
    const node = useRecoilValue(elementsAtom(nodeId)) as NodeState
    const placement = useRecoilValue(nodePlacement({nodeId, diagramId}))

    const selectedElements = useRecoilValue(selectedRefsSelector(diagramId))
    const isSelected = selectedElements.map(e => e.id).includes(nodeId);
    const isFocused = selectedElements.length > 0 && selectedElements.at(-1)?.id === nodeId;

    const linking = useRecoilValue(linkingAtom)
    const linkingTarget = linking?.targetElement;
    const linkingSource = linking?.sourceElement;
    const element = {id: nodeId, type: ElementType.ClassNode};

    const eventHandlers = useCustomDispatch({
        onClick: true,
        onDrag: true,
        element: element,
        diagramId: diagramId,
        bounds: placement.bounds,
    });

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
            />

            {Component && (
                <Component
                    node={node}
                    image={image}
                    placement={placement}
                    eventHandlers={eventHandlers}
                    shadowEnabled={shadowEnabled}
                />
            )}

            {isSelected && (
                <Scaffold
                    element={element}
                    bounds={placement.bounds}
                    isFocused={isFocused}
                    isLinking={linking?.drawing === true}
                    linkingDrawing={<DrawingLink/>}
                    excludeBackground={true} // Skip background in Scaffold since we're already rendering it
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

