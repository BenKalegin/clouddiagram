import {Action} from "@reduxjs/toolkit";
import {Get, Set} from "../diagramEditor/diagramEditorSlice";
import {StructureDiagramHandler} from "../structureDiagram/structureDiagramHandler";
import {ElementRef, Id, RouteStyle, TipStyle} from "../../package/packageModel";
import {Coordinate} from "../../common/model";
import {autoConnectNodes} from "../structureDiagram/structureDiagramModel";

class MindMapDiagramHandler extends StructureDiagramHandler {
    handleAction(action: Action, get: Get, set: Set): void {
        super.handleAction(action, get, set);
    }

    connectNodes(get: Get, set: Set, sourceId: Id, target: ElementRef, diagramPos: Coordinate): void {
        autoConnectNodes(get, set, sourceId, target, {
            routeStyle: RouteStyle.Bezier,
            tipStyle1: TipStyle.None,
            tipStyle2: TipStyle.None,
        });
    }
}

export const mindMapDiagramEditor = new MindMapDiagramHandler();
