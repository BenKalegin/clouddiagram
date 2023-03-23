import {Bounds, Coordinate} from "../../common/model";
import React, {useContext} from "react";
import {Rect} from "react-konva";
import {
    elementMoveAction,
    ElementMoveResizePhase,
    screenToCanvas,
    useDispatch
} from "../diagramEditor/diagramEditorSlice";
import {IdAndKind} from "../../package/packageModel";
import {AppLayout, AppLayoutContext} from "../../app/AppModel";

export interface BackgroundProps {
    backgroundBounds: Bounds;
    nodeBounds: Bounds;
    origin: IdAndKind
}

export const Background = (props: BackgroundProps) => {

    const [startNodePos, setStartNodePos] = React.useState<Coordinate | undefined>();
    const [startPointerPos, setStartPointerPos] = React.useState<Coordinate | undefined>();

    const dispatch = useDispatch()
    const {appLayout, setAppLayout} = useContext(AppLayoutContext);
    const handleDrawerClose = () => {
        const newLayout: AppLayout = {...appLayout, propsPaneOpen: !appLayout.propsPaneOpen};
        setAppLayout(newLayout);
    };

    return (
        <Rect
            {...props.backgroundBounds}
            fill={"transparent"}
            stroke={""}
            strokeWidth={0}
            draggable={true}
            onDragStart={(e) => {
                const pos = screenToCanvas(e);
                setStartNodePos(props.nodeBounds);
                setStartPointerPos(pos);

                dispatch(elementMoveAction({
                    phase: ElementMoveResizePhase.start,
                    element: props.origin,
                    startNodePos: {x: props.nodeBounds.x, y: props.nodeBounds.y},
                    startPointerPos: pos,
                    currentPointerPos: pos}))
            }}
            onDragMove={(e) => {
                if (startPointerPos && startNodePos)
                    dispatch(elementMoveAction({
                        phase: ElementMoveResizePhase.move,
                        element: props.origin,
                        startNodePos: startNodePos,
                        startPointerPos: startPointerPos,
                        currentPointerPos: screenToCanvas(e)}));
            }}

            onDragEnd={(e) => {
                // check required because DragMove event can be received before DragStart updated the state
                if (startPointerPos && startNodePos)
                    dispatch(elementMoveAction({
                        phase: ElementMoveResizePhase.end,
                        element: props.origin,
                        startNodePos: startNodePos,
                        startPointerPos: startPointerPos,
                        currentPointerPos: screenToCanvas(e)}));
                }
            }
            onDblClick={handleDrawerClose}
        />
    );
};

