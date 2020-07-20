///<reference path="ActorShape.ts" />

module Five {
    export class CloudShape extends ActorShape {
    constructor(bounds, fill, stroke, strokewidth) {
        super(bounds, fill, stroke, strokewidth);
    }

        redrawPath(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
            c.moveTo(0.25 * w, 0.25 * h);
            c.curveTo(0.05 * w, 0.25 * h, 0, 0.5 * h, 0.16 * w, 0.55 * h);
            c.curveTo(0, 0.66 * h, 0.18 * w, 0.9 * h, 0.31 * w, 0.8 * h);
            c.curveTo(0.4 * w, h, 0.7 * w, h, 0.8 * w, 0.8 * h);
            c.curveTo(w, 0.8 * h, w, 0.6 * h, 0.875 * w, 0.5 * h);
            c.curveTo(w, 0.3 * h, 0.8 * w, 0.1 * h, 0.625 * w, 0.2 * h);
            c.curveTo(0.5 * w, 0.05 * h, 0.3 * w, 0.05 * h, 0.25 * w, 0.25 * h);
            c.close();
        }

        static factory(): Shape { return new CloudShape(null, null, null, 0); }
    }
}