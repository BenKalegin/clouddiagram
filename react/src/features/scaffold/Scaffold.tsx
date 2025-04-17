import React, {useEffect} from "react";
import {Bounds, inflate} from "../../common/model";
import {ResizeHandles} from "./ResizeHandle";
import {FocusFrame} from "./FocusFrame";
import {ContextButtons} from "./ContextButtons";
import {ElementRef} from "../../package/packageModel";
import {linkingAction, LinkingPhase, useDispatch} from "../diagramEditor/diagramEditorSlice";

export interface ScaffoldProps {
    bounds: Bounds;
    isFocused: boolean;
    isLinking: boolean;
    element: ElementRef;
    excludeDiagonalResize?: boolean;
    excludeVerticalResize?: boolean;
    linkingDrawing: JSX.Element | undefined;
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
                    elementId: props.element.id
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
                    elementId: props.element.id
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
            <ResizeHandles
                perimeterBounds={bounds}
                nodeBounds={props.bounds}
                element={props.element}
                excludeDiagonal={props.excludeDiagonalResize}
                excludeVertical={props.excludeVerticalResize}
            />
            {props.isFocused && <FocusFrame bounds={bounds} />}
            {props.isFocused && !props.isLinking && <ContextButtons placement={buttonsPosition} elementId={props.element.id}/>}
            {props.isFocused && props.isLinking && props.linkingDrawing}
        </>
    )
}

