///<reference path="ActorShape.ts" />

module Five {
    export class TriangleShape extends ActorShape {
        constructor() {
            super(null, null, null, 0);
        }

        redrawPath(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
            c.moveTo(0, 0);
            c.lineTo(w, 0.5 * h);
            c.lineTo(0, h);
            c.close();
        }
        
        static factory(): Shape { return new TriangleShape(); }
    }
}