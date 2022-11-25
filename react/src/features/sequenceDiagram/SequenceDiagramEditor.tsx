import {useAppDispatch, useAppSelector} from "../../app/hooks";
import {
    dropFromPalette,
    nodeDeselect,
    selectSequenceDiagramEditor
} from "../classDiagram/diagramEditorSlice";
import React, {RefObject} from "react";
import Konva from "konva";
import {Provider, ReactReduxContext} from "react-redux";
import {Layer, Stage} from "react-konva";
import {LifelineState} from "./model";
import {Lifeline} from "./Lifeline";
import {Message} from "./Message";

export const SequenceDiagramEditor = () => {
    const {diagram, selectedElements, focusedElement} = useAppSelector(state => selectSequenceDiagramEditor(state));
    const dispatch = useAppDispatch();
    const isSelected = (lifeline: LifelineState) => selectedElements.includes(lifeline.id);
    const isFocused = (lifeline : LifelineState) => focusedElement === lifeline.id;
    const checkDeselect = (e: Konva.KonvaEventObject<MouseEvent>) => {
        // deselect when clicked on empty area
        const clickedOnEmpty = e.target === e.target.getStage()
        if (clickedOnEmpty) {
            dispatch(nodeDeselect())
        }
    }

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
                                {Object.values(diagram.lifelines).map((lifeline, i) => {
                                    return (
                                        <Lifeline
                                            key={i}
                                            isSelected={isSelected(lifeline)}
                                            isFocused={isFocused(lifeline)}
                                            lifeline={lifeline}
                                        />
                                    );
                                })}
                                {Object.values(diagram.messages).map((message, i) => {
                                    return (
                                        <Message
                                            key={i}
                                            message={message}
                                        />
                                    )
                                })}
                            </Layer>
                        </Provider>
                    </Stage>
                )}
            </ReactReduxContext.Consumer>
        </div>
    );
}
