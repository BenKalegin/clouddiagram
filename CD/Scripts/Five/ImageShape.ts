///<reference path="RectangleShape.ts" />

module Five {
    export class ImageShape extends RectangleShape {
        /// <summary> Extends Shape to implement an image shape. This shape is registered under ShapeStyle._IMAGE in xCellRenderer.</summary>

        private shadow: boolean;
        overlay: CellOverlay;

        constructor(bounds: Rectangle, public image: string, fill?: string, stroke?: string, strokewidth: number = 1) {
            /// <param name="bounds">Rectangle that defines the bounds. This is stored in Shape.bounds</param>
            /// <param name="image">String that specifies the URL of the image. This is stored in image</param>
            /// <param name="fill">String that defines the fill color. This is stored in fill</param>
            /// <param name="stroke">String that defines the stroke color. This is stored in stroke</param>
            /// <param name="strokewidth">Optional integer that defines the stroke width.</param>
            super(bounds, fill, stroke, strokewidth);
            this.shadow = false;
        }

        static factory(): Shape { return new ImageShape(null, null, null); }

        /**
         * Switch to preserve image aspect. Default is true.
         */
        preserveImageAspect = true;

        /**
         * Disables offset in IE9 for crisper image output.
         */
        getSvgScreenOffset() {
            return (!Client.isIe) ? 0.5 : 0;
        }

        /**
         * Overrides Shape.apply to replace the fill and stroke colors with the respective values from <Constants.STYLE_IMAGE_BACKGROUND> and
         * <Constants.STYLE_IMAGE_BORDER>.
         * 
         * Applies the style of the given <mxCellState> to the shape. This
         * implementation assigns the following styles to local fields:
         * 
         * - <Constants.STYLE_IMAGE_BACKGROUND> => fill
         * - <Constants.STYLE_IMAGE_BORDER> => stroke
         *
         * Parameters:
         *
         * state - <mxCellState> of the corresponding cell.
         */
        apply(state: CellState) {
            super.apply(state);

            this.fill = null;
            this.stroke = null;
            this.gradient = null;

            if (this.style != null) {
                this.preserveImageAspect = this.style.preserveImageAspect;
            }
        }

        /**
         * Function: isHtmlAllowed
         * 
         * Returns true if HTML is allowed for this shape. This implementation always
         * returns false.
         */
        isHtmlAllowed() {
            return !this.preserveImageAspect;
        }

        /**
         * Function: paintVertexShape
         * 
         * Generic background painting implementation.
         */
        // override
        paintVertexShape(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
            if (this.image != null) {
                var fill = this.style.imageBackground;
                var stroke = this.style.imageBorder;

                if (fill != null || stroke != null) {
                    c.setFillColor(fill);
                    c.setStrokeColor(stroke);
                    c.rect(x, y, w, h);
                    c.fillAndStroke();
                }

                // FlipH/V are implicit via mxShape.updateTransform
                c.image(x, y, w, h, this.image, this.preserveImageAspect, false, false);
            }
            else {
                super.paintBackground(c, x, y, w, h);
            }
        }

        /** Overrides <mxShape.redraw> to preserve the aspect ratio of images. */
        redrawHtmlShape() {
            var elem: HTMLElement = <HTMLElement>(this.node);
            elem.style.left = Math.round(this.bounds.x) + "px";
            elem.style.top = Math.round(this.bounds.y) + "px";
            elem.style.width = Math.max(0, Math.round(this.bounds.width)) + "px";
            elem.style.height = Math.max(0, Math.round(this.bounds.height)) + "px";
            elem.innerHTML = "";

            if (this.image != null) {
                var fill = this.style.imageBackground;
                var stroke = this.style.imageBorder;
                elem.style.backgroundColor = fill;
                elem.style.borderColor = stroke;

                var img = document.createElement("img");
                img.style.position = "absolute";
                img.src = this.image;

                var filter = (this.opacity < 100) ? "alpha(opacity=" + this.opacity + ")" : "";
                elem.style.filter = filter;

                if (this.flipH && this.flipV) {
                    filter += "progid:DXImageTransform.Microsoft.BasicImage(rotation=2)";
                }
                else if (this.flipH) {
                    filter += "progid:DXImageTransform.Microsoft.BasicImage(mirror=1)";
                }
                else if (this.flipV) {
                    filter += "progid:DXImageTransform.Microsoft.BasicImage(rotation=2, mirror=1)";
                }

                if (img.style.filter != filter) {
                    img.style.filter = filter;
                }


                if (this.rotation != 0) {
                    // LATER: Add flipV/H support
                    Utils.setPrefixedStyle(img.style, "transform", "rotate(" + this.rotation + "deg)");
                }
                else {
                    Utils.setPrefixedStyle(img.style, "transform", "");
                }

                // Known problem: IE clips top line of image for certain angles
                img.style.width = elem.style.width;
                img.style.height = elem.style.height;

                elem.style.backgroundImage = "";
                elem.appendChild(img);
            }
            else {
                this.setTransparentBackgroundImage(this.node);
            }
        }
    }
}