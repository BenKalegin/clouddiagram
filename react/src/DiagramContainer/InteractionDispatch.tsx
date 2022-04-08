import React from "react";
import {InteractionHandler} from "./DiagramCanvas";
import {DragMovableNodeInteraction} from "./DragMovableNodeInteraction";
import {DiagramElement} from "../Common/Model";


export class InteractionDispatch implements InteractionHandler {
    private activeInteraction?: InteractionHandler;

    onMouseDown(element: DiagramElement, x: number, y: number): void {
        if (!this.activeInteraction)
            this.activeInteraction = new DragMovableNodeInteraction();


        if (this.activeInteraction)
            this.activeInteraction.onMouseDown(element, x, y);
        else {
            console.log("Mouse down undecided");
        }
    }

    onMouseMove(element: DiagramElement, x: number, y: number): void {
    }

    onMouseUp(element: DiagramElement, x: number, y: number): void {
    }

}