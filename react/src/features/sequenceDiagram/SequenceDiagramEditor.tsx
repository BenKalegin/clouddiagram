import {useAppDispatch, useAppSelector} from "../../app/hooks";
import {
    nodeDeselect
} from "../classDiagram/classDiagramSlice";
import React, {RefObject} from "react";
import Konva from "konva";
import {Provider, ReactReduxContext} from "react-redux";
import {Layer, Stage} from "react-konva";
import {LifelineState} from "./model";
import {Lifeline} from "./Lifeline";
import {Message} from "./Message";
import {selectSequenceDiagramEditor} from "./sequenceDiagramSlice";

export const SequenceDiagramEditor = () => {
    const {diagram, selectedElements, focusedElement, linking} = useAppSelector(state => selectSequenceDiagramEditor(state));
    const dispatch = useAppDispatch();
    const isSelected = (lifeline: LifelineState) => selectedElements.includes(lifeline.id);
    const isFocused = (lifeline : LifelineState) => focusedElement === lifeline.id;
    const isLinking = () => linking?.drawing === true;
    const checkDeselect = (e: Konva.KonvaEventObject<MouseEvent>) => {
        // deselect when clicked on empty area
        const clickedOnEmpty = e.target === e.target.getStage()
        if (clickedOnEmpty) {
            dispatch(nodeDeselect())
        }
    }

    const stageRef: RefObject<Konva.Stage> = React.useRef(null);

    return (
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
                                        isLinking={isLinking()}
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
    );
}
