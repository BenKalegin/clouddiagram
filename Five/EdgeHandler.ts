module Five {
    /**
     * Graph event handler that reconnects edges and modifies control points and
     * the edge label location. Uses <mxTerminalMarker> for finding and
     * highlighting new source and target vertices. This handler is automatically
     * created in <mxGraph.createHandler> for each selected edge.
     * 
     * To enable adding/removing control points, the following code can be used:
     * 
     * (code)
     * private addEnabled = true;
     * private removeEnabled = true;
     * (end)
     * 
     * Note: This experimental feature is not recommended for production use.
    */
    export class EdgeHandler implements ICellHandler {
        constructor(state) {
            if (state != null) {
                this.state = state;
                this.init();

                // Handles escape keystrokes
                this.escapeHandler = () => this.reset();
                this.state.view.graph.onEscape.add(this.escapeHandler);
            }
        }

        private escapeHandler : IListener<BasicEvent>;

        /** Reference to the enclosing Graph. */
        graph: Graph = null;

        /** Reference to the CellState being modified. */
        public state: CellState = null;

        /** Holds the TerminalMarker which is used for highlighting terminals.*/
        private marker: CellMarker = null;

        /** Holds the <mxConstraintHandler> used for drawing and highlighting constraints. */
        private constraintHandler: ConstraintHandler = null;

        /** Holds the current validation error while a connection is being changed.*/
        private error: string = null;

        /** Holds the Shape that represents the preview edge. */
        private shape: Shape = null;

        /** Holds the Shapes that represent the points. */
        bends: Shape[] = null;

        /** Holds the Shape that represents the label position.*/
        labelShape: Shape = null;

        /** Specifies if cloning by control-drag is enabled. Default is true. */
        private cloneEnabled = true;

        /** Specifies if adding bends by shift-click is enabled. Default is false. Note: This experimental feature is not recommended for production use. */
        private addEnabled = false;

        /** Specifies if removing bends by shift-click is enabled. Default is false.Note: This experimental feature is not recommended for production use. */
        private removeEnabled = false;

        /** Specifies if bends should be added to the graph container. This is updated in <init> based on whether the edge or one of its terminals has an HTML label in the container. */
        private preferHtml = false;

        /** Specifies if the bounds of handles should be used for hit-detection in IE Default is true.*/
        private allowHandleBoundsCheck = true;

        /**Specifies if waypoints should snap to the routing centers of terminals.*/
        snapToTerminals = false;

        /** Optional <mxImage> to be used as handles. Default is null. */
        handleImage: Image = null;

        /**Optional tolerance for hit-detection in <getHandleForEvent>. Default is 0. */
        private tolerance = 0;

        /** Specifies if connections to the outline of a highlighted target should be enabled. This will allow to place the connection point along the outline of the highlighted target. */
        private outlineConnect = false;

        /** Specifies if the label handle should be moved if it intersects with another handle. Uses <checkLabelHandle> for checking and moving. Default is false. */
        manageLabelHandle = false;
        
        private active: boolean;
        points: Point[];
        abspoints: Point[];
        private label : Point;
        isSource: boolean;
        isTarget: boolean;
        private isLabel: boolean;
        private labelHandleImage: Image;
        private startX: number;
        private startY: number;
        index: number;
        private snapPoint: Point;

        /** Initializes the shapes required for this edge handler.*/
        private init() {
            this.graph = this.state.view.graph;
            this.marker = this.createMarker();
            this.constraintHandler = new ConstraintHandler(this.graph);

            // Clones the original points from the cell and makes sure at least one point exists
            this.points = [];

            // Uses the absolute points of the state
            // for the initial configuration and preview
            this.abspoints = this.getSelectionPoints(this.state);
            this.shape = this.createSelectionShape(this.abspoints);
            this.shape.dialect = (this.graph.dialect != Dialect.Svg) ? Dialect.MixedHtml : Dialect.Svg;
            this.shape.init(this.graph.getView().getOverlayPane());
            this.shape.pointerEvents = false;
            Utils.nodeStyle(this.shape.node).cursor = Constants.cursorMovableEdge;
            Events.redirectMouseEvents(this.shape.node, this.graph, () => this.state);

            // Updates preferHtml
            this.preferHtml = this.state.text != null &&
                this.state.text.node.parentNode == this.graph.container;

            if (!this.preferHtml) {
                // Checks source terminal
                var sourceState = this.state.getVisibleTerminalState(true);

                if (sourceState != null) {
                    this.preferHtml = sourceState.text != null &&
                        sourceState.text.node.parentNode == this.graph.container;
                }

                if (!this.preferHtml) {
                    // Checks target terminal
                    var targetState = this.state.getVisibleTerminalState(false);

                    if (targetState != null) {
                        this.preferHtml = targetState.text != null &&
                            targetState.text.node.parentNode == this.graph.container;
                    }
                }
            }

            // Creates bends for the non-routed absolute points
            // or bends that don't correspond to points
            if (this.graph.getSelectionCount() < GraphHandler.maxCells || GraphHandler.maxCells <= 0) {
                this.bends = this.createBends();
            }

            // Adds a rectangular handle for the label position
            this.label = new Point(this.state.absoluteOffset.x, this.state.absoluteOffset.y);
            this.labelShape = this.createLabelHandleShape();
            this.initBend(this.labelShape);
            Utils.nodeStyle(this.labelShape.node).cursor = Constants.cursorLabelHandle;
            Events.redirectMouseEvents(this.labelShape.node, this.graph, () => this.state);

            this.redraw();
        }

        /** Returns true if the given event is a trigger to add a new point. This implementation returns true if shift is pressed. */
        private isAddPointEvent(evt: MouseEvent): boolean {
            return Events.isMouseShiftDown(evt);
        }

        /** Returns true if the given event is a trigger to remove a point. This implementation returns true if shift is pressed.*/
        private isRemovePointEvent(evt: MouseEvent): boolean {
            return Events.isMouseShiftDown(evt);
        }

        /** Returns the list of points that defines the selection stroke.*/
        private getSelectionPoints(state: CellState) : Point[] {
            return state.absolutePoints;
        }

        /** Creates the shape used to draw the selection border. */
        private createSelectionShape(points: Point[]) : Shape {
            //var shape = <Shape>Object.create(this.state.shape);
            var constructor = <any>this.state.shape.constructor;
            var shape = new constructor();
            shape.outline = true;
            shape.apply(this.state);

            shape.isDashed = this.isSelectionDashed();
            shape.stroke = this.getSelectionColor();
            shape.isShadow = false;

            return shape;
        }

        private getSelectionColor() : string {
            return Constants.edgeSelectionColor;
        }

        private getSelectionStrokeWidth() : number {
            return Constants.edgeSelectionStrokewidth;
        }

        private isSelectionDashed() : boolean {
            return Constants.edgeSelectionDashed;
        }

        /** Returns true if the given cell is connectable. This is a hook to disable floating connections. This implementation returns true. */
        private isConnectableCell(cell: Cell) : boolean {
            return true;
        }

        private getCellAt(x: number, y: number) : Cell {
            return (!this.outlineConnect) ? this.graph.getCellAt(x, y) : null;
        }

        private createMarker() : CellMarker {
            var marker = new CellMarker(this.graph);
            var self = this; // closure

            // Only returns edges if they are connectable and never returns
            // the edge that is currently being modified
            marker.getCell = (me: MouseEventContext) => {
                var cell = <Cell>CellMarker.prototype.getCell.apply(this, arguments);
                var point = self.getPointForEvent(me);

                // Checks for cell under mouse
                if (cell == self.state.cell || cell == null) {
                    cell = self.getCellAt(point.x, point.y);

                    if (self.state.cell == cell) {
                        cell = null;
                    }
                }

                var model = self.graph.getModel();

                if ((this.graph.isSwimlane(cell) && this.graph.hitsSwimlaneContent(cell, point.x, point.y)) ||
                    (!self.isConnectableCell(cell)) ||
                    (cell == self.state.cell || (cell != null && !self.graph.connectableEdges && model.isEdge(cell))) ||
                    model.isAncestor(self.state.cell, cell)) {
                    cell = null;
                }

                return cell;
            };

            // Sets the highlight color according to validateConnection
            marker.isValidState = (state: CellState) => {
                var model = this.graph.getModel();
                var other = this.graph.view.getTerminalPort(state, this.graph.view.getState(model.getTerminal(this.state.cell, !this.isSource)), !this.isSource);
                var otherCell = (other != null) ? other.cell : null;
                var source = (this.isSource) ? state.cell : otherCell;
                var target = (this.isSource) ? otherCell : state.cell;

                // Updates the error message of the handler
                this.error = this.validateConnection(source, target);

                return this.error == null;
            };

            return marker;
        }

        /** Returns the error message or an empty string if the connection for the given source, target pair is not valid. Otherwise it returns null. 
         * source - <mxCell> that represents the source terminal.
         * target - <mxCell> that represents the target terminal.
         */
        private validateConnection(source: Cell, target: Cell) {
            return this.graph.getEdgeValidationError(this.state.cell, source, target);
        }

        /** virtual. Creates and returns the bends used for modifying the edge. This is typically an array of <RectangleShapes>. */
        createBends(): RectangleShape[] {
            var cell = this.state.cell;
            var bends: RectangleShape[] = [];

            for (var i = 0; i < this.abspoints.length; i++) {
                if (this.isHandleVisible(i)) {
                    var source = i == 0;
                    var target = i == this.abspoints.length - 1;
                    var terminal = source || target;

                    if (terminal || this.graph.isCellBendable(cell)) {
                        var bend = this.createHandleShape(i);
                        this.initBend(bend);

                        if (this.isHandleEnabled(i)) {
                            Utils.nodeStyle(bend.node).cursor = Constants.cursorBendHandle;
                            Events.redirectMouseEvents(bend.node, this.graph, () => this.state);

                            // Fixes lost event tracking for images in quirks / IE8 standards
                            if (Client.isQuirks || document.documentMode == 8) {
                                Events.addListener(bend.node, "dragstart", evt => {
                                    Events.consume(evt);
                                    return false;
                                });
                            }
                        }

                        bends.push(bend);

                        if (!terminal) {
                            this.points.push(new Point(0, 0));
                            Utils.nodeStyle(bend.node).visibility = "hidden";
                        }
                    }
                }
            }

            return bends;
        }

        /** Creates the shape used to display the given bend. */
        private isHandleEnabled(index: number) {
            return true;
        }

        /** Returns true if the handle at the given index is visible. */
        private isHandleVisible(index: number): boolean {
            var source = this.state.getVisibleTerminalState(true);
            var target = this.state.getVisibleTerminalState(false);
            var geo = this.graph.getCellGeometry(this.state.cell);
            var edgeStyle = (geo != null) ? this.graph.view.getEdgeStyle(this.state, geo.points, source, target) : null;

            return edgeStyle != EdgeStyle.entityRelation || index == 0 || index == this.abspoints.length - 1;
        }

        /** Creates the shape used to display the given bend. Note that the index may be null for special cases, such as when called from ElbowEdgeHandler.createVirtualBend.
         * Only images and rectangles should bereturned if support for HTML labels with not foreign objects is required. */
        createHandleShape(index?: number) : RectangleShape {
            if (this.handleImage != null) {
                var shape = new ImageShape(new Rectangle(0, 0, this.handleImage.width, this.handleImage.height), this.handleImage.src);

                // Allows HTML rendering of the images
                shape.preserveImageAspect = false;

                return shape;
            }
            else {
                var s = Constants.handleSize;

                if (this.preferHtml) {
                    s -= 1;
                }

                return new RectangleShape(new Rectangle(0, 0, s, s), Constants.handleFillcolor, Constants.handleStrokecolor);
            }
        }

        /** Creates the shape used to display the the label handle. */
        private createLabelHandleShape() : Shape {
            if (this.labelHandleImage != null) {
                var shape = new ImageShape(new Rectangle(0, 0, this.labelHandleImage.width, this.handleImage.height), this.labelHandleImage.src);

                // Allows HTML rendering of the images
                shape.preserveImageAspect = false;

                return shape;
            }
            else {
                var s = Constants.labelHandleSize;
                return new RectangleShape(new Rectangle(0, 0, s, s), Constants.labelHandleFillcolor, Constants.handleStrokecolor);
            }
        }

        /**
         * Function: initBend
         * 
         * Helper method to initialize the given bend.
         * 
         * Parameters:
         * 
         * bend - <mxShape> that represents the bend to be initialized.
         */
        initBend(bend: Shape) {
            if (this.preferHtml) {
                bend.dialect = Dialect.StrictHtml;
                bend.init(this.graph.container);
            }
            else {
                bend.dialect = (this.graph.dialect != Dialect.Svg) ? Dialect.MixedHtml : Dialect.Svg;
                bend.init(this.graph.getView().getOverlayPane());
            }
        }

        /**
         * Function: getHandleForEvent
         * 
         * Returns the index of the handle for the given event.
         */
        private getHandleForEvent(me: MouseEventContext): EventHandle {
            // Connection highlight may consume events before they reach sizer handle
            var tol = (!Events.isMouseEvent(me.getEvent())) ? this.tolerance : 1;
            var hit = (this.allowHandleBoundsCheck && (Client.isIe || tol > 0)) ?
                new Rectangle(me.getGraphX() - tol, me.getGraphY() - tol, 2 * tol, 2 * tol) : null;
            var minDistSq = null;

            function checkShape(shape) {
                if (shape != null && shape.node.style.display != "none" && shape.node.style.visibility != "hidden" &&
                (me.isSource(shape) || (hit != null && Utils.intersects(shape.bounds, hit)))) {
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

            if (me.isSource(this.state.text) || checkShape(this.labelShape)) {
                return EventHandle.Label;
            }

            if (this.bends != null) {
                for (var i = 0; i < this.bends.length; i++) {
                    if (checkShape(this.bends[i])) {
                        return i;
                    }
                }
            }

            return null;
        }

        /**
         * Function: mouseDown
         * 
         * Handles the event by checking if a special element of the handler
         * was clicked, in which case the index parameter is non-null. The
         * indices may be one of <LABEL_HANDLE> or the number of the respective
         * control point. The source and target points are used for reconnecting
         * the edge.
         */
        mouseDown(sender, me: MouseEventContext) { // Handles the case where the state in the event points to another
            // cell if the cell has a HTML label which sits on top of the handles
            // NOTE: Commented out. This should not be required as all HTML labels
            // are in order an do not appear behind the handles.
            //if (Client.IS_SVG || me.getState() == this.state)
            //{
                var handle = this.getHandleForEvent(me);

                if (this.bends != null && this.bends[handle] != null) {
                    var b = this.bends[handle].bounds;
                    this.snapPoint = new Point(b.getCenterX(), b.getCenterY());
                }
            //}

            if (this.addEnabled && handle == null && this.isAddPointEvent(me.getEvent())) {
                this.addPoint(this.state, me.getEvent());
            }
            else if (handle != null && !me.isConsumed() && this.graph.isEnabled()) {
                if (this.removeEnabled && this.isRemovePointEvent(me.getEvent())) {
                    this.removePoint(this.state, handle);
                }
                else if (handle != EventHandle.Label || this.graph.isLabelMovable(me.getCell())) {
                    this.start(me.getX(), me.getY(), handle);
                }

                me.consume();
            }
        }

        /** Starts the handling of the mouse gesture. */
        private start(x: number, y: number, index: number) {
            this.startX = x;
            this.startY = y;

            this.isSource = (this.bends == null) ? false : index == 0;
            this.isTarget = (this.bends == null) ? false : index == this.bends.length - 1;
            this.isLabel = index == EventHandle.Label;

            if (this.isSource || this.isTarget) {
                var cell = this.state.cell;
                var terminal = this.graph.model.getTerminal(cell, this.isSource);

                if ((terminal == null && this.graph.isTerminalPointMovable(cell, this.isSource)) ||
                    (terminal != null && this.graph.isCellDisconnectable(cell, terminal, this.isSource))) {
                    this.index = index;
                }
            }
            else {
                this.index = index;
            }
        }

        /** Returns a clone of the current preview state for the given point and terminal. */
        private clonePreviewState(point: Point, terminal: Cell) {
            return this.state.clone();
        }

        /** Returns the tolerance for the guides. Default value is gridSize * scale / 2. */
        private getSnapToTerminalTolerance() : number {
            return this.graph.gridSize * this.graph.view.scale / 2;
        }

        /**
         * Function: updateHint
         * 
         * Hook for subclassers do show details while the handler is active.
         */
        protected updateHint(me: MouseEventContext, point: Point) { }

        /**
         * Function: removeHint
         * 
         * Hooks for subclassers to hide details when the handler gets inactive.
         */
        protected removeHint() { }

        /**
         * Function: roundLength
         * 
         * Hook for rounding the unscaled width or height. This uses Math.round.
         */
        protected roundLength(length: number): number {
            return Math.round(length);
        }

        /**
         * Function: isSnapToTerminalsEvent
         * 
         * Returns true if <snapToTerminals> is true and if alt is not pressed.
         */
        private isSnapToTerminalsEvent(me: MouseEventContext) {
            return this.snapToTerminals && !Events.isMouseAltDown(me.getEvent());
        }

        /**
         * Function: getPointForEvent
         * 
         * Returns the point for the given event.
         */
        private getPointForEvent(me: MouseEventContext) {
            var view = this.graph.getView();
            var scale = view.scale;
            var point = new Point(this.roundLength(me.getGraphX() / scale) * scale, this.roundLength(me.getGraphY() / scale) * scale);

            var tt = this.getSnapToTerminalTolerance();
            var overrideX = false;
            var overrideY = false;

            if (tt > 0 && this.isSnapToTerminalsEvent(me)) {
                var snapToPoint = (pt: Point) => {
                    if (pt != null) {
                        var x = pt.x;

                        if (Math.abs(point.x - x) < tt) {
                            point.x = x;
                            overrideX = true;
                        }

                        var y = pt.y;

                        if (Math.abs(point.y - y) < tt) {
                            point.y = y;
                            overrideY = true;
                        }
                    }
                }

                // Temporary function
	            function snapToTerminal(terminal: CellState): void {
                    if (terminal != null) {
                        snapToPoint(new Point(view.getRoutingCenterX(terminal),view.getRoutingCenterY(terminal)));
                    }
                };

                snapToTerminal(this.state.getVisibleTerminalState(true));
                snapToTerminal(this.state.getVisibleTerminalState(false));

                if (this.state.absolutePoints != null) {
                    for (var i = 0; i < this.state.absolutePoints.length; i++) {
                        snapToPoint(this.state.absolutePoints[i]);
                    }
                }
            }

            if (this.graph.isGridEnabledEvent(me.getEvent())) {
                var tr = view.translate;

                if (!overrideX) {
                    point.x = (this.graph.snap(point.x / scale - tr.x) + tr.x) * scale;
                }

                if (!overrideY) {
                    point.y = (this.graph.snap(point.y / scale - tr.y) + tr.y) * scale;
                }
            }

            return point;
        }

        /** Updates the given preview state taking into account the state of the constraint handler. */
        private getPreviewTerminalState(me: MouseEventContext) : CellState {
            this.constraintHandler.update(me, this.isSource);

            if (this.constraintHandler.currentFocus != null && this.constraintHandler.currentConstraint != null) {
                // KNOWN: Hit detection on cell shape if highlight of constraint is hidden because at that
                // point the perimeter highlight is not yet visible and can't be used for hit detection.
                // This results in flickering for the first move after hiding the constraint highlight.
                this.marker.reset();

                return this.constraintHandler.currentFocus;
            } else {
                this.marker.process(me);

                return this.marker.getValidState();
            }
        }

        /** Updates the given preview state taking into account the state of the constraint handler. */
        getPreviewPoints(point: Point) : Point[] {
            var geometry = this.graph.getCellGeometry(this.state.cell);
            var points = (geometry.points != null) ? geometry.points.slice() : null;
            point = new Point(point.x, point.y);

            if (!this.isSource && !this.isTarget) {
                this.convertPoint(point, false);

                if (points == null) {
                    points = [point];
                } else {
                    points[this.index - 1] = point;
                }
            } else if (this.graph.resetEdgesOnConnect) {
                points = null;
            }

            return points;
        }

        /** Returns true if <outlineConnect> is true and the source of the event is the outline shape or shift is pressed. */
        private isOutlineConnectEvent(me: MouseEventContext): boolean {
            return this.outlineConnect && (me.isSource(this.marker.highlight.shape) || Events.isMouseAltDown(me.getEvent()));
        }

        /** Updates the given preview state taking into account the state of the constraint handler. */
        private updatePreviewState(edge: CellState, point: Point, terminalState: CellState, me: MouseEventContext) {
            // Computes the points for the edge style and terminals
            var sourceState = (this.isSource) ? terminalState : this.state.getVisibleTerminalState(true);
            var targetState = (this.isTarget) ? terminalState : this.state.getVisibleTerminalState(false);

            var sourceConstraint = this.graph.getConnectionConstraint(edge, sourceState, true);
            var targetConstraint = this.graph.getConnectionConstraint(edge, targetState, false);

            var constraint = this.constraintHandler.currentConstraint;

            if (constraint == null) {
                if (terminalState != null && this.isOutlineConnectEvent(me)) {
                    constraint = this.graph.getOutlineConstraint(point, terminalState, me);
                    this.constraintHandler.currentConstraint = constraint;
                    this.constraintHandler.currentFocus = terminalState;
                    this.constraintHandler.currentPoint = point;
                }
                else {
                    constraint = new ConnectionConstraint();
                }
            }

            if (this.outlineConnect) {
                if (this.marker.highlight != null && this.marker.highlight.shape != null) {
                    if (this.constraintHandler.currentConstraint != null &&
                        this.constraintHandler.currentFocus != null) {
                        this.marker.highlight.shape.stroke = Constants.outlineHighlightColor;
                        this.marker.highlight.shape.strokewidth = Constants.outlineHighlightStrokewidth / this.state.view.scale / this.state.view.scale;
                        this.marker.highlight.repaint();
                    }
                    else if (this.marker.hasValidState()) {
                        this.marker.highlight.shape.stroke = Constants.defaultValidColor;
                        this.marker.highlight.shape.strokewidth = Constants.highlightStrokewidth / this.state.view.scale / this.state.view.scale;
                        this.marker.highlight.repaint();
                    }
                }
            }

            if (this.isSource) {
                sourceConstraint = constraint;
            }
            else if (this.isTarget) {
                targetConstraint = constraint;
            }

            if (!this.isSource || sourceState != null) {
                edge.view.updateFixedTerminalPoint(edge, sourceState, true, sourceConstraint);
            }

            if (!this.isTarget || targetState != null) {
                edge.view.updateFixedTerminalPoint(edge, targetState, false, targetConstraint);
            }

            if ((this.isSource || this.isTarget) && terminalState == null) {
                edge.setAbsoluteTerminalPoint(point, this.isSource);

                if (this.marker.getMarkedState() == null) {
                    this.error = (this.graph.allowDanglingEdges) ? null : "";
                }
            }

            edge.view.updatePoints(edge, this.points, sourceState, targetState);
            edge.view.updateFloatingTerminalPoints(edge, sourceState, targetState);
        }

        /** Handles the event by updating the preview.*/
        mouseMove(sender, me: MouseEventContext) {
            if (this.index != null && this.marker != null) {
                var point = this.getPointForEvent(me);

                if (Events.isMouseShiftDown(me.getEvent()) && this.snapPoint != null) {
                    if (Math.abs(this.snapPoint.x - point.x) < Math.abs(this.snapPoint.y - point.y)) {
                        point.x = this.snapPoint.x;
                    } else {
                        point.y = this.snapPoint.y;
                    }
                }

                if (this.isLabel) {
                    this.label.x = point.x;
                    this.label.y = point.y;
                } else {
                    this.points = this.getPreviewPoints(point);
                    var terminalState = (this.isSource || this.isTarget) ? this.getPreviewTerminalState(me) : null;
                    var clone = this.clonePreviewState(point, (terminalState != null) ? terminalState.cell : null);
                    this.updatePreviewState(clone, point, terminalState, me);

                    // Sets the color of the preview to valid or invalid, updates the
                    // points of the preview and redraws
                    var color = (this.error == null) ? this.marker.validColor : this.marker.invalidColor;
                    this.setPreviewColor(color);
                    this.abspoints = clone.absolutePoints;
                    this.active = true;
                }

                this.drawPreview();
                this.updateHint(me, point);
                Events.consume(me.getEvent());
                me.consume();
            }
            // Workaround for disabling the connect highlight when over handle
            else if (Client.isIe && this.getHandleForEvent(me) != null) {
                me.consume(false);
            }
        }

        /** Handles the event to applying the previewed changes on the edge by using <moveLabel>, <connect> or <changePoints>. */
        mouseUp(sender, me: MouseEventContext) {
            // Workaround for wrong event source in Webkit
            if (this.index != null && this.marker != null) {
                var edge = this.state.cell;

                // Ignores event if mouse has not been moved
                if (me.getX() != this.startX || me.getY() != this.startY) {
                    var clone = this.graph.isCloneEvent(me.getEvent()) && this.cloneEnabled && this.graph.isCellsCloneable();

                    // Displays the reason for not carriying out the change
                    // if there is an error message with non-zero length
                    if (this.error != null) {
                        if (this.error.length > 0) {
                            this.graph.validationAlert(this.error);
                        }
                    }
                    else if (this.isLabel) {
                        this.moveLabel(this.state, this.label.x, this.label.y);
                    }
                    else if (this.isSource || this.isTarget) {
                        var terminal = null;

                        if (this.constraintHandler.currentConstraint != null &&
                            this.constraintHandler.currentFocus != null) {
                            terminal = this.constraintHandler.currentFocus.cell;
                        }

                        if (terminal == null && this.marker.hasValidState()) {
                            terminal = this.marker.validState.cell;
                        }

                        if (terminal != null) {
                            edge = this.connect(edge, terminal, this.isSource, clone, me);
                        }
                        else if (this.graph.isAllowDanglingEdges()) {
                            var pt = this.abspoints[(this.isSource) ? 0 : this.abspoints.length - 1];
                            pt.x = this.roundLength(pt.x / this.graph.view.scale - this.graph.view.translate.x);
                            pt.y = this.roundLength(pt.y / this.graph.view.scale - this.graph.view.translate.y);

                            var pstate = this.graph.getView().getState(
                                this.graph.getModel().getParent(edge));

                            if (pstate != null) {
                                pt.x -= pstate.origin.x;
                                pt.y -= pstate.origin.y;
                            }

                            pt.x -= this.graph.panDx / this.graph.view.scale;
                            pt.y -= this.graph.panDy / this.graph.view.scale;

                            // Destroys and recreates this handler
                            edge = this.changeTerminalPoint(edge, pt, this.isSource, clone);
                        }
                    }
                    else if (this.active) {
                        edge = this.changePoints(edge, this.points, clone);
                    }
                    else {
                        this.graph.getView().invalidate(this.state.cell);
                        this.graph.getView().revalidate();
                    }
                }

                // Resets the preview color the state of the handler if this
                // handler has not been recreated
                if (this.marker != null) {
                    this.reset();

                    // Updates the selection if the edge has been cloned
                    if (edge != this.state.cell) {
                        this.graph.setSelectionCell(edge);
                    }
                }

                me.consume();
            }
        }

        reset() {
            this.error = null;
            this.index = null;
            this.label = null;
            this.points = null;
            this.snapPoint = null;
            this.active = false;
            this.isLabel = false;
            this.isSource = false;
            this.isTarget = false;

            if (this.marker != null) {
                this.marker.reset();
            }

            this.constraintHandler.reset();
            this.setPreviewColor(Constants.edgeSelectionColor);
            this.removeHint();
            this.redraw();
        }

        /** Sets the color of the preview to the given value. */
        private setPreviewColor(color: string ) {
            if (this.shape != null) {
                this.shape.stroke = color;
            }
        }


        /** Converts the given point in-place from screen to unscaled, untranslated graph coordinates and applies the grid. Returns the given, modified
         * point instance.
         * point - <Point> to be converted.
         * gridEnabled - Boolean that specifies if the grid should be applied.
         */
        convertPoint(point: Point, gridEnabled: boolean) : Point {
            var scale = this.graph.getView().getScale();
            var tr = this.graph.getView().getTranslate();

            if (gridEnabled) {
                point.x = this.graph.snap(point.x);
                point.y = this.graph.snap(point.y);
            }

            point.x = Math.round(point.x / scale - tr.x);
            point.y = Math.round(point.y / scale - tr.y);

            var pstate = this.graph.getView().getState(
                this.graph.getModel().getParent(this.state.cell));

            if (pstate != null) {
                point.x -= pstate.origin.x;
                point.y -= pstate.origin.y;
            }

            return point;
        }

        /** Changes the coordinates for the label of the given edge. */
        private moveLabel(edgeState: CellState, x: number, y: number) {
            var model = this.graph.getModel();
            var geometry = Cells.getGeometry(edgeState.cell);

            if (geometry != null) {
                var scale = this.graph.getView().scale;
                geometry = geometry.clone();

                if (geometry.relative) {
                    // Resets the relative location stored inside the geometry
                    var pt = this.graph.getView().getRelativePoint(edgeState, x, y);
                    geometry.x = Math.round(pt.x * 10000) / 10000;
                    geometry.y = Math.round(pt.y);

                    // Resets the offset inside the geometry to find the offset
                    // from the resulting point
                    geometry.offset = new Point(0, 0);
                    pt = this.graph.view.getPoint(edgeState, geometry);
                    geometry.offset = new Point(Math.round((x - pt.x) / scale), Math.round((y - pt.y) / scale));
                }
                else {
                    var points = edgeState.absolutePoints;
                    var p0 = points[0];
                    var pe = points[points.length - 1];

                    if (p0 != null && pe != null) {
                        var cx = p0.x + (pe.x - p0.x) / 2;
                        var cy = p0.y + (pe.y - p0.y) / 2;

                        geometry.offset = new Point(Math.round((x - cx) / scale), Math.round((y - cy) / scale));
                        geometry.x = 0;
                        geometry.y = 0;
                    }
                }

                model.setGeometry(edgeState.cell, geometry);
            }
        }

        /** Changes the terminal or terminal point of the given edge in the graph model.
         * edge - <mxCell> that represents the edge to be reconnected.
         * terminal - <mxCell> that represents the new terminal.
         * isSource - Boolean indicating if the new terminal is the source or target terminal.
         * isClone - Boolean indicating if the new connection should be a clone of the old edge.
         * me - <mxMouseEvent> that contains the mouse up event.
         */
        private connect(edge: Cell, terminal: Cell, isSource: boolean, isClone: boolean, me: MouseEventContext) {
            var model = this.graph.getModel();
            var parent = model.getParent(edge);

            model.beginUpdate();
            try {
                // Clones and adds the cell
                if (isClone) {
                    var clone = this.graph.cloneCells([edge])[0];
                    model.add(parent, clone, model.getChildCount(parent));

                    var other = model.getTerminal(edge, !isSource);
                    this.graph.connectCell(clone, other, !isSource);

                    edge = clone;
                }

                var constraint = this.constraintHandler.currentConstraint;

                if (constraint == null) {
                    constraint = new ConnectionConstraint();
                }

                this.graph.connectCell(edge, terminal, isSource, constraint);
            } finally {
                model.endUpdate();
            }

            return edge;
        }

        private changeTerminalPoint(edge: Cell, point: Point, isSource: boolean, clone: boolean) {
            var model = this.graph.getModel();

            model.beginUpdate();
            try {
                if (clone) {
                    var parent = model.getParent(edge);
                    var terminal = model.getTerminal(edge, !isSource);
                    edge = this.graph.cloneCells([edge])[0];
                    model.add(parent, edge, model.getChildCount(parent));
                    model.setTerminal(edge, terminal, !isSource);
                }

                var geo = Cells.getGeometry(edge);

                if (geo != null) {
                    geo = geo.clone();
                    geo.setTerminalPoint(point, isSource);
                    model.setGeometry(edge, geo);
                    this.graph.connectCell(edge, null, isSource, new ConnectionConstraint());
                }
            } finally {
                model.endUpdate();
            }

            return edge;
        }

        /** Changes the control points of the given edge in the graph model. */
        changePoints(edge: Cell, points: Point[], clone: boolean) : Cell {
            var model = this.graph.getModel();
            model.beginUpdate();
            try {
                if (clone) {
                    var parent = model.getParent(edge);
                    var source = model.getTerminal(edge, true);
                    var target = model.getTerminal(edge, false);
                    edge = this.graph.cloneCells([edge])[0];
                    model.add(parent, edge, model.getChildCount(parent));
                    model.setTerminal(edge, source, true);
                    model.setTerminal(edge, target, false);
                }

                var geo = Cells.getGeometry(edge);

                if (geo != null) {
                    geo = geo.clone();
                    geo.points = points;

                    model.setGeometry(edge, geo);
                }
            } finally {
                model.endUpdate();
            }

            return edge;
        }

        /** Adds a control point for the given state and event. */
        private addPoint(state: CellState, evt: MouseEvent) {
            var pt = Utils.convertPoint(this.graph.container, Events.getClientX(evt),
                Events.getClientY(evt));
            var gridEnabled = this.graph.isGridEnabledEvent(evt);
            this.convertPoint(pt, gridEnabled);
            this.addPointAt(state, pt.x, pt.y);
            Events.consume(evt);
        }

        /** Adds a control point at the given point. */
        private addPointAt(state: CellState, x: number, y: number) {
            var geo = this.graph.getCellGeometry(state.cell);
            var pt = new Point(x, y);

            if (geo != null) {
                geo = geo.clone();
                var t = this.graph.view.translate;
                var s = this.graph.view.scale;
                var offset = new Point(t.x * s, t.y * s);

                var parent = this.graph.model.getParent(this.state.cell);

                if (this.graph.model.isVertex(parent)) {
                    var pState = this.graph.view.getState(parent);
                    offset = new Point(pState.x, pState.y);
                }

                var index = Utils.findNearestSegment(state, pt.x * s + offset.x, pt.y * s + offset.y);

                if (geo.points == null) {
                    geo.points = [pt];
                }
                else {
                    geo.points.splice(index, 0, pt);
                }

                this.graph.getModel().setGeometry(state.cell, geo);
                this.refresh();
                this.redraw();
            }
        }

        /** Removes the control point at the given index from the given state. */
        private removePoint(state: CellState, index: number) {
            if (index > 0 && index < this.abspoints.length - 1) {
                var geo = this.graph.getCellGeometry(this.state.cell);

                if (geo != null && geo.points != null) {
                    geo = geo.clone();
                    geo.points.splice(index - 1, 1);
                    this.graph.getModel().setGeometry(state.cell, geo);
                    this.refresh();
                    this.redraw();
                }
            }
        }

        /** Returns the fillcolor for the handle at the given index. */
        private getHandleFillColor(index: number) : string {
            var isSource = index == 0;
            var cell = this.state.cell;
            var terminal = this.graph.getModel().getTerminal(cell, isSource);
            var color = Constants.handleFillcolor;

            if ((terminal != null && !this.graph.isCellDisconnectable(cell, terminal, isSource)) ||
                (terminal == null && !this.graph.isTerminalPointMovable(cell, isSource))) {
                color = Constants.lockedHandleFillcolor;
            }
            else if (terminal != null && this.graph.isCellDisconnectable(cell, terminal, isSource)) {
                color = Constants.connectHandleFillcolor;
            }

            return color;
        }

        /** Redraws the preview, and the bends- and label control points. */
        redraw() {
            this.abspoints = this.state.absolutePoints.slice();
            this.redrawHandles();

            var g = Cells.getGeometry(this.state.cell);
            var pts = g.points;

            if (this.bends != null && this.bends.length > 0) {
                if (pts != null) {
                    if (this.points == null) {
                        this.points = [];
                    }

                    for (var i = 1; i < this.bends.length - 1; i++) {
                        if (this.bends[i] != null && this.abspoints[i] != null) {
                            this.points[i - 1] = pts[i - 1];
                        }
                    }
                }
            }

            this.drawPreview();
        }

        private redrawHandles() {
            var cell = this.state.cell;

            // Updates the handle for the label position
            var b = this.labelShape.bounds;
            this.label = new Point(this.state.absoluteOffset.x, this.state.absoluteOffset.y);
            this.labelShape.bounds = new Rectangle(Math.round(this.label.x - b.width / 2),
                Math.round(this.label.y - b.height / 2), b.width, b.height);

            // Shows or hides the label handle depending on the label
            var lab = this.graph.getLabel(cell);
            this.labelShape.visible = (lab != null && lab.length > 0 && this.graph.isLabelMovable(cell));

            if (this.bends != null && this.bends.length > 0) {
                var n = this.abspoints.length - 1;

                var p0 = this.abspoints[0];
                var x0 = p0.x;
                var y0 = p0.y;

                b = this.bends[0].bounds;
                this.bends[0].bounds = new Rectangle(Math.round(x0 - b.width / 2),
                    Math.round(y0 - b.height / 2), b.width, b.height);
                this.bends[0].fill = this.getHandleFillColor(0);
                this.bends[0].redraw();

                if (this.manageLabelHandle) {
                    this.checkLabelHandle(this.bends[0].bounds);
                }

                var pe = this.abspoints[n];
                var xn = pe.x;
                var yn = pe.y;

                var bn = this.bends.length - 1;
                b = this.bends[bn].bounds;
                this.bends[bn].bounds = new Rectangle(Math.round(xn - b.width / 2),
                    Math.round(yn - b.height / 2), b.width, b.height);
                this.bends[bn].fill = this.getHandleFillColor(bn);
                this.bends[bn].redraw();

                if (this.manageLabelHandle) {
                    this.checkLabelHandle(this.bends[bn].bounds);
                }

                this.redrawInnerBends(p0, pe);
                this.labelShape.redraw();
            }
        }

        redrawInnerBends(p0: Point, pe: Point) {
            for (var i = 1; i < this.bends.length - 1; i++) {
                if (this.bends[i] != null) {
                    if (this.abspoints[i] != null) {
                        var x = this.abspoints[i].x;
                        var y = this.abspoints[i].y;

                        var b = this.bends[i].bounds;
                        Utils.nodeStyle(this.bends[i].node).visibility = "visible";
                        this.bends[i].bounds = new Rectangle(Math.round(x - b.width / 2),
                            Math.round(y - b.height / 2), b.width, b.height);

                        if (this.manageLabelHandle) {
                            this.checkLabelHandle(this.bends[i].bounds);
                        }
                        else if (this.handleImage == null && this.labelShape.visible && Utils.intersects(this.bends[i].bounds, this.labelShape.bounds)) {
                            var w = Constants.handleSize + 3;
                            var h = Constants.handleSize + 3;
                            this.bends[i].bounds = new Rectangle(Math.round(x - w / 2), Math.round(y - h / 2), w, h);
                        }

                        this.bends[i].redraw();
                    }
                    else {
                        this.bends[i].destroy();
                        this.bends[i] = null;
                    }
                }
            }
        }

        /** Checks if the label handle intersects the given bounds and moves it if it intersects. */
        checkLabelHandle(bounds: Rectangle) {
            if (this.labelShape != null) {
                var b2 = this.labelShape.bounds;

                if (Utils.intersects(bounds, b2)) {
                    if (bounds.getCenterY() < b2.getCenterY()) {
                        b2.y = bounds.y + bounds.height;
                    }
                    else {
                        b2.y = bounds.y - b2.height;
                    }
                }
            }
        }

        private drawPreview() {
            if (this.isLabel) {
                var b = this.labelShape.bounds;
                var bounds = new Rectangle(Math.round(this.label.x - b.width / 2),
                    Math.round(this.label.y - b.height / 2), b.width, b.height);
                this.labelShape.bounds = bounds;
                this.labelShape.redraw();
            }
            else {
                this.shape.points = this.abspoints;
                this.shape.scale = this.state.view.scale;
                this.shape.strokewidth = this.getSelectionStrokeWidth() / this.shape.scale / this.shape.scale;
                this.shape.arrowStrokewidth = this.getSelectionStrokeWidth();
                this.shape.redraw();
            }
        }

        /** Refreshes the bends of this handler. */
        refresh() {
            this.abspoints = this.getSelectionPoints(this.state);
            this.shape.points = this.abspoints;
            this.points = [];

            if (this.bends != null) {
                this.destroyBends();
                this.bends = this.createBends();
            }

            // Puts label node on top of bends
            if (this.labelShape != null && this.labelShape.node != null && this.labelShape.node.parentNode != null) {
                this.labelShape.node.parentNode.appendChild(this.labelShape.node);
            }
        }

        private destroyBends() {
            if (this.bends != null) {
                for (var i = 0; i < this.bends.length; i++) {
                    if (this.bends[i] != null) {
                        this.bends[i].destroy();
                    }
                }

                this.bends = null;
            }
        }

        /** Destroys the handler and all its resources and DOM nodes. This does normally not need to be called as handlers are destroyed automatically
         * when the corresponding cell is deselected. */
        destroy() {
            if (this.escapeHandler != null) {
                this.state.view.graph.onEscape.remove(this.escapeHandler);
                this.escapeHandler = null;
            }

            if (this.marker != null) {
                this.marker.destroy();
                this.marker = null;
            }

            if (this.shape != null) {
                this.shape.destroy();
                this.shape = null;
            }

            if (this.labelShape != null) {
                this.labelShape.destroy();
                this.labelShape = null;
            }

            if (this.constraintHandler != null) {
                this.constraintHandler.destroy();
                this.constraintHandler = null;
            }

            this.destroyBends();
            this.removeHint();
        }        
    }
}