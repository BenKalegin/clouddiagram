///<reference path="Shape.ts" />

module Five {
    export class PolylineShape extends Shape {
        /**
         * points - Array of <mxPoints> that define the points. This is stored in
         * <mxShape.points>.
         * stroke - String that defines the stroke color. Default is 'black'. This is
         * stored in <stroke>.
         * strokewidth - Optional integer that defines the stroke width. Default is
         * 1. This is stored in <strokewidth>.
         */
        constructor(points: Point[], stroke: string = "black", strokewidth: number = 1) {
            super();
            this.points = points;
            this.stroke = stroke;
            this.strokewidth = (strokewidth != null) ? strokewidth : 1;
        }

        getRotation() : number {
            return 0;
        }

        getShapeRotation() : number {
            return 0;
        }

        isPaintBoundsInverted(): boolean {
            return false;
        }

        paintEdgeShape(c: AbstractCanvas2D, pts: Point[]) {
            if (this.style == null || !this.style.curved) {
                this.paintLine(c, pts, this.isRounded);
            }
            else {
                this.paintCurvedLine(c, pts);
            }
        }

        /**
         * Function: paintLine
         * 
         * Paints the line shape.
         */
        private paintLine(c: AbstractCanvas2D, pts: Point[], rounded: boolean) {
            var arcSize = (this.style.arcSize || Constants.lineArcsize) / 2;
            var pt = pts[0];
            var pe = pts[pts.length - 1];

            c.begin();
            c.moveTo(pt.x, pt.y);

            // Draws the line segments
            for (var i = 1; i < pts.length - 1; i++) {
                var tmp = pts[i];
                var dx = pt.x - tmp.x;
                var dy = pt.y - tmp.y;

                if ((rounded && i < pts.length - 1) && (dx != 0 || dy != 0)) {
                    // Draws a line from the last point to the current
                    // point with a spacing of size off the current point
                    // into direction of the last point
                    var dist = Math.sqrt(dx * dx + dy * dy);
                    var nx1 = dx * Math.min(arcSize, dist / 2) / dist;
                    var ny1 = dy * Math.min(arcSize, dist / 2) / dist;

                    var x1 = tmp.x + nx1;
                    var y1 = tmp.y + ny1;
                    c.lineTo(x1, y1);

                    // Draws a curve from the last point to the current
                    // point with a spacing of size off the current point
                    // into direction of the next point
                    var next = pts[i + 1];

                    // Uses next non-overlapping point
                    while (i < pts.length - 2 && Math.round(next.x - tmp.x) == 0 && Math.round(next.y - tmp.y) == 0) {
                        next = pts[i + 2];
                        i++;
                    }

                    dx = next.x - tmp.x;
                    dy = next.y - tmp.y;

                    dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
                    var nx2 = dx * Math.min(arcSize, dist / 2) / dist;
                    var ny2 = dy * Math.min(arcSize, dist / 2) / dist;

                    var x2 = tmp.x + nx2;
                    var y2 = tmp.y + ny2;

                    c.quadTo(tmp.x, tmp.y, x2, y2);
                    tmp = new Point(x2, y2);
                } else {
                    c.lineTo(tmp.x, tmp.y);
                }

                pt = tmp;
            }

            c.lineTo(pe.x, pe.y);
            c.stroke();
        }

        private paintCurvedLine(c: AbstractCanvas2D, pts: Point[]) {
            c.begin();

            var pt = pts[0];
            var n = pts.length;

            c.moveTo(pt.x, pt.y);
            var p0: Point;
            var p1: Point;
            for (var i = 1; i < n - 2; i++) {
                p0 = pts[i];
                p1 = pts[i + 1];
                var ix = (p0.x + p1.x) / 2;
                var iy = (p0.y + p1.y) / 2;

                c.quadTo(p0.x, p0.y, ix, iy);
            }
            p0 = pts[n - 2];
            p1 = pts[n - 1];
            c.quadTo(p0.x, p0.y, p1.x, p1.y);
            c.stroke();
        }
    }
}