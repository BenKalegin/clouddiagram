import React, {useEffect, useState} from "react";
import {Bounds, ConnectorPlacement, Coordinate, Id, inflate, zeroCoordinate} from "../../common/Model";
import {Background} from "./Background";
import {ResizeHandles} from "./ResizeHandle";
import {FocusFrame} from "./FocusFrame";
import {ContextButtons} from "./ContextButtons";
import {SuggestedMessage} from "./SuggestedMessage";
import {useDispatch} from "react-redux";
import {useAppDispatch} from "../../app/hooks";
import {continueLinking} from "../classDiagram/diagramEditorSlice";

export interface ScaffoldProps {
    bounds: Bounds;
    isFocused: boolean;
    onResize: (suggestedBounds: Bounds) => void;
    isLinking: boolean;
    elementId: Id;
    onLinkingDraw: () => Element

    resizeEnabled?: boolean;
    borderEnabled?: boolean;
    borderStroke?: string;
    borderStrokeWidth?: number;
    borderDash?: Array<number>;
    anchorFill?: string;
    anchorStroke?: string;
    anchorStrokeWidth?: number;
    anchorSize?: number;
    anchorCornerRadius?: number;
    keepRatio?: boolean;
    centeredScaling?: boolean;
    enabledAnchors?: Array<string>;
    ignoreStroke?: boolean;
    useSingleNodeRotation?: boolean;
    shouldOverdrawWholeArea?: boolean;
}

export const Scaffold = (props: ScaffoldProps) => {

    const dispatch = useAppDispatch()

    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            dispatch(continueLinking({
                mousePos: {x: event.clientX, y: event.clientY},
                ctrlKey: event.ctrlKey,
                shiftKey: event.shiftKey,
                elementId: props.elementId}))
        };

        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener(
                'mousemove',
                handleMouseMove
            );
        };
    }, []);


    const bounds = inflate(props.bounds, 12, 12);
    const buttonsPosition = {
        x: bounds.x + bounds.width + 5,
        y: bounds.y
    };

    return (
        <>
            <Background bounds={bounds} onDrag={newBounds => props.onResize(newBounds)}/>
            <ResizeHandles bounds={bounds} onResize={newBounds => props.onResize(newBounds)}/>
            {props.isFocused && <FocusFrame bounds={bounds} />}
            {props.isFocused && !props.isLinking && <ContextButtons placement={buttonsPosition} elementId={props.elementId}/>}
            {props.isFocused && props.isLinking && props.onLinkingDraw(props.)/>}
        </>
    )
}

