import {BezierSpline} from "./BezierSpline";
import {Bounds, center, Coordinate} from "../model";
import {PortAlignment, PortState, TipStyle} from "../../package/packageModel";
import {PortPlacement} from "../../features/structureDiagram/structureDiagramState";

export type PathGeneratorResult = {
    path: string[];
    sourceMarkerAngle?: number;
    sourceMarkerPosition?: Coordinate;
    targetMarkerAngle?: number;
    targetMarkerPosition?: Coordinate;
}

function drawTip(pointTo: Coordinate, size: Coordinate, sourceAngle: number, tipStyle: TipStyle): string {
    switch (tipStyle) {
        case TipStyle.Arrow:
            return drawArrowTip(pointTo, size, sourceAngle);

        case TipStyle.Triangle:
            return drawTriangleTip(pointTo, size, sourceAngle);

        case TipStyle.Diamond:
            return drawDiamondTip(pointTo, size, sourceAngle);
        default:
            return "";
    }
}

function drawArrowTip(pointTo: Coordinate, size: Coordinate, sourceAngle: number): string {
    const PI2 = Math.PI * 2;
    // Angle offset for tip sides (determines tip width)
    const TIP_ANGLE_OFFSET = Math.PI * 0.85; // ~153 degrees

    // Normalize angle to 0-2π range
    const radians = (sourceAngle + PI2) % PI2;

    // Calculate the two points that form the arrow
    const leftPoint = {
        x: pointTo.x + size.x * Math.cos(radians + TIP_ANGLE_OFFSET),
        y: pointTo.y + size.y * Math.sin(radians + TIP_ANGLE_OFFSET)
    };

    const rightPoint = {
        x: pointTo.x + size.x * Math.cos(radians - TIP_ANGLE_OFFSET),
        y: pointTo.y + size.y * Math.sin(radians - TIP_ANGLE_OFFSET)
    };

    return `M ${pointTo.x} ${pointTo.y} 
            L ${leftPoint.x} ${leftPoint.y}
            M ${pointTo.x} ${pointTo.y}
            L ${rightPoint.x} ${rightPoint.y}`;
}


function drawDiamondTip(pointTo: Coordinate, size: Coordinate, sourceAngle: number): string {
    const PI2 = Math.PI * 2;
    // Angle offset for the side points of the diamond
    const SIDE_ANGLE_OFFSET = Math.PI * 0.75; // ~153 degrees
    // Distance for the center point of the diamond
    const CENTER_DISTANCE = Math.sqrt(size.x * size.x + size.y * size.y);

    // Normalize angle to 0-2π range
    const radians = (sourceAngle + PI2) % PI2;

    // Calculate the center point of the diamond
    const centerPoint = {
        x: pointTo.x - CENTER_DISTANCE * Math.cos(radians),
        y: pointTo.y - CENTER_DISTANCE * Math.sin(radians)
    };

    // Calculate the side points of the diamond
    const leftPoint = {
        x: pointTo.x + size.x * Math.cos(radians + SIDE_ANGLE_OFFSET),
        y: pointTo.y + size.y * Math.sin(radians + SIDE_ANGLE_OFFSET)
    };

    const rightPoint = {
        x: pointTo.x + size.x * Math.cos(radians - SIDE_ANGLE_OFFSET),
        y: pointTo.y + size.y * Math.sin(radians - SIDE_ANGLE_OFFSET)
    };

    return `M ${pointTo.x} ${pointTo.y}
            L ${leftPoint.x} ${leftPoint.y}
            L ${centerPoint.x} ${centerPoint.y}
            L ${rightPoint.x} ${rightPoint.y}
            L ${pointTo.x} ${pointTo.y} Z`;
}

function drawTriangleTip(pointTo: Coordinate, size: Coordinate, sourceAngle: number): string {
    const PI2 = Math.PI * 2;
    // Angle offset for tip sides (determines tip width)
    const TIP_ANGLE_OFFSET = Math.PI * 0.85; // ~153 degrees

    // Normalize angle to 0-2π range
    const radians = (sourceAngle + PI2) % PI2;

    // Calculate the points that form the triangle
    const leftPoint = {
        x: pointTo.x + size.x * Math.cos(radians + TIP_ANGLE_OFFSET),
        y: pointTo.y + size.y * Math.sin(radians + TIP_ANGLE_OFFSET)
    };

    const rightPoint = {
        x: pointTo.x + size.x * Math.cos(radians - TIP_ANGLE_OFFSET),
        y: pointTo.y + size.y * Math.sin(radians - TIP_ANGLE_OFFSET)
    };

    return `M ${pointTo.x} ${pointTo.y}
            L ${leftPoint.x} ${leftPoint.y}
            L ${rightPoint.x} ${rightPoint.y}
            L ${pointTo.x} ${pointTo.y} Z`;
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
                            target: PortState, targetBounds: Bounds, targetPlacement: PortPlacement, tipStyle1: TipStyle, tipStyle2: TipStyle) => {
        route = concatRouteAndSourceAndTarget(route, sourceBounds, targetBounds);

        const {startAngle, endAngle} = calculateStartAndEndAngles(route);
        route = adjustRouteToFitMarkers(route, source.longitude / 2, target.longitude / 2, startAngle, endAngle);

        const path = `M ${route[0].x} ${route[0].y} L ${route[route.length - 1].x} ${route[route.length - 1].y}`;
        const result = new Array<string>();
        const tipSize = {x: 10, y: 8};

        if (tipStyle1 !== TipStyle.None) {
            result.push(drawTip(route[0], tipSize, startAngle, tipStyle1));
        }

        result.push(path);

        if(tipStyle2 !== TipStyle.None) {
            result.push(drawTip(route[route.length - 1], tipSize, endAngle, tipStyle2));
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
