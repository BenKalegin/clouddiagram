import {InteractionHandler} from "./DiagramCanvas";
import React from "react";

export class DragMovableNodeInteraction implements InteractionHandler {
    onMouseDown(event: React.MouseEvent<Element>): void {
        console.log(typeof event.target);
    }

    onMouseMove(event: React.MouseEvent<Element>): void {
    }

    onMouseUp(event: React.MouseEvent<Element>): void {
    }
}