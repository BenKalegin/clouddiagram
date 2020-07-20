///<reference path="PolylineShape.ts" />

module Five {
    export class ConnectorShape extends PolylineShape {
        /**
     * Class: mxConnector
     * 
     * Extends <mxShape> to implement a connector shape. The connector
     * shape allows for arrow heads on either side.
     * 
     * This shape is registered under <mxShapeStyle._CONNECTOR> in
     * <mxCellRenderer>.
     */
        /* 
     * points - Array of <mxPoints> that define the points. This is stored in Shape.points.
     * stroke - String that defines the stroke color. This is stored in <stroke>.
     * Default is 'black'.
     * strokewidth - Optional integer that defines the stroke width. Default is
     * 1. This is stored in <strokewidth>.
     */
        constructor(points, stroke, strokewidth) {
            super(points, stroke, strokewidth);
        }

        paintEdgeShape(c: AbstractCanvas2D, pts: Point[]) {
            // The indirection via functions for markers is needed in
            // order to apply the offsets before painting the line and
            // paint the markers after painting the line.
            var sourceMarker = this.createMarker(c, pts, true);
            var targetMarker = this.createMarker(c, pts, false);

            super.paintEdgeShape(c, pts);

            // Disables shadows, dashed styles and fixes fill color for markers
            c.setFillColor(this.stroke);
            c.setShadow(false);
            c.setDashed(false);

            if (sourceMarker != null) {
                sourceMarker();
            }

            if (targetMarker != null) {
                targetMarker();
            }
        }

        /**
         * Prepares the marker by adding offsets in pts and returning a function to
         * paint the marker.
         */
        createMarker(c: AbstractCanvas2D, pts: Point[], source: boolean) {
            var result = null;
            var n = pts.length;
            var type = (source) ? this.style.startArrow : this.style.endArrow;
            var p0 = (source) ? pts[1] : pts[n - 2];
            var pe = (source) ? pts[0] : pts[n - 1];

            if (type != null && p0 != null && pe != null) {
                var count = 1;

                // Uses next non-overlapping point
                while (count < n - 1 && Math.round(p0.x - pe.x) == 0 && Math.round(p0.y - pe.y) == 0) {
                    p0 = (source) ? pts[1 + count] : pts[n - 2 - count];
                    count++;
                }

                // Computes the norm and the inverse norm
                var dx = pe.x - p0.x;
                var dy = pe.y - p0.y;

                var dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));

                var unitX = dx / dist;
                var unitY = dy / dist;

                var size = ((source) ? this.style.startSize : this.style.endSize) || Constants.defaultMarkersize;

                // Allow for stroke width in the end point used and the 
                // orthogonal vectors describing the direction of the marker
                var filled = source ? this.style.startFill : this.style.endFill;

                result = Marker.createMarker(c, this, type, pe, unitX, unitY, size, source, this.arrowStrokewidth, filled);
            }

            return result;
        }

        /**
         * Function: augmentBoundingBox
         *
         * Augments the bounding box with the strokewidth and shadow offsets.
         */
        augmentBoundingBox(bbox: Rectangle) {
            super.augmentBoundingBox(bbox);

            // Adds marker sizes
            var size = 0;

            if (this.style.startArrow) {
                size = this.style.startSize + 1;
            }

            if (this.style.endArrow) {
                size = Math.max(size, this.style.endSize + 1);
            }

            bbox.grow(Math.ceil(size * this.scale));
        }

        static factory(): Shape { return new ConnectorShape(null, null, null); }
    }
}