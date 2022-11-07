import {Node} from "./Node";
import React from "react";
import {Layer, Stage} from 'react-konva';
import Konva from "konva";
import {Link} from "./Link";
import {
    nodeDeselect,
    NodeState
} from "./classDiagramSlice";
import {ReactReduxContext, Provider} from 'react-redux';

import {useAppDispatch, useAppSelector} from "../../app/hooks";

export function DiagramCanvas() {
    const diagram = useAppSelector(state => state.diagram);
    const dispatch = useAppDispatch();

    const checkDeselect = (e: Konva.KonvaEventObject<MouseEvent>) => {
        // deselect when clicked on empty area
        const clickedOnEmpty = e.target === e.target.getStage()
        if (clickedOnEmpty) {
            dispatch(nodeDeselect())
        }
    }

    const isSelected = (node: NodeState) => diagram.selectedElementIds.includes(node.id);
    const isFocused = (node: NodeState) => diagram.focusedElementId === node.id;

    return (
        <ReactReduxContext.Consumer>
            {({ store }) => (
                <Stage
                    width={window.innerWidth}
                    height={window.innerHeight}
                    onMouseDown={e => checkDeselect(e)}
                >
                    <Provider store={store}>
                        <Layer>
                            {diagram.Nodes.map((node, i) => {
                                return (
                                    <Node
                                        key={i}
                                        isSelected={isSelected(node)}
                                        isFocused={isFocused(node)}
                                        node={node}
                                    />
                                );
                            })}
                            {diagram.Links.map((link, index) => {
                                return <Link key={index} {...link} />
                            })}
                        </Layer>
                    </Provider>
                </Stage>
            )}
        </ReactReduxContext.Consumer>
    );
}
