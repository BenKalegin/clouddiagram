module Five {
    export interface IEscapeHandler extends EventListener {
        (event: Events);
    }

    export interface IEdgeFactory {
        (source: Cell, target: Cell, style?: string) : Cell;    
    }

    export class StartConnectEvent extends BasicEvent {
        constructor(public state: CellState) { super(); }
    }

    export class ConnectEvent extends BasicEvent {
        constructor(public cell: Cell, public terminal: Cell, public event: Event, public target: Cell, public terminalInserted: boolean) { super(); }
    }

    export class ConnectionHandler implements IMouseListener {
        graph: Graph;

        escapeHandler: IEscapeHandler;

        //Function that is used for creating new edges.The function takes the source and target < mxCell > as the first and second argument 
        // and returns a new < Cell > that represents the edge.This is used in <createEdge>.
        factoryMethod: IEdgeFactory;

        /** Specifies if icons should be displayed inside the graph container instead of the overlay pane. This is used for HTML labels on vertices which hide
         * the connect icon. This has precendence over <moveIconBack> when set to true. Default is false. */
        private moveIconFront = false;

        /** Specifies if icons should be moved to the back of the overlay pane. This can be set to true if the icons of the connection handler conflict with other
         * handles, such as the vertex label move handle. Default is false. */
        private moveIconBack = false;

        /** <mxImage> that is used to trigger the creation of a new connection. This is used in <createIcons>. Default is null. */
        private connectImage: Image = null;

        /** Specifies if the connect icon should be centered on the target state while connections are being previewed. Default is false. */
        private targetConnectImage = false;

        /** Specifies if events are handled. Default is true. */
        private enabled = true;

        /** Specifies if new edges should be selected. Default is true. */
        private select = true;

        /** Specifies if <createTargetVertex> should be called if no target was under the mouse for the new connection. Setting this to true means the connection
         * will be drawn as valid if no target is under the mouse, and <createTargetVertex> will be called before the connection is created between
         * the source cell and the newly created vertex in <createTargetVertex>, which can be overridden to create a new target. Default is false. */
        private createTarget = false;

        /** Holds the <mxTerminalMarker> used for finding source and target cells. */
        marker: CellMarker = null;

        /** Holds the <mxConstraintHandler> used for drawing and highlighting constraints. */
        constraintHandler: ConstraintHandler = null;

        /** Holds the current validation error while connections are being created.*/
        private error: string = null;

        /** Specifies if single clicks should add waypoints on the new edge. Default is false. */
        private waypointsEnabled = false;

        /** Specifies if the connection handler should ignore the state of the mouse button when highlighting the source. Default is false, that is, the
         * handler only highlights the source if no button is being pressed. */
        private ignoreMouseDown = false;

        /** Holds the <Point> where the mouseDown took place while the handler is active. */
        first: Point = null;

        /** Holds the offset for connect icons during connection preview. Default is Point(0, <Constants.TOOLTIP_VERTICAL_OFFSET>).
         * Note that placing the icon under the mouse pointer with an offset of (0,0) will affect hit detection.*/
        private connectIconOffset = new Point(0, Constants.tooltipVerticalOffset);

        /** Optional <mxCellState> that represents the preview edge while the handler is active. This is created in <createEdgeState>. */
        edgeState: CellState = null;

        /** Holds the change event listener for later removal.  */
        private changeHandler: () => void;

        /** Holds the drill event listener for later removal. */
        private drillHandler: () => void;

        /** Counts the number of mouseDown events since the start. */
        private mouseDownCounter = 0;

        /** Switch to enable moving the preview away from the mousepointer. This is required in browsers where the preview cannot be made transparent to events 
         * and if the built-in hit detection on the HTML elements in the page should be used. Default is the value of <mxClient.IS_VML>. */
        private movePreviewAway = Client.isVml;

        /** Specifies if connections to the outline of a highlighted target should beenabled. This will allow to place the connection point along the outline of
         * the highlighted target. Default is false. */
        private outlineConnect = false;
        previous: CellState;
        private iconState: CellState;
        private currentState: CellState;
        private shape: Shape;
        private icon: ImageShape;
        private selectedIcon: ImageShape;
        private icons: ImageShape[];
        private sourceConstraint: ConnectionConstraint;
        private waypoints: Point[];
        private currentPoint: Point;

        onStartConnect = new EventListeners<StartConnectEvent>();
        onConnect = new EventListeners<ConnectEvent>();
        onReset = new EventListeners<BasicEvent>();

        constructor(graph: Graph, factoryMethod?: IEdgeFactory) {

            if (graph != null) {
                this.graph = graph;
                this.factoryMethod = factoryMethod;
                this.init();

                // Handles escape keystrokes
                this.escapeHandler = () => { this.reset(); };
                this.graph.onEscape.add(this.escapeHandler);
            }
        }

        isEnabled(): boolean {
            return this.enabled;
        }

        setEnabled(enabled: boolean) {
            this.enabled = enabled;
        }

        /** Initializes the shapes required for this connection handler. This should be invoked if Graph.container is assigned after the connection
         * handler has been created. */
        init() {
            this.graph.addMouseListener(this);
            this.marker = this.createMarker();
            this.constraintHandler = new ConstraintHandler(this.graph);

            // Redraws the icons if the graph changes
            this.changeHandler = () => {
                if (this.iconState != null) {
                    this.iconState = this.graph.getView().getState(this.iconState.cell);
                }

                if (this.iconState != null) {
                    this.redrawIcons(this.icons, this.iconState);
                    this.constraintHandler.reset();
                } else {
                    this.reset();
                }
            };

            this.graph.getModel().onChange.add(this.changeHandler);
            this.graph.getView().onScale.add(this.changeHandler);
            this.graph.getView().onTranslate.add(this.changeHandler);
            this.graph.getView().onScaleAndTranslate.add(this.changeHandler);

            // Removes the icon if we step into/up or start editing
            this.drillHandler = () => this.reset();
            this.graph.onStartEditing.add(this.drillHandler);
            this.graph.getView().onRootChange.add(this.drillHandler);
        }

        //Creates and returns the < mxCellMarker > used in <marker>.
        createMarker(): CellMarker {
            var marker = new CellMarker(this.graph);
            marker.hotspotEnabled = true;

            // Overrides to return cell at location only if valid (so that
            // there is no highlight for invalid cells)
            marker.getCell = Utils.bind(this, (me: MouseEventContext) => {
                var cell = CellMarker.prototype.getCell.apply(marker, arguments);
                var scale = this.graph.view.scale;
                var point = new Point(this.graph.snap(me.getGraphX() / scale) * scale,
                    this.graph.snap(me.getGraphY() / scale) * scale);
                this.error = null;

                // Checks for cell under mouse
                if (cell == null) {
                    cell = this.getCellAt(point.x, point.y);
                }

                if ((this.graph.isSwimlane(cell) && this.graph.hitsSwimlaneContent(cell, point.x, point.y)) ||
                    !this.isConnectableCell(cell)) {
                    cell = null;
                }

                if (cell != null) {
                    if (this.isConnecting()) {
                        if (this.previous != null) {
                            this.error = this.validateConnection(this.previous.cell, cell);

                            if (this.error != null && this.error.length == 0) {
                                cell = null;

                                // Enables create target inside groups
                                if (this.isCreateTarget()) {
                                    this.error = null;
                                }
                            }
                        }
                    } else if (!this.isValidSource(cell, me)) {
                        cell = null;
                    }
                } else if (this.isConnecting() && !this.isCreateTarget() &&
                    !this.graph.allowDanglingEdges) {
                    this.error = "";
                }

                return cell;
            });

            // Sets the highlight color according to validateConnection
            marker.isValidState = Utils.bind(this, () => {
                if (this.isConnecting()) {
                    return this.error == null;
                } else {
                    return CellMarker.prototype.isValidState.apply(marker, arguments);
                }
            });

            // Overrides to use marker color only in highlight mode or for
            // target selection
            marker.getMarkerColor = Utils.bind(this, () => {
                return (this.connectImage == null || this.isConnecting()) ?
                    CellMarker.prototype.getMarkerColor.apply(marker, arguments) :
                    null;
            });

            // Overrides to use hotspot only for source selection otherwise
            // intersects always returns true when over a cell
            marker.intersects = Utils.bind(this, () => {
                if (this.connectImage != null || this.isConnecting()) {
                    return true;
                }

                return CellMarker.prototype.intersects.apply(marker, arguments);
            });

            return marker;
        }


        private isCreateTarget(): boolean {
            return this.createTarget;
        }

        private setCreateTarget(value: boolean) {
            this.createTarget = value;
        }

        /** Creates the preview shape for new connections. */
        private createShape(): Shape {
            // Creates the edge preview
            var shape = new PolylineShape([], Constants.invalidColor);
            shape.dialect = (this.graph.dialect != Dialect.Svg) ? Dialect.Vml : Dialect.Svg;
            shape.pointerEvents = false;
            shape.isDashed = true;
            shape.init(this.graph.getView().getOverlayPane());
            Events.redirectMouseEvents(shape.node, this.graph, null);
            return shape;
        }

        /** Returns true if the given cell is connectable. This is a hook to disable floating connections. This implementation returns true. */
        private isConnectableCell(cell: Cell): boolean {
            return true;
        }

        /** Starts a new connection for the given state and coordinates. */
        private start(state: CellState, x: number, y: number, edgeState: CellState) {
            this.previous = state;
            this.first = new Point(x, y);
            this.edgeState = (edgeState != null) ? edgeState : this.createEdgeState(null);

            // Marks the source state
            this.marker.currentColor = this.marker.validColor;
            this.marker.markedState = state;
            this.marker.mark();

            this.onStartConnect.fire(new StartConnectEvent(this.previous));
        }

        private getCellAt(x: number, y: number): Cell {
            return (!this.outlineConnect) ? this.graph.getCellAt(x, y) : null;
        }

        /** Returns true if the source terminal has been clicked and a new connection is currently being previewed. */
        private isConnecting(): boolean {
            return this.first != null && this.shape != null;
        }

        private isValidSource(cell: Cell, me: MouseEventContext): boolean {
            return this.graph.isValidSource(cell);
        }

        /** Returns true. The call to <Graph.isValidTarget> is implicit by calling xGraph.getEdgeValidationError in <validateConnection>. This is an
         * additional hook for disabling certain targets in this specific handler. */
        private isValidTarget(cell: Cell): boolean {
            return true;
        }

        /** Returns the error message or an empty string if the connection for the given source target pair is not valid. Otherwise it returns null. This
         * implementation uses <mxGraph.getEdgeValidationError>. */
        private validateConnection(source: Cell, target: Cell): string {
            if (!this.isValidTarget(target)) {
                return "";
            }

            return this.graph.getEdgeValidationError(null, source, target);
        }

        /** Hook to return the <mxImage> used for the connection icon of the given CellState. This implementation returns <connectImage>.
         * state - <mxCellState> whose connect image should be returned. */
        private getConnectImage(state: CellState): Image {
            return this.connectImage;
        }

        /** Returns true if the state has a HTML label in the graph's container, otherwise it returns <moveIconFront>. */
        private isMoveIconToFrontForState(state: CellState) {
            if (state.text != null && state.text.node.parentNode == this.graph.container) {
                return true;
            }

            return this.moveIconFront;
        }

        /** Creates the array <mxImageShapes> that represent the connect icons for the given <mxCellState>. */
        private createIcons(state: CellState): ImageShape[] {
            var image = this.getConnectImage(state);

            if (image != null && state != null) {
                this.iconState = state;
                var icons = [];

                // Cannot use HTML for the connect icons because the icon receives all
                // mouse move events in IE, must use VML and SVG instead even if the
                // connect-icon appears behind the selection border and the selection
                // border consumes the events before the icon gets a chance
                var bounds = new Rectangle(0, 0, image.width, image.height);
                var icon = new ImageShape(bounds, image.src, null, null, 0);
                icon.preserveImageAspect = false;

                if (this.isMoveIconToFrontForState(state)) {
                    icon.dialect = Dialect.StrictHtml;
                    icon.init(this.graph.container);
                } else {
                    icon.dialect = (this.graph.dialect == Dialect.Svg) ? Dialect.Svg : Dialect.Vml;
                    icon.init(this.graph.getView().getOverlayPane());

                    // Move the icon back in the overlay pane
                    if (this.moveIconBack && icon.node.previousSibling != null) {
                        icon.node.parentNode.insertBefore(icon.node, icon.node.parentNode.firstChild);
                    }
                }

                Utils.nodeStyle(icon.node).cursor = Constants.cursorConnect;

                // Events transparency
                var getState = Utils.bind(this, () => {
                    return (this.currentState != null) ? this.currentState : state;
                });

                // Updates the local icon before firing the mouse down event.
                var mouseDown = Utils.bind(this, evt => {
                    if (!Events.isConsumed(evt)) {
                        this.icon = icon;
                        this.graph.fireMouseEvent(Events.mouseDown, new MouseEventContext(evt, getState()));
                    }
                });

                Events.redirectMouseEvents(icon.node, this.graph, getState, mouseDown);

                icons.push(icon);
                this.redrawIcons(icons, this.iconState);

                return icons;
            }

            return null;
        }

        private redrawIcons(icons: ImageShape[], state: CellState) {
            if (icons != null && icons[0] != null && state != null) {
                var pos = this.getIconPosition(icons[0], state);
                icons[0].bounds.x = pos.x;
                icons[0].bounds.y = pos.y;
                icons[0].redraw();
            }
        }

        private getIconPosition(icon: ImageShape, state: CellState): Point {
            var scale = this.graph.getView().scale;
            var cx = state.getCenterX();
            var cy = state.getCenterY();

            if (this.graph.isSwimlane(state.cell)) {
                var size = this.graph.getStartSize(state.cell);

                cx = (size.width != 0) ? state.x + size.width * scale / 2 : cx;
                cy = (size.height != 0) ? state.y + size.height * scale / 2 : cy;

                var alpha = Utils.toRadians(Utils.getFloat(state.style, Constants.styleRotation, 0));

                if (alpha != 0) {
                    var cos = Math.cos(alpha);
                    var sin = Math.sin(alpha);
                    var ct = new Point(state.getCenterX(), state.getCenterY());
                    var pt = Utils.getRotatedPoint(new Point(cx, cy), cos, sin, ct);
                    cx = pt.x;
                    cy = pt.y;
                }
            }

            return new Point(cx - icon.bounds.width / 2,
                cy - icon.bounds.height / 2);
        }

        private destroyIcons() {
            if (this.icons != null) {
                for (var i = 0; i < this.icons.length; i++) {
                    this.icons[i].destroy();
                }

                this.icons = null;
                this.icon = null;
                this.selectedIcon = null;
                this.iconState = null;
            }
        }

        /** Returns true if the given mouse down event should start this handler. The This implementation returns true if the event does not force marquee
         * selection, and the currentConstraint and currentFocus of the <constraintHandler> are not null, or <previous> and <error> are not null and <icons> is null or <icons> and <icon> are not null.*/
        private isStartEvent(me: MouseEventContext): boolean {
            return ((this.constraintHandler.currentFocus != null && this.constraintHandler.currentConstraint != null) ||
            (this.previous != null && this.error == null && (this.icons == null || (this.icons != null &&
                this.icon != null))));
        }

        /** IMouseListener.mouseDown */
        mouseDown(sender: Object, me: MouseEventContext) {
            this.mouseDownCounter++;

            if (this.isEnabled() && this.graph.isEnabled() && !me.isConsumed() &&
                !this.isConnecting() && this.isStartEvent(me)) {
                if (this.constraintHandler.currentConstraint != null &&
                    this.constraintHandler.currentFocus != null &&
                    this.constraintHandler.currentPoint != null) {
                    this.sourceConstraint = this.constraintHandler.currentConstraint;
                    this.previous = this.constraintHandler.currentFocus;
                    this.first = this.constraintHandler.currentPoint.clone();
                } else {
                    // Stores the location of the initial mousedown
                    this.first = new Point(me.getGraphX(), me.getGraphY());
                }

                this.edgeState = this.createEdgeState(me);
                this.mouseDownCounter = 1;

                if (this.waypointsEnabled && this.shape == null) {
                    this.waypoints = null;
                    this.shape = this.createShape();

                    if (this.edgeState != null) {
                        this.shape.apply(this.edgeState);
                    }
                }

                // Stores the starting point in the geometry of the preview
                if (this.previous == null && this.edgeState != null) {
                    var pt = this.graph.getPointForEvent(me.getEvent());
                    this.edgeState.cell.geometry.setTerminalPoint(pt, true);
                }

                this.onStartConnect.fire(new StartConnectEvent(this.previous));

                me.consume();
            }

            this.selectedIcon = this.icon;
            this.icon = null;
        }

        /** Returns true if a tap on the given source state should immediately startconnecting. 
         * This implementation returns true if the state is not movablein the graph. */
        private isImmediateConnectSource(state: CellState): boolean {
            return !this.graph.isCellMovable(state.cell);
        }

        /** Hook to return an <mxCellState> which may be used during the preview. This implementation returns null.
         * 
         * Use the following code to create a preview for an existing edge style:
         * 
         * (code)
         * graph.connectionHandler.createEdgeState = function(me)
         * {
         *   var edge = graph.createEdge(null, null, null, null, null, 'edgeStyle=elbowEdgeStyle');
         *   
         *   return new mxCellState(this.graph.view, edge, this.graph.getCellStyle(edge));
         * };
         * (end)
         */
        createEdgeState(me: MouseEventContext): CellState {
            return null;
        }

        /** Returns true if <outlineConnect> is true and the source of the event is the outline shape or shift is pressed. */
        private isOutlineConnectEvent(me: MouseEventContext): boolean {
            return this.outlineConnect && (me.isSource(this.marker.highlight.shape) || Events.isMouseAltDown(me.getEvent()));
        }

        /** Updates the current state for a given mouse move event by using the <marker>. */
        private updateCurrentState(me: MouseEventContext, point: Point) {
            this.constraintHandler.update(me, this.first == null);

            if (this.constraintHandler.currentFocus != null && this.constraintHandler.currentConstraint != null) {
                this.marker.reset();
                this.currentState = this.constraintHandler.currentFocus;
            } else {
                this.marker.process(me);
                this.currentState = this.marker.getValidState();

                if (this.currentState != null && this.isOutlineConnectEvent(me)) {
                    var constraint = this.graph.getOutlineConstraint(point, this.currentState, me);
                    this.constraintHandler.currentConstraint = constraint;
                    this.constraintHandler.currentFocus = this.currentState;
                    this.constraintHandler.currentPoint = point;
                }
            }

            if (this.outlineConnect) {
                if (this.marker.highlight != null && this.marker.highlight.shape != null) {
                    if (this.constraintHandler.currentConstraint != null &&
                        this.constraintHandler.currentFocus != null) {
                        this.marker.highlight.shape.stroke = Constants.outlineHighlightColor;
                        this.marker.highlight.shape.strokewidth = Constants.outlineHighlightStrokewidth / this.graph.view.scale / this.graph.view.scale;
                        this.marker.highlight.repaint();
                    } else if (this.marker.hasValidState()) {
                        this.marker.highlight.shape.stroke = Constants.defaultValidColor;
                        this.marker.highlight.shape.strokewidth = Constants.highlightStrokewidth / this.graph.view.scale / this.graph.view.scale;
                        this.marker.highlight.repaint();
                    }
                }
            }
        }

        /** Converts the given point from screen coordinates to model coordinates.*/
        private convertWaypoint(point: Point) {
            var scale = this.graph.getView().getScale();
            var tr = this.graph.getView().getTranslate();

            point.x = point.x / scale - tr.x;
            point.y = point.y / scale - tr.y;
        }

        /** IMouseListener. Handles the event by updating the preview edge or by highlighting a possible source or target terminal. */
        mouseMove(sender: Object, me: MouseEventContext) {
            if (!me.isConsumed() && (this.ignoreMouseDown || this.first != null || !this.graph.isMouseDown)) {
                // Handles special case when handler is disabled during highlight
                if (!this.isEnabled() && this.currentState != null) {
                    this.destroyIcons();
                    this.currentState = null;
                }

                var view = this.graph.getView();
                var scale = view.scale;
                var tr = view.translate;
                var point = new Point(me.getGraphX(), me.getGraphY());

                if (this.graph.isGridEnabledEvent(me.getEvent())) {
                    point = new Point((this.graph.snap(point.x / scale - tr.x) + tr.x) * scale,
                    (this.graph.snap(point.y / scale - tr.y) + tr.y) * scale);
                }

                this.currentPoint = point;

                if (this.first != null || (this.isEnabled() && this.graph.isEnabled())) {
                    this.updateCurrentState(me, point);
                }
                var i: number;
                if (this.first != null) {
                    var constraint = null;
                    var current = point;

                    // Uses the current point from the constraint handler if available
                    if (this.constraintHandler.currentConstraint != null &&
                        this.constraintHandler.currentFocus != null &&
                        this.constraintHandler.currentPoint != null) {
                        constraint = this.constraintHandler.currentConstraint;
                        current = this.constraintHandler.currentPoint.clone();
                    } else if (this.previous != null && Events.isMouseShiftDown(me.getEvent())) {
                        if (Math.abs(this.previous.getCenterX() - point.x) < Math.abs(this.previous.getCenterY() - point.y)) {
                            point.x = this.previous.getCenterX();
                        } else {
                            point.y = this.previous.getCenterY();
                        }
                    }

                    var pt2 = this.first;

                    // Moves the connect icon with the mouse
                    if (this.selectedIcon != null) {
                        var w = this.selectedIcon.bounds.width;
                        var h = this.selectedIcon.bounds.height;

                        if (this.currentState != null && this.targetConnectImage) {
                            var pos = this.getIconPosition(this.selectedIcon, this.currentState);
                            this.selectedIcon.bounds.x = pos.x;
                            this.selectedIcon.bounds.y = pos.y;
                        } else {
                            var bounds = new Rectangle(me.getGraphX() + this.connectIconOffset.x,
                                me.getGraphY() + this.connectIconOffset.y, w, h);
                            this.selectedIcon.bounds = bounds;
                        }

                        this.selectedIcon.redraw();
                    }

                    // Uses edge state to compute the terminal points
                    if (this.edgeState != null) {
                        this.edgeState.absolutePoints = [null, (this.currentState != null) ? null : current];
                        this.graph.view.updateFixedTerminalPoint(this.edgeState, this.previous, true, this.sourceConstraint);

                        if (this.currentState != null) {
                            if (constraint == null) {
                                constraint = this.graph.getConnectionConstraint(this.edgeState, this.previous, false);
                            }

                            this.edgeState.setAbsoluteTerminalPoint(null, false);
                            this.graph.view.updateFixedTerminalPoint(this.edgeState, this.currentState, false, constraint);
                        }

                        // Scales and translates the waypoints to the model
                        var realPoints = null;

                        if (this.waypoints != null) {
                            realPoints = [];

                            for (i = 0; i < this.waypoints.length; i++) {
                                var pt = this.waypoints[i].clone();
                                this.convertWaypoint(pt);
                                realPoints[i] = pt;
                            }
                        }

                        this.graph.view.updatePoints(this.edgeState, realPoints, this.previous, this.currentState);
                        this.graph.view.updateFloatingTerminalPoints(this.edgeState, this.previous, this.currentState);
                        current = this.edgeState.absolutePoints[this.edgeState.absolutePoints.length - 1];
                        pt2 = this.edgeState.absolutePoints[0];
                    } else {
                        var tmp: Point;
                        if (this.currentState != null) {
                            if (this.constraintHandler.currentConstraint == null) {
                                tmp = this.getTargetPerimeterPoint(this.currentState, me);
                                if (tmp != null) {
                                    current = tmp;
                                }
                            }
                        }

                        // Computes the source perimeter point
                        if (this.sourceConstraint == null && this.previous != null) {
                            var next = (this.waypoints != null && this.waypoints.length > 0) ?
                                this.waypoints[0] : current;
                            tmp = this.getSourcePerimeterPoint(this.previous, next, me);
                            if (tmp != null) {
                                pt2 = tmp;
                            }
                        }
                    }

                    // Makes sure the cell under the mousepointer can be detected
                    // by moving the preview shape away from the mouse. This
                    // makes sure the preview shape does not prevent the detection
                    // of the cell under the mousepointer even for slow gestures.
                    var dx: number;
                    var dy: number;
                    if (this.currentState == null && this.movePreviewAway) {
                        var tmpp = pt2;

                        if (this.edgeState != null && this.edgeState.absolutePoints.length > 2) {
                            var tmp2 = this.edgeState.absolutePoints[this.edgeState.absolutePoints.length - 2];

                            if (tmp2 != null) {
                                tmpp = tmp2;
                            }
                        }
                        dx = current.x - tmpp.x;
                        dy = current.y - tmpp.y;
                        var len = Math.sqrt(dx * dx + dy * dy);

                        if (len == 0) {
                            return;
                        }

                        current.x -= dx * 4 / len;
                        current.y -= dy * 4 / len;
                    }

                    // Creates the preview shape (lazy)
                    if (this.shape == null) {
                        dx = Math.abs(point.x - this.first.x);
                        dy = Math.abs(point.y - this.first.y);
                        if (dx > this.graph.tolerance || dy > this.graph.tolerance) {
                            this.shape = this.createShape();

                            if (this.edgeState != null) {
                                this.shape.apply(this.edgeState);
                            }

                            // Revalidates current connection
                            this.updateCurrentState(me, point);
                        }
                    }

                    // Updates the points in the preview edge
                    if (this.shape != null) {
                        if (this.edgeState != null) {
                            this.shape.points = this.edgeState.absolutePoints;
                        } else {
                            var pts = [pt2];

                            if (this.waypoints != null) {
                                pts = pts.concat(this.waypoints);
                            }

                            pts.push(current);
                            this.shape.points = pts;
                        }

                        this.drawPreview();
                    }

                    Events.consume(me.getEvent());
                    me.consume();
                } else if (!this.isEnabled() || !this.graph.isEnabled()) {
                    this.constraintHandler.reset();
                } else if (this.previous != this.currentState && this.edgeState == null) {
                    this.destroyIcons();

                    // Sets the cursor on the current shape				
                    if (this.currentState != null && this.error == null && this.constraintHandler.currentConstraint == null) {
                        this.icons = this.createIcons(this.currentState);

                        if (this.icons == null) {
                            this.currentState.setCursor(Constants.cursorConnect);
                            me.consume();
                        }
                    }

                    this.previous = this.currentState;
                } else if (this.previous == this.currentState && this.currentState != null && this.icons == null &&
                    !this.graph.isMouseDown) {
                    // Makes sure that no cursors are changed
                    me.consume();
                }

                if (!this.graph.isMouseDown && this.currentState != null && this.icons != null) {
                    var hitsIcon = false;
                    var target = me.getSource();

                    for (i = 0; i < this.icons.length && !hitsIcon; i++) {
                        hitsIcon = target == this.icons[i].node || target.parentNode == this.icons[i].node;
                    }

                    if (!hitsIcon) {
                        this.updateIcons(this.currentState, this.icons, me);
                    }
                }
            } else {
                this.constraintHandler.reset();
            }
        }

        /** Returns the perimeter point for the given target state.*/
        private getTargetPerimeterPoint(state: CellState, me: MouseEventContext) : Point {
            var result = null;
            var view = state.view;
            var targetPerimeter = view.getPerimeterFunction(state);

            if (targetPerimeter != null) {
                var next = (this.waypoints != null && this.waypoints.length > 0) ?
                    this.waypoints[this.waypoints.length - 1] :
                    new Point(this.previous.getCenterX(), this.previous.getCenterY());
                var tmp = targetPerimeter(view.getPerimeterBounds(state),
                    this.edgeState, next, false);

                if (tmp != null) {
                    result = tmp;
                }
            } else {
                result = new Point(state.getCenterX(), state.getCenterY());
            }

            return result;
        }

        /** Hook to update the icon position(s) based on a mouseOver event. This is an empty implementation.
         * state - <mxCellState> that represents the target cell state.
         * next - <Point> that represents the next point along the previewed edge.
         * me - <mxMouseEvent> that represents the mouse move.
         */
        private getSourcePerimeterPoint(state: CellState, next: Point, me: MouseEventContext): Point {
            var view = state.view;
            var sourcePerimeter = view.getPerimeterFunction(state);
            var c = new Point(state.getCenterX(), state.getCenterY());

            var result: Point = null;
            if (sourcePerimeter != null) {
                var theta = Utils.getFloat(state.style, Constants.styleRotation, 0);
                var rad = -theta * (Math.PI / 180);

                if (theta != 0) {
                    next = Utils.getRotatedPoint(new Point(next.x, next.y), Math.cos(rad), Math.sin(rad), c);
                }

                var tmp: Point = sourcePerimeter(view.getPerimeterBounds(state), state, next, false);

                if (tmp != null) {
                    if (theta != 0) {
                        tmp = Utils.getRotatedPoint(new Point(tmp.x, tmp.y), Math.cos(-rad), Math.sin(-rad), c);
                    }

                    result = tmp;
                }
            } else {
                result = c;
            }

            return result;
        }


        /** Hook to update the icon position(s) based on a mouseOver event. This is an empty implementation.
         * state - <mxCellState> under the mouse.
         * icons - Array of currently displayed icons.
         * me - <mxMouseEvent> that contains the mouse event.
         */
        private updateIcons(state: CellState, icons: ImageShape[], me: MouseEventContext) {
            // empty
        }

        /** Returns true if the given mouse up event should stop this handler. Theconnection will be created if <error> is null. Note that this is only
         * called if <waypointsEnabled> is true. This implemtation returns true if there is a cell state in the given event. */
        private isStopEvent(me: MouseEventContext): boolean {
            return me.getState() != null;
        }

        /** Adds the waypoint for the given event to <waypoints>. */
        private addWaypointForEvent(me: MouseEventContext) {
            var point = Utils.convertPoint(this.graph.container, me.getX(), me.getY());
            var dx = Math.abs(point.x - this.first.x);
            var dy = Math.abs(point.y - this.first.y);
            var addPoint = this.waypoints != null || (this.mouseDownCounter > 1 && (dx > this.graph.tolerance || dy > this.graph.tolerance));

            if (addPoint) {
                if (this.waypoints == null) {
                    this.waypoints = [];
                }

                var scale = this.graph.view.scale;
                point = new Point(this.graph.snap(me.getGraphX() / scale) * scale, this.graph.snap(me.getGraphY() / scale) * scale);
                this.waypoints.push(point);
            }
        }

        /** IMouseListener implementation */
        mouseUp(sender: Object, me: MouseEventContext) {
            if (!me.isConsumed() && this.isConnecting()) {
                if (this.waypointsEnabled && !this.isStopEvent(me)) {
                    this.addWaypointForEvent(me);
                    me.consume();

                    return;
                }

                // Inserts the edge if no validation error exists
                if (this.error == null) {
                    var source = (this.previous != null) ? this.previous.cell : null;
                    var target = null;

                    if (this.constraintHandler.currentConstraint != null &&
                        this.constraintHandler.currentFocus != null) {
                        target = this.constraintHandler.currentFocus.cell;
                    }

                    if (target == null && this.marker.hasValidState()) {
                        target = this.marker.validState.cell;
                    }

                    this.connect(source, target, me.getEvent(), me.getCell());
                } else {
                    // Selects the source terminal for self-references
                    if (this.previous != null && this.marker.validState != null &&
                        this.previous.cell == this.marker.validState.cell) {
                        this.graph.selectCellForEvent(null /*this.marker.source*/, me.getEvent());
                    }

                    // Displays the error message if it is not an empty string,
                    // for empty error messages, the event is silently dropped
                    if (this.error.length > 0) {
                        this.graph.validationAlert(this.error);
                    }
                }

                // Redraws the connect icons and resets the handler state
                this.destroyIcons();
                me.consume();
            }

            if (this.first != null) {
                this.reset();
            }
        }

        /** Resets the state of this handler.*/
        private reset() {
            if (this.shape != null) {
                this.shape.destroy();
                this.shape = null;
            }

            this.destroyIcons();
            this.marker.reset();
            this.constraintHandler.reset();
            this.edgeState = null;
            this.previous = null;
            this.error = null;
            this.sourceConstraint = null;
            this.mouseDownCounter = 0;
            this.first = null;

            this.onReset.fire();
        }

        /** Redraws the preview edge using the color and width returned by <getEdgeColor> and <getEdgeWidth>. */
        private drawPreview() {
            var valid = this.error == null;
            this.shape.strokewidth = this.getEdgeWidth(valid);
            var color = this.getEdgeColor(valid);
            this.shape.stroke = color;
            this.shape.redraw();
        }

        /** Returns the color used to draw the preview edge. This returns green if there is no edge validation error and red otherwise.
         * valid - Boolean indicating if the color for a valid edge should be returned. */
        private getEdgeColor(valid: boolean): string {
            return (valid) ? Constants.validColor : Constants.invalidColor;
        }

        /** Returns the width used to draw the preview edge. This returns 3 if there is no edge validation error and 1 otherwise.
         * valid - Boolean indicating if the width for a valid edge should be returned.
         */
        private getEdgeWidth(valid: boolean): number {
            return (valid) ? 3 : 1;
        }

        /** Connects the given source and target using a new edge. This implementation uses <createEdge> to create the edge.
         * source - <mxCell> that represents the source terminal.
         * target - <mxCell> that represents the target terminal.
         * evt - Mousedown event of the connect gesture.
         * dropTarget - <mxCell> that represents the cell under the mouse when it was released. */
        connect(source: Cell, target: Cell, evt: MouseEvent, dropTarget?: Cell) {
            if (target != null || this.isCreateTarget() || this.graph.allowDanglingEdges) {
                // Uses the common parent of source and target or
                // the default parent to insert the edge
                var model = this.graph.getModel();
                var terminalInserted = false;
                var edge = null;

                model.beginUpdate();
                try {
                    if (source != null && target == null && this.isCreateTarget()) {
                        target = this.createTargetVertex(evt, source);

                        if (target != null) {
                            dropTarget = this.graph.getDropTarget([target], evt, dropTarget);
                            terminalInserted = true;

                            // Disables edges as drop targets if the target cell was created
                            // FIXME: Should not shift if vertex was aligned (same in Java)
                            if (dropTarget == null || !this.graph.getModel().isEdge(dropTarget)) {
                                var pstate = this.graph.getView().getState(dropTarget);

                                if (pstate != null) {
                                    var tmp = Cells.getGeometry(target);
                                    tmp.x -= pstate.origin.x;
                                    tmp.y -= pstate.origin.y;
                                }
                            } else {
                                dropTarget = this.graph.getDefaultParent();
                            }

                            this.graph.addCell(target, dropTarget);
                        }
                    }

                    var parent = this.graph.getDefaultParent();

                    if (source != null && target != null &&
                        model.getParent(source) == model.getParent(target) &&
                        model.getParent(model.getParent(source)) != model.getRoot()) {
                        parent = model.getParent(source);

                        if ((source.geometry != null && source.geometry.relative) &&
                        (target.geometry != null && target.geometry.relative)) {
                            parent = model.getParent(parent);
                        }
                    }

                    // Uses the value of the preview edge state for inserting
                    // the new edge into the graph
                    var value = null;
                    var style = null;

                    if (this.edgeState != null) {
                        value = this.edgeState.cell.value;
                        style = this.edgeState.cell.style;
                    }

                    edge = this.insertEdge(parent, null, value, source, target, style);

                    if (edge != null) {
                        // Updates the connection constraints
                        this.graph.setConnectionConstraint(edge, source, true, this.sourceConstraint);
                        this.graph.setConnectionConstraint(edge, target, false, this.constraintHandler.currentConstraint);

                        // Uses geometry of the preview edge state
                        if (this.edgeState != null) {
                            model.setGeometry(edge, this.edgeState.cell.geometry);
                        }

                        // Makes sure the edge has a non-null, relative geometry
                        var geo = Cells.getGeometry(edge);

                        if (geo == null) {
                            geo = new Geometry();
                            geo.relative = true;

                            model.setGeometry(edge, geo);
                        }

                        // Uses scaled waypoints in geometry
                        var s: number;
                        var pt: Point;
                        if (this.waypoints != null && this.waypoints.length > 0) {
                            s = this.graph.view.scale;
                            var tr = this.graph.view.translate;
                            geo.points = [];

                            for (var i = 0; i < this.waypoints.length; i++) {
                                pt = this.waypoints[i];
                                geo.points.push(new Point(pt.x / s - tr.x, pt.y / s - tr.y));
                            }
                        }

                        if (target == null) {
                            var t = this.graph.view.translate;
                            s = this.graph.view.scale;
                            pt = new Point(this.currentPoint.x / s - t.x, this.currentPoint.y / s - t.y);
                            pt.x -= this.graph.panDx / this.graph.view.scale;
                            pt.y -= this.graph.panDy / this.graph.view.scale;
                            geo.setTerminalPoint(pt, false);
                        }

                        this.onConnect.fire(new ConnectEvent(edge, target, evt, dropTarget, terminalInserted));
                    }
                } catch (e) {
                    console.warn(e.message);
                } finally {
                    model.endUpdate();
                }

                if (this.select) {
                    this.selectCells(edge, (terminalInserted) ? target : null);
                }
            }
        }

        /** Selects the given edge after adding a new connection. The target argument contains the target vertex if one has been inserted. */
        private selectCells(edge: Cell, target: Cell) {
            this.graph.setSelectionCell(edge);
        }

        /** Creates, inserts and returns the new edge for the given parameters. This implementation does only use <createEdge> if <factoryMethod> is defined,
         * otherwise <mxGraph.insertEdge> will be used. */
        private insertEdge(parent: Cell, id: number, value: Node, source: Cell, target: Cell, style?: string): Cell {
            if (this.factoryMethod == null) {
                return this.graph.insertEdge(parent, id, value, source, target, style);
            } else {
                var edge = this.createEdge(value, source, target, style);
                edge = this.graph.addEdge(edge, parent, source, target);

                return edge;
            }
        }

        /** Hook method for creating new vertices on the fly if no target was under the mouse. This is only called if <createTarget> is true and returns null. */
        private createTargetVertex(evt: MouseEvent, source: Cell) : Cell {
            // Uses the first non-relative source
            var geo = this.graph.getCellGeometry(source);

            while (geo != null && geo.relative) {
                source = this.graph.getModel().getParent(source);
                geo = this.graph.getCellGeometry(source);
            }

            var clone = this.graph.cloneCells([source])[0];
            geo = Cells.getGeometry(clone);
            if (geo != null) {
                var t = this.graph.view.translate;
                var s = this.graph.view.scale;
                var point = new Point(this.currentPoint.x / s - t.x, this.currentPoint.y / s - t.y);
                geo.x = point.x - geo.width / 2 - this.graph.panDx / s;
                geo.y = point.y - geo.height / 2 - this.graph.panDy / s;

                // Aligns with source if within certain tolerance
                var tol = this.getAlignmentTolerance();

                if (tol > 0) {
                    var sourceState = this.graph.view.getState(source);

                    if (sourceState != null) {
                        var x = sourceState.x / s - t.x;
                        var y = sourceState.y / s - t.y;

                        if (Math.abs(x - geo.x) <= tol) {
                            geo.x = x;
                        }

                        if (Math.abs(y - geo.y) <= tol) {
                            geo.y = y;
                        }
                    }
                }
            }

            return clone;
        }

        /** Returns the tolerance for aligning new targets to sources. This returns the grid size / 2. */
        private getAlignmentTolerance() : number {
            return (this.graph.isGridEnabled()) ? this.graph.gridSize / 2 : this.graph.tolerance;
        }

        /** Creates and returns a new edge using <factoryMethod> if one exists. If no factory method is defined, then a new default edge is returned. 
         * The source and target arguments are informal, the actual connection is setup later by the caller of this function.
         * value - Value to be used for creating the edge.
         * source - <mxCell> that represents the source terminal.
         * target - <mxCell> that represents the target terminal.
         * style - Optional style from the preview edge.
         */
        private createEdge(value: Node, source: Cell, target: Cell, style: string): Cell {
            var edge = null;

            // Creates a new edge using the factoryMethod
            if (this.factoryMethod != null) {
                edge = this.factoryMethod(source, target, style);
            }

            if (edge == null) {
                edge = new Cell(value);
                edge.setEdge(true);
                edge.setStyle(style);

                var geo = new Geometry();
                geo.relative = true;
                edge.setGeometry(geo);
            }

            return edge;
        }

        /** Destroys the handler and all its resources and DOM nodes. This should be called on all instances. It is called automatically for the built-in
         * instance created for each <mxGraph>. */
        destroy() {
            this.graph.removeMouseListener(this);

            if (this.shape != null) {
                this.shape.destroy();
                this.shape = null;
            }

            if (this.marker != null) {
                this.marker.destroy();
                this.marker = null;
            }

            if (this.constraintHandler != null) {
                this.constraintHandler.destroy();
                this.constraintHandler = null;
            }

            if (this.changeHandler != null) {
                this.graph.getModel().onChange.remove(this.changeHandler);
                this.graph.getView().onScale.remove(this.changeHandler);
                this.graph.getView().onTranslate.remove(this.changeHandler);
                this.graph.getView().onScaleAndTranslate.remove(this.changeHandler);
                this.changeHandler = null;
            }

            if (this.drillHandler != null) {
                this.graph.onStartEditing.remove(this.drillHandler);
                this.graph.getView().onRootChange.remove(this.drillHandler);
                this.drillHandler = null;
            }

            if (this.escapeHandler != null) {
                this.graph.onEscape.remove(this.escapeHandler);
                this.escapeHandler = null;
            }
        }
    }
}