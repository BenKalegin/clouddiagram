import { DiagramHandler, Get, Set } from "../diagramEditor/diagramEditorSlice";
import { Action } from "@reduxjs/toolkit";
import { Bounds, Coordinate } from "../../common/model";
import { DiagramElement, ElementRef, Id } from "../../package/packageModel";
import { DiagramId } from "../diagramEditor/diagramEditorModel";
import { LinkId, LinkRender, PortRender, StructureDiagramState } from "./structureDiagramState";
export declare class StructureDiagramHandler implements DiagramHandler {
    private originalDiagramState;
    private startElement;
    private startNodePosition;
    handleAction(action: Action, get: Get, set: Set): void;
    snapToElements(get: Get, diagramPos: Coordinate): [Coordinate, DiagramElement] | undefined;
    connectNodes(get: Get, set: Set, sourceId: Id, target: ElementRef, diagramPos: Coordinate): void;
    createAndConnectTo(get: Get, set: Set, name: string): void;
    getElement(get: Get, ref: ElementRef, diagram: StructureDiagramState): DiagramElement;
}
/**
 * Search for a port at specified X,Y diagram position
 */
export declare function findPortAtPos(get: Get, pos: Coordinate, diagramId: string, tolerance: number): [Id?, Bounds?];
export declare const portRenderSelector: (param: {
    portId: Id;
    nodeId: Id;
    diagramId: Id;
}) => import("recoil").RecoilValueReadOnly<PortRender>;
export declare function findNodeAtPos(get: Get, pos: Coordinate, diagramId: string, tolerance: number): [Id?, Bounds?];
export declare const linkRenderSelector: (param: {
    linkId: LinkId;
    diagramId: DiagramId;
}) => import("recoil").RecoilValueReadOnly<LinkRender>;
export declare const drawingLinkRenderSelector: import("recoil").RecoilValueReadOnly<LinkRender>;
//# sourceMappingURL=structureDiagramHandler.d.ts.map