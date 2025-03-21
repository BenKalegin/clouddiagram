import {BezierSpline} from "./BezierSpline";
import {Bounds, center, Coordinate} from "../model";
import {MarkerStyle, PortAlignment, PortState} from "../../package/packageModel";
import {PortPlacement} from "../../features/structureDiagram/structureDiagramState";

export type PathGeneratorResult = {
    path: string[];
    sourceMarkerAngle?: number;
    sourceMarkerPosition?: Coordinate;
    targetMarkerAngle?: number;
    targetMarkerPosition?: Coordinate;
}

function drawArrowTip(pointTo: Coordinate, size: Coordinate, sourceAngle: number): string {
    const PI2 = Math.PI * 2;

    // Normalize angle to 0-2π range
    const radians = (sourceAngle + PI2) % PI2;

    // Calculate the two points that form the arrow
    const leftPoint = {
        x: pointTo.x + size.x * Math.cos(radians + Math.PI * 0.85),
        y: pointTo.y + size.y * Math.sin(radians + Math.PI * 0.85)
    };

    const rightPoint = {
        x: pointTo.x + size.x * Math.cos(radians - Math.PI * 0.85),
        y: pointTo.y + size.y * Math.sin(radians - Math.PI * 0.85)
    };

    return `M ${pointTo.x} ${pointTo.y} 
            L ${leftPoint.x} ${leftPoint.y}
            M ${pointTo.x} ${pointTo.y}
            L ${rightPoint.x} ${rightPoint.y}`;
}

const calculateStartAndEndAngles = (route: Coordinate[]) => {
    return {
        startAngle: Math.atan2(route[0].y - route[1].y, route[0].x - route[1].x),
        endAngle: Math.atan2(route[route.length - 1].y - route[route.length - 2].y, route[route.length - 1].x - route[route.length - 2].x)
    }
}

const adjustRouteToFitMarkers = (route: Coordinate[],
                                 markerWidth1: number, markerWidth2: number,
                                 angle1: number, angle2: number): Coordinate[] => {

    // For source, we want to move away from the second point
    // For target, we want to move toward the second-to-last point
    const newRoute = [...route];
    newRoute[0] = {
        x: route[0].x - markerWidth1 * Math.cos(angle1),
        y: route[0].y - markerWidth1 * Math.sin(angle1)
    };

    newRoute[newRoute.length - 1] = {
        x: route[route.length - 1].x - markerWidth2 * Math.cos(angle2),
        y: route[route.length - 1].y - markerWidth2 * Math.sin(angle2)
    };
    return newRoute;
}

function concatRouteAndSourceAndTarget(route: Coordinate[], sourcePlacement: Bounds,
    targetPlacement: Bounds): Coordinate[] {
    return [center(sourcePlacement), ...route, center(targetPlacement)];
}


export class PathGenerators {
    private static _margin = 25;

    static CurveThroughPoints = (route: Coordinate[]) => {

        const {firstControlPoints, secondControlPoints} = BezierSpline.GetCurveControlPoints(route)
        const paths = new Array<string>(firstControlPoints.length);

        for (let i = 0; i < firstControlPoints.length; i++) {
            const cp1 = firstControlPoints[i]
            const cp2 = secondControlPoints[i]
            paths[i] = `M ${route[i].x} ${route[i].y} C ${cp1.x} ${cp1.y} ${cp2.x} ${cp2.y} ${route[i + 1].x} ${route[i + 1].y}`
        }
        const { startAngle, endAngle } = calculateStartAndEndAngles(route);
        return {
            path: paths,
            sourceMarkerAngle: startAngle,
            sourceMarkerPosition: route[0],
            targetMarkerAngle: endAngle,
            targetMarkerPosition: route[route.length - 1]
        } as PathGeneratorResult;
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
        route = concatRouteAndSourceAndTarget(route, sourceBounds, targetBounds);

        if (route.length > 2) {
            return PathGenerators.CurveThroughPoints(route).path
        }

        route = PathGenerators.GetRouteWithCurvePoints(route, source, sourcePlacement, target, targetPlacement);

        const path = `
          M ${route[0].x} ${route[0].y}
          C ${route[1].x} ${route[1].y}, ${route[2].x} ${route[2].y}, ${route[3].x} ${route[3].y}
          C ${route[2].x} ${route[2].y}, ${route[1].x} ${route[1].y}, ${route[0].x} ${route[0].y} Z`;
        return [path]
    }

    public static Direct = (route: Coordinate[], source: PortState, sourceBounds: Bounds, sourcePlacement: PortPlacement,
                            target: PortState, targetBounds: Bounds, targetPlacement: PortPlacement, markerStyle1: MarkerStyle, markerStyle2: MarkerStyle) => {
        route = concatRouteAndSourceAndTarget(route, sourceBounds, targetBounds);

        const {startAngle, endAngle} = calculateStartAndEndAngles(route);
        route = adjustRouteToFitMarkers(route, source.longitude / 2, target.longitude / 2, startAngle, endAngle);

        const path = `M ${route[0].x} ${route[0].y} L ${route[route.length - 1].x} ${route[route.length - 1].y}`;
        const result = new Array<string>();
        const tipSize = {x: 10, y: 8};
        if (markerStyle1 === MarkerStyle.Arrow) {
            const arrow = drawArrowTip(route[0], tipSize,  startAngle);
            result.push(arrow);
        }

        result.push(path);

        if(markerStyle2 === MarkerStyle.Arrow) {
            const arrow = drawArrowTip(route[route.length-1], tipSize, endAngle);
            result.push(arrow);
        }


        return result;
    }

    public static LateralHorizontal = (route: Coordinate[], source: PortState, sourceBounds: Bounds, sourcePlacement: PortPlacement,
                                       target: PortState, targetBounds: Bounds, targetPlacement: PortPlacement) => {
        route = concatRouteAndSourceAndTarget(route, sourceBounds, targetBounds);

        if (Math.abs(route[0].x - route[1].x) < PathGenerators._margin * 2 &&
            Math.abs(route[0].y - route[1].y) < PathGenerators._margin * 2) {
            return PathGenerators.Bezier([], source, sourceBounds, sourcePlacement, target, targetBounds, targetPlacement);
        }

        route = PathGenerators.GetRouteWithCurvePoints(route, source, sourcePlacement, target, targetPlacement);

        const paths = new Array<string>(route.length - 1);
        for (let i = 0; i < route.length - 1; i++) {
            paths[i] = `M ${route[i].x} ${route[i].y} L ${route[i + 1].x} ${route[i + 1].y}`;
        }

        return paths
    }

    public static LateralVertical = (route: Coordinate[], source: PortState, sourceBounds: Bounds, sourcePlacement: PortPlacement,
                                     target: PortState, targetBounds: Bounds, targetPlacement: PortPlacement) => {
        route = concatRouteAndSourceAndTarget(route, sourceBounds, targetBounds);

        // Handle close nodes differently
        if (Math.abs(route[0].x - route[1].x) < PathGenerators._margin * 2 &&
            Math.abs(route[0].y - route[1].y) < PathGenerators._margin * 2) {
        }

        route = PathGenerators.GetRouteWithCurvePoints(route, source, sourcePlacement, target, targetPlacement);

        const paths = new Array<string>(route.length - 1);
        for (let i = 0; i < route.length - 1; i++) {
            paths[i] = `M ${route[i].x} ${route[i].y} L ${route[i + 1].x} ${route[i + 1].y}`;
        }

        return paths
    }
}
