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

/**
 * Creates a lateral horizontal path between two points
 * This style is useful for hierarchical diagrams where connections flow horizontally
 */
const lateralHorizontal = (route: Coordinate[], source: PortState, sourceBounds: Bounds, sourcePlacement: PortPlacement,
                          target: PortState, targetBounds: Bounds, targetPlacement: PortPlacement) => {
    let result: ConnectorContext = {svg: [], startAngle: 0, endAngle: 0};

    // If nodes are too close, use bezier curve instead
    if (Math.abs(route[0].x - route[1].x) < _margin * 2 &&
        Math.abs(route[0].y - route[1].y) < _margin * 2) {
        return bezier([], source, sourcePlacement, target, targetPlacement);
    }

    // Create lateral horizontal path
    const start = route[0];
    const end = route[route.length - 1];

    // Create waypoints based on port alignments and relative positions
    const waypoints: Coordinate[] = [];
    waypoints.push(start);

    // Determine if we're going left to right or right to left
    const goingRight = end.x > start.x;

    // Add intermediate points based on port alignments and direction
    switch (sourcePlacement.alignment) {
        case PortAlignment.Left:
            if (!goingRight) {
                // Going left, need extra space
                waypoints.push({x: Math.min(start.x - _margin * 2, end.x - _margin), y: start.y});
            }
            break;
        case PortAlignment.Right:
            if (goingRight) {
                // Going right, add a small extension
                waypoints.push({x: Math.max(start.x + _margin, end.x - _margin * 2), y: start.y});
            } else {
                // Going left, need more space
                waypoints.push({x: start.x + _margin * 2, y: start.y});
            }
            break;
        case PortAlignment.Top:
        case PortAlignment.Bottom:
            // For vertical ports, extend horizontally first
            const horizontalExtension = goingRight ?
                Math.max(start.x + _margin, end.x - _margin * 2) :
                Math.min(start.x - _margin, end.x + _margin * 2);
            waypoints.push({x: horizontalExtension, y: start.y});
            break;
    }

    // Add vertical segment if needed
    if (Math.abs(waypoints[waypoints.length - 1].y - end.y) > _margin) {
        // Add a point at the same x as the last point but at the y of the end point
        waypoints.push({x: waypoints[waypoints.length - 1].x, y: end.y});
    }

    // Handle target port alignment
    switch (targetPlacement.alignment) {
        case PortAlignment.Left:
            if (goingRight) {
                // If we're coming from the right, add a point to approach from the left
                if (waypoints[waypoints.length - 1].x > end.x) {
                    waypoints.push({x: end.x - _margin, y: end.y});
                }
            }
            break;
        case PortAlignment.Right:
            if (!goingRight) {
                // If we're coming from the left, add a point to approach from the right
                if (waypoints[waypoints.length - 1].x < end.x) {
                    waypoints.push({x: end.x + _margin, y: end.y});
                }
            }
            break;
    }

    // Add final point
    waypoints.push(end);

    // Create SVG path segments
    const paths = new Array<string>(waypoints.length - 1);
    for (let i = 0; i < waypoints.length - 1; i++) {
        paths[i] = `M ${waypoints[i].x} ${waypoints[i].y} L ${waypoints[i + 1].x} ${waypoints[i + 1].y}`;
    }

    result.svg = paths;
    result.startAngle = Math.atan2(waypoints[0].y - waypoints[1].y, waypoints[0].x - waypoints[1].x);
    result.endAngle = Math.atan2(waypoints[waypoints.length - 1].y - waypoints[waypoints.length - 2].y,
                                 waypoints[waypoints.length - 1].x - waypoints[waypoints.length - 2].x);
    return result;
}

/**
 * Creates a tree-style horizontal path between two points
 * This style is useful for hierarchical tree diagrams where connections flow horizontally
 */
const treeStyleHorizontal = (route: Coordinate[], source: PortState, sourceBounds: Bounds, sourcePlacement: PortPlacement,
                            target: PortState, targetBounds: Bounds, targetPlacement: PortPlacement) => {
    let result: ConnectorContext = {svg: [], startAngle: 0, endAngle: 0};

    // If nodes are too close, use bezier curve instead
    if (Math.abs(route[0].x - route[1].x) < _margin * 2 &&
        Math.abs(route[0].y - route[1].y) < _margin * 2) {
        return bezier([], source, sourcePlacement, target, targetPlacement);
    }

    // Create tree-style horizontal path
    const start = route[0];
    const end = route[route.length - 1];

    // Create waypoints
    const waypoints: Coordinate[] = [];
    waypoints.push(start);

    // Calculate midpoint x-coordinate
    const midX = (start.x + end.x) / 2;

    // Add intermediate points to create a tree-style path
    waypoints.push({x: midX, y: start.y});
    waypoints.push({x: midX, y: end.y});
    waypoints.push(end);

    // Create SVG path segments
    const paths = new Array<string>(waypoints.length - 1);
    for (let i = 0; i < waypoints.length - 1; i++) {
        paths[i] = `M ${waypoints[i].x} ${waypoints[i].y} L ${waypoints[i + 1].x} ${waypoints[i + 1].y}`;
    }

    result.svg = paths;
    result.startAngle = Math.atan2(waypoints[0].y - waypoints[1].y, waypoints[0].x - waypoints[1].x);
    result.endAngle = Math.atan2(waypoints[waypoints.length - 1].y - waypoints[waypoints.length - 2].y,
                                 waypoints[waypoints.length - 1].x - waypoints[waypoints.length - 2].x);
    return result;
}

/**
 * Creates a lateral vertical path between two points
 * This style is useful for hierarchical diagrams where connections flow vertically
 */
const lateralVertical = (route: Coordinate[], source: PortState, sourceBounds: Bounds, sourcePlacement: PortPlacement,
                        target: PortState, targetBounds: Bounds, targetPlacement: PortPlacement) => {
    let result: ConnectorContext = {svg: [], startAngle: 0, endAngle: 0};

    // If nodes are too close, use bezier curve instead
    if (Math.abs(route[0].x - route[1].x) < _margin * 2 &&
        Math.abs(route[0].y - route[1].y) < _margin * 2) {
        return bezier([], source, sourcePlacement, target, targetPlacement);
    }

    // Create lateral vertical path
    const start = route[0];
    const end = route[route.length - 1];

    // Create waypoints based on port alignments and relative positions
    const waypoints: Coordinate[] = [];
    waypoints.push(start);

    // Determine if we're going top to bottom or bottom to top
    const goingDown = end.y > start.y;

    // Add intermediate points based on port alignments and direction
    switch (sourcePlacement.alignment) {
        case PortAlignment.Top:
            if (!goingDown) {
                // Going up, need extra space
                waypoints.push({x: start.x, y: Math.min(start.y - _margin * 2, end.y - _margin)});
            }
            break;
        case PortAlignment.Bottom:
            if (goingDown) {
                // Going down, add a small extension
                waypoints.push({x: start.x, y: Math.max(start.y + _margin, end.y - _margin * 2)});
            } else {
                // Going up, need more space
                waypoints.push({x: start.x, y: start.y + _margin * 2});
            }
            break;
        case PortAlignment.Left:
        case PortAlignment.Right:
            // For horizontal ports, extend vertically first
            const verticalExtension = goingDown ?
                Math.max(start.y + _margin, end.y - _margin * 2) :
                Math.min(start.y - _margin, end.y + _margin * 2);
            waypoints.push({x: start.x, y: verticalExtension});
            break;
    }

    // Add horizontal segment if needed
    if (Math.abs(waypoints[waypoints.length - 1].x - end.x) > _margin) {
        // Add a point at the same y as the last point but at the x of the end point
        waypoints.push({x: end.x, y: waypoints[waypoints.length - 1].y});
    }

    // Handle target port alignment
    switch (targetPlacement.alignment) {
        case PortAlignment.Top:
            if (goingDown) {
                // If we're coming from below, add a point to approach from above
                if (waypoints[waypoints.length - 1].y > end.y) {
                    waypoints.push({x: end.x, y: end.y - _margin});
                }
            }
            break;
        case PortAlignment.Bottom:
            if (!goingDown) {
                // If we're coming from above, add a point to approach from below
                if (waypoints[waypoints.length - 1].y < end.y) {
                    waypoints.push({x: end.x, y: end.y + _margin});
                }
            }
            break;
    }

    // Add final point
    waypoints.push(end);

    // Create SVG path segments
    const paths = new Array<string>(waypoints.length - 1);
    for (let i = 0; i < waypoints.length - 1; i++) {
        paths[i] = `M ${waypoints[i].x} ${waypoints[i].y} L ${waypoints[i + 1].x} ${waypoints[i + 1].y}`;
    }

    result.svg = paths;
    result.startAngle = Math.atan2(waypoints[0].y - waypoints[1].y, waypoints[0].x - waypoints[1].x);
    result.endAngle = Math.atan2(waypoints[waypoints.length - 1].y - waypoints[waypoints.length - 2].y,
                                 waypoints[waypoints.length - 1].x - waypoints[waypoints.length - 2].x);
    return result;
}

/**
 * Creates a tree-style vertical path between two points
 * This style is useful for hierarchical tree diagrams where connections flow vertically
 */
const treeStyleVertical = (route: Coordinate[], source: PortState, sourceBounds: Bounds, sourcePlacement: PortPlacement,
                          target: PortState, targetBounds: Bounds, targetPlacement: PortPlacement) => {
    let result: ConnectorContext = {svg: [], startAngle: 0, endAngle: 0};

    // If nodes are too close, use bezier curve instead
    if (Math.abs(route[0].x - route[1].x) < _margin * 2 &&
        Math.abs(route[0].y - route[1].y) < _margin * 2) {
        return bezier([], source, sourcePlacement, target, targetPlacement);
    }

    // Create tree-style vertical path
    const start = route[0];
    const end = route[route.length - 1];

    // Create waypoints
    const waypoints: Coordinate[] = [];
    waypoints.push(start);

    // Calculate midpoint y-coordinate
    const midY = (start.y + end.y) / 2;

    // Add intermediate points to create a tree-style path
    waypoints.push({x: start.x, y: midY});
    waypoints.push({x: end.x, y: midY});
    waypoints.push(end);

    // Create SVG path segments
    const paths = new Array<string>(waypoints.length - 1);
    for (let i = 0; i < waypoints.length - 1; i++) {
        paths[i] = `M ${waypoints[i].x} ${waypoints[i].y} L ${waypoints[i + 1].x} ${waypoints[i + 1].y}`;
    }

    result.svg = paths;
    result.startAngle = Math.atan2(waypoints[0].y - waypoints[1].y, waypoints[0].x - waypoints[1].x);
    result.endAngle = Math.atan2(waypoints[waypoints.length - 1].y - waypoints[waypoints.length - 2].y,
                                 waypoints[waypoints.length - 1].x - waypoints[waypoints.length - 2].x);
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
        case RouteStyle.LateralVertical:
            return lateralVertical(route, source, sourceBounds, sourcePlacement, target, targetBounds, targetPlacement);
        case RouteStyle.TreeStyleHorizontal:
            return treeStyleHorizontal(route, source, sourceBounds, sourcePlacement, target, targetBounds, targetPlacement);
        case RouteStyle.TreeStyleVertical:
            return treeStyleVertical(route, source, sourceBounds, sourcePlacement, target, targetBounds, targetPlacement);
        case RouteStyle.OrthogonalSquare:
            return orthogonalSquare(route, source, sourceBounds, sourcePlacement, target, targetBounds, targetPlacement);
        case RouteStyle.OrthogonalRounded:
            return orthogonalRounded(route, source, sourceBounds, sourcePlacement, target, targetBounds, targetPlacement);
        case RouteStyle.AutoRouting:
            return autoRouting(route, source, sourceBounds, sourcePlacement, target, targetBounds, targetPlacement);
        default:
            return direct(route);
    }
}

/**
 * Creates an orthogonal path with square corners between two points
 */
const orthogonalSquare = (route: Coordinate[], source: PortState, sourceBounds: Bounds, sourcePlacement: PortPlacement,
                          target: PortState, targetBounds: Bounds, targetPlacement: PortPlacement) => {
    let result: ConnectorContext = {svg: [], startAngle: 0, endAngle: 0};

    // If nodes are too close, use bezier curve instead
    if (Math.abs(route[0].x - route[1].x) < _margin * 2 &&
        Math.abs(route[0].y - route[1].y) < _margin * 2) {
        return bezier([], source, sourcePlacement, target, targetPlacement);
    }

    // Create orthogonal path with square corners
    const start = route[0];
    const end = route[route.length - 1];
    const midX = (start.x + end.x) / 2;

    // Create waypoints based on port alignments
    const waypoints: Coordinate[] = [];
    waypoints.push(start);

    // Add intermediate points based on port alignments
    switch (sourcePlacement.alignment) {
        case PortAlignment.Top:
            waypoints.push({x: start.x, y: Math.min(start.y - _margin, end.y)});
            break;
        case PortAlignment.Bottom:
            waypoints.push({x: start.x, y: Math.max(start.y + _margin, end.y)});
            break;
        case PortAlignment.Left:
            waypoints.push({x: Math.min(start.x - _margin, end.x), y: start.y});
            break;
        case PortAlignment.Right:
            waypoints.push({x: Math.max(start.x + _margin, end.x), y: start.y});
            break;
    }

    // Add midpoint if needed
    if (Math.abs(waypoints[waypoints.length - 1].x - end.x) > _margin &&
        Math.abs(waypoints[waypoints.length - 1].y - end.y) > _margin) {
        waypoints.push({x: midX, y: waypoints[waypoints.length - 1].y});
        waypoints.push({x: midX, y: end.y});
    }

    // Add final point
    waypoints.push(end);

    // Create SVG path segments
    const paths = new Array<string>(waypoints.length - 1);
    for (let i = 0; i < waypoints.length - 1; i++) {
        paths[i] = `M ${waypoints[i].x} ${waypoints[i].y} L ${waypoints[i + 1].x} ${waypoints[i + 1].y}`;
    }

    result.svg = paths;
    result.startAngle = Math.atan2(waypoints[0].y - waypoints[1].y, waypoints[0].x - waypoints[1].x);
    result.endAngle = Math.atan2(waypoints[waypoints.length - 1].y - waypoints[waypoints.length - 2].y,
                                 waypoints[waypoints.length - 1].x - waypoints[waypoints.length - 2].x);
    return result;
}

/**
 * Creates an orthogonal path with rounded corners between two points
 */
const orthogonalRounded = (route: Coordinate[], source: PortState, sourceBounds: Bounds, sourcePlacement: PortPlacement,
                           target: PortState, targetBounds: Bounds, targetPlacement: PortPlacement) => {
    // First get the square orthogonal path
    const squareResult = orthogonalSquare(route, source, sourceBounds, sourcePlacement, target, targetBounds, targetPlacement);

    // If there are fewer than 3 waypoints, we can't create rounded corners
    if (squareResult.svg.length < 2) {
        return squareResult;
    }

    // Extract waypoints from the square path
    const waypoints: Coordinate[] = [];
    for (const path of squareResult.svg) {
        const match = path.match(/M\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+L\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/);
        if (match) {
            waypoints.push({x: parseFloat(match[1]), y: parseFloat(match[2])});
            // Only add the end point of the last segment to avoid duplicates
            if (path === squareResult.svg[squareResult.svg.length - 1]) {
                waypoints.push({x: parseFloat(match[3]), y: parseFloat(match[4])});
            }
        }
    }

    // Create SVG path with rounded corners
    const radius = 10; // Corner radius
    let svgPath = `M ${waypoints[0].x} ${waypoints[0].y}`;

    for (let i = 1; i < waypoints.length - 1; i++) {
        const prev = waypoints[i - 1];
        const curr = waypoints[i];
        const next = waypoints[i + 1];

        // Calculate direction vectors
        const dx1 = curr.x - prev.x;
        const dy1 = curr.y - prev.y;
        const dx2 = next.x - curr.x;
        const dy2 = next.y - curr.y;

        // Calculate distance to corner
        const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
        const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

        // Calculate corner points
        const r1 = Math.min(radius, dist1 / 2);
        const r2 = Math.min(radius, dist2 / 2);

        const p1 = {
            x: curr.x - dx1 * r1 / dist1,
            y: curr.y - dy1 * r1 / dist1
        };

        const p2 = {
            x: curr.x + dx2 * r2 / dist2,
            y: curr.y + dy2 * r2 / dist2
        };

        // Add line to first corner point and quadratic curve for the corner
        svgPath += ` L ${p1.x} ${p1.y} Q ${curr.x} ${curr.y}, ${p2.x} ${p2.y}`;
    }

    // Add final line
    svgPath += ` L ${waypoints[waypoints.length - 1].x} ${waypoints[waypoints.length - 1].y}`;

    // Return result
    return {
        svg: [svgPath],
        startAngle: squareResult.startAngle,
        endAngle: squareResult.endAngle
    };
}

/**
 * Creates a path that automatically routes around obstacles
 */
const autoRouting = (route: Coordinate[], source: PortState, sourceBounds: Bounds, sourcePlacement: PortPlacement,
                     target: PortState, targetBounds: Bounds, targetPlacement: PortPlacement) => {
    // For now, use orthogonal routing as a base
    // In a full implementation, this would detect other elements and route around them
    return orthogonalSquare(route, source, sourceBounds, sourcePlacement, target, targetBounds, targetPlacement);
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
