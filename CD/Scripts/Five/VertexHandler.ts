module Five {

    export interface INodeSelectionConfig {
        color: string;
        strokeWidth: number;
        dashed: boolean;
    }


    export interface ISelectionHandleConfig {
        fillColor: string;
        strokeColor: string;
        size: number;
    }

    export class VertexHandler implements ICellHandler {

        constructor(state: CellState, private nodeSelConfig: INodeSelectionConfig, private selHandleConfig: ISelectionHandleConfig) {
            if (state != null) {
                this.state = state;
                this.init();

                // Handles escape keystrokes
                this.escapeHandler = Utils.bind(this, () =>  {
                    if (this.livePreview) {
                        // Redraws the live preview
                        this.state.view.graph.cellRenderer.redraw(this.state, true);

                        // Redraws connected edges
                        this.state.view.invalidate(this.state.cell);
                        this.state.invalid = false;
                        this.state.view.validate();
                    }

                    this.reset();
                });

                this.state.view.graph.onEscape.add(this.escapeHandler);
            }
        }

        private escapeHandler: IListener<BasicEvent>;
        private graph: Graph = null;
        private selectionBounds: Rectangle;
        private bounds: Rectangle;
        private unscaledBounds: Rectangle;
        private selectionBorder: RectangleShape;
        private sizers: Shape[];
        private labelShape: Shape;
        private rotationShape: Shape;
        private minBounds: Rectangle;
        private x0: number;
        private y0: number;
        private inTolerance: boolean;
        private childOffsetX: number;
        private childOffsetY: number;
        private startX: number;
        private startY: number;
        private currentAlpha: number;
        private parentState: CellState;
        private preview: Shape;
        private edgeHandlers: ICellHandler[];

        /** Reference to the <mxCellState> being modified. */
        state: CellState = null;

        /** Specifies if only one sizer handle at the bottom, right corner should be used. Default is false. */
        private singleSizer = false;

        /** Holds the index of the current handle. */
        private _index: EventHandle = null;

        private get index(): EventHandle {
            return this._index;
        }

        private set index(value: EventHandle) {
            this._index = value;
        }

        /** Specifies if the bounds of handles should be used for hit-detection in IE or if <tolerance> > 0. Default is true. */
        private allowHandleBoundsCheck = true;

        /** Optional Image to be used as handles. Default is null. */
        private handleImage: Image = null;

        /** Optional tolerance for hit-detection in <getHandleForEvent>. Default is 0. */
        private tolerance = 0;

        /** Specifies if a rotation handle should be visible. Default is false. */
        private rotationEnabled = false;

        /** Specifies if rotation steps should be "rasterized" depening on the distance to the handle. Default is true. */
        private rotationRaster = true;

        /** Specifies the cursor for the rotation handle. Default is 'crosshair'. */
        private rotationCursor = "crosshair";

        /** Specifies if resize should change the cell in-place. This is an experimental feature for non-touch devices. Default is false. */
        private livePreview = false;

        /** Specifies if sizers should be hidden and spaced if the vertex is small.Default is false. */
        private manageSizers = false;

        /** Specifies if the size of groups should be constrained by the children. Default is false. */
        private constrainGroupByChildren = false;

        /** Vertical spacing for rotation icon. Default is -16. */
        private rotationHandleVSpacing = -16;

        /** The horizontal offset for the handles. This is updated in <redrawHandles> if <manageSizers> is true and the sizers are offset horizontally. */
        private horizontalOffset = 0;

        /** The horizontal offset for the handles. This is updated in <redrawHandles> if <manageSizers> is true and the sizers are offset vertically. */
        private verticalOffset = 0;

        /** Initializes the shapes required for this vertex handler. */
        private init() {
            this.graph = this.state.view.graph;
            this.selectionBounds = this.getSelectionBounds(this.state);
            this.bounds = new Rectangle(this.selectionBounds.x, this.selectionBounds.y, this.selectionBounds.width, this.selectionBounds.height);
            this.selectionBorder = this.createSelectionShape(this.bounds);
            // VML dialect required here for event transparency in IE
            this.selectionBorder.dialect = Dialect.Svg;
            this.selectionBorder.pointerEvents = false;
            this.selectionBorder.rotation = this.state.style.rotation;
            this.selectionBorder.init(ElementInitializer(this.graph.getView().getOverlayPane()));
            Events.redirectMouseEvents(this.selectionBorder.node, this.graph, () => this.state);

            if (this.graph.isCellMovable(this.state.cell)) {
                Utils.nodeStyle(this.selectionBorder.node).cursor = Constants.cursorMovableVertex;
            }

            // Adds the sizer handles
            if (GraphHandler.maxCells <= 0 || this.graph.getSelectionCount() < GraphHandler.maxCells) {
                var resizable = this.graph.isCellResizable(this.state.cell);
                this.sizers = [];

                if (resizable || (this.graph.isLabelMovable(this.state.cell) &&
                    this.state.width >= 2 && this.state.height >= 2)) {
                    var i = 0;

                    if (resizable) {
                        if (!this.singleSizer) {
                            this.sizers.push(this.createSizer("nw-resize", i++));
                            this.sizers.push(this.createSizer("n-resize", i++));
                            this.sizers.push(this.createSizer("ne-resize", i++));
                            this.sizers.push(this.createSizer("w-resize", i++));
                            this.sizers.push(this.createSizer("e-resize", i++));
                            this.sizers.push(this.createSizer("sw-resize", i++));
                            this.sizers.push(this.createSizer("s-resize", i++));
                        }

                        this.sizers.push(this.createSizer("se-resize", i++));
                    }

                    var geo = Cells.getGeometry(this.state.cell);

                    if (geo != null && !geo.relative && !this.graph.isSwimlane(this.state.cell) &&
                        this.graph.isLabelMovable(this.state.cell)) {
                        // Marks this as the label handle for getHandleForEvent
                        this.labelShape = this.createSizer(Constants.cursorLabelHandle, EventHandle.Label, Constants.labelHandleSize, Constants.labelHandleFillcolor);
                        this.sizers.push(this.labelShape);
                    }
                }
                else if (this.graph.isCellMovable(this.state.cell) && !this.graph.isCellResizable(this.state.cell) &&
                    this.state.width < 2 && this.state.height < 2) {
                    this.labelShape = this.createSizer(Constants.cursorMovableVertex, null, null, Constants.labelHandleFillcolor);
                    this.sizers.push(this.labelShape);
                }
            }

            // Adds the rotation handler
            if (this.graph.isEnabled() && this.rotationEnabled && this.graph.isCellRotatable(this.state.cell) &&
                (GraphHandler.maxCells <= 0 || this.graph.getSelectionCount() < GraphHandler.maxCells) &&
                this.state.width > 2 && this.state.height > 2) {
                this.rotationShape = this.createSizer(this.rotationCursor, EventHandle.Rotation,
                    this.selHandleConfig.size + 3, this.selHandleConfig.fillColor);
                this.sizers.push(this.rotationShape);
            }

            this.redraw();

            if (this.constrainGroupByChildren) {
                this.updateMinBounds();
            }
        }

        private createCustomHandles() : ICellHandler[] {
            return null;
        }

        /** Returns true if the aspect ratio if the cell should be maintained. */
        private isConstrainedEvent(me: MouseEventContext) {
            return Events.isMouseShiftDown(me.getEvent()) || this.state.style[Constants.styleAspect] == "fixed";
        }

        /** Initializes the shapes required for this vertex handler. */
        private updateMinBounds() {
            var children = this.graph.getChildCells(this.state.cell);

            if (children.length > 0) {
                this.minBounds = this.graph.view.getBounds(children);

                if (this.minBounds != null) {
                    var s = this.state.view.scale;
                    var t = this.state.view.translate;

                    this.minBounds.x -= this.state.x;
                    this.minBounds.y -= this.state.y;
                    this.minBounds.x /= s;
                    this.minBounds.y /= s;
                    this.minBounds.width /= s;
                    this.minBounds.height /= s;
                    this.x0 = this.state.x / s - t.x;
                    this.y0 = this.state.y / s - t.y;
                }
            }
        }

        /** Returns the Rectangle that defines the bounds of the selection border. */
        private getSelectionBounds(state) : Rectangle {
            return new Rectangle(Math.round(state.x), Math.round(state.y), Math.round(state.width), Math.round(state.height));
        }

        /** Creates the shape used to draw the selection border. */
        private createSelectionShape(bounds: Rectangle): Shape {
            if (this.nodeSelConfig.strokeWidth > 1) {
                bounds = bounds.clone();
                bounds.grow(this.nodeSelConfig.strokeWidth - 1);
            }
            var shape = new RectangleShape(bounds, null, this.nodeSelConfig.color);
            shape.strokewidth = this.nodeSelConfig.strokeWidth;
            shape.isDashed = this.nodeSelConfig.dashed;

            return shape;
        }

        /** Creates a sizer handle for the specified cursor and index and returns the new <RectangleShape> that represents the handle. */
        private createSizer(cursor: string, index: EventHandle, size?: number, fillColor?: string) {
            size = size || this.selHandleConfig.size;

            var bounds = new Rectangle(0, 0, size, size);
            var sizer = this.createSizerShape(bounds, index, fillColor);

            if (sizer.isHtmlAllowed() && this.state.text != null && this.graph.container.is(this.state.text.node.parentNode)) {
                sizer.bounds.height -= 1;
                sizer.bounds.width -= 1;
                sizer.dialect = Dialect.StrictHtml;
                sizer.init(this.graph.container);
            }
            else {
                sizer.dialect = (this.graph.dialect != Dialect.Svg) ? Dialect.MixedHtml : Dialect.Svg;
                sizer.init(ElementInitializer(this.graph.getView().getOverlayPane()));
            }

            Events.redirectMouseEvents(sizer.node, this.graph, () => this.state);

            if (this.graph.isEnabled()) {
                Utils.nodeStyle(sizer.node).cursor = cursor;
            }

            if (!this.isSizerVisible(index)) {
                Utils.nodeStyle(sizer.node).visibility = "hidden";
            }

            return sizer;
        }

        /** Returns true if the sizer for the given index is visible. This returns true for all given indices. */
        private isSizerVisible(index: EventHandle) : boolean {
            return true;
        }

        /** Creates the shape used for the sizer handle for the specified bounds an index. Only images and rectangles should be returned if support for HTML
         * labels with not foreign objects is required. */
        private createSizerShape(bounds: Rectangle, index: EventHandle, fillColor: string): Shape {
            if (this.handleImage != null) {
                bounds = new Rectangle(bounds.x, bounds.y, this.handleImage.width, this.handleImage.height);
                var shape = new ImageShape(bounds, this.handleImage.src);

                // Allows HTML rendering of the images
                shape.preserveImageAspect = false;

                return shape;
            }
            else if (index == EventHandle.Rotation) {
                return new EllipseShape(bounds, fillColor || this.selHandleConfig.fillColor, this.selHandleConfig.strokeColor);
            }
            else {
                return new RectangleShape(bounds, fillColor || this.selHandleConfig.fillColor, this.selHandleConfig.strokeColor);
            }
        }

        /** Helper method to create an <Rectangle> around the given centerpoint with a width and height of 2*s or 6, if no s is given. */
        private moveSizerTo(shape: Shape, x: number, y: number) {
            if (shape != null) {
                shape.bounds.x = Math.round(x - shape.bounds.width / 2);
                shape.bounds.y = Math.round(y - shape.bounds.height / 2);

                // Fixes visible inactive handles in VML
                if (shape.node != null && Utils.nodeStyle(shape.node).display != "none") {
                    shape.redraw();
                }
            }
        }

        /** Returns the index of the handle for the given event. This returns the index of the sizer from where the event originated or <Events.LABEL_INDEX>. */
        private getHandleForEvent(me: MouseEventContext) : EventHandle {
            // Connection highlight may consume events before they reach sizer handle
            var tol = (!Events.isMouseEvent(me.getEvent())) ? this.tolerance : 1;
            var hit = (this.allowHandleBoundsCheck && (Client.isIe || tol > 0)) ?
                new Rectangle(me.getGraphX() - tol, me.getGraphY() - tol, 2 * tol, 2 * tol) : null;
            var minDistSq = null;

            function checkShape(shape: Shape) {
                if (shape != null && (me.isSource(shape) || (hit != null && Utils.intersects(shape.bounds, hit) &&
                    Utils.nodeStyle(shape.node).display != "none" && Utils.nodeStyle(shape.node).visibility != "hidden"))) {
                    var dx = me.getGraphX() - shape.bounds.getCenterX();
                    var dy = me.getGraphY() - shape.bounds.getCenterY();
                    var tmp = dx * dx + dy * dy;

                    if (minDistSq == null || tmp <= minDistSq) {
                        minDistSq = tmp;

                        return true;
                    }
                }

                return false;
            }

            if (checkShape(this.rotationShape)) {
                return EventHandle.Rotation;
            }
            else if (checkShape(this.labelShape)) {
                return EventHandle.Label;
            }

            if (this.sizers != null) {
                for (var i = 0; i < this.sizers.length; i++) {
                    if (checkShape(this.sizers[i])) {
                        return i;
                    }
                }
            }

            return null;
        }

        /** Handles the event if a handle has been clicked. By consuming the event all subsequent events of the gesture are redirected to this handler. */
        mouseDown(sender: Object, me: MouseEventContext) {
            var tol = (!Events.isMouseEvent(me.getEvent())) ? this.tolerance : 0;

            if (!me.isConsumed() && this.graph.isEnabled() && (tol > 0 || me.getState() == this.state)) {
                var handle = this.getHandleForEvent(me);

                if (handle != null) {
                    this.start(me.getGraphX(), me.getGraphY(), handle);
                    me.consume();
                }
            }
        }

        /** Called if <livePreview> is enabled to check if a border should be painted. This implementation returns true if the shape is transparent. */
        private isLivePreviewBorder(): boolean {
            return this.state.shape != null && this.state.shape.fill == null && this.state.shape.stroke == null;
        }

        /** Starts the handling of the mouse gesture. */
        private start(x: number, y: number, index: EventHandle) {
            this.inTolerance = true;
            this.childOffsetX = 0;
            this.childOffsetY = 0;
            this.index = index;
            this.startX = x;
            this.startY = y;

            // Saves reference to parent state
            var parent = Cells.getParent(this.state.cell);

            if (this.state.view.currentRoot != parent && (Cells.isVertex(parent) || Cells.isEdge(parent))) {
                this.parentState = this.state.view.graph.view.getState(parent);
            }

            // Creates a preview that can be on top of any HTML label
            Utils.nodeStyle(this.selectionBorder.node).display = (index == EventHandle.Rotation) ? "inline" : "none";

            // Creates the border that represents the new bounds
            if (!this.livePreview || this.isLivePreviewBorder()) {
                this.preview = this.createSelectionShape(this.bounds);

                if (!(Client.isSvg && this.state.style.rotation != 0) &&
                    this.state.text != null && this.graph.container.is(this.state.text.node.parentNode)) {
                    this.preview.dialect = Dialect.StrictHtml;
                    this.preview.init(this.graph.container);
                } else {
                    this.preview.dialect = (this.graph.dialect != Dialect.Svg) ? Dialect.Vml : Dialect.Svg;
                    this.preview.init(ElementInitializer(this.graph.view.getOverlayPane()));
                }
            }

            // Prepares the handles for live preview
            if (this.livePreview) {
                this.hideSizers();

                if (index == EventHandle.Rotation) {
                    Utils.nodeStyle(this.rotationShape.node).display = "";
                } else if (this.sizers != null && this.sizers[index] != null) {
                    Utils.nodeStyle(this.sizers[index].node).display = "";
                }

                // Gets the array of connected edge handlers for redrawing
                var edges = this.graph.getEdges(this.state.cell);
                this.edgeHandlers = [];

                for (var i = 0; i < edges.length; i++) {
                    var handler = this.graph.selectionCellsHandler.getHandler(edges[i]);

                    if (handler != null) {
                        this.edgeHandlers.push(handler);
                    }
                }
            }
        }

        /** Hides all sizers except. Starts the handling of the mouse gesture. */
        private hideSizers() {
            if (this.sizers != null) {
                for (var i = 0; i < this.sizers.length; i++) {
                    Utils.nodeStyle(this.sizers[i].node).display = "none";
                }
            }
        }

        /** Checks if the coordinates for the given event are within the <mxGraph.tolerance>. If the event is a mouse event then the tolerance is ignored. */
        private checkTolerance(me: MouseEventContext) {
            if (this.inTolerance && this.startX != null && this.startY != null) {
                if (Events.isMouseEvent(me.getEvent()) ||
                    Math.abs(me.getGraphX() - this.startX) > this.graph.tolerance ||
                    Math.abs(me.getGraphY() - this.startY) > this.graph.tolerance) {
                    this.inTolerance = false;
                }
            }
        }

        /** Hook for subclassers do show details while the handler is active. */
        private updateHint(me: MouseEventContext) {}

        /** Hooks for subclassers to hide details when the handler gets inactive.*/
        private removeHint() {}

        /** Hook for rounding the angle. This uses Math.round. */
        private roundAngle(angle: number): number {
            return Math.round(angle);
        }

        /** Hook for rounding the unscaled width or height. This uses Math.round. */
        private roundLength(length: number): number {
            return Math.round(length);
        }

        private rotateOnMove(point: Point, me: MouseEventContext) {
            var dx = this.state.x + this.state.width / 2 - point.x;
            var dy = this.state.y + this.state.height / 2 - point.y;

            this.currentAlpha = (dx != 0) ? Math.atan(dy / dx) * 180 / Math.PI + 90 : ((dy < 0) ? 180 : 0);

            if (dx > 0) {
                this.currentAlpha -= 180;
            }

            // Rotation raster
            if (this.rotationRaster && this.graph.isGridEnabledEvent(me.getEvent())) {
                var cx = point.x - this.state.getCenterX();
                var cy = point.y - this.state.getCenterY();
                var dist = Math.abs(Math.sqrt(cx * cx + cy * cy) - this.state.height / 2 - 20);
                var raster = Math.max(1, 5 * Math.min(3, Math.max(0, Math.round(80 / Math.abs(dist)))));

                this.currentAlpha = Math.round(this.currentAlpha / raster) * raster;
            } else {
                this.currentAlpha = this.roundAngle(this.currentAlpha);
            }

            this.selectionBorder.rotation = this.currentAlpha;
            this.selectionBorder.redraw();

            if (this.livePreview) {
                this.redrawHandles();
            }
        }

        /** Handles the event by updating the preview. */
        mouseMove(sender: Object, me: MouseEventContext) {
            if (!me.isConsumed() && this.index != null) {
                // Checks tolerance for ignoring single clicks
                this.checkTolerance(me);

                if (!this.inTolerance) {
                    var point = new Point(me.getGraphX(), me.getGraphY());
                    var gridEnabled = this.graph.isGridEnabledEvent(me.getEvent());
                    var scale = this.graph.view.scale;
                    var tr = this.graph.view.translate;

                    if (this.index == EventHandle.Label) {
                        if (gridEnabled) {
                            point.x = (this.graph.snap(point.x / scale - tr.x) + tr.x) * scale;
                            point.y = (this.graph.snap(point.y / scale - tr.y) + tr.y) * scale;
                        }

                        this.moveSizerTo(this.sizers[this.sizers.length - 1], point.x, point.y);
                    } else if (this.index == EventHandle.Rotation) {
                        this.rotateOnMove(point, me);
                    } else {
                        var alpha = Utils.toRadians(this.state.style.rotation);
                        var cos = Math.cos(-alpha);
                        var sin = Math.sin(-alpha);

                        var ct = new Point(this.state.getCenterX(), this.state.getCenterY());

                        var dx = point.x - this.startX;
                        var dy = point.y - this.startY;

                        // Rotates vector for mouse gesture
                        var tx = cos * dx - sin * dy;
                        var ty = sin * dx + cos * dy;

                        dx = tx;
                        dy = ty;

                        var geo = this.graph.getCellGeometry(this.state.cell);
                        this.unscaledBounds = this.union(geo, dx / scale, dy / scale,
                            this.index, gridEnabled, 1, new Point(0, 0), this.isConstrainedEvent(me));
                        this.bounds = new Rectangle(((this.parentState != null) ? this.parentState.x : tr.x * scale) +
                        (this.unscaledBounds.x) * scale, ((this.parentState != null) ? this.parentState.y : tr.y * scale) +
                        (this.unscaledBounds.y) * scale, this.unscaledBounds.width * scale, this.unscaledBounds.height * scale);

                        if (geo.relative && this.parentState != null) {
                            this.bounds.x += this.state.x - this.parentState.x;
                            this.bounds.y += this.state.y - this.parentState.y;
                        }

                        cos = Math.cos(alpha);
                        sin = Math.sin(alpha);

                        var c2 = new Point(this.bounds.getCenterX(), this.bounds.getCenterY());

                        dx = c2.x - ct.x;
                        dy = c2.y - ct.y;

                        var dx2 = cos * dx - sin * dy;
                        var dy2 = sin * dx + cos * dy;

                        var dx3 = dx2 - dx;
                        var dy3 = dy2 - dy;

                        var dx4 = this.bounds.x - this.state.x;
                        var dy4 = this.bounds.y - this.state.y;

                        var dx5 = cos * dx4 - sin * dy4;
                        var dy5 = sin * dx4 + cos * dy4;

                        this.bounds.x += dx3;
                        this.bounds.y += dy3;

                        // Rounds unscaled bounds to int
                        this.unscaledBounds.x = this.roundLength(this.unscaledBounds.x + dx3 / scale);
                        this.unscaledBounds.y = this.roundLength(this.unscaledBounds.y + dy3 / scale);
                        this.unscaledBounds.width = this.roundLength(this.unscaledBounds.width);
                        this.unscaledBounds.height = this.roundLength(this.unscaledBounds.height);

                        // Shifts the children according to parent offset
                        if (!this.graph.isCellCollapsed(this.state.cell) && (dx3 != 0 || dy3 != 0)) {
                            this.childOffsetX = this.state.x - this.bounds.x + dx5;
                            this.childOffsetY = this.state.y - this.bounds.y + dy5;
                        } else {
                            this.childOffsetX = 0;
                            this.childOffsetY = 0;
                        }

                        // TODO: Apply child offset to children in live preview
                        if (this.livePreview) {
                            // Saves current state
                            var tmp = new Rectangle(this.state.x, this.state.y, this.state.width, this.state.height);
                            var orig = this.state.origin;

                            // Temporarily changes size and origin
                            this.state.x = this.bounds.x;
                            this.state.y = this.bounds.y;
                            this.state.origin = new Point(this.state.x / scale - tr.x, this.state.y / scale - tr.y);
                            this.state.width = this.bounds.width;
                            this.state.height = this.bounds.height;

                            // Redraws cell and handles
                            var off = this.state.absoluteOffset;
                            off = new Point(off.x, off.y);

                            // Required to store and reset absolute offset for updating label position
                            this.state.absoluteOffset.x = 0;
                            this.state.absoluteOffset.y = 0;
                            //var geo = this.graph.getCellGeometry(this.state.cell);

                            if (geo != null) {
                                var offset = geo.offset || new Point(0,0);

                                if (offset != null && !geo.relative) {
                                    this.state.absoluteOffset.x = this.state.view.scale * offset.x;
                                    this.state.absoluteOffset.y = this.state.view.scale * offset.y;
                                }

                                this.state.view.updateVertexLabelOffset(this.state);
                            }

                            // Draws the live preview
                            this.state.view.graph.cellRenderer.redraw(this.state, true);

                            // Redraws connected edges
                            this.state.view.invalidate(this.state.cell);
                            this.state.invalid = false;
                            this.state.view.validate();
                            this.redrawHandles();

                            // Restores current state
                            this.state.x = tmp.x;
                            this.state.y = tmp.y;
                            this.state.width = tmp.width;
                            this.state.height = tmp.height;
                            this.state.origin = orig;
                            this.state.absoluteOffset = off;
                        }

                        if (this.preview != null) {
                            this.drawPreview();
                        }
                    }

                    this.updateHint(me);
                }

                me.consume();
            }
            // Workaround for disabling the connect highlight when over handle
            else if (!this.graph.isMouseDown && this.getHandleForEvent(me) != null) {
                me.consume(false);
            }
        }

        /** Handles the event by applying the changes to the geometry. */
        mouseUp(sender: Object, me: MouseEventContext) {
            if (this.index != null && this.state != null) {
                var point = new Point(me.getGraphX(), me.getGraphY());

                this.graph.getModel().beginUpdate();
                try {
                    var rotation = this.state.style.rotation;
                    if (this.index == EventHandle.Rotation) {
                        if (this.currentAlpha != null) {
                            var delta = this.currentAlpha - rotation;

                            if (delta != 0) {
                                this.rotateCell(this.state.cell, delta, null);
                            }
                        }
                    }
                    else {
                        var gridEnabled = this.graph.isGridEnabledEvent(me.getEvent());
                        var alpha = Utils.toRadians(rotation);
                        var cos = Math.cos(-alpha);
                        var sin = Math.sin(-alpha);

                        var dx = point.x - this.startX;
                        var dy = point.y - this.startY;

                        // Rotates vector for mouse gesture
                        var tx = cos * dx - sin * dy;
                        var ty = sin * dx + cos * dy;

                        dx = tx;
                        dy = ty;

                        var s = this.graph.view.scale;
                        var recurse = this.isRecursiveResize(this.state, me);
                        this.resizeCell(this.state.cell, this.roundLength(dx / s), this.roundLength(dy / s),
                            this.index, gridEnabled, this.isConstrainedEvent(me), recurse);
                    }
                }
                finally {
                    this.graph.getModel().endUpdate();
                }

                me.consume();
                this.reset();
            }
        }

        /** Rotates the given cell to the given rotation. */
        private isRecursiveResize(state: CellState, me: MouseEventContext) : boolean {
            return this.graph.isRecursiveResize(this.state);
        }

        /** Rotates the given cell and its children by the given angle in degrees. Angle in degrees. */
        private rotateCell(cell: Cell, angle: number, parent: Cell) {
            if (angle != 0) {
                var model = this.graph.getModel();

                if (Cells.isVertex(cell) || Cells.isEdge(cell)) {
                    if (!Cells.isEdge(cell)) {
                        var state = this.graph.view.getState(cell);
                        var style = (state != null) ? state.style : this.graph.getCellStyle(cell);

                        if (style != null) {
                            var total = style.rotation + angle;
                            this.graph.setCellStyles((s) => s.rotation = total, [cell]);
                        }
                    }

                    var geo = this.graph.getCellGeometry(cell);

                    if (geo != null) {
                        var pgeo = this.graph.getCellGeometry(parent);

                        if (pgeo != null && !Cells.isEdge(parent)) {
                            geo = geo.clone();
                            geo.rotate(angle, new Point(pgeo.width / 2, pgeo.height / 2));
                            model.setGeometry(cell, geo);
                        }

                        if ((Cells.isVertex(cell) && !geo.relative) || Cells.isEdge(cell)) {
                            // Recursive rotation
                            var childCount = Cells.getChildCount(cell);

                            for (var i = 0; i < childCount; i++) {
                                this.rotateCell(Cells.getChildAt(cell, i), angle, cell);
                            }
                        }
                    }
                }
            }
        }

        /** Resets the state of this handler.*/
        reset() {
            if (this.sizers != null && this.index != null && this.sizers[this.index] != null) {
                var style = Utils.nodeStyle(this.sizers[this.index].node);
                if (style.display == "none") {
                    style.display = "";
                }
            }

            this.currentAlpha = null;
            this.inTolerance = null;
            this.index = null;

            // TODO: Reset and redraw cell states for live preview
            if (this.preview != null) {
                this.preview.destroy();
                this.preview = null;
            }

            // Checks if handler has been destroyed
            if (this.selectionBorder != null) {
                Utils.nodeStyle(this.selectionBorder.node).display = "inline";
                this.selectionBounds = this.getSelectionBounds(this.state);
                this.bounds = new Rectangle(this.selectionBounds.x, this.selectionBounds.y,
                    this.selectionBounds.width, this.selectionBounds.height);
                this.drawPreview();
            }

            if (this.livePreview && this.sizers != null) {
                for (var i = 0; i < this.sizers.length; i++) {
                    if (this.sizers[i] != null) {
                        Utils.nodeStyle(this.sizers[i].node).display = "";
                    }
                }
            }

            this.removeHint();
            this.redrawHandles();
            this.edgeHandlers = null;
            this.unscaledBounds = null;
        }

        /** Uses the given vector to change the bounds of the given cell in the graph using <mxGraph.resizeCell>. */
        private resizeCell(cell, dx, dy, index, gridEnabled, constrained, recurse) {
            var geo = Cells.getGeometry(cell);

            if (geo != null) {
                var scale: number;
                if (index == Events.labelHandle) {
                    scale = this.graph.view.scale;
                    dx = Math.round((this.labelShape.bounds.getCenterX() - this.startX) / scale);
                    dy = Math.round((this.labelShape.bounds.getCenterY() - this.startY) / scale);

                    geo = geo.clone();

                    if (geo.offset == null) {
                        geo.offset = new Point(dx, dy);
                    }
                    else {
                        geo.offset.x += dx;
                        geo.offset.y += dy;
                    }

                    this.graph.model.setGeometry(cell, geo);
                }
                else if (this.unscaledBounds != null) {
                    scale = this.graph.view.scale;
                    if (this.childOffsetX != 0 || this.childOffsetY != 0) {
                        this.moveChildren(cell, Math.round(this.childOffsetX / scale), Math.round(this.childOffsetY / scale));
                    }

                    this.graph.resizeCell(cell, this.unscaledBounds, recurse);
                }
            }
        }

        /** Moves the children of the given cell by the given vector.*/
        private moveChildren(cell: Cell, dx: number, dy: number) {
            var model = this.graph.getModel();
            var childCount = Cells.getChildCount(cell);

            for (var i = 0; i < childCount; i++) {
                var child = Cells.getChildAt(cell, i);
                var geo = this.graph.getCellGeometry(child);

                if (geo != null) {
                    geo = geo.clone();
                    geo.translate(dx, dy);
                    model.setGeometry(child, geo);
                }
            }
        }

        /**
         * Function: union
         * 
         * Returns the union of the given bounds and location for the specified
         * handle index.
         * 
         * To override this to limit the size of vertex via a minWidth/-Height style,
         * the following code can be used.
         * 
         * (code)
         * var vertexHandlerUnion = private union;
         * private union = function(bounds, dx, dy, index, gridEnabled, scale, tr, constrained)
         * {
         *   var result = vertexHandlerUnion.apply(this, arguments);
         *   
         *   result.width = Math.max(result.width, Utils.getNumber(this.state.style, 'minWidth', 0));
         *   result.height = Math.max(result.height, Utils.getNumber(this.state.style, 'minHeight', 0));
         *   
         *   return result;
         * };
         * (end)
         * 
         * The minWidth/-Height style can then be used as follows:
         * 
         * (code)
         * graph.insertVertex(parent, null, 'Hello,', 20, 20, 80, 30, 'minWidth=100;minHeight=100;');
         * (end)
         * 
         * To override this to update the height for a wrapped text if the width of a vertex is
         * changed, the following can be used.
         * 
         * (code)
         * var mxVertexHandlerUnion = private union;
         * private union = function(bounds, dx, dy, index, gridEnabled, scale, tr, constrained)
         * {
         *   var result = mxVertexHandlerUnion.apply(this, arguments);
         *   var s = this.state;
         *   
         *   if (this.graph.isHtmlLabel(s.cell) && (index == 3 || index == 4) &&
         *       s.text != null && s.style[Constants.STYLE_WHITE_SPACE] == 'wrap')
         *   {
         *     var label = this.graph.getLabel(s.cell);
         *     var fontSize = Utils.getNumber(s.style, Constants.STYLE_FONTSIZE, Constants.DEFAULT_FONTSIZE);
         *     var ww = result.width / s.view.scale - s.text.spacingRight - s.text.spacingLeft
         *     
         *     result.height = Utils.getSizeForString(label, fontSize, s.style[Constants.STYLE_FONTFAMILY], ww).height;
         *   }
         *   
         *   return result;
         * };
         * (end)
         */
        private union(bounds: Rectangle, dx: number, dy: number, index: EventHandle, gridEnabled: boolean, scale: number, tr, constrained) {
            if (this.singleSizer) {
                var x = bounds.x + bounds.width + dx;
                var y = bounds.y + bounds.height + dy;

                if (gridEnabled) {
                    x = this.graph.snap(x / scale) * scale;
                    y = this.graph.snap(y / scale) * scale;
                }

                var rect = new Rectangle(bounds.x, bounds.y, 0, 0);
                rect.add(new Rectangle(x, y, 0, 0));

                return rect;
            }
            else {
                var left = bounds.x - tr.x * scale;
                var right = left + bounds.width;
                var top = bounds.y - tr.y * scale;
                var bottom = top + bounds.height;

                if (index > 4 /* Bottom Row */) {
                    bottom = bottom + dy;

                    if (gridEnabled) {
                        bottom = this.graph.snap(bottom / scale) * scale;
                    }
                }
                else if (index < 3 /* Top Row */) {
                    top = top + dy;

                    if (gridEnabled) {
                        top = this.graph.snap(top / scale) * scale;
                    }
                }

                if (index == 0 || index == 3 || index == 5 /* Left */) {
                    left += dx;

                    if (gridEnabled) {
                        left = this.graph.snap(left / scale) * scale;
                    }
                }
                else if (index == 2 || index == 4 || index == 7 /* Right */) {
                    right += dx;

                    if (gridEnabled) {
                        right = this.graph.snap(right / scale) * scale;
                    }
                }

                var width = right - left;
                var height = bottom - top;

                if (constrained) {
                    var geo = this.graph.getCellGeometry(this.state.cell);

                    if (geo != null) {
                        var aspect = geo.width / geo.height;

                        if (index == 1 || index == 2 || index == 7 || index == 6) {
                            width = height * aspect;
                        }
                        else {
                            height = width / aspect;
                        }

                        if (index == 0) {
                            left = right - width;
                            top = bottom - height;
                        }
                    }
                }

                // Flips over left side
                if (width < 0) {
                    left += width;
                    width = Math.abs(width);
                }

                // Flips over top side
                if (height < 0) {
                    top += height;
                    height = Math.abs(height);
                }

                var result = new Rectangle(left + tr.x * scale, top + tr.y * scale, width, height);

                if (this.minBounds != null) {
                    result.width = Math.max(result.width, this.minBounds.x * scale + this.minBounds.width * scale +
                        Math.max(0, this.x0 * scale - result.x));
                    result.height = Math.max(result.height, this.minBounds.y * scale + this.minBounds.height * scale +
                        Math.max(0, this.y0 * scale - result.y));
                }

                return result;
            }
        }

        /** Redraws the handles and the preview. */
        redraw() {
            this.selectionBounds = this.getSelectionBounds(this.state);
            this.bounds = new Rectangle(this.selectionBounds.x, this.selectionBounds.y, this.selectionBounds.width, this.selectionBounds.height);

            this.redrawHandles();
            this.drawPreview();
        }

        /** Redraws the handles. To hide certain handles the following code can be used.
         * 
         * (code)
         * private redrawHandles = function()
         * {
         *   mxVertexHandlerRedrawHandles.apply(this, arguments);
         *   
         *   if (this.sizers != null && this.sizers.length > 7)
         *   {
         *     this.sizers[1].node.style.display = 'none';
         *     this.sizers[6].node.style.display = 'none';
         *   }
         * };
         * (end)
         */
        private redrawHandles() {
            this.horizontalOffset = 0;
            this.verticalOffset = 0;
            var s = this.bounds;
            var alpha: number;
            var cos: number;
            var sin: number;
            var ct: Point;
            var pt: Point;
            if (this.sizers != null) {
                if (this.index == null && this.manageSizers && this.sizers.length > 1) {
                    // KNOWN: Tolerance depends on event type (eg. 0 for mouse events)
                    var tol = this.tolerance;

                    if (s.width < 2 * this.sizers[0].bounds.width - 2 + 2 * tol) {
                        Utils.nodeStyle(this.sizers[1].node).display = "none";
                        Utils.nodeStyle(this.sizers[6].node).display = "none";
                    } else {
                        Utils.nodeStyle(this.sizers[1].node).display = "";
                        Utils.nodeStyle(this.sizers[6].node).display = "";
                    }

                    if (s.height < 2 * this.sizers[0].bounds.height - 2 + 2 * tol) {
                        Utils.nodeStyle(this.sizers[3].node).display = "none";
                        Utils.nodeStyle(this.sizers[4].node).display = "none";
                    } else {
                        Utils.nodeStyle(this.sizers[3].node).display = "";
                        Utils.nodeStyle(this.sizers[4].node).display = "";
                    }

                    if (s.width < 2 * this.sizers[0].bounds.width - 2 + 3 * tol ||
                        s.height < 2 * this.sizers[0].bounds.height - 2 + 3 * tol) {
                        s = new Rectangle(s.x, s.y, s.width, s.height);
                        tol /= 2;

                        this.horizontalOffset = this.sizers[0].bounds.width + tol;
                        this.verticalOffset = this.sizers[0].bounds.height + tol;
                        s.x -= this.horizontalOffset / 2;
                        s.width += this.horizontalOffset;
                        s.y -= this.verticalOffset / 2;
                        s.height += this.verticalOffset;
                    }
                }

                var r = s.x + s.width;
                var b = s.y + s.height;

                if (this.singleSizer) {
                    this.moveSizerTo(this.sizers[0], r, b);
                } else {
                    var cx = s.x + s.width / 2;
                    var cy = s.y + s.height / 2;

                    if (this.sizers.length > 1) {
                        var crs = ["nw-resize", "n-resize", "ne-resize", "e-resize", "se-resize", "s-resize", "sw-resize", "w-resize"];
                        alpha = Utils.toRadians(this.state.style.rotation);
                        cos = Math.cos(alpha);
                        sin = Math.sin(alpha);
                        var da = Math.round(alpha * 4 / Math.PI);
                        ct = new Point(s.getCenterX(), s.getCenterY());
                        pt = Utils.getRotatedPoint(new Point(s.x, s.y), cos, sin, ct);
                        this.moveSizerTo(this.sizers[0], pt.x, pt.y);
                        Utils.nodeStyle(this.sizers[0].node).cursor = crs[Utils.mod(0 + da, crs.length)];

                        pt.x = cx;
                        pt.y = s.y;
                        pt = Utils.getRotatedPoint(pt, cos, sin, ct);

                        this.moveSizerTo(this.sizers[1], pt.x, pt.y);
                        Utils.nodeStyle(this.sizers[1].node).cursor = crs[Utils.mod(1 + da, crs.length)];

                        pt.x = r;
                        pt.y = s.y;
                        pt = Utils.getRotatedPoint(pt, cos, sin, ct);

                        this.moveSizerTo(this.sizers[2], pt.x, pt.y);
                        Utils.nodeStyle(this.sizers[2].node).cursor = crs[Utils.mod(2 + da, crs.length)];

                        pt.x = s.x;
                        pt.y = cy;
                        pt = Utils.getRotatedPoint(pt, cos, sin, ct);

                        this.moveSizerTo(this.sizers[3], pt.x, pt.y);
                        Utils.nodeStyle(this.sizers[3].node).cursor = crs[Utils.mod(7 + da, crs.length)];

                        pt.x = r;
                        pt.y = cy;
                        pt = Utils.getRotatedPoint(pt, cos, sin, ct);

                        this.moveSizerTo(this.sizers[4], pt.x, pt.y);
                        Utils.nodeStyle(this.sizers[4].node).cursor = crs[Utils.mod(3 + da, crs.length)];

                        pt.x = s.x;
                        pt.y = b;
                        pt = Utils.getRotatedPoint(pt, cos, sin, ct);

                        this.moveSizerTo(this.sizers[5], pt.x, pt.y);
                        Utils.nodeStyle(this.sizers[5].node).cursor = crs[Utils.mod(6 + da, crs.length)];

                        pt.x = cx;
                        pt.y = b;
                        pt = Utils.getRotatedPoint(pt, cos, sin, ct);

                        this.moveSizerTo(this.sizers[6], pt.x, pt.y);
                        Utils.nodeStyle(this.sizers[6].node).cursor = crs[Utils.mod(5 + da, crs.length)];

                        pt.x = r;
                        pt.y = b;
                        pt = Utils.getRotatedPoint(pt, cos, sin, ct);

                        this.moveSizerTo(this.sizers[7], pt.x, pt.y);
                        Utils.nodeStyle(this.sizers[7].node).cursor = crs[Utils.mod(4 + da, crs.length)];

                        this.moveSizerTo(this.sizers[8], cx + this.state.absoluteOffset.x, cy + this.state.absoluteOffset.y);
                    } else if (this.state.width >= 2 && this.state.height >= 2) {
                        this.moveSizerTo(this.sizers[0], cx + this.state.absoluteOffset.x, cy + this.state.absoluteOffset.y);
                    } else {
                        this.moveSizerTo(this.sizers[0], s.x, s.y);
                    }
                }
            }

            if (this.rotationShape != null) {
                alpha = Utils.toRadians((this.currentAlpha != null) ? this.currentAlpha : this.state.style.rotation);
                cos = Math.cos(alpha);
                sin = Math.sin(alpha);
                ct = new Point(this.state.getCenterX(), this.state.getCenterY());
                pt = Utils.getRotatedPoint(new Point(s.x + s.width / 2, s.y + this.rotationHandleVSpacing), cos, sin, ct);
                if (this.rotationShape.node != null) {
                    this.moveSizerTo(this.rotationShape, pt.x, pt.y);
                }
            }

            if (this.selectionBorder != null) {
                this.selectionBorder.rotation = this.state.style.rotation;
            }

            if (this.edgeHandlers != null) {
                for (var i = 0; i < this.edgeHandlers.length; i++) {
                    this.edgeHandlers[i].redraw();
                }
            }
        }

        private drawPreview() {
            if (this.preview != null) {
                this.preview.bounds = this.bounds;

                if (this.graph.container.is(this.preview.node.parentNode)) {
                    this.preview.bounds.width = Math.max(0, this.preview.bounds.width - 1);
                    this.preview.bounds.height = Math.max(0, this.preview.bounds.height - 1);
                }

                this.preview.rotation = this.state.style.rotation;
                this.preview.redraw();
            }

            this.selectionBorder.bounds = this.bounds;
            this.selectionBorder.redraw();
        }

        /**Destroys the handler and all its resources and DOM nodes.*/
        destroy() {
            if (this.escapeHandler != null) {
                this.state.view.graph.onEscape.remove(this.escapeHandler);
                this.escapeHandler = null;
            }

            if (this.preview != null) {
                this.preview.destroy();
                this.preview = null;
            }

            this.selectionBorder.destroy();
            this.selectionBorder = null;
            this.labelShape = null;
            this.removeHint();

            if (this.sizers != null) {
                for (var i = 0; i < this.sizers.length; i++) {
                    this.sizers[i].destroy();
                }

                this.sizers = null;
            }
        }
    }
}