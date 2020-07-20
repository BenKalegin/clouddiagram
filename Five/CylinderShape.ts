﻿///<reference path="Shape.ts" />

module Five {
    /**
     * Class: mxCylinder
     *
     * Extends <mxShape> to implement an cylinder shape. If a
     * custom shape with one filled area and an overlay path is
     * needed, then this shape's <redrawPath> should be overridden.
     * This shape is registered under <mxConstants.SHAPE_CYLINDER>
     * in <mxCellRenderer>.
     */
    export class CylinderShape extends Shape {
        /* Constructor: mxCylinder
         *
         * Constructs a new cylinder shape.
         * 
         * Parameters:
         * 
         * bounds - <mxRectangle> that defines the bounds. This is stored in
         * <mxShape.bounds>.
         * fill - String that defines the fill color. This is stored in <fill>.
         * stroke - String that defines the stroke color. This is stored in <stroke>.
         * strokewidth - Optional integer that defines the stroke width. Default is
         * 1. This is stored in <strokewidth>.
         */
        constructor(bounds, fill, stroke, strokewidth) {
            super();
            this.bounds = bounds;
            this.fill = fill;
            this.stroke = stroke;
            this.strokewidth = (strokewidth != null) ? strokewidth : 1;
        }

        /**
         * Variable: maxHeight
         *
         * Defines the maximum height of the top and bottom part
         * of the cylinder shape.
         */
        maxHeight = 40;

        /**
         * Variable: svgStrokeTolerance
         *
         * Sets stroke tolerance to 0 for SVG.
         */
        svgStrokeTolerance = 0;

        /**
         * Function: paintVertexShape
         * 
         * Redirects to redrawPath for subclasses to work.
         */
        paintVertexShape(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
            c.translate(x, y);
            c.begin();
            this.redrawPath(c, x, y, w, h, false);
            c.fillAndStroke();

            c.setShadow(false);

            c.begin();
            this.redrawPath(c, x, y, w, h, true);
            c.stroke();
        }

        /**
         * Function: redrawPath
         *
         * Draws the path for this shape.
         */
        redrawPath(c: AbstractCanvas2D, x: number, y: number, w: number, h: number, isForeground: boolean) {
            var dy = Math.min(this.maxHeight, Math.round(h / 5));

            if ((isForeground && this.fill != null) || (!isForeground && this.fill == null)) {
                c.moveTo(0, dy);
                c.curveTo(0, 2 * dy, w, 2 * dy, w, dy);

                // Needs separate shapes for correct hit-detection
                if (!isForeground) {
                    c.stroke();
                    c.begin();
                }
            }

            if (!isForeground) {
                c.moveTo(0, dy);
                c.curveTo(0, -dy / 3, w, -dy / 3, w, dy);
                c.lineTo(w, h - dy);
                c.curveTo(w, h + dy / 3, 0, h + dy / 3, 0, h - dy);
                c.close();
            }
        }

        static factory(): Shape { return new CylinderShape(null, null, null, null); }
    }
}