///<reference path="Shape.ts" />

module Five {
    export class LineShape extends Shape {

        constructor(bounds: Rectangle, stroke: string, strokewidth: number = 1) {
            super();
            this.bounds = bounds;
            this.stroke = stroke;
            this.strokewidth = strokewidth;
        }

        paintVertexShape(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
            var mid = y + h / 2;

            c.begin();
            c.moveTo(x, mid);
            c.lineTo(x + w, mid);
            c.stroke();
        }

        static factory(): Shape { return new LineShape(null, null, 0); }
    }
}