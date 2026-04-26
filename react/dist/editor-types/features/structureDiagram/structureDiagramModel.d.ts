import { Get, Set } from "../diagramEditor/diagramEditorSlice";
import { ElementRef, Id, NodeState, PortState, RouteStyle, TipStyle } from "../../package/packageModel";
import { Bounds, Coordinate } from "../../common/model";
import { DiagramId } from "../diagramEditor/diagramEditorModel";
import { LinkRender, NodeId, NodePlacement, PortPlacement, StructureDiagramState } from "./structureDiagramState";
export declare const moveElementImpl: (get: Get, set: Set, element: ElementRef, currentPointerPos: Coordinate, startPointerPos: Coordinate, startNodePos: Coordinate, snap?: boolean) => void;
export declare const moveElement: (get: Get, set: Set, ...args: any[]) => void;
export declare const resizeElementImpl: (get: Get, set: Set, element: ElementRef, suggestedBounds: Bounds) => void;
export declare const resizeElement: (get: Get, set: Set, ...args: any[]) => void;
export declare const structureDiagramSelector: (param: string) => import("recoil").RecoilState<StructureDiagramState>;
export declare const nodePlacementSelector: (param: {
    nodeId: NodeId;
    diagramId: DiagramId;
}) => import("recoil").RecoilValueReadOnly<NodePlacement>;
export declare const portPlacementSelector: (param: {
    portId: Id;
    diagramId: Id;
}) => import("recoil").RecoilValueReadOnly<PortPlacement>;
export declare const autoConnectNodes: (get: Get, set: Set, ...args: any[]) => void;
export declare const addNodeAndConnect: (get: Get, set: Set, ...args: any[]) => void;
export declare const addNewElementAt: (get: Get, set: Set, ...args: any[]) => ElementRef;
export declare enum SelectDirection {
    North = 0,
    South = 1,
    East = 2,
    West = 3
}
export declare const handleStructureElementCommand: (get: Get, set: Set, ...args: any[]) => void;
export declare const handleStructureElementPropertyChanged: (get: Get, set: Set, elements: ElementRef[], propertyName: string, value: any) => void;
export declare const renderLink: (sourcePort: PortState, sourceBounds: Bounds, sourcePlacement: PortPlacement, targetPort: PortState, targetBounds: Bounds, targetPlacement: PortPlacement, linkStyle: RouteStyle, tipStyle1: TipStyle, tipStyle2: TipStyle) => LinkRender;
export declare function addNewPort(_get: Get, set: Set, node: NodeState): PortState;
export declare const portSelector: (param: string) => import("recoil").RecoilValueReadOnly<PortState>;
export declare const portBounds: (nodePlacement: Bounds, port: PortState, portPlacement: PortPlacement) => Bounds;
//# sourceMappingURL=structureDiagramModel.d.ts.map