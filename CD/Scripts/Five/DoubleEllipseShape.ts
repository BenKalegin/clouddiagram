///<reference path="Shape.ts" />

module Five {
    export class DoubleEllipseShape extends Shape {
        constructor(bounds: Rectangle, fill: string, stroke: string, strokewidth = 1) {
            super();
            this.bounds = bounds;
            this.fill = fill;
            this.stroke = stroke;
            this.strokewidth = strokewidth;
        }

        /**
         * Scale for improving the precision of VML rendering. Default is 10.
         */
        vmlScale = 10;

        paintBackground(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
            c.ellipse(x, y, w, h);
            c.fillAndStroke();
        }

        paintForeground(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
            if (!this.outline) {
                var inset = this.style.margin || Math.min(3 + this.strokewidth, Math.min(w / 5, h / 5));
                x += inset;
                y += inset;
                w -= 2 * inset;
                h -= 2 * inset;

                // FIXME: Rounding issues in IE8 standards mode (not in 1.x)
                if (w > 0 && h > 0) {
                    c.ellipse(x, y, w, h);
                }

                c.stroke();
            }
        }

        static factory(): Shape { return new DoubleEllipseShape(null, null, null); }
    }
}