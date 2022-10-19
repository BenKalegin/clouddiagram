import {InteractionHandler} from "./DiagramCanvas";
import React from "react";
import {Coordinate, NodeState, ZeroCoordinate} from "../ClassDiagram/Models";
import {DiagramElement} from "../Common/Model";

export class DragMovableNodeInteraction implements InteractionHandler {
    private initialCoordinate?: Coordinate;
    private lastClientCoordinate?: Coordinate;

    onMouseDown(element: DiagramElement, clientX: number, clientY: number): void {
        this.start(element as NodeState, clientX, clientY);
    };

    onMouseMove(element: DiagramElement, clientX: number, clientY: number): void {
        this.move(element as NodeState, clientX, clientY);
    }

    onMouseUp(element: DiagramElement, clientX: number, clientY: number): void {
    }

    private start(node: NodeState, clientX: number, clientY: number) {
        this.initialCoordinate = {...node};
        this.lastClientCoordinate = {left: clientX, top: clientY};
    }

    private move(element: NodeState, clientX: number, clientY: number) {
        if(!this.initialCoordinate || !this.lastClientCoordinate )
            return;

        const deltaX = (clientX - this.lastClientCoordinate.left); // TODO /zoom
        const deltaY = (clientY - this.lastClientCoordinate.top);

        //const newCoordinate: Coordinate = { left: this.initialCoordinate.;

    }
}
