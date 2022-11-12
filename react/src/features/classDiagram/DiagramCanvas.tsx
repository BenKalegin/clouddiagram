import {Node} from "./Node";
import React, {RefObject} from "react";
import {Layer, Stage} from 'react-konva';
import Konva from "konva";
import {Link} from "./Link";
import {
    dropFromPalette,
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

    const isSelected = (node: NodeState) => diagram.selectedElements.includes(node.id);
    const isFocused = (node: NodeState) => diagram.focusedElement === node.id;

    const stageRef: RefObject<Konva.Stage> = React.useRef(null);

    return (
        <div
            // Stage wrapper that handles drag and drop
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
                e.preventDefault();
                stageRef.current?.setPointersPositions(e);
                const pos = stageRef.current?.getPointerPosition();
                dispatch(dropFromPalette({droppedAt: {x: pos?.x || 100, y: pos?.y || 100}}))
            }}
        >
            <ReactReduxContext.Consumer /* Stage does not propagate provider properly, we need to hack and provide it manually */>
                {({store}) => (
                    <Stage
                        width={window.innerWidth}
                        height={window.innerHeight}
                        ref={stageRef}
                        onMouseDown={e => checkDeselect(e)}
                    >
                        <Provider store={store}>
                            <Layer>

                                {Object.values(diagram.nodes).map((node, i) => {
                                    return (
                                        <Node
                                            key={i}
                                            isSelected={isSelected(node)}
                                            isFocused={isFocused(node)}
                                            node={node}
                                        />
                                    );
                                })}
                                {Object.values(diagram.links).map((link, index) => {
                                    return (<Link key={index} {...link} />)
                                })}
                            </Layer>
                        </Provider>
                    </Stage>
                )}
            </ReactReduxContext.Consumer>
        </div>
    );
}
