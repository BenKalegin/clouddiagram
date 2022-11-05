import {Coordinate, LinkState} from "../../ClassDiagram/Models";

export class PathGeneratorResult
{
    constructor(public path: string[], public sourceMarkerAngle?: number, public sourceMarkerPosition?: Coordinate,
                public targetMarkerAngle?: number, public targetMarkerPosition?: Coordinate) {
    }
}

export class PathGenerators
{
    private const _margin = 125;

    static SourceMarkerAdjustment = (route: Coordinate[], markerWidth: number) => {
        const angleInRadians = Math.atan2(route[1].y - route[0].y, route[1].x - route[0].x) + Math.PI;
        var xChange = markerWidth * Math.cos(angleInRadians);
        var yChange = markerWidth * Math.sin(angleInRadians);
        route[0] = {x: route[0].x - xChange, y: route[0].y - yChange};
        return angleInRadians * 180 / Math.PI;
    }

    static TargetMarkerAdjustment = (route: Coordinate[], markerWidth: number) =>
    {
        const angleInRadians = Math.atan2(route[route.length-1].y - route[route.length-2].y, route[route.length-1].x - route[route.length-2].x)
        const xChange = markerWidth * Math.cos(angleInRadians);
        const yChange = markerWidth * Math.sin(angleInRadians);
        route[route.length-1] = {x: route[route.length-1].x - xChange, y: route[route.length-1].y - yChange}
        return angleInRadians * 180 / Math.PI;
    }

    static ConcatRouteAndSourceAndTarget(route: Coordinate[], source: Coordinate, target: Coordinate): Coordinate[] {
        return [source, ...route, target];
    }

    static CurveThroughPoints = (route: Coordinate, link: LinkState) =>
    {
        let sourceAngle: number | null = null;
        let targetAngle: number | null = null;

    if (link.port1.marker  SourceMarker != null)
    {
        sourceAngle = SourceMarkerAdjustement(route, link.SourceMarker.Width);
    }

    if (link.TargetMarker != null)
    {
        targetAngle = TargetMarkerAdjustement(route, link.TargetMarker.Width);
    }

    BezierSpline.GetCurveControlPoints(route, out var firstControlPoints, out var secondControlPoints);
    var paths = new string[firstControlPoints.Length];

    for (var i = 0; i < firstControlPoints.Length; i++)
    {
        var cp1 = firstControlPoints[i];
        var cp2 = secondControlPoints[i];
        paths[i] = FormattableString.Invariant($"M {route[i].x} {route[i].y} C {cp1.x} {cp1.y}, {cp2.x} {cp2.y}, {route[i + 1].x} {route[i + 1].y}");
    }

// Todo: adjust marker positions based on closest control points
return new PathGeneratorResult(paths, sourceAngle, route[0], targetAngle, route[^1]);
}

    public static Smooth = (link: LinkState, route: Coordinate[], source: Coordinate, target: Coordinate) =>
    {
        route = PathGenerators.ConcatRouteAndSourceAndTarget(route, source, target);

        if (route.length > 2)
        return CurveThroughPoints(route, link);

        route = GetRouteWithCurvePoints(link, route);
        double? sourceAngle = null;
        double? targetAngle = null;

        if (link.SourceMarker != null)
    {
        sourceAngle = SourceMarkerAdjustement(route, link.SourceMarker.Width);
    }

        if (link.TargetMarker != null)
        {
            targetAngle = TargetMarkerAdjustement(route, link.TargetMarker.Width);
        }

        var path = FormattableString.Invariant($"M {route[0].x} {route[0].y} C {route[1].x} {route[1].y}, {route[2].x} {route[2].y}, {route[3].x} {route[3].y}");
        return new PathGeneratorResult(new[] { path }, sourceAngle, route[0], targetAngle, route[^1]);
    }


    private static Point[] GetRouteWithCurvePoints(BaseLinkModel link, Point[] route)
    {
        if (link.IsPortless)
        {
            if (Math.Abs(route[0].x - route[1].x) >= Math.Abs(route[0].y - route[1].y))
            {
                var cX = (route[0].x + route[1].x) / 2;
                return new[] { route[0], new Point(cX, route[0].y), new Point(cX, route[1].y), route[1] };
            }
            else
            {
                var cY = (route[0].y + route[1].y) / 2;
                return new[] { route[0], new Point(route[0].x, cY), new Point(route[1].x, cY), route[1] };
            }
        }
        else
        {
            var cX = (route[0].x + route[1].x) / 2;
            var cY = (route[0].y + route[1].y) / 2;
            var curvePointA = GetCurvePoint(route[0].x, route[0].y, cX, cY, link.SourcePort?.Alignment);
            var curvePointB = GetCurvePoint(route[1].x, route[1].y, cX, cY, link.TargetPort?.Alignment);
            return new[] { route[0], curvePointA, curvePointB, route[1] };
        }
    }

    private static Point GetCurvePoint(double pX, double pY, double cX, double cY, PortAlignment? alignment)
    {
        var margin = Math.Min(_margin, Math.Pow(Math.Pow(pX - cX, 2) + Math.Pow(pY - cY, 2), .5));
        return alignment switch
        {
            PortAlignment.Top => new Point(pX, Math.Min(pY - margin, cY)),
            PortAlignment.Bottom => new Point(pX, Math.Max(pY + margin, cY)),
            PortAlignment.TopRight => new Point(Math.Max(pX + margin, cX), Math.Min(pY - margin, cY)),
            PortAlignment.BottomRight => new Point(Math.Max(pX + margin, cX), Math.Max(pY + margin, cY)),
            PortAlignment.Right => new Point(Math.Max(pX + margin, cX), pY),
            PortAlignment.Left => new Point(Math.Min(pX - margin, cX), pY),
            PortAlignment.BottomLeft => new Point(Math.Min(pX - margin, cX), Math.Max(pY + margin, cY)),
            PortAlignment.TopLeft => new Point(Math.Min(pX - margin, cX), Math.Min(pY - margin, cY)),
            _ => new Point(cX, cY),
        };
    }
}

