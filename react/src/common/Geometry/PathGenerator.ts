import {BezierSpline} from "./BezierSpline";
import {Bounds, center, Coordinate} from "../model";
import {PortAlignment, PortState, TipStyle, RouteStyle} from "../../package/packageModel";
import {PortPlacement} from "../../features/structureDiagram/structureDiagramState";
import {drawTip} from "./arrowTips";


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


const _margin = 25;

export const getCurvePoint = (pX: number, pY: number, cX: number, cY: number, alignment?: PortAlignment): Coordinate => {
    const margin = Math.min(_margin, Math.pow(Math.pow(pX - cX, 2) + Math.pow(pY - cY, 2), .5));
    switch (alignment) {
        case PortAlignment.Top:
            return {x: pX, y: Math.min(pY - margin, cY)}
        case PortAlignment.Bottom:
            return {x: pX, y: Math.max(pY + margin, cY)}
        case PortAlignment.Right:
            return {x: Math.max(pX + margin, cX), y: pY}
        case PortAlignment.Left:
            return {x: Math.min(pX - margin, cX), y: pY}
    }
    throw new Error("Invalid alignment: " + alignment);
}

/**
 * Creates a curved route between two ports by adding intermediate curve control points.
 * If the source is null, generates a simple S-curve with midpoints.
 * Otherwise, creates a curve with control points based on port alignments.
 *
 * @returns Array of coordinates including original points and additional curve control points
 */
const getRouteWithCurvePoints = (route: Coordinate[], source: PortState, sourcePlacement: PortPlacement,
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
        const curvePointA = getCurvePoint(route[0].x, route[0].y, cX, cY, sourcePlacement.alignment)
        const curvePointB = getCurvePoint(route[1].x, route[1].y, cX, cY, targetPlacement.alignment)
        return [route[0], curvePointA, curvePointB, route[1]]
    }
}

type ConnectorContext = {
    svg: string[]
    startAngle: number
    endAngle: number
}

const bezier = (route: Coordinate[], source: PortState, sourcePlacement: PortPlacement,
                        target: PortState, targetPlacement: PortPlacement) : ConnectorContext => {
    let result: ConnectorContext = {svg: [], startAngle: 0, endAngle: 0};
    // complex case: intermediate points
    if (route.length > 2) {
        const {firstControlPoints, secondControlPoints} = BezierSpline.GetCurveControlPoints(route)
        const paths = new Array<string>(firstControlPoints.length);

        for (let i = 0; i < firstControlPoints.length; i++) {
            const cp1 = firstControlPoints[i]
            const cp2 = secondControlPoints[i]
            paths[i] = `M ${route[i].x} ${route[i].y} 
                        C ${cp1.x} ${cp1.y} ${cp2.x} ${cp2.y} ${route[i + 1].x} ${route[i + 1].y}`
        }
        result.svg = paths;
        result.startAngle = Math.atan2(route[0].y - firstControlPoints[0].y, route[0].x - firstControlPoints[0].x);
        result.endAngle = Math.atan2(route[route.length - 1].y - secondControlPoints[secondControlPoints.length - 1].y,
                                      route[route.length - 1].x - secondControlPoints[secondControlPoints.length - 1].x);
    }else {
        // handle simple case: just two points
        route = getRouteWithCurvePoints(route, source, sourcePlacement, target, targetPlacement);

        result.svg = [`
          M ${route[0].x} ${route[0].y}
          C ${route[1].x} ${route[1].y}, ${route[2].x} ${route[2].y}, ${route[3].x} ${route[3].y}
          C ${route[2].x} ${route[2].y}, ${route[1].x} ${route[1].y}, ${route[0].x} ${route[0].y} Z`];

        result.startAngle = Math.atan2(route[0].y - route[1].y, route[0].x - route[1].x);
        result.endAngle = Math.atan2(route[route.length - 1].y - route[route.length - 2].y,
                                      route[route.length - 1].x - route[route.length - 2].x);
    }

    return result;
}

const direct = (route: Coordinate[]) => {
    let result: ConnectorContext = {svg: [], startAngle: 0, endAngle: 0};
    result.svg = [`M ${route[0].x} ${route[0].y} L ${route[route.length - 1].x} ${route[route.length - 1].y}`];
    result.startAngle = Math.atan2(route[0].y - route[1].y, route[0].x - route[1].x);
    result.endAngle = Math.atan2(route[route.length - 1].y - route[route.length - 2].y,
                                  route[route.length - 1].x - route[route.length - 2].x);
    return result;
}

const lateralHorizontal = (route: Coordinate[], source: PortState, sourceBounds: Bounds, sourcePlacement: PortPlacement,
                                  target: PortState, targetBounds: Bounds, targetPlacement: PortPlacement) => {
    let result: ConnectorContext = {svg: [], startAngle: 0, endAngle: 0};
    if (Math.abs(route[0].x - route[1].x) < _margin * 2 &&
        Math.abs(route[0].y - route[1].y) < _margin * 2) {
        return bezier([], source, sourcePlacement, target, targetPlacement);
    }

    route = getRouteWithCurvePoints(route, source, sourcePlacement, target, targetPlacement);

    const paths = new Array<string>(route.length - 1);
    for (let i = 0; i < route.length - 1; i++) {
        paths[i] = `M ${route[i].x} ${route[i].y} L ${route[i + 1].x} ${route[i + 1].y}`;
    }

    result.svg = paths;
    result.startAngle = Math.atan2(route[0].y - route[1].y, route[0].x - route[1].x);
    result.endAngle = Math.atan2(route[route.length - 1].y - route[route.length - 2].y,
                                  route[route.length - 1].x - route[route.length - 2].x);
    return result;
}

function drawConnector(routeStyle: RouteStyle, route: Coordinate[], source: PortState, target: PortState,
                       sourcePlacement: PortPlacement, targetPlacement: PortPlacement,
                       sourceBounds: Bounds, targetBounds: Bounds) : ConnectorContext{
    switch(routeStyle){
        case RouteStyle.Direct:
            return direct(route);
        case RouteStyle.Bezier:
            return bezier(route, source, sourcePlacement, target, targetPlacement);
        case RouteStyle.LateralHorizontal:
            return lateralHorizontal(route, source, sourceBounds, sourcePlacement, target, targetBounds, targetPlacement);
        default:
            return direct(route);
    }
}

export const generatePath = (source: PortState, sourceBounds: Bounds, sourcePlacement: PortPlacement,
                           target: PortState, targetBounds: Bounds, targetPlacement: PortPlacement,
                           routeStyle: RouteStyle, tipStyle1: TipStyle, tipStyle2: TipStyle): string[] => {
    let route = concatRouteAndSourceAndTarget([], sourceBounds, targetBounds);
    let connectorContext = drawConnector(routeStyle, route, source, target, sourcePlacement, targetPlacement, sourceBounds, targetBounds);
    const tipSize = {x: 10, y: 8};
    route = adjustRouteToFitMarkers(route, source.longitude / 2, target.longitude / 2, connectorContext.startAngle, connectorContext.endAngle);

    const result = new Array<string>();

    if (tipStyle1 !== TipStyle.None) {
        result.push(drawTip(route[0], tipSize, connectorContext.startAngle, tipStyle1));
    }

    if(tipStyle2 !== TipStyle.None) {
        result.push(drawTip(route[route.length - 1], tipSize, connectorContext.endAngle, tipStyle2));
    }

    result.push(...connectorContext.svg);

    return result;

}

