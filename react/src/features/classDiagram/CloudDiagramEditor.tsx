import {Node} from "./Node";
import React from "react";
import {Layer, Stage} from 'react-konva';
import Konva from "konva";
import {Link} from "./Link";
import {nodeDeselect, selectClassDiagramEditor} from "./diagramEditorSlice";
import {ReactReduxContext, Provider} from 'react-redux';

import {useAppDispatch, useAppSelector} from "../../app/hooks";
import {NodeState} from "./model";

export const CloudDiagramEditor = () => {
    const {diagram, selectedElements, focusedElement, linkingSourceElement} = useAppSelector(state => selectClassDiagramEditor(state));
    const dispatch = useAppDispatch();

    const checkDeselect = (e: Konva.KonvaEventObject<MouseEvent>) => {
        // deselect when clicked on empty area
        const clickedOnEmpty = e.target === e.target.getStage()
        if (clickedOnEmpty) {
            dispatch(nodeDeselect())
        }
    }

    const isSelected = (node: NodeState) => selectedElements.includes(node.id);
    const isFocused = (node: NodeState) => focusedElement === node.id;
    const isLinking = (node: NodeState) => linkingSourceElement === node.id;
    return (
        <ReactReduxContext.Consumer /* Stage does not propagate provider properly, we need to hack and provide it manually */>
            {({store}) => (
                <Stage
                    width={window.innerWidth}
                    height={window.innerHeight}
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
                                        isLinking={isLinking(node)}
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
    );
};
