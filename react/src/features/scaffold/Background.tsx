import {Bounds} from "../../common/model";
import React, {useContext} from "react";
import {Rect} from "react-konva";
import {ElementRef} from "../../package/packageModel";
import {AppLayout, AppLayoutContext} from "../../app/AppModel";
import {useCustomDispatch} from "../diagramEditor/commonHandlers";

export interface BackgroundProps {
    backgroundBounds: Bounds;
    nodeBounds: Bounds;
    origin: ElementRef
}

export const Background = (props: BackgroundProps) => {
    const {appLayout, setAppLayout} = useContext(AppLayoutContext);
    const handleDrawerClose = () => {
        const newLayout: AppLayout = {...appLayout, propsPaneOpen: !appLayout.propsPaneOpen};
        setAppLayout(newLayout);
    };

    const eventHandlers = useCustomDispatch({
        onClick: false,
        onDrag: true,
        element: props.origin,
        diagramId: "",
        bounds: props.nodeBounds
    });


    return (
        <Rect
            {...props.backgroundBounds}
            {...eventHandlers}
            fill={"transparent"}
            stroke={""}
            strokeWidth={0}
            draggable={true}
            onClick={handleDrawerClose}
            onDblClick={handleDrawerClose}
        />
    );
};

