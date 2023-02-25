import React, {useEffect} from "react";
import {Bounds, inflate} from "../../common/model";
import {Background} from "./Background";
import {ResizeHandles} from "./ResizeHandle";
import {FocusFrame} from "./FocusFrame";
import {ContextButtons} from "./ContextButtons";
import {Id} from "../../package/packageModel";
import {linkingAction, LinkingPhase, useDispatch} from "../diagramEditor/diagramEditorSlice";

export interface ScaffoldProps {
    bounds: Bounds;
    isFocused: boolean;
    isLinking: boolean;
    elementId: Id;
    linkingDrawing: JSX.Element
}

export const Scaffold = (props: ScaffoldProps) => {
    const dispatch = useDispatch()

    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            if (props.isFocused && props.isLinking) {
                dispatch(linkingAction({
                    diagramPos: undefined,
                    mousePos: {x: event.clientX, y: event.clientY},
                    ctrlKey: event.ctrlKey,
                    shiftKey: event.shiftKey,
                    phase: LinkingPhase.draw,
                    elementId: props.elementId
                }))
            }
        };

        const handleMouseUp = (event: MouseEvent) => {
            if (props.isFocused && props.isLinking) {
                dispatch(linkingAction({
                    diagramPos: undefined,
                    mousePos: {x: event.clientX, y: event.clientY},
                    ctrlKey: event.ctrlKey,
                    shiftKey: event.shiftKey,
                    phase: LinkingPhase.end,
                    elementId: props.elementId
                }))
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
            <Background
                originId={props.elementId}
                backgroundBounds={bounds}
                nodeBounds={props.bounds}
            />
            <ResizeHandles
                perimeterBounds={bounds}
                nodeBounds={props.bounds}
                elementId={props.elementId}
            />
            {props.isFocused && <FocusFrame bounds={bounds} />}
            {props.isFocused && !props.isLinking && <ContextButtons placement={buttonsPosition} elementId={props.elementId}/>}
            {props.isFocused && props.isLinking && props.linkingDrawing}
        </>
    )
}

