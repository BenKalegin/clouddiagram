///<reference path="Shape.ts" />

module Five {
    export class RectangleShape extends Shape{
        constructor(bounds: Rectangle, fill: string, stroke: string, strokewidth: number = 1) {
            super();
            this.bounds = bounds;
            this.fill = fill;
            this.stroke = stroke;
            this.strokewidth = strokewidth;
        }

        className = "RectangleShape";

        static factory() : Shape { return new RectangleShape(null, null, null);}

        /** Returns true for non-rounded, non-rotated shapes with no glass gradient. */
        isHtmlAllowed() {
            return !this.isRounded && !this.glass && this.rotation == 0;
        }

        /** Generic background painting implementation. */
        paintBackground(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
            if (this.isRounded) {
                var f = (this.style.arcSize || Constants.rectangleRoundingFactor * 100) / 100;
                var r = Math.min(w * f, h * f);
                c.roundrect(x, y, w, h, r, r);
            } else {
                c.rect(x, y, w, h);
            }

            c.fillAndStroke();
        }

        /** Generic background painting implementation. */
        paintForeground(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
            if (this.glass) {
                this.paintGlassEffect(c, x, y, w, h, this.getArcSize(w + this.strokewidth, h + this.strokewidth));
            }
        }

    }
}