///<reference path="RectangleShape.ts" />

module Five {
    export class LabelShape extends RectangleShape {
        constructor(bounds: Rectangle, fill: string, stroke: string, strokewidth = 1) {
            super(bounds, fill, stroke, strokewidth);
        }

        static factory(): Shape { return new LabelShape(null, null, null); }

        /** Default width and height for the image. Default is <Constants.DEFAULT_IMAGESIZE>. */
        static imageSize = Constants.defaultImagesize;

        /** Default value for image spacing. Default is 2. */
        spacing = 2;

        /** Default width and height for the indicicator. Default is 10. */
        indicatorSize = 10;

        /** Default spacing between image and indicator. Default is 2. */
        indicatorSpacing = 2;

        private indicator: Shape;
        
        /** Initializes the shape and the <indicator>. */
        init(initializer: IShapeInitializer) {
            super.init(initializer);

            if (this.indicatorShape != null) {
                this.indicator = this.indicatorShape();
                this.indicator.dialect = this.dialect;
                this.indicator.init(ElementInitializer(this.node));
            }
        }

        /**
         * Function: redraw
         *
         * Reconfigures this shape. This will update the colors of the indicator
         * and reconfigure it if required.
         */
        redraw() {
            if (this.indicator != null) {
                this.indicator.fill = this.indicatorColor;
                this.indicator.stroke = this.indicatorStrokeColor;
                this.indicator.gradient = this.indicatorGradientColor;
                this.indicator.direction = this.indicatorDirection;
            }
            super.redraw();
        }

        /** Returns true for non-rounded, non-rotated shapes with no glass gradient and no indicator shape. */
        isHtmlAllowed(): boolean {
            return super.isHtmlAllowed() && this.indicatorColor == null && this.indicatorShape == null;
        }

        /**
         * Function: paintForeground
         * 
         * Generic background painting implementation.
         */
        paintForeground(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
            this.paintImage(c, x, y, w, h);
            this.paintIndicator(c, x, y, w, h);

            super.paintForeground(c, x, y, w, h);
        }

        /**
         * Generic background painting implementation.
         */
        paintImage(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
            if (this.image != null) {
                var bounds = this.getImageBounds(x, y, w, h);
                c.image(bounds.x, bounds.y, bounds.width, bounds.height, this.image, false, false, false);
            }
        }

        /**
         * Function: getImageBounds
         * 
         * Generic background painting implementation.
         */
        getImageBounds(x: number, y: number, w: number, h: number): Rectangle {
            var align = this.style.imageAlign || HorizontalAlign.Left;
            var valign = this.style.imageVerticalAlign || VerticalAlign.Middle;
            var width = this.style.imageWidth || Constants.defaultImagesize;
            var height = this.style.imageHeight || Constants.defaultImagesize;
            var spacing = (this.style.spacing || this.spacing) + 5;

            if (align == HorizontalAlign.Center) {
                x += (w - width) / 2;
            } else if (align == HorizontalAlign.Right) {
                x += w - width - spacing;
            } else // default is left
            {
                x += spacing;
            }

            if (valign == VerticalAlign.Top) {
                y += spacing;
            } else if (valign == VerticalAlign.Bottom) {
                y += h - height - spacing;
            } else // default is middle
            {
                y += (h - height) / 2;
            }

            return new Rectangle(x, y, width, height);
        }


        paintIndicator(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
            if (this.indicator != null) {
                this.indicator.bounds = this.getIndicatorBounds(x, y, w, h);
                this.indicator.paint(c);
            } else if (this.indicatorImage != null) {
                var bounds = this.getIndicatorBounds(x, y, w, h);
                c.image(bounds.x, bounds.y, bounds.width, bounds.height, this.indicatorImage, false, false, false);
            }
        }

        getIndicatorBounds(x: number, y: number, w: number, h: number): Rectangle {
            var align = this.style.imageAlign || HorizontalAlign.Left;
            var valign = this.style.imageVerticalAlign || VerticalAlign.Middle;
            var width = this.style.indicatorWidth || this.indicatorSize;
            var height = this.style.indicatorHeight || this.indicatorSize;
            var spacing = this.spacing + 5;

            if (align == HorizontalAlign.Right) {
                x += w - width - spacing;
            } else if (align == HorizontalAlign.Center) {
                x += (w - width) / 2;
            } else // default is left
            {
                x += spacing;
            }

            if (valign == VerticalAlign.Bottom) {
                y += h - height - spacing;
            } else if (valign == VerticalAlign.Top) {
                y += spacing;
            } else // default is middle
            {
                y += (h - height) / 2;
            }

            return new Rectangle(x, y, width, height);
        }

        redrawHtmlShape() {
            super.redrawHtmlShape();

            // Removes all children
            while (this.node.hasChildNodes()) {
                this.node.removeChild(this.node.lastChild);
            }

            if (this.image != null) {
                var node = document.createElement("img");
                node.style.position = "relative";
                node.setAttribute("border", "0");

                var bounds = this.getImageBounds(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);
                bounds.x -= this.bounds.x;
                bounds.y -= this.bounds.y;

                node.style.left = Math.round(bounds.x) + "px";
                node.style.top = Math.round(bounds.y) + "px";
                node.style.width = Math.round(bounds.width) + "px";
                node.style.height = Math.round(bounds.height) + "px";

                node.src = this.image;

                this.node.appendChild(node);
            }
        }
    }
}