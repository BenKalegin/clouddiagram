import {Bounds, Coordinate} from "../../common/model";
import React, {RefObject, useContext, useState} from "react";
import {Group, Path, Rect} from "react-konva";
import Konva from "konva";
import {Id} from "../../package/packageModel";
import {
    linkingAction,
    LinkingPhase,
    screenToCanvas, showContextAction,
    useDispatch
} from "../diagramEditor/diagramEditorSlice";
import KonvaEventObject = Konva.KonvaEventObject;
import {AppLayoutContext} from "../../app/AppModel";

interface ContextButtonProps {
    svgPath: string
    placement: Bounds
    draggable?: boolean
    onMouseDown?: (mousePos: Coordinate, relativePos: Coordinate, shiftKey: boolean, ctrlKey: boolean) => void
}

export const ContextButton = (props: ContextButtonProps) => {
    const [isHover, setIsHover] = useState(false);
    const scaleX = 1;
    const groupRef: RefObject<Konva.Group> = React.useRef(null);

    const { appLayout } = useContext(AppLayoutContext);

    return (
        <Group {...props.placement}
            ref={groupRef}
            onMouseEnter={() => {setIsHover(true)}}
            onMouseLeave={() => {setIsHover(false)}}
            onMouseDown={(e: KonvaEventObject<MouseEvent>) => {
               e.cancelBubble = true;

               if(props.onMouseDown != null) {
                   const canvasPos = screenToCanvas(e)
                   props.onMouseDown({x: e.evt.x, y: e.evt.y}, canvasPos, e.evt.shiftKey, e.evt.ctrlKey)
               }
           }}
        >
            <Rect
              width={props.placement.width - 2}
              height={props.placement.height - 2}
              fill={"transparent"}
              strokeWeight={0}
            />
            <Path
                width={props.placement.width - 2}
                height={props.placement.height - 2}
                data={props.svgPath}
                fill={isHover ? appLayout.darkMode ? "white" : "black" : appLayout.darkMode ? "darkgray": "darkgray"}
                stroke="transparent"
                strokeWidth={1 / scaleX}
            />
        </Group>
    )
}

interface ContextButtonsProps {
    placement: Coordinate
    elementId: Id
}

export const ContextButtons = (props: ContextButtonsProps) => {
    const {x, y} = props.placement;
    const dispatch = useDispatch()
    return (
        <>
            <ContextButton
                svgPath={"m12 4-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"}
                placement={{x: x, y: y, width: 16, height: 16}}
                onMouseDown={(mousePos, diagramPos, shiftKey, ctrlKey) => {
                    dispatch(linkingAction(
                    {
                        elementId: props.elementId,
                        mousePos: mousePos,
                        diagramPos: diagramPos,
                        phase: LinkingPhase.start,
                        shiftKey: shiftKey,
                        ctrlKey: ctrlKey
                    }))
                    }
                }
            />
            <ContextButton
                svgPath={"M19.43 12.98c.04-.32.07-.66.07-1s-.03-.68-.07-1l-2.11-.45a5.84 5.84 0 0 0-.42-1.03l1.2-1.67a8.07 8.07 0 0 0-1.92-1.92l-1.67 1.2c-.33-.17-.68-.31-1.03-.42L12.98 4.5a8.07 8.07 0 0 0-2 0l-.45 2.11c-.35.11-.7.25-1.03.42l-1.67-1.2a8.07 8.07 0 0 0-1.92 1.92l1.2 1.67c-.17.33-.31.68-.42 1.03L4.57 11c-.04.32-.07.66-.07 1s.03.68.07 1l2.11.45c.11.35.25.7.42 1.03l-1.2 1.67a8.07 8.07 0 0 0 1.92 1.92l1.67-1.2c.33.17.68.31 1.03.42l.45 2.11c.32.04.66.07 1 .07s.68-.03 1-.07l.45-2.11c.35-.11.7-.25 1.03-.42l1.67 1.2a8.07 8.07 0 0 0 1.92-1.92l-1.2-1.67c.17-.33.31-.68.42-1.03l2.11-.45zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"}
                placement={{x: x, y: y + 20, width: 16, height: 16}}
                onMouseDown={(mousePos, diagramPos) => {
                    dispatch(showContextAction(
                        {
                            elementId: props.elementId,
                            mousePos: mousePos,
                            diagramPos: diagramPos,
                        }
                    ));
                }}
            />
        </>
    )
}
