module Five { 
    export class AbstractCanvas2D {
        converter: UrlConverter;

        // Holds the current state.
        state: CanvasState = null;

        // Stack of states.
        private states: CanvasState[] = [];

        // Holds the current path as an array.
        //path = null;

        // Switch for rotation of HTML. Default is false.
        rotateHtml = true;

        // Holds the last x coordinate.
        lastX = 0;

        // Holds the last y coordinate.
        lastY = 0;

        // Contains the string used for moving in paths. Default is 'M'.
        moveOp = "M";

        // Contains the string used for moving in paths. Default is 'L'.
        lineOp = "L";

        // Contains the string used for quadratic paths. Default is 'Q'.
        quadOp = "Q";

        // Contains the string used for bezier curves. Default is 'C'.
        curveOp = "C";

        // Holds the operator for closing curves. Default is 'Z'.
        closeOp = "Z";

        // Boolean value that specifies if events should be handled. Default is false.
        pointerEvents = false;

        // Holds the current path as an array.
        path = null;

        constructor() {
            this.converter = this.createUrlConverter();
            this.reset();
        }

        createUrlConverter() {
            return new UrlConverter();
        }

        reset() {
            this.state = new CanvasState();
            this.states = [];
        }

        // Scales the current state.
        scale(value: number) {
            this.state.scale *= value;
            this.state.strokeWidth *= value;
        }

        // Sets the current stroke color.
        setStrokeColor(value) {
            if (value == Constants.none) {
                value = null;
            }
            this.state.strokeColor = value;
        }

        // Enables or disables dashed lines.
        setDashed(value: boolean) {
            this.state.dashed = value;
        }

        // Sets the current fill color.
        setFillColor(value: string) {
            if (value == Constants.none) {
                value = null;
            }

            this.state.fillColor = value;
            this.state.gradientColor = null;
        }

        // Sets the current gradient.
        setGradient(color1: string, color2: string, x: number, y: number, w: number, h: number, direction: Direction, alpha1: number = null, alpha2: number = null) {
            var s = this.state;
            s.fillColor = color1;
            s.fillAlpha = (alpha1 != null) ? alpha1 : 1;
            s.gradientColor = color2;
            s.gradientAlpha = (alpha2 != null) ? alpha2 : 1;
            s.gradientDirection = direction;
        }


        // Sets the rotation of the canvas.Note that rotation cannot be concatenated.
        rotate(theta: number, flipH: boolean, flipV: boolean, cx: number, cy: number) {
            if (theta != 0 || flipH || flipV) {
                var s = this.state;
                cx += s.dx;
                cy += s.dy;

                cx *= s.scale;
                cy *= s.scale;

                s.transform = s.transform || "";

                // This implementation uses custom scale/translate and built-in rotation
                // Rotation state is part of the AffineTransform in state.transform
                if (flipH && flipV) {
                    theta += 180;
                } else if (flipH || flipV) {
                    var tx = (flipH) ? cx : 0;
                    var sx = (flipH) ? -1 : 1;

                    var ty = (flipV) ? cy : 0;
                    var sy = (flipV) ? -1 : 1;

                    s.transform += "translate(" + this.format1(tx) + "," + this.format1(ty) + ")" +
                    "scale(" + this.format1(sx) + "," + this.format1(sy) + ")" +
                    "translate(" + this.format1(-tx) + "," + this.format1(-ty) + ")";
                }

                if (flipH ? !flipV : flipV) {
                    theta *= -1;
                }

                if (theta != 0) {
                    s.transform += "rotate(" + this.format1(theta) + "," + this.format1(cx) + "," + this.format1(cy) + ")";
                }

                s.rotation = s.rotation + theta;
                s.rotationCx = cx;
                s.rotationCy = cy;
            }
        }

        // Rotates the given point and returns the result as an<Point>.
        rotatePoint(x, y, theta, cx, cy) {
            var rad = theta * (Math.PI / 180);

            return Utils.getRotatedPoint(new Point(x, y), Math.cos(rad), Math.sin(rad), new Point(cx, cy));
        }

        // Sets the current alpha. TODO: convert to prpoerty
        setAlpha(value: number) {
            this.state.alpha = value;
        }

        setStrokeWidth(value: number) {
            /// <summary>Sets the current stroke width.</summary>
            /// <param name="value" type="number"></param>
            this.state.strokeWidth = value;
        }

        // Rounds all numbers to integers.
        format(value: string): number {
            return Math.round(parseFloat(value));
        }

        format1(value: number): number {
            return Math.round(value);
        }

        // Enables or disables and configures the current shadow.
        setShadow(enabled: boolean) {
            this.state.shadow = enabled;
        }

        // Sets the current dash pattern.
        setDashPattern(value: string) {
            this.state.dashPattern = value;
        }

        // Saves the current state.
        save() {
            this.states.push(this.state);
            this.state = Utils.clone(this.state);
        }

        // Restores the current state.
        restore() {
            this.state = this.states.pop();
        }

        // Starts a new path.
        begin() {
            this.lastX = 0;
            this.lastY = 0;
            this.path = [];
        }

        // Closes the current path.
        close( /*x1, y1, x2, y2, x3, y3*/) {
            this.addOp(this.closeOp);
        }

        // Adds the given operation to the path.
        addOp(op: string, ...numbers: number[]) {
            if (this.path != null) {
                this.path.push(op);

                if (numbers.length > 1) {
                    var s = this.state;

                    for (var i = 0; i < numbers.length; i += 2) {
                        this.lastX = numbers[i];
                        this.lastY = numbers[i + 1];

                        this.path.push(this.format1((this.lastX + s.dx) * s.scale));
                        this.path.push(this.format1((this.lastY + s.dy) * s.scale));
                    }
                }
            }
        }

        // Moves the current path the given coordinates.
        moveTo(x, y) {
            this.addOp(this.moveOp, x, y);
        }

        // Draws a line to the given coordinates. Uses moveTo with the op argument.
        lineTo(x: number, y: number) {
            this.addOp(this.lineOp, x, y);
        }

        // Adds a quadratic curve to the current path.
        quadTo(x1, y1, x2, y2) {
            this.addOp(this.quadOp, x1, y1, x2, y2);
        }

        // Adds a bezier curve to the current path.
        curveTo(x1, y1, x2, y2, x3, y3) {
            this.addOp(this.curveOp, x1, y1, x2, y2, x3, y3);
        }

        // Adds the given arc to the current path.This is a synthetic operation that is broken down into curves.
        arcTo(rx: number, ry: number, angle: number, largeArcFlag: number, sweepFlag: number, x, y) {
            var curves = Utils.arcToCurves(this.lastX, this.lastY, rx, ry, angle, largeArcFlag, sweepFlag, x, y);

            if (curves != null) {
                for (var i = 0; i < curves.length; i += 6) {
                    this.curveTo(curves[i], curves[i + 1], curves[i + 2], curves[i + 3], curves[i + 4], curves[i + 5]);
                }
            }
        }

        rect(x: number, y: number, w: number, h: number) { throw new Error("Not implemented"); }

        roundrect(x: number, y: number, w: number, h: number, dx: number, dy: number) { throw new Error("Not implemented"); }

        ellipse(x: number, y: number, w: number, h: number) { throw new Error("Not implemented"); }

        image(x: number, y: number, w: number, h: number, src: string, aspect: boolean, flipH: boolean, flipV: boolean) { throw new Error("Not implemented"); }

        text(x: number, y: number, w: number, h: number, str, align: HorizontalAlign, valign: VerticalAlign, wrap: boolean, format: string, overflow: Overflow, clip: boolean, rotation: number) { throw new Error("Not implemented"); }

        fillAndStroke() { throw new Error("Not implemented"); }

        fill() { throw new Error("Not implemented"); }

        stroke() { throw new Error("Not implemented"); }

        setLineCap(value: string): void {
            this.state.lineCap = value;
        }

        setLineJoin(value: string): void {
            this.state.lineJoin = value;
        }

        setMiterLimit(value: number): void {
            this.state.miterLimit = value;
        }

        setFontColor(value: string): void {
            if (value == Constants.none) {
                value = null;
            }
            this.state.fontColor = value;
        }

        setFontStyle(value: number): void {
            if (value == null) {
                value = 0;
            }
            this.state.fontStyle = value;
        }

        setFontFamily(value: string) {
            this.state.fontFamily = value;
        }

        setFontSize(value: number) {
            if (value == null) {
                value = 0;
            }
            this.state.fontStyle = value;
        }

        setFontBackgroundColor(value: string) {
            if (value == Constants.none) {
                value = null;
            }
            this.state.fontBackgroundColor = value;
        }

        setFontBorderColor(value: string) {
            if (value == Constants.none) {
                value = null;
            }
            this.state.fontBorderColor = value;
        }

        translate(dx: number, dy: number) {
            this.state.dx += dx;
            this.state.dy += dy;            
        }
    }
}