///<reference path="Shape.ts" />

module Five {
    export class SwimlaneShape extends Shape {

        constructor(bounds: Rectangle, fill: string, stroke: string, strokewidth: number = 1) {
            super();
            this.bounds = bounds;
            this.fill = fill;
            this.stroke = stroke;
            this.strokewidth = strokewidth;
        }

        /**
         * Default imagewidth and imageheight if an image but no imagewidth and imageheight are defined in the style. Value is 16.
         */
        imageSize = 16;

        getTitleSize(): number {
            return Math.max(0, this.style.startSize, Constants.defaultStartsize);
        }

        getLabelBounds(rect: Rectangle) {
            var start = this.getTitleSize();
            var bounds = new Rectangle(rect.x, rect.y, rect.width, rect.height);
            var horizontal = this.isHorizontal();

            var flipH = this.style.flipH;
            var flipV = this.style.flipV;

            // East is default
            var shapeVertical = (this.direction == Direction.North || this.direction == Direction.South);
            var realHorizontal = horizontal == !shapeVertical;

            var realFlipH = !realHorizontal && flipH != (this.direction === Direction.South || this.direction === Direction.West);
            var realFlipV = realHorizontal && flipV != (this.direction === Direction.South || this.direction === Direction.West);

            // Shape is horizontal
            var tmp: number;
            if (!shapeVertical) {
                tmp = Math.min(bounds.height, start * this.scale);
                if (realFlipH || realFlipV) {
                    bounds.y += bounds.height - tmp;
                }

                bounds.height = tmp;
            } else {
                tmp = Math.min(bounds.width, start * this.scale);
                if (realFlipH || realFlipV) {
                    bounds.x += bounds.width - tmp;
                }

                bounds.width = tmp;
            }

            return bounds;
        }

        getGradientBounds(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
            var start = this.getTitleSize();

            if (this.isHorizontal()) {
                start = Math.min(start, h);
                return new Rectangle(x, y, w, start);
            } else {
                start = Math.min(start, w);
                return new Rectangle(x, y, start, h);
            }
        }

        getArcSizeWithStart(w: number, h: number, start: number): number {
            var f = (this.style.arcSize || Constants.rectangleRoundingFactor * 100) / 100;
            return start * f * 3;
        }

        isHorizontal(): boolean {
            return !this.style.portrait;
        }

        paintVertexShape(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
            var start = this.getTitleSize();
            var fill = this.style.swimlaneFillColor;
            var swimlaneLine = this.style.swimlaneLine || true;
            var r = 0;

            if (this.isHorizontal()) {
                start = Math.min(start, h);
            } else {
                start = Math.min(start, w);
            }

            c.translate(x, y);

            if (!this.isRounded) {
                this.paintSwimlane(c, x, y, w, h, start, fill, swimlaneLine);
            } else {
                r = this.getArcSizeWithStart(w, h, start);
                this.paintRoundedSwimlane(c, x, y, w, h, start, r, fill, swimlaneLine);
            }

            var sep = this.style.separatorColor;
            this.paintSeparator(c, x, y, w, h, start, sep);

            if (this.image != null) {
                var bounds = this.getImageBounds(x, y, w, h);
                c.image(bounds.x - x, bounds.y - y, bounds.width, bounds.height, this.image, false, false, false);
            }

            if (this.glass) {
                c.setShadow(false);
                this.paintGlassEffect(c, 0, 0, w, start, r);
            }
        }

        private paintSwimlane(c: AbstractCanvas2D, x: number, y: number, w: number, h: number, start: number, fill: string, swimlaneLine: boolean) {
            if (fill != Constants.none) {
                c.save();
                c.setFillColor(fill);
                c.rect(0, 0, w, h);
                c.fillAndStroke();
                c.restore();
                c.setShadow(false);
            }

            c.begin();

            if (this.isHorizontal()) {
                c.moveTo(0, start);
                c.lineTo(0, 0);
                c.lineTo(w, 0);
                c.lineTo(w, start);

                if (swimlaneLine) {
                    c.close();
                }

                c.fillAndStroke();

                // Transparent content area
                if (start < h && fill == Constants.none) {
                    c.pointerEvents = false;

                    c.begin();
                    c.moveTo(0, start);
                    c.lineTo(0, h);
                    c.lineTo(w, h);
                    c.lineTo(w, start);
                    c.stroke();
                }
            } else {
                c.moveTo(start, 0);
                c.lineTo(0, 0);
                c.lineTo(0, h);
                c.lineTo(start, h);

                if (swimlaneLine) {
                    c.close();
                }

                c.fillAndStroke();

                // Transparent content area
                if (start < w && fill == Constants.none) {
                    c.pointerEvents = false;

                    c.begin();
                    c.moveTo(start, 0);
                    c.lineTo(w, 0);
                    c.lineTo(w, h);
                    c.lineTo(start, h);
                    c.stroke();
                }
            }
        }

        private paintRoundedSwimlane(c: AbstractCanvas2D, x: number, y: number, w: number, h: number, start: number, r: number, fill: string, swimlaneLine: boolean) {
            if (fill != Constants.none) {
                c.save();
                c.setFillColor(fill);
                c.roundrect(0, 0, w, h, r, r);
                c.fillAndStroke();
                c.restore();
                c.setShadow(false);
            }

            c.begin();

            if (this.isHorizontal()) {
                c.moveTo(w, start);
                c.lineTo(w, r);
                c.quadTo(w, 0, w - Math.min(w / 2, r), 0);
                c.lineTo(Math.min(w / 2, r), 0);
                c.quadTo(0, 0, 0, r);
                c.lineTo(0, start);

                if (swimlaneLine) {
                    c.close();
                }

                c.fillAndStroke();

                // Transparent content area
                if (start < h && fill == Constants.none) {
                    c.pointerEvents = false;

                    c.begin();
                    c.moveTo(0, start);
                    c.lineTo(0, h - r);
                    c.quadTo(0, h, Math.min(w / 2, r), h);
                    c.lineTo(w - Math.min(w / 2, r), h);
                    c.quadTo(w, h, w, h - r);
                    c.lineTo(w, start);
                    c.stroke();
                }
            } else {
                c.moveTo(start, 0);
                c.lineTo(r, 0);
                c.quadTo(0, 0, 0, Math.min(h / 2, r));
                c.lineTo(0, h - Math.min(h / 2, r));
                c.quadTo(0, h, r, h);
                c.lineTo(start, h);

                if (swimlaneLine) {
                    c.close();
                }

                c.fillAndStroke();

                // Transparent content area
                if (start < w && fill == Constants.none) {
                    c.pointerEvents = false;

                    c.begin();
                    c.moveTo(start, h);
                    c.lineTo(w - r, h);
                    c.quadTo(w, h, w, h - Math.min(h / 2, r));
                    c.lineTo(w, Math.min(h / 2, r));
                    c.quadTo(w, 0, w - r, 0);
                    c.lineTo(start, 0);
                    c.stroke();
                }
            }
        }

        private paintSeparator(c: AbstractCanvas2D, x: number, y: number, w: number, h: number, start: number, color: string) {
            if (color != Constants.none) {
                c.setStrokeColor(color);
                c.setDashed(true);
                c.begin();

                if (this.isHorizontal()) {
                    c.moveTo(w, start);
                    c.lineTo(w, h);
                } else {
                    c.moveTo(start, 0);
                    c.lineTo(w, 0);
                }

                c.stroke();
                c.setDashed(false);
            }
        }

        private getImageBounds(x: number, y: number, w: number, h: number): Rectangle {
            if (this.isHorizontal()) {
                return new Rectangle(x + w - this.imageSize, y, this.imageSize, this.imageSize);
            } else {
                return new Rectangle(x, y, this.imageSize, this.imageSize);
            }
        }

        static factory(): Shape { return new SwimlaneShape(null, null, null); }
    }
}