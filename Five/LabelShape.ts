///<reference path="RectangleShape.ts" />

module Five {
    export class LabelShape extends RectangleShape {
        constructor(bounds: Rectangle, fill: string, stroke: string, strokewidth = 1) {
            super(bounds, fill, stroke, strokewidth);
        }

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
        init(container: Element) {
            super.init(container);

            if (this.indicatorShape != null) {
                this.indicator = this.indicatorShape();
                this.indicator.dialect = this.dialect;
                this.indicator.init(this.node);
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
            var align = Utils.getValue(this.style, Constants.styleImageAlign, Constants.alignLeft);
            var valign = Utils.getValue(this.style, Constants.styleImageVerticalAlign, Constants.alignMiddle);
            var width = Utils.getInt(this.style, Constants.styleImageWidth, Constants.defaultImagesize);
            var height = Utils.getInt(this.style, Constants.styleImageHeight, Constants.defaultImagesize);
            var spacing = Utils.getInt(this.style, Constants.styleSpacing, this.spacing) + 5;

            if (align == Constants.alignCenter) {
                x += (w - width) / 2;
            } else if (align == Constants.alignRight) {
                x += w - width - spacing;
            } else // default is left
            {
                x += spacing;
            }

            if (valign == Constants.alignTop) {
                y += spacing;
            } else if (valign == Constants.alignBottom) {
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
            var align = Utils.getValue(this.style, Constants.styleImageAlign, Constants.alignLeft);
            var valign = Utils.getValue(this.style, Constants.styleImageVerticalAlign, Constants.alignMiddle);
            var width = Utils.getInt(this.style, Constants.styleIndicatorWidth, this.indicatorSize);
            var height = Utils.getInt(this.style, Constants.styleIndicatorHeight, this.indicatorSize);
            var spacing = this.spacing + 5;

            if (align == Constants.alignRight) {
                x += w - width - spacing;
            } else if (align == Constants.alignCenter) {
                x += (w - width) / 2;
            } else // default is left
            {
                x += spacing;
            }

            if (valign == Constants.alignBottom) {
                y += h - height - spacing;
            } else if (valign == Constants.alignTop) {
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