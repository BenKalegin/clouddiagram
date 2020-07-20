///<reference path="Shape.ts" />

module Five {
    export class ActorShape extends Shape {
        constructor(bounds?: Rectangle, fill?: string, stroke?: string, strokewidth: number = 1) {
            super();
            this.bounds = bounds;
            this.fill = fill;
            this.stroke = stroke;
            this.strokewidth = strokewidth;
        }

        paintVertexShape(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
            c.translate(x, y);
            c.begin();
            this.redrawPath(c, x, y, w, h);
            c.fillAndStroke();
        }

        redrawPath(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
            var width = w / 3;
            c.moveTo(0, h);
            c.curveTo(0, 3 * h / 5, 0, 2 * h / 5, w / 2, 2 * h / 5);
            c.curveTo(w / 2 - width, 2 * h / 5, w / 2 - width, 0, w / 2, 0);
            c.curveTo(w / 2 + width, 0, w / 2 + width, 2 * h / 5, w / 2, 2 * h / 5);
            c.curveTo(w, 2 * h / 5, w, 3 * h / 5, w, h);
            c.close();
        }

        static factory(): Shape { return new ActorShape(null, null, null, 0); }
    }
}