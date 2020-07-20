///<reference path="Shape.ts" />
module Five {

    /**
     * Extends Shape to implement a rhombus (aka diamond) shape. This shape is registered under <Constants.SHAPE_RHOMBUS> in <mxCellRenderer>.
     * 
     */
    export class RhombusShape extends Shape {
        constructor(bounds: Rectangle, fill: string, stroke: string, strokewidth) {
            super();
            this.bounds = bounds;
            this.fill = fill;
            this.stroke = stroke;
            this.strokewidth = (strokewidth != null) ? strokewidth : 1;
        }

        paintVertexShape(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
            var hw = w / 2;
            var hh = h / 2;

            c.begin();
            c.moveTo(x + hw, y);
            c.lineTo(x + w, y + hh);
            c.lineTo(x + hw, y + h);
            c.lineTo(x, y + hh);
            c.close();

            c.fillAndStroke();
        }

        static factory(): Shape { return new RhombusShape(null, null, null, null); }
    }
}