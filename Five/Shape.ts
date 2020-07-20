module Five {

    export class Shape {
        className = "shape";

        opacity: number;
        private strokeWidth = 1;
        rotation = 0;

        // Holds the outermost DOM node that represents this shape
        node: Element = null;

        // Specifies if the shape is visible. Default is true.
        visible: boolean = true;

        // Holds the array of < Points > that specify the points of this shape
        private _points: Point[];

        get points(): Point[] { return this._points; }
        set points(value: Point[]) {
            if (value)
                for (var i = 0; i < value.length; i++)
                    value[i].check();
            this._points = value;
        }

        // Contains the bounding box of the shape, that is, the smallest rectangle that includes all pixels of the shape.
        boundingBox: Rectangle = null;

        // Optional reference to the style of the corresponding<CellState>.
        style: { [key: string]: string} = {};

        // Holds the scale in which the shape is being painted.
        scale = 1;

        // Holds the <Rectangle> that specifies the bounds of this shape
        private _bounds: Rectangle;

        // Specifies if pointer events should be handled. Default is true.
        pointerEvents = true;

        // Holds the < Stencil > that defines the shape.
        stencil: Stencil = null;

        // Event-tolerance for SVG strokes (in px).Default is 8. This is only passed to the canvas in <createSvgCanvas> if <pointerEvents> is true.
        svgStrokeTolerance = 8;

        // Specifies if the shape should be drawn as an outline.This disables all fill colors and can be used to disable other drawing states that should
        //  not be painted for outlines.Default is false.This should be set before calling<apply>.
        outline = false;
        direction: Direction = null;

        // Specifies if pointer events outside of shape should be handled.Default is false.
        private _shapePointerEvents = false;

        // Specifies if pointer events outside of stencils should be handled.Default is false.Set this to true for backwards compatibility with the 1.x branch.
        private _stencilPointerEvents = false;

        // Holds the dialect in which the shape is to be painted. This can be one of the DIALECT constants in <Constants>.
        private _dialect: Dialect = null;
        flipH = false;
        flipV = false;
        strokewidth = 1; // todo seems like dup of state
        stroke: string = null; // stroke color
        isDashed: boolean = null;
        isRounded: boolean = null;
        glass: boolean = null;
        isShadow: boolean = null;
        gradient: string = null;
        private gradientDirection: Direction;
        fill: string = null; // fill color

        // Specifies if pointer events should be handled.Default is true.
        svgPointerEvents = "all";
        state: CellState;
        private oldGradients: SVGLinearGradientElement[];
        arrowStrokewidth: number;
        spacing: number;
        private startSize: number;
        endSize: number;
        private startArrow: string; // todo to enum
        private endArrow: string; // todo to enum
        private cursor: string;
        indicatorShape: () => Shape;
        image: string;
        indicatorColor: string;
        indicatorStrokeColor: string;
        indicatorGradientColor: string;
        indicatorDirection: Direction;
        indicatorImage: string;

        constructor(stencil?: Stencil) {
            this.stencil = stencil;

            // Sets some defaults
            this.strokewidth = 1;
            this.rotation = 0;
            this.opacity = 100;
            this.flipH = false;
            this.flipV = false;
        }

        public nodeStyle(): CSSStyleDeclaration {
                return (<any>this.node).style;
        }

        set dialect(value: Dialect) {
            this._dialect = value;
        }

        get bounds(): Rectangle {
            return this._bounds;
        }

        set bounds(value: Rectangle) {
            this._bounds = value;
        }

        redraw() {
            this.updateBoundsFromPoints();

            if (this.visible && this.checkBounds()) {
                this.nodeStyle().visibility = "visible";
                this.clear(); // this.clearChildren();
                if (this.node.nodeName == "DIV" && (this.isHtmlAllowed() || !Client.isVml)) {
                    this.redrawHtmlShape();
                }
                else {
                    this.redrawShape();
                }
                this.updateBoundingBox();

            } else {
                this.nodeStyle().visibility = "hidden";
                this.boundingBox = null;
            }
        }

        checkBounds() {
            return (this.bounds != null && !isNaN(this.bounds.x) && !isNaN(this.bounds.y) &&
                !isNaN(this.bounds.width) && !isNaN(this.bounds.height) &&
                this.bounds.width > 0 && this.bounds.height > 0);
        }

        updateBoundsFromPoints() {
            var pts = this.points;

            if (pts != null && pts.length > 0 && pts[0] != null) {
                this.bounds = new Rectangle(pts[0].x, pts[0].y, 1, 1);

                for (var i = 1; i < this.points.length; i++) {
                    if (pts[i] != null) {
                        this.bounds.add(new Rectangle(pts[i].x, pts[i].y, 1, 1));
                    }
                }
            }
        }

        redrawShape() {
            var canvas = this.createCanvas();

            if (canvas != null) {
                // Specifies if events should be handled
                canvas.pointerEvents = this.pointerEvents;

                this.paint(canvas);
                this.destroyCanvas(canvas);
            }
        }

        // Returns true if the bounds should be inverted.
        isPaintBoundsInverted() {
            // Stencil implements inversion via aspect
            return this.stencil == null && (this.direction == Direction.North || this.direction == Direction.South);
        }

        paint(c: AbstractCanvas2D) {
            // Scale is passed-through to canvas
            var s = this.scale;
            var x = this.bounds.x / s;
            var y = this.bounds.y / s;
            var w = this.bounds.width / s;
            var h = this.bounds.height / s;

            if (this.isPaintBoundsInverted()) {
                var t = (w - h) / 2;
                x += t;
                y -= t;
                var tmp = w;
                w = h;
                h = tmp;
            }

            this.updateTransform(c, x, y, w, h);
            this.configureCanvas(c, x, y, w, h);

            // Adds background rectangle to capture events
            var bg = null;

            if ((this.stencil == null && this.points == null && this._shapePointerEvents) ||
            (this.stencil != null && this._stencilPointerEvents)) {
                var bb = this.createBoundingBox();

                if (this.dialect == Dialect.Svg) {
                    bg = this.createTransparentSvgRectangle(bb.x, bb.y, bb.width, bb.height);
                    this.node.appendChild(bg);
                }
            }

            if (this.stencil != null) {
                this.stencil.drawShape(c, this, x, y, w, h);
            } else {
                // Stencils have separate strokewidth
                c.setStrokeWidth(this.strokeWidth);

                if (this.points != null) {
                    // Paints edge shape
                    var pts = [];

                    for (var i = 0; i < this.points.length; i++) {
                        if (this.points[i] != null) {
                            pts.push(new Point(this.points[i].x / s, this.points[i].y / s));
                        }
                    }

                    this.paintEdgeShape(c, pts);
                } else {
                    // Paints vertex shape
                    this.paintVertexShape(c, x, y, w, h);
                }
            }

            if (bg != null && c.state != null && c.state.transform != null) {
                bg.setAttribute("transform", c.state.transform);
            }
        }

        // Sets the scale and rotation on the given canvas.
        updateTransform(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
            // NOTE: Currently, scale is implemented in state and canvas. This will
            // move to canvas in a later version, so that the states are unscaled
            // and untranslated and do not need an update after zooming or panning.
            c.scale(this.scale);
            c.rotate(this.getShapeRotation(), this.flipH, this.flipV, x + w / 2, y + h / 2);
        }

        // Hook for subclassers.This implementation is empty.
        paintEdgeShape(c: AbstractCanvas2D, pts: Point[]) {}

        // Hook for subclassers.This implementation is empty.
        paintBackground(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {}

        // Hook for subclassers.This implementation is empty.
        paintForeground(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {}

        // Paints the vertex shape.
        protected paintVertexShape(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
            this.paintBackground(c, x, y, w, h);
            c.setShadow(false);
            this.paintForeground(c, x, y, w, h);
        }

        // Destroys the given canvas which was used for drawing. This implementation
        // increments the reference counts on all shared gradients used in the canvas.
        createCanvas() {
            // LATER: Check if reusing existing DOM nodes improves performance
            var canvas = this.createSvgCanvas();

            if (this.outline) {
                canvas.setStrokeWidth(this.strokewidth);
                canvas.setStrokeColor(this.stroke);

                if (this.isDashed != null) {
                    canvas.setDashed(this.isDashed);
                }

                canvas.setStrokeWidth = () => {};
                canvas.setStrokeColor = () => {};
                canvas.setFillColor = () => {};
                canvas.setGradient = () => {};
                canvas.setDashed = () => {};
            }

            return canvas;
        }


        // Sets the state of the canvas for drawing the shape.
        configureCanvas(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
            var dash = null;

            if (this.style != null) {
                dash = this.style["dashPattern"];
            }

            c.setAlpha(this.opacity / 100);

            // Sets alpha, colors and gradients
            if (this.isShadow != null) {
                c.setShadow(this.isShadow);
            }

            // Dash pattern
            if (this.isDashed != null) {
                c.setDashed(this.isDashed);
            }

            if (dash != null) {
                c.setDashPattern(dash);
            }

            if (this.gradient != null) {
                var b = this.getGradientBounds(c, x, y, w, h);
                c.setGradient(this.fill, this.gradient, b.x, b.y, b.width, b.height, this.gradientDirection);
            } else {
                c.setFillColor(this.fill);
            }

            c.setStrokeColor(this.stroke);
        } 
        
        // Creates and returns an SvgCanvas2D for rendering this shape.
        createSvgCanvas() {
            var svgElement = <SVGElement>this.node;
            var canvas = new SvgCanvas2D(svgElement, false);
            canvas.strokeTolerance = (this.pointerEvents) ? this.svgStrokeTolerance : 0;
            canvas.pointerEventsValue = this.svgPointerEvents;
            canvas.blockImagePointerEvents = Client.isFf;
            var off = this.getSvgScreenOffset();

            if (off != 0) {
                svgElement.setAttribute("transform", "translate(" + off + "," + off + ")");
            } else {
                this.node.removeAttribute("transform");
            }

            return canvas;
        }

        // Returns a new rectangle that represents the bounding box of the bare shape
        // with no shadows or strokewidths.
        createBoundingBox(): Rectangle {
            var bb = Utils.clone(this.bounds);
            if ((this.stencil != null && (this.direction === Direction.North ||
                this.direction === Direction.South)) || this.isPaintBoundsInverted()) {
                var t = (bb.width - bb.height) / 2;
                bb.x += t;
                bb.y -= t;
                var tmp = bb.width;
                bb.width = bb.height;
                bb.height = tmp;
            }

            return bb;
        }

        // Updates the < boundingBox> for this shape using < createBoundingBox > and <augmentBoundingBox> and stores the result in <boundingBox>.
        updateBoundingBox() {
            if (this.bounds != null) {
                var bbox = this.createBoundingBox();

                if (bbox != null) {
                    this.augmentBoundingBox(bbox);
                    var rot = this.getShapeRotation();

                    if (rot != 0) {
                        bbox = Utils.getBoundingBox(bbox, rot);
                    }
                }

                this.boundingBox = bbox;
            }
        }

        createTransparentSvgRectangle(x: number, y: number, w: number, h: number): Element {
            /// <summary>Adds a transparent rectangle that catches all events.</summary>
            /// <param name="x" type=""></param>
            /// <param name="y" type=""></param>
            /// <param name="w" type=""></param>
            /// <param name="h" type=""></param>
            /// <returns type=""></returns>
            var rect = document.createElementNS(Constants.nsSvg, "rect");
            rect.setAttribute("x", "" + x);
            rect.setAttribute("y", "" + y);
            rect.setAttribute("width", "" + w);
            rect.setAttribute("height", "" + h);
            rect.setAttribute("fill", "none");
            rect.setAttribute("stroke", "none");
            rect.setAttribute("pointer-events", "all");

            return rect;
        }

        // Returns the actual rotation of the shape.
        getShapeRotation() {
            var rot = this.getRotation();

            if (this.direction != null) {
                if (this.direction == Direction.North) {
                    rot += 270;
                } else if (this.direction == Direction.West) {
                    rot += 180;
                } else if (this.direction == Direction.South) {
                    rot += 90;
                }
            }

            return rot;
        }

        // Returns the rotation from the style.
        getRotation(): number {
            return (this.rotation != null) ? this.rotation : 0;
        }

        // Paints the line shape.
        releaseSvgGradients(grads: SVGLinearGradientElement[]) {
            if (grads != null) {
                for (var i = 0; i < grads.length; i++) {
                    var gradient = grads[i];
                    var obj = <any>gradient;
                    obj.RefCount = (obj.RefCount || 0) - 1;

                    if (obj.RefCount == 0 && gradient.parentNode != null) {
                        gradient.parentNode.removeChild(gradient);
                    }
                }
            }
        }

        // Returns the bounding box for the gradient box for this shape.
        getGradientBounds(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
            return new Rectangle(x, y, w, h);
        }

        // Returns 0, or 0.5 if <strokewidth> % 2 == 1.
        getSvgScreenOffset(): number {
            // was != 'inherit'
            var sw = this.stencil && this.stencil.strokewidth != null ? Number(this.stencil.strokewidth) : this.strokewidth;
            return (Utils.mod(Math.max(1, Math.round(sw * this.scale)), 2) == 1) ? 0.5 : 0;
        }

        // Augments the bounding box with the strokewidth and shadow offsets.
        augmentBoundingBox(bbox: Rectangle) {
            if (this.isShadow) {
                bbox.width += Math.ceil(Constants.shadowOffsetX * this.scale);
                bbox.height += Math.ceil(Constants.shadowOffsetY * this.scale);
            }

            // Adds strokeWidth
            bbox.grow(this.strokewidth * this.scale / 2);
        }

        init(container: Element) {
            /// <summary>Initializes the shape by creaing the DOM node using create and adding it into the given container.</summary>
            /// <param name="container" type="">DOM node that will contain the shape.</param>
            if (this.node == null) {
                this.node = this.create(container);

                if (container != null) {
                    container.appendChild(this.node);
                }
            }
        }

        protected isParseVml() {
            return true;
        }

        isHtmlAllowed(): boolean {
            return false;
        }

        private create(container: Element) : Element {
            /// <summary>Creates and returns the DOM node(s) for the shape in the given container. This implementation invokes createSvg, createHtml or createVml depending on the dialect and style settings.</summary>
            /// <param name="container" type="">DOM node that will contain the shape</param>
            /// <returns type="Object"></returns>
            var node: Element;

            if (container != null && (<SVGElement>container).ownerSVGElement != null) {
                node = this.createGElement();
            } else
                node = this.createHtml();

            return node;
        }

        /* Creates and returns the SVG node(s) to represent this shape. */
        private createGElement(): SVGGElement {
            // todo unify construction
            var result = <SVGGElement>document.createElementNS(Constants.nsSvg, "g");
            result.id = this.className + "#" + ObjectIdentity.nodeCounter++;
            return result;
        }

        protected createHtml(): HTMLDivElement {
            /// <summary>Creates and returns the HTML DOM node(s) to represent this shape. This implementation falls back to createVml so that the HTML creation is optional</summary>
            var node: HTMLDivElement = document.createElement("div");
            node.style.position = "absolute";
            return node;
        }

        // Reconfigures this shape. This will update the colors etc in addition to the bounds or points.
        private reconfigure() {
            this.redraw();
        }

        private clear() {
            /// <summary>Removes all child nodes and resets all CSS.</summary>

            if (this.node instanceof SVGElement) {
                while (this.node.lastChild != null) {
                    this.node.removeChild(this.node.lastChild);
                }
            } else {
                var htmlElement = <HTMLElement>this.node;
                htmlElement.style.cssText = "position:absolute;";
                htmlElement.innerHTML = "";
            }
        }

        public getLabelBounds(rect: Rectangle) : Rectangle {
            /// <summary>Returns the xRectangle for the label bounds of this shape, based on the given scaled and translated bounds of the shape. 
            /// This method should not change the rectangle in-place. This implementation returns the given rect.</summary>
            return rect;
        }

        redrawHtmlShape() {
            /// <summary>Allow optimization by replacing VML with HTML</summary>
            // LATER: Refactor methods
            this.updateHtmlBounds(this.node);
            this.updateHtmlFilters(this.node);
            this.updateHtmlColors(this.node);
        }

        /**
         * Function: updateHtmlFilters
         *
         * Allow optimization by replacing VML with HTML.
         */
        private updateHtmlFilters(node) {
            var f = "";

            if (this.opacity < 100) {
                f += "alpha(opacity=" + (this.opacity) + ")";
            }

            if (this.isShadow) {
                // FIXME: Cannot implement shadow transparency with filter
                f += "progid:DXImageTransform.Microsoft.dropShadow (" +
                    "OffX='" + Math.round(Constants.shadowOffsetX * this.scale) + "', " +
                    "OffY='" + Math.round(Constants.shadowOffsetY * this.scale) + "', " +
                    "Color='" + Constants.shadowColor + "')";
            }

            if (this.gradient) {
                var start = this.fill;
                var end = this.gradient;
                var type = "0";

                var lookup = { east: 0, south: 1, west: 2, north: 3 };
                var dir = (this.direction != null) ? lookup[this.direction] : 0;

                if (this.gradientDirection != null) {
                    dir = Utils.mod(dir + lookup[this.gradientDirection] - 1, 4);
                }

                var tmp: string;
                if (dir == 1) {
                    type = "1";
                    tmp = start;
                    start = end;
                    end = tmp;
                } else if (dir == 2) {
                    tmp = start;
                    start = end;
                    end = tmp;
                } else if (dir == 3) {
                    type = "1";
                }

                f += "progid:DXImageTransform.Microsoft.gradient(" +
                    "startColorStr='" + start + "', endColorStr='" + end +
                    "', gradientType='" + type + "')";
            }

            node.style.filter = f;
        }

        /**
         * Function: mixedModeHtml
         *
         * Allow optimization by replacing VML with HTML.
         */
        private updateHtmlColors(node) {
            var color = this.stroke;

            if (color != null && color != Constants.none) {
                node.style.borderColor = color;

                if (this.isDashed) {
                    node.style.borderStyle = "dashed";
                } else if (this.strokewidth > 0) {
                    node.style.borderStyle = "solid";
                }

                node.style.borderWidth = Math.max(1, Math.ceil(this.strokewidth * this.scale)) + "px";
            } else {
                node.style.borderWidth = "0px";
            }

            color = this.fill;

            if (color != null && color != Constants.none) {
                node.style.backgroundColor = color;
                node.style.backgroundImage = "none";
            } else if (this.pointerEvents) {
                node.style.backgroundColor = "transparent";
            } else {
                this.setTransparentBackgroundImage(node);
            }
        }

        /** Allow optimization by replacing VML with HTML. */
        private updateHtmlBounds(node) {
            var sw = (document.documentMode >= 9) ? 0 : Math.ceil(this.strokewidth * this.scale);
            node.style.borderWidth = Math.max(1, sw) + "px";
            node.style.overflow = "hidden";

            node.style.left = Math.round(this.bounds.x - sw / 2) + "px";
            node.style.top = Math.round(this.bounds.y - sw / 2) + "px";

            if (document.compatMode == "CSS1Compat") {
                sw = -sw;
            }

            node.style.width = Math.round(Math.max(0, this.bounds.width + sw)) + "px";
            node.style.height = Math.round(Math.max(0, this.bounds.height + sw)) + "px";
        }

        /**
         * Function: destroyCanvas
         * 
         * Destroys the given canvas which was used for drawing. This implementation
         * increments the reference counts on all shared gradients used in the canvas.
         */
        private destroyCanvas(canvas) {
            // Manages reference counts
            if (canvas instanceof SvgCanvas2D) {
                // Increments ref counts
                var gradients = (<SvgCanvas2D>canvas).gradients;
                for (var i = 0; i < gradients.length; i++) {
                    var gradient = canvas.gradients[i];
                    gradient.mxRefCount = (gradient.mxRefCount || 0) + 1;
                }

                this.releaseSvgGradients(this.oldGradients);
                this.oldGradients = canvas.gradients;
            }
        }

        getArcSize(w: number, h: number) : number {
            /// <summary>Returns the arc size for the given dimension.</summary>
            var f = Utils.getInt(this.style, Constants.styleArcsize, Constants.rectangleRoundingFactor * 100) / 100;
            return Math.min(w * f, h * f);
        }

        /**
         * Function: paintGlassEffect
         * 
         * Paints the glass gradient effect.
         */
        paintGlassEffect(c, x, y, w, h, arc) {
            var sw = Math.ceil(this.strokewidth / 2);
            var size = 0.4;

            c.setGradient("#ffffff", "#ffffff", x, y, w, h * 0.6, "south", 0.9, 0.1);
            c.begin();
            arc += 2 * sw;

            if (this.isRounded) {
                c.moveTo(x - sw + arc, y - sw);
                c.quadTo(x - sw, y - sw, x - sw, y - sw + arc);
                c.lineTo(x - sw, y + h * size);
                c.quadTo(x + w * 0.5, y + h * 0.7, x + w + sw, y + h * size);
                c.lineTo(x + w + sw, y - sw + arc);
                c.quadTo(x + w + sw, y - sw, x + w + sw - arc, y - sw);
            } else {
                c.moveTo(x - sw, y - sw);
                c.lineTo(x - sw, y + h * size);
                c.quadTo(x + w * 0.5, y + h * 0.7, x + w + sw, y + h * size);
                c.lineTo(x + w + sw, y - sw);
            }

            c.close();
            c.fill();
        }

        /**
         * Function: apply
         * 
         * Applies the style of the given <mxCellState> to the shape. This
         * implementation assigns the following styles to local fields:
         * 
         * - <Constants.STYLE_FILLCOLOR> => fill
         * - <Constants.STYLE_GRADIENTCOLOR> => gradient
         * - <Constants.STYLE_GRADIENT_DIRECTION> => gradientDirection
         * - <Constants.STYLE_OPACITY> => opacity
         * - <Constants.STYLE_STROKECOLOR> => stroke
         * - <Constants.STYLE_STROKEWIDTH> => strokewidth
         * - <Constants.STYLE_SHADOW> => isShadow
         * - <Constants.STYLE_DASHED> => isDashed
         * - <Constants.STYLE_SPACING> => spacing
         * - <Constants.STYLE_STARTSIZE> => startSize
         * - <Constants.STYLE_ENDSIZE> => endSize
         * - <Constants.STYLE_ROUNDED> => isRounded
         * - <Constants.STYLE_STARTARROW> => startArrow
         * - <Constants.STYLE_ENDARROW> => endArrow
         * - <Constants.STYLE_ROTATION> => rotation
         * - <Constants.STYLE_DIRECTION> => direction
         * - <Constants.STYLE_GLASS> => glass
         *
         * This keeps a reference to the <style>. If you need to keep a reference to
         * the cell, you can override this method and store a local reference to
         * state.cell or the <mxCellState> itself. If <outline> should be true, make
         * sure to set it before calling this method.
         *
         * Parameters:
         *
         * state - <mxCellState> of the corresponding cell.
         */
        apply(state: CellState) {
            this.state = state;
            this.style = state.style;

            if (this.style != null) {
                this.fill = Utils.getValue(this.style, Constants.styleFillcolor, this.fill);
                this.gradient = Utils.getValue(this.style, Constants.styleGradientcolor, this.gradient);
                this.gradientDirection = Direction[Utils.getValue(this.style, Constants.styleGradientDirection, Direction[this.gradientDirection])];
                this.opacity = Utils.getInt(this.style, Constants.styleOpacity, this.opacity);
                this.stroke = Utils.getValue(this.style, Constants.styleStrokecolor, this.stroke);
                this.strokewidth = Utils.getInt(this.style, Constants.styleStrokeWidth, this.strokewidth);
                // Arrow stroke width is used to compute the arrow heads size in mxConnector
                this.arrowStrokewidth = Utils.getInt(this.style, Constants.styleStrokeWidth, this.strokewidth);
                this.spacing = Utils.getInt(this.style, Constants.styleSpacing, this.spacing);
                this.startSize = Utils.getInt(this.style, Constants.styleStartsize, this.startSize);
                this.endSize = Utils.getInt(this.style, Constants.styleEndsize, this.endSize);
                this.startArrow = Utils.getValue(this.style, Constants.styleStartarrow, this.startArrow);
                this.endArrow = Utils.getValue(this.style, Constants.styleEndarrow, this.endArrow);
                this.rotation = Utils.getInt(this.style, Constants.styleRotation, this.rotation);
                this.direction = Direction[Utils.getValue(this.style, Constants.styleDirection, Direction[this.direction])];
                this.flipH = Utils.getInt(this.style, Constants.styleFlipH, 0) == 1;
                this.flipV = Utils.getInt(this.style, Constants.styleFlipV, 0) == 1;

                // Legacy support for stencilFlipH/V
                if (this.stencil != null) {
                    this.flipH = Utils.getInt(this.style, "stencilFlipH", 0) == 1 || this.flipH;
                    this.flipV = Utils.getInt(this.style, "stencilFlipV", 0) == 1 || this.flipV;
                }

                if (this.direction == Direction.North || this.direction == Direction.South) {
                    var tmp = this.flipH;
                    this.flipH = this.flipV;
                    this.flipV = tmp;
                }

                this.isShadow = Utils.getBoolean(this.style, Constants.styleShadow, this.isShadow);
                this.isDashed = Utils.getBoolean(this.style, Constants.styleDashed, this.isDashed);
                this.isRounded = Utils.getBoolean(this.style, Constants.styleRounded, this.isRounded);
                this.glass = Utils.getBoolean(this.style, Constants.styleGlass, this.glass);

                if (this.fill == "none") {
                    this.fill = null;
                }

                if (this.gradient == "none") {
                    this.gradient = null;
                }

                if (this.stroke == "none") {
                    this.stroke = null;
                }
            }
        }

        /**
         * Sets the cursor on the given shape.
         * cursor - The cursor to be used.
         */
        setCursor(cursor: string) {
            if (cursor == null) {
                cursor = "";
            }

            this.cursor = cursor;

            if (this.node != null) {
                this.nodeStyle().cursor = cursor;
            }
        }

        //Returns the current cursor.
        getCursor() {
            return this.cursor;
        }


        // Returns the rotation for the text label.
        getTextRotation() : number {
            var rot = this.getRotation();

            if (Utils.getInt(this.style, Constants.styleHorizontal, 1) != 1) {
                rot += TextShape.verticalTextRotation;
            }

            return rot;
        }

        /**
     * Function: setTransparentBackgroundImage
     * 
     * Sets a transparent background CSS style to catch all events.
     * 
     * Paints the line shape.
     */
        setTransparentBackgroundImage(node) {
            node.style.backgroundImage = "url('" + FileStructure.imageBasePath + "/transparent.gif')";
        }

        /**
     * Function: destroy
     *
     * Destroys the shape by removing it from the DOM and releasing the DOM
     * node associated with the shape using <mxEvent.release>.
     */
        destroy() {
            if (this.node != null) {
                Events.release(this.node);

                if (this.node.parentNode != null) {
                    this.node.parentNode.removeChild(this.node);
                }

                this.node = null;
            }

            // Decrements refCount and removes unused
            this.releaseSvgGradients(this.oldGradients);
            this.oldGradients = null;
        }

    } 
}

