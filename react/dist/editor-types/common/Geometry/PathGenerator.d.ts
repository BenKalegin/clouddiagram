import { Bounds, Coordinate } from "../model";
import { PortAlignment, PortState, TipStyle, RouteStyle } from "../../package/packageModel";
import { PortPlacement } from "../../features/structureDiagram/structureDiagramState";
export declare const getCurvePoint: (pX: number, pY: number, cX: number, cY: number, alignment?: PortAlignment) => Coordinate;
export declare const generatePath: (source: PortState, sourceBounds: Bounds, sourcePlacement: PortPlacement, target: PortState, targetBounds: Bounds, targetPlacement: PortPlacement, routeStyle: RouteStyle, tipStyle1: TipStyle, tipStyle2: TipStyle) => string[];
//# sourceMappingURL=PathGenerator.d.ts.map