import React from "react";
import {InteractionHandler} from "./DiagramCanvas";
import {DragMovableNodeInteraction} from "./DragMovableNodeInteraction";


export class InteractionDispatch implements InteractionHandler {
    private activeInteraction?: InteractionHandler;

    onMouseDown(event: React.MouseEvent<Element>): void {
        if (!this.activeInteraction)
            this.activeInteraction = new DragMovableNodeInteraction();


        if (this.activeInteraction)
            this.activeInteraction.onMouseDown(event);
        else {
            console.log("Mouse down undecided");
        }
    }

    onMouseMove(event: React.MouseEvent<Element>): void {
    }

    onMouseUp(event: React.MouseEvent<Element>): void {
    }
}