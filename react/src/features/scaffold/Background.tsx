import {Bounds} from "../../common/model";
import React, {useContext} from "react";
import {Rect} from "react-konva";
import {ElementRef} from "../../package/packageModel";
import {AppLayout, AppLayoutContext} from "../../app/AppModel";
import {useCustomDispatch} from "../diagramEditor/commonHandlers";
import {DiagramId} from "../diagramEditor/diagramEditorModel";

export interface BackgroundProps {
    backgroundBounds: Bounds;
    nodeBounds: Bounds;
    origin: ElementRef
    diagramId: DiagramId
}

export const Background = (props: BackgroundProps) => {
    const {appLayout, setAppLayout} = useContext(AppLayoutContext);
    const handleDrawerClose = () => {
        const newLayout: AppLayout = {...appLayout, propsPaneOpen: !appLayout.propsPaneOpen};
        setAppLayout(newLayout);
    };

    const eventHandlers = useCustomDispatch({
        onClick: true,
        onDrag: true,
        element: props.origin,
        diagramId: props.diagramId,
        bounds: props.nodeBounds
    });

    const originalOnClick = eventHandlers.onClick;
    eventHandlers.onClick = (evt) => {
        if (originalOnClick) {
            originalOnClick(evt);
        }
        if (!evt.evt.shiftKey && !evt.evt.ctrlKey)
            handleDrawerClose();
    };

    return (
        <Rect
            {...props.backgroundBounds}
            {...eventHandlers}
            fill={"transparent"}
            stroke={""}
            strokeWidth={0}
            draggable={true}
            listening={true}
            onDblClick={handleDrawerClose}
        />
    );
};

