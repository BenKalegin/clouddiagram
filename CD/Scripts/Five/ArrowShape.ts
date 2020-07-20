///<reference path="Shape.ts" />
module Five {
    export class ArrowShape extends Shape {
        private arrowWidth: number;

        constructor(points: Point[], fill: string, stroke: string, strokewidth: number = 1, arrowWidth: number = Constants.arrowWidth, spacing: number = Constants.arrowSpacing, endSize: number = Constants.arrowSize) {
            super();
            this.points = points;
            this.fill = fill;
            this.stroke = stroke;
            this.strokewidth = strokewidth;
            this.arrowWidth = arrowWidth;
            this.spacing = spacing;
            this.endSize = endSize;
        }

        paintEdgeShape(c: AbstractCanvas2D, pts: Point[]) {
            // Geometry of arrow
            var spacing = Constants.arrowSpacing;
            var width = Constants.arrowWidth;
            var arrow = Constants.arrowSize;

            // Base vector (between end points)
            var p0 = pts[0];
            var pe = pts[pts.length - 1];
            var dx = pe.x - p0.x;
            var dy = pe.y - p0.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            var length = dist - 2 * spacing - arrow;

            // Computes the norm and the inverse norm
            var nx = dx / dist;
            var ny = dy / dist;
            var basex = length * nx;
            var basey = length * ny;
            var floorx = width * ny / 3;
            var floory = -width * nx / 3;

            // Computes points
            var p0x = p0.x - floorx / 2 + spacing * nx;
            var p0y = p0.y - floory / 2 + spacing * ny;
            var p1x = p0x + floorx;
            var p1y = p0y + floory;
            var p2x = p1x + basex;
            var p2y = p1y + basey;
            var p3x = p2x + floorx;
            var p3y = p2y + floory;
            // p4 not necessary
            var p5x = p3x - 3 * floorx;
            var p5y = p3y - 3 * floory;

            c.begin();
            c.moveTo(p0x, p0y);
            c.lineTo(p1x, p1y);
            c.lineTo(p2x, p2y);
            c.lineTo(p3x, p3y);
            c.lineTo(pe.x - spacing * nx, pe.y - spacing * ny);
            c.lineTo(p5x, p5y);
            c.lineTo(p5x + floorx, p5y + floory);
            c.close();

            c.fillAndStroke();
        }

        static factory(): Shape { return new ArrowShape(new Array<Point>(), null, null); }
    }
}