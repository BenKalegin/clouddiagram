import {Node} from "./Node";
import React from "react";
import {Layer, Stage} from 'react-konva';
import Konva from "konva";
import {Link} from "./Link";
import {
    changeSelection,
    NodeState
} from "./classDiagramSlice";
import {ReactReduxContext, Provider} from 'react-redux';

import {useAppDispatch, useAppSelector} from "../../app/hooks";

export function DiagramCanvas() {
    const diagram = useAppSelector(state => state.diagram);
    const dispatch = useAppDispatch();

    const setSelectedIds = (selectedElementIds: string[]) => {
        dispatch(changeSelection(selectedElementIds))
    };

    // TODO move to actions
    const clearSelection = () => {
        setSelectedIds([])
    };
    const selectId = (id: string, append: boolean) => {
        if (!append) {
            setSelectedIds([id])
        } else {
            if (!diagram.selectedElementIds.includes(id)) {
                setSelectedIds([...diagram.selectedElementIds, id])
            } else
                setSelectedIds(diagram.selectedElementIds.filter(e => e !== id))
        }
    };

    const isSelected = (node: NodeState) => diagram.selectedElementIds.includes(node.id);
    const isFocused = (node: NodeState) => diagram.focusedElementId === node.id;


    const checkDeselect = (e: Konva.KonvaEventObject<MouseEvent>) => {
        // deselect when clicked on empty area
        const clickedOnEmpty = e.target === e.target.getStage()
        if (clickedOnEmpty) {
            clearSelection()
        }
    }

    return (
        <ReactReduxContext.Consumer>
            {({ store }) => (
                <Stage
                    width={window.innerWidth}
                    height={window.innerHeight}
                    onMouseDown={checkDeselect}
                >
                    <Provider store={store}>
                        <Layer>
                            {diagram.Nodes.map((node, i) => {
                                return (
                                    <Node
                                        key={i}
                                        isSelected={isSelected(node)}
                                        isFocused={isFocused(node)}
                                        onSelect={({evt}) => {
                                            selectId(node.id, evt.shiftKey || evt.ctrlKey);
                                        }}
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
