import React, {useEffect} from "react";
import {Bounds, Id, inflate} from "../../common/Model";
import {Background} from "./Background";
import {ResizeHandles} from "./ResizeHandle";
import {FocusFrame} from "./FocusFrame";
import {ContextButtons} from "./ContextButtons";
import {useAppDispatch} from "../../app/hooks";
import {continueLinking, endLinking} from "../classDiagram/diagramEditorSlice";

export interface ScaffoldProps {
    bounds: Bounds;
    isFocused: boolean;
    onResize: (suggestedBounds: Bounds) => void;
    isLinking: boolean;
    elementId: Id;
    linkingDrawing: () => JSX.Element
}

export const Scaffold = (props: ScaffoldProps) => {

    const dispatch = useAppDispatch()

    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            if (props.isFocused && props.isLinking) {
            dispatch(continueLinking({
                mousePos: {x: event.clientX, y: event.clientY},
                ctrlKey: event.ctrlKey,
                shiftKey: event.shiftKey,
                elementId: props.elementId}))
            }
        };

        const handleMouseUp = () => {
            if (props.isFocused && props.isLinking) {
                dispatch(endLinking())
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener(
                'mousemove',
                handleMouseMove
            );
            window.removeEventListener(
                'mouseup',
                handleMouseUp
            );
        };
    });


    const bounds = inflate(props.bounds, 12, 12);
    const buttonsPosition = {
        x: bounds.x + bounds.width + 5,
        y: bounds.y
    };

    return (
        <>
            <Background backgroundBounds={bounds} nodeBounds={props.bounds} onDrag={newBounds => props.onResize(newBounds)}/>
            <ResizeHandles perimeterBounds={bounds} nodeBounds={props.bounds}  onResize={newBounds => props.onResize(newBounds)}/>
            {props.isFocused && <FocusFrame bounds={bounds} />}
            {props.isFocused && !props.isLinking && <ContextButtons placement={buttonsPosition} elementId={props.elementId}/>}
            {props.isFocused && props.isLinking && props.linkingDrawing()}
        </>
    )
}

