///<reference path="ActorShape.ts" />
module Five {
    export class HexagonShape extends ActorShape {
        constructor() {
            super();
        }

        redrawPath(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
            c.moveTo(0.25 * w, 0);
            c.lineTo(0.75 * w, 0);
            c.lineTo(w, 0.5 * h);
            c.lineTo(0.75 * w, h);
            c.lineTo(0.25 * w, h);
            c.lineTo(0, 0.5 * h);
            c.close();
        }
        static factory(): Shape { return new HexagonShape(); }
    }
}