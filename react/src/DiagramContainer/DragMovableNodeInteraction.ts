import {InteractionHandler} from "./DiagramCanvas";
import React from "react";
import {NodeState} from "../ClassDiagram/Models";
import {DiagramElement} from "../Common/Model";

export class DragMovableNodeInteraction implements InteractionHandler {

    onMouseDown(element: DiagramElement, x: number, y: number): void {
        this.start(element as NodeState, x, y);
    };

    private start(node: NodeState, clientX: number, clientY: number) {
        console.log(node);
    }

    onMouseMove(event: React.MouseEvent<Element>): void {
    }

    onMouseUp(event: React.MouseEvent<Element>): void {
    }

}