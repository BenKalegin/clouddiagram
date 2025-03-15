import {BezierSpline} from "./BezierSpline";
import {Bounds, center, Coordinate} from "../model";
import {PortAlignment, PortState} from "../../package/packageModel";
import {PortPlacement} from "../../features/structureDiagram/structureDiagramState";

export class PathGeneratorResult {
    constructor(public path: string[], public sourceMarkerAngle?: number, public sourceMarkerPosition?: Coordinate,
                public targetMarkerAngle?: number, public targetMarkerPosition?: Coordinate) {
    }
}

export class PathGenerators {
    private static _margin = 125;

    static SourceMarkerAdjustment = (route: Coordinate[], markerWidth: number) => {
        const angleInRadians = Math.atan2(route[1].y - route[0].y, route[1].x - route[0].x) + Math.PI;
        var xChange = markerWidth * Math.cos(angleInRadians);
        var yChange = markerWidth * Math.sin(angleInRadians);
        route[0] = {x: route[0].x - xChange, y: route[0].y - yChange};
        return angleInRadians * 180 / Math.PI;
    }

    static TargetMarkerAdjustment = (route: Coordinate[], markerWidth: number) => {
        const angleInRadians = Math.atan2(route[route.length - 1].y - route[route.length - 2].y, route[route.length - 1].x - route[route.length - 2].x)
        const xChange = markerWidth * Math.cos(angleInRadians);
        const yChange = markerWidth * Math.sin(angleInRadians);
        route[route.length - 1] = {x: route[route.length - 1].x - xChange, y: route[route.length - 1].y - yChange}
        return angleInRadians * 180 / Math.PI;
    }

    static ConcatRouteAndSourceAndTarget(route: Coordinate[], sourcePlacement: Bounds,
                                         targetPlacement: Bounds): Coordinate[] {
        return [center(sourcePlacement), ...route, center(targetPlacement)];
    }

    static CurveThroughPoints = (route: Coordinate[]) => {
        let sourceAngle: number | undefined;
        let targetAngle: number | undefined;

        // if (link.port1.marker)
        sourceAngle = PathGenerators.SourceMarkerAdjustment(route, 0);

        //if (link.port2.marker)
        targetAngle = PathGenerators.TargetMarkerAdjustment(route, 0);

        const {firstControlPoints, secondControlPoints} = BezierSpline.GetCurveControlPoints(route)
        var paths = new Array<string>(firstControlPoints.length);

        for (let i = 0; i < firstControlPoints.length; i++) {
            const cp1 = firstControlPoints[i]
            const cp2 = secondControlPoints[i]
            paths[i] = `M ${route[i].x} ${route[i].y} C ${cp1.x} ${cp1.y} ${cp2.x} ${cp2.y} ${route[i + 1].x} ${route[i + 1].y}`
        }
        // Todo: adjust marker positions based on closest control points
        return new PathGeneratorResult(paths, sourceAngle, route[0], targetAngle, route[route.length - 1])
    }

    static GetCurvePoint = (pX: number, pY: number, cX: number, cY: number, alignment?: PortAlignment): Coordinate => {
        const margin = Math.min(PathGenerators._margin, Math.pow(Math.pow(pX - cX, 2) + Math.pow(pY - cY, 2), .5));
        switch (alignment) {
            case PortAlignment.Top:
                return {x: pX, y: Math.min(pY - margin, cY)}
            case PortAlignment.Bottom:
                return {x: pX, y: Math.max(pY + margin, cY)}
            // case PortAlignment.TopRight:
            //     return {x: Math.max(pX + margin, cX), y: Math.min(pY - margin, cY)}
            // case PortAlignment.BottomRight:
            //     return {x: Math.max(pX + margin, cX), y: Math.max(pY + margin, cY)}
            case PortAlignment.Right:
                return {x: Math.max(pX + margin, cX), y: pY}
            case PortAlignment.Left:
                return {x: Math.min(pX - margin, cX), y: pY}
            // case PortAlignment.BottomLeft:
            //     return {x: Math.min(pX - margin, cX), y: Math.max(pY + margin, cY)}
            // case PortAlignment.TopLeft:
            //     return {x: Math.min(pX - margin, cX), y: Math.min(pY - margin, cY)}
        }
        throw new Error("Invalid alignment: " + alignment);
    }

    static GetRouteWithCurvePoints = (route: Coordinate[], source: PortState, sourcePlacement: PortPlacement,
                                      target: PortState, targetPlacement: PortPlacement): Coordinate[] => {
        if (!source) {
            if (Math.abs(route[0].x - route[1].x) >= Math.abs(route[0].y - route[1].y)) {
                const cX = (route[0].x + route[1].x) / 2;
                return [route[0], {x: cX, y: route[0].y}, {x: cX, y: route[1].y}, route[1]]
            } else {
                const cY = (route[0].y + route[1].y) / 2;
                return [route[0], {x: route[0].x, y: cY}, {x: route[1].x, y: cY}, route[1]]
            }
        } else {
            const cX = (route[0].x + route[1].x) / 2
            const cY = (route[0].y + route[1].y) / 2
            const curvePointA = PathGenerators.GetCurvePoint(route[0].x, route[0].y, cX, cY, sourcePlacement.alignment)
            const curvePointB = PathGenerators.GetCurvePoint(route[1].x, route[1].y, cX, cY, targetPlacement.alignment)
            return [route[0], curvePointA, curvePointB, route[1]]
        }
    }


    public static Bezier = (route: Coordinate[], source: PortState, sourceBounds: Bounds, sourcePlacement: PortPlacement,
                            target: PortState, targetBounds: Bounds, targetPlacement: PortPlacement) => {
        route = PathGenerators.ConcatRouteAndSourceAndTarget(route, sourceBounds, targetBounds);

        if (route.length > 2) {
            return PathGenerators.CurveThroughPoints(route);
        }

        route = PathGenerators.GetRouteWithCurvePoints(route, source, sourcePlacement, target, targetPlacement);
        let sourceAngle: number | undefined;
        let targetAngle: number | undefined;

        const markerWidth1 = /*link.port1.longitude*/ 0;
        sourceAngle = PathGenerators.SourceMarkerAdjustment(route, markerWidth1);

        const markerWidth2 = /*link.port2.longitude*/ 0;
        targetAngle = PathGenerators.TargetMarkerAdjustment(route, markerWidth2);

        const path = `
          M ${route[0].x} ${route[0].y}
          C ${route[1].x} ${route[1].y}, ${route[2].x} ${route[2].y}, ${route[3].x} ${route[3].y}
          C ${route[2].x} ${route[2].y}, ${route[1].x} ${route[1].y}, ${route[0].x} ${route[0].y} Z
        `;
        return new PathGeneratorResult([path], sourceAngle, route[0], targetAngle, route[route.length - 1]);
    }

    public static Direct = (route: Coordinate[], source: PortState, sourceBounds: Bounds, sourcePlacement: PortPlacement,
                            target: PortState, targetBounds: Bounds, targetPlacement: PortPlacement) => {
        route = PathGenerators.ConcatRouteAndSourceAndTarget(route, sourceBounds, targetBounds);

        let sourceAngle: number | undefined;
        let targetAngle: number | undefined;

        sourceAngle = PathGenerators.SourceMarkerAdjustment(route, source.longitude / 2);
        targetAngle = PathGenerators.TargetMarkerAdjustment(route, target.longitude / 2);

        const path = `M ${route[0].x} ${route[0].y} L ${route[route.length - 1].x} ${route[route.length - 1].y}`;
        return new PathGeneratorResult([path], sourceAngle, route[0], targetAngle, route[route.length - 1]);
    }

    public static LateralHorizontal = (route: Coordinate[], source: PortState, sourceBounds: Bounds, sourcePlacement: PortPlacement,
                                       target: PortState, targetBounds: Bounds, targetPlacement: PortPlacement) => {
        route = PathGenerators.ConcatRouteAndSourceAndTarget(route, sourceBounds, targetBounds);
        route = PathGenerators.GetRouteWithCurvePoints(route, source, sourcePlacement, target, targetPlacement);
        let sourceAngle: number | undefined;
        let targetAngle: number | undefined;

        //if (link.port1.marker)
        sourceAngle = PathGenerators.SourceMarkerAdjustment(route, source.longitude / 2);

        //if (link.port2.marker)
        targetAngle = PathGenerators.TargetMarkerAdjustment(route, target.longitude / 2);

        const paths = new Array<string>(route.length - 1);
        for (let i = 0; i < route.length - 1; i++) {
            paths[i] = `M ${route[i].x} ${route[i].y} L ${route[i + 1].x} ${route[i + 1].y}`
        }

        return new PathGeneratorResult(paths, sourceAngle, route[0], targetAngle, route[route.length - 1]);
    }
}
