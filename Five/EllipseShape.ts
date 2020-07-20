///<reference path="Shape.ts" />

module Five {
    export class EllipseShape extends Shape{

        constructor(bounds : Rectangle, fill: string, stroke: string, strokewidth: number = 1) {
            /// <param name="bounds"> Rectangle that defines the bounds.This is stored in Shape.bounds</param>
            /// <param name="fill"> String that defines the fill color.This is stored in fill</param>
            /// <param name="stroke"> String that defines the stroke color.This is stored in stroke </param>
            /// <param name="strokewidth">Optional integer that defines the stroke width </param>
            super();
            this.bounds = bounds;
            this.fill = fill;
            this.stroke = stroke;
            this.strokewidth = strokewidth;
        }

        // override
        paintVertexShape(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
            c.ellipse(x, y, w, h);
            c.fillAndStroke();
        }

        static factory(): Shape { return new EllipseShape(null, null, null, 0); }

    }
}