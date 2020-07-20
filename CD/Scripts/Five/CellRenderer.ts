///<reference path="Common.ts" />
///<reference path="RectangleShape.ts" />
///<reference path="EllipseShape.ts" />
///<reference path="RhombusShape.ts" />
///<reference path="CylinderShape.ts" />
///<reference path="ConnectorShape.ts" />
///<reference path="ActorShape.ts" />
///<reference path="TriangleShape.ts" />
///<reference path="HexagonShape.ts" />
///<reference path="CloudShape.ts" />
///<reference path="LineShape.ts" />
///<reference path="ArrowShape.ts" />
///<reference path="DoubleEllipseShape.ts" />
///<reference path="SwimlaneShape.ts" />
///<reference path="ImageShape.ts" />
///<reference path="LabelShape.ts" />
///<reference path="Stylesheet.ts" />

module Five {
    
    /**
     * Renders cells into a document object model. The <defaultShapes> is a global map of shapename, constructor pairs that is used in all instances. 
     * In general the cell renderer is in charge of creating, redrawing and destroying the shape and label associated with a cell state, as well as
     * some other graphical objects, namely controls and overlays. The shape hieararchy in the display (ie. the hierarchy in which the DOM nodes
     * appear in the document) does not reflect the cell hierarchy. The shapes are a (flat) sequence of shapes and labels inside the draw pane of the
     * graph view, with some exceptions, namely the HTML labels being placed directly inside the graph container for certain browsers.
     */
    export class CellRenderer {
        // Defines the default shape for edges. Default is <mxConnector>.
        defaultEdgeShape: () => Shape = ConnectorShape.factory;

        // Defines the default shape for vertices. Default is <RectangleShape>.
        defaultVertexShape: () => Shape = RectangleShape.factory;

        // Specifies if the folding icon should ignore the horizontal orientation of a swimlane. Default is true.
        legacyControlPosition = true;

        // Static array that contains the globally registered shapes which are known to all instances of this class. For adding new shapes you should
        // use the static <CellRenderer.registerShape> function.
        static defaultShapes: { [key: number]: () => Shape} = {};


        static registerShape(key: ShapeStyle, shape: () => Shape) {
            CellRenderer.defaultShapes[key] = shape;
        }

        static registerDefaultShapes(){
            // Adds default shapes into the default shapes array
            CellRenderer.registerShape(ShapeStyle.Rectangle,  RectangleShape.factory);
            CellRenderer.registerShape(ShapeStyle.Ellipse, EllipseShape.factory);
            CellRenderer.registerShape(ShapeStyle.Rhombus, RhombusShape.factory);
            CellRenderer.registerShape(ShapeStyle.Cylinder, CylinderShape.factory);
            CellRenderer.registerShape(ShapeStyle.Connector, ConnectorShape.factory);
            CellRenderer.registerShape(ShapeStyle.Actor, ActorShape.factory);
            CellRenderer.registerShape(ShapeStyle.Triangle, TriangleShape.factory);
            CellRenderer.registerShape(ShapeStyle.Hexagon, HexagonShape.factory);
            CellRenderer.registerShape(ShapeStyle.Cloud, CloudShape.factory);
            CellRenderer.registerShape(ShapeStyle.Line, LineShape.factory);
            CellRenderer.registerShape(ShapeStyle.Arrow, ArrowShape.factory);
            CellRenderer.registerShape(ShapeStyle.DoubleEllipse, DoubleEllipseShape.factory);
            CellRenderer.registerShape(ShapeStyle.Swimlane, SwimlaneShape.factory);
            CellRenderer.registerShape(ShapeStyle.Image, ImageShape.factory);
            CellRenderer.registerShape(ShapeStyle.Label, LabelShape.factory);
        }
        /**
         * Function: initializeShape
         * 
         * Initializes the shape in the given state by calling its init method with
         * the correct container after configuring it using <configureShape>.
         * 
         * Parameters:
         * 
         * state - <mxCellState> for which the shape should be initialized.
         */
        initializeShape(state: CellState) {
            state.shape.dialect = state.view.graph.dialect;
            this.configureShape(state);
            state.shape.init(ElementInitializer(state.view.getDrawPane()));
        }

        /** Creates the shape for the given cell state. */
        createShape(state: CellState) {
            if (state.style != null) {
                // Checks if there is a stencil for the name and creates
                // a shape instance for the stencil if one exists
                var stencil = StencilRegistry.getStencil(state.style.shape);

                if (stencil != null) {
                    state.shape = new Shape(stencil);
                } else {
                    var ctor = this.getShapeConstructor(state);
                    state.shape = ctor();
                }
            }
        }

        /** Creates the indicator shape for the given cell state. */
        createIndicatorShape(state: CellState) {
            state.shape.indicatorShape = this.getShape(state.view.graph.getIndicatorShape(state));
        }

        /** Returns the shape for the given name from <defaultShapes>. */
        getShape(style: ShapeStyle): () => Shape {
            return (style != null) ? CellRenderer.defaultShapes[style] : null;
        }

        /** Returns the constructor to be used for creating the shape. */
        getShapeConstructor(state: CellState) : () => Shape {
            var ctor = this.getShape(state.style.shape);

            if (ctor == null) {
                ctor = (Cells.isEdge(state.cell)) ?
                    this.defaultEdgeShape : this.defaultVertexShape;
            }

            return ctor;
        }

        /**
         * Configures the shape for the given cell state.
         * Parameters:
         * state - <mxCellState> for which the shape should be configured.
         */
        configureShape(state: CellState) {
            state.shape.apply(state);
            state.shape.image = state.view.graph.getImage(state);
            state.shape.indicatorColor = state.view.graph.getIndicatorColor(state);
            state.shape.indicatorStrokeColor = state.style.indicatorStrokeColor;
            state.shape.indicatorGradientColor = state.view.graph.getIndicatorGradientColor(state);
            state.shape.indicatorDirection = state.style.indicatorDirection;
            state.shape.indicatorImage = state.view.graph.getIndicatorImage(state);

            this.postConfigureShape(state);
        }

        /** Replaces any reserved words used for attributes, eg. inherit, indicated or swimlane for colors in the shape for the given state.
         * This implementation resolves these keywords on the fill, stroke and gradient color keys. */
        postConfigureShape(state: CellState) {
        }

        /**
         * Returns the value to be used for the label.
         * Parameters:
         * state - <mxCellState> for which the label should be created.
         */
        getLabelValue(state: CellState) {
            return state.view.graph.getLabel(state.cell);
        }

        /**
         * Function: createLabel
         * 
         * Creates the label for the given cell state.
         * 
         * Parameters:
         * 
         * state - <mxCellState> for which the label should be created.
         */
        private createLabel(state: CellState, value) {
            var graph = state.view.graph;
            if (state.style.fontSize > 0 || state.style.fontSize == null) {
                // Avoids using DOM node for empty labels
                var isForceHtml = (graph.isHtmlLabel(state.cell) || (value != null && Utils.isNode(value)));

                state.text = new TextShape(value, new Rectangle(0, 0),
                    (state.style.hAlign || HorizontalAlign.Center),
                    graph.getVerticalAlign(state),
                    state.style.fontColor,
                    state.style.fontFamily,
                    state.style.fontSize,
                    state.style.fontStyle,
                    state.style.spacing,
                    state.style.spacingTop,
                    state.style.spacingRight,
                    state.style.spacingBottom,
                    state.style.spacingLeft,
                    !state.style.portrait,
                    state.style.labelBackgroundColor,
                    state.style.LabelBorderColor,
                    graph.isWrapping(state.cell) && graph.isHtmlLabel(state.cell),
                    graph.isLabelClipped(state.cell),
                    state.style.overflow,
                    state.style.labelPadding);
                state.text.opacity = state.style.textOpacity || 100;
                state.text.dialect = (isForceHtml) ? Dialect.StrictHtml : state.view.graph.dialect;
                state.text.style = state.style;
                state.text.state = state;
                this.initializeLabel(state);

                // Workaround for touch devices routing all events for a mouse gesture
                // (down, move, up) via the initial DOM node. IE additionally redirects
                // the event via the initial DOM node but the event source is the node
                // under the mouse, so we need to check if this is the case and force
                // getCellAt for the subsequent mouseMoves and the final mouseUp.
                var forceGetCell = false;

                var getState = evt => {
                    var result = state;

                    if (Client.isTouch || forceGetCell) {
                        var x = Events.getClientX(evt);
                        var y = Events.getClientY(evt);

                        // Dispatches the drop event to the graph which
                        // consumes and executes the source function
                        var pt = graph.container.convertPoint(x, y);
                        result = graph.view.getState(graph.getCellAt(pt.x, pt.y));
                    }

                    return result;
                };

                // TODO: Add handling for special touch device gestures
                Events.addGestureListeners(state.text.node,
                    evt => {
                        if (this.isLabelEvent(state, evt)) {
                            graph.fireMouseEvent(Events.mouseDown, new MouseEventContext(evt, state));
                            forceGetCell = graph.dialect !== Dialect.Svg &&
                                (Events.getSource(evt) as Element).nodeName === "IMG";
                        }
                    },
                    evt => {
                        if (this.isLabelEvent(state, evt)) {
                            graph.fireMouseEvent(Events.mouseMove, new MouseEventContext(evt, getState(evt)));
                        }
                    },
                    evt => {
                        if (this.isLabelEvent(state, evt)) {
                            graph.fireMouseEvent(Events.mouseUp, new MouseEventContext(evt, getState(evt)));
                            forceGetCell = false;
                        }
                    }
                );

                // Uses double click timeout in mxGraph for quirks mode
                if (graph.nativeDblClickEnabled) {
                    Events.addListener(state.text.node, "dblclick",
                        (evt: MouseEvent) => {
                            if (this.isLabelEvent(state, evt)) {
                                graph.dblClick(evt, state.cell);
                                Events.consume(evt);
                            }
                        }
                    );
                }
            }
        }

        /** Initiailzes the label with a suitable container.
         * state - <mxCellState> whose label should be initialized.
         */
        private initializeLabel(state: CellState) {
            if (Client.isSvg && Client.noFo && state.text.dialect != Dialect.Svg) {
                state.text.init(state.view.graph.container);
            } else {
                state.text.init(ElementInitializer(state.view.getDrawPane()));
            }
        }

        /**
         * Function: createCellOverlays
         * 
         * Creates the actual shape for showing the overlay for the given cell state.
         * 
         * Parameters:
         * 
         * state - <mxCellState> for which the overlay should be created.
         */
        private createCellOverlays(state: CellState) {
            var graph = state.view.graph;
            var overlays = graph.getCellOverlays(state.cell);
            var dict = null;

            if (overlays != null) {
                dict = new Dictionary<CellOverlay, ImageShape>();

                for (var i = 0; i < overlays.length; i++) {
                    var cellOverlay = overlays[i];
                    var shape = (state.overlays != null) ? state.overlays.remove(cellOverlay) : null;

                    if (shape == null) {
                        var tmp = new ImageShape(new Rectangle(0, 0, 0, 0), cellOverlay.image.src);
                        tmp.dialect = state.view.graph.dialect;
                        tmp.preserveImageAspect = false;
                        tmp.overlay = cellOverlay;
                        this.initializeOverlay(state, tmp);
                        this.installCellOverlayListeners(state, cellOverlay, tmp);

                        if (cellOverlay.cursor != null) {
                            var style = <CSSStyleDeclaration>(<any>tmp.node).style;
                            style.cursor = cellOverlay.cursor;
                        }

                        dict.put(cellOverlay, tmp);
                    } else {
                        dict.put(cellOverlay, shape);
                    }
                }
            }

            // Removes unused
            if (state.overlays != null) {
                state.overlays.visit((sh) => {
                    sh.destroy();
                });
            }

            state.overlays = dict;
        }

        /**
         * Function: initializeOverlay
         * 
         * Initializes the given overlay.
         * 
         * Parameters:
         * 
         * state - <mxCellState> for which the overlay should be created.
         * overlay - <mxImageShape> that represents the overlay.
         */
        private initializeOverlay(state: CellState, overlay: ImageShape) {
            overlay.init(ElementInitializer(state.view.getOverlayPane()));
        }

        /**
         * Function: installOverlayListeners
         * 
         * Installs the listeners for the given <mxCellState>, <mxCellOverlay> and
         * <mxShape> that represents the overlay.
         */
        private installCellOverlayListeners(state: CellState, overlay: CellOverlay, shape: Shape) {
            var graph = state.view.graph;

            Events.addListener(shape.node, "click", (evt) => {
                if (graph.isEditing()) {
                    graph.stopEditing(!graph.isInvokesStopCellEditing());
                }

                overlay.onClick.fire(new ClickEvent(evt, state.cell));
            });

            Events.addGestureListeners(shape.node,
                evt => {Events.consume(evt);},
                evt => {graph.fireMouseEvent(Events.mouseMove, new MouseEventContext(evt, state));});

            if (Client.isTouch) {
                Events.addListener(shape.node, "touchend", evt => {
                    overlay.onClick.fire(new ClickEvent(evt, state.cell));
                });
            }
        }

        /**
         * Function: createControl
         * 
         * Creates the control for the given cell state.
         * 
         * Parameters:
         * 
         * state - <mxCellState> for which the control should be created.
         */
        private createControl(state: CellState) {
            var graph = state.view.graph;
            var image = graph.getFoldingImage(state);

            if (graph.foldingEnabled && image != null) {
                if (state.control == null) {
                    var b = new Rectangle(0, 0, image.width, image.height);
                    state.control = new ImageShape(b, image.src);
                    state.control.preserveImageAspect = false;
                    state.control.dialect = graph.dialect;

                    this.initControl(state, state.control, true, evt => {
                        if (graph.isEnabled()) {
                            var collapse = !graph.isCellCollapsed(state.cell);
                            graph.foldCells(collapse, false, [state.cell]);
                            Events.consume(evt);
                        }
                    });
                }
            } else if (state.control != null) {
                state.control.destroy();
                state.control = null;
            }
        }

        /**
         * Initializes the given control and returns the corresponding DOM node.
         * @param state for which the control should be initialized.
         * control - <mxShape> to be initialized.
         * handleEvents - Boolean indicating if mousedown and mousemove should fire events via the graph.
         * clickHandler - Optional function to implement clicks on the control.
         */
        private initControl(state: CellState, control: Shape, handleEvents: boolean, clickHandler: EventListener) {
            var graph = state.view.graph;

            // In the special case where the label is in HTML and the display is SVG the image
            // should go into the graph container directly in order to be clickable. Otherwise
            // it is obscured by the HTML label that overlaps the cell.
            var isForceHtml = graph.isHtmlLabel(state.cell) && Client.noFo && graph.dialect == Dialect.Svg;

            if (isForceHtml) {
                control.dialect = Dialect.PreferHtml;
                control.init(graph.container);
                Utils.nodeStyle(control.node).zIndex = "1";
            } else {
                control.init(ElementInitializer(state.view.getOverlayPane()));
            }

            var node = control.node;

            if (clickHandler) {
                if (graph.isEnabled()) {
                    Utils.nodeStyle(control.node).cursor = "pointer";
                }

                Events.addListener(node, "click", clickHandler);
            }

            if (handleEvents) {
                Events.addGestureListeners(node,
                    evt => {
                        graph.fireMouseEvent(Events.mouseDown, new MouseEventContext(evt, state));
                        Events.consume(evt);
                    },
                    evt => {
                        graph.fireMouseEvent(Events.mouseMove, new MouseEventContext(evt, state));
                    });
            }

            return node;
        }

        /**
         * Function: isShapeEvent
         * 
         * Returns true if the event is for the shape of the given state. This
         * implementation always returns true.
         * 
         * Parameters:
         * 
         * state - <mxCellState> whose shape fired the event.
         * evt - Mouse event which was fired.
         */
        private(state: CellState, evt: MouseEvent) {
            return true;
        }

        /**
         * Returns true if the event is for the label of the given state. This implementation always returns true.
         * state - <mxCellState> whose label fired the event.
         * evt - Mouse event which was fired.
         */
        private isLabelEvent(state: CellState, evt: MouseEvent) {
                    return true;
        }

        /**
         * Returns true if the event is for the shape of the given state. This implementation always returns true.
         * state - <mxCellState> whose shape fired the event.
         * evt - Mouse event which was fired.
         */
        private isShapeEvent(state: CellState, evt: MouseEvent) {
            return true;
        }

        /**
         * Installs the event listeners for the given cell state.
         * state - <mxCellState> for which the event listeners should be isntalled.
         */
        private installListeners(state: CellState) {
            var graph = state.view.graph;

            // Workaround for touch devices routing all events for a mouse
            // gesture (down, move, up) via the initial DOM node. Same for
            // HTML images in all IE versions (VML images are working).
            var getState = evt => {
                var result = state;

                if ((graph.dialect !== Dialect.Svg && (Events.getSource(evt) as Node).nodeName === "IMG") || Client.isTouch) {
                    var x = Events.getClientX(evt);
                    var y = Events.getClientY(evt);

                    // Dispatches the drop event to the graph which
                    // consumes and executes the source function
                    var pt = graph.container.convertPoint(x, y);
                    result = graph.view.getState(graph.getCellAt(pt.x, pt.y));
                }

                return result;
            };

            Events.addGestureListeners(state.shape.node,
                Utils.bind(this, (evt) =>  {
                    if (this.isShapeEvent(state, evt)) {
                        // Redirects events from the "event-transparent" region of a
                        // swimlane to the graph. This is only required in HTML, SVG
                        // and VML do not fire mouse events on transparent backgrounds.
                        graph.fireMouseEvent(Events.mouseDown,
                            new MouseEventContext(evt, (state.shape != null && Events.getSource(evt) == state.shape.node) ? null : state));
                    }
                }),
                Utils.bind(this, (evt) =>  {
                    if (this.isShapeEvent(state, evt)) {
                        graph.fireMouseEvent(Events.mouseMove,
                            new MouseEventContext(evt, (state.shape != null && Events.getSource(evt) == state.shape.node) ? null : getState(evt)));
                    }
                }),
                Utils.bind(this, (evt) => {
                    if (this.isShapeEvent(state, evt)) {
                        graph.fireMouseEvent(Events.mouseUp, 
                            new MouseEventContext(evt, (state.shape != null && Events.getSource(evt) == state.shape.node) ? null : getState(evt)));
                    }
                })
            );

            // Uses double click timeout in mxGraph for quirks mode
            if (graph.nativeDblClickEnabled) {
                Events.addListener(state.shape.node, "dblclick",
                    Utils.bind(this, evt => {
                        if (this.isShapeEvent(state, <MouseEvent>evt)) {
                            graph.dblClick(<MouseEvent>evt, state.cell);
                            Events.consume(evt);
                        }
                    })
                );
            }
        }

        /**
         * Function: redrawLabel
         * 
         * Redraws the label for the given cell state.
         * 
         * Parameters:
         * 
         * state - <mxCellState> whose label should be redrawn.
         */
        private redrawLabel(state: CellState, forced: boolean) {
            var value = this.getLabelValue(state);

            if (state.text == null && value != null && (/*Utils.isNode(value) ||*/ value.length > 0)) {
                this.createLabel(state, value);
            } else if (state.text != null && (value == null || value.length == 0)) {
                state.text.destroy();
                state.text = null;
            }

            if (state.text != null) {
                var graph = state.view.graph;
                var wrapping = graph.isWrapping(state.cell);
                var clipping = graph.isLabelClipped(state.cell);
                var bounds = this.getLabelBounds(state);

                var isForceHtml = (state.view.graph.isHtmlLabel(state.cell) || (value != null && Utils.isNode(value)));
                var dialect = (isForceHtml) ? Dialect.StrictHtml : state.view.graph.dialect;

                // Text is a special case where change of dialect is possible at runtime
                if (forced || state.text.value != value || state.text.isWrapping != wrapping ||
                    state.text.isClipping != clipping || state.text.scale != state.view.scale ||
                    state.text.dialect != dialect || !state.text.bounds.equals(bounds)) {
                    state.text.dialect = dialect;
                    state.text.value = value;
                    state.text.bounds = bounds;
                    state.text.scale = this.getTextScale(state);
                    state.text.isWrapping = wrapping;
                    state.text.isClipping = clipping;

                    state.text.redraw();
                }
            }
        }

        /**
         * Function: getTextScale
         * 
         * Returns the scaling used for the label of the given state
         * 
         * Parameters:
         * 
         * state - <mxCellState> whose label scale should be returned.
         */
        private getTextScale(state: CellState): number {
            return state.view.scale;
        }

        /**
         * Function: getLabelBounds
         * 
         * Returns the bounds to be used to draw the label of the given state.
         * 
         * Parameters:
         * 
         * state - <mxCellState> whose label bounds should be returned.
         */
        private getLabelBounds(state: CellState): Rectangle {
            var graph = state.view.graph;
            var scale = state.view.scale;
            var isEdge = Cells.isEdge(state.cell);
            var bounds = new Rectangle(state.absoluteOffset.x, state.absoluteOffset.y);
            var tmp: number;
            if (isEdge) {
                var spacing = state.text.getSpacing();
                bounds.x += spacing.x * scale;
                bounds.y += spacing.y * scale;

                var geo = graph.getCellGeometry(state.cell);

                if (geo != null) {
                    bounds.width = Math.max(0, geo.width * scale);
                    bounds.height = Math.max(0, geo.height * scale);
                }
            } else {
                // Inverts label position
                if (state.text.isPaintBoundsInverted()) {
                    tmp = bounds.x;
                    bounds.x = bounds.y;
                    bounds.y = tmp;
                }

                bounds.x += state.x;
                bounds.y += state.y;

                // Minimum of 1 fixes alignment bug in HTML labels
                bounds.width = Math.max(1, state.width);
                bounds.height = Math.max(1, state.height);
            }

            if (state.text.isPaintBoundsInverted()) {
                // Rotates around center of state
                var t = (state.width - state.height) / 2;
                bounds.x += t;
                bounds.y -= t;
                tmp = bounds.width;
                bounds.width = bounds.height;
                bounds.height = tmp;
            }

            // Shape can modify its label bounds
            if (state.shape != null) {
                bounds = state.shape.getLabelBounds(bounds);
            }

            // Label width style overrides actual label width
            var lw = state.style.labelWidth;

            if (lw != null) {
                bounds.width = lw * scale;
            }

            if (!isEdge) {
                this.rotateLabelBounds(state, bounds);
            }

            return bounds;
        }

        /**
         * Adds the shape rotation to the given label bounds and applies the alignment and offsets.
         * state - <mxCellState> whose label bounds should be rotated.
         * bounds - <Rectangle> the rectangle to be rotated.
         */
        private rotateLabelBounds(state: CellState, bounds: Rectangle) {
            bounds.x -= state.text.margin.x * bounds.width;
			if (state.text.margin.y == -0.5) {
				bounds.y -= state.text.margin.y * bounds.height;
				bounds.height += state.text.margin.y * bounds.height;
			}
			else
				bounds.y -= state.text.margin.y * bounds.height;
			
            if (state.style.overflow != Overflow.fill && state.style.overflow != Overflow.width)
			{
                var s = state.view.scale;
                var spacing = state.text.getSpacing();
                bounds.x += spacing.x * s;
                bounds.y += spacing.y * s;

                var hpos = state.style.labelPosition || HorizontalAlign.Center;
                var vpos = state.style.verticalLabelPosition || VerticalAlign.Middle;
                var lw = state.style.labelWidth;

                bounds.width = Math.max(0, bounds.width - ((hpos == HorizontalAlign.Center && lw == null) ? (state.text.spacingLeft * s + state.text.spacingRight * s) : 0));
                bounds.height = Math.max(0, bounds.height - ((vpos == VerticalAlign.Middle) ? (state.text.spacingTop * s + state.text.spacingBottom * s) : 0));
            }

            var theta = state.text.getTextRotation();

            // Only needed if rotated around another center
            if (theta != 0 && Cells.isVertex(state.cell)) {
                var cx = state.getCenterX();
                var cy = state.getCenterY();

                if (bounds.x != cx || bounds.y != cy) {
                    var rad = theta * (Math.PI / 180);
                    var pt = Utils.getRotatedPoint(new Point(bounds.x, bounds.y), Math.cos(rad), Math.sin(rad), new Point(cx, cy));

                    bounds.x = pt.x;
                    bounds.y = pt.y;
                }
            }
        }

        /**
         * Redraws the overlays for the given cell state.
         * state - <mxCellState> whose overlays should be redrawn.
         */
        private redrawCellOverlays(state: CellState, forced: boolean) {
            this.createCellOverlays(state);

            if (state.overlays != null) {
                var rot = Utils.mod(state.style.rotation || 0, 90);
                var rad = Utils.toRadians(rot);
                var cos = Math.cos(rad);
                var sin = Math.sin(rad);

                state.overlays.visit(shape => {
                    var bounds = shape.overlay.getBounds(state);

                    if (!Cells.isEdge(state.cell)) {
                        if (state.shape != null && rot != 0) {
                            var cx = bounds.getCenterX();
                            var cy = bounds.getCenterY();

                            var point = Utils.getRotatedPoint(new Point(cx, cy), cos, sin,
                                new Point(state.getCenterX(), state.getCenterY()));

                            cx = point.x;
                            cy = point.y;
                            bounds.x = Math.round(cx - bounds.width / 2);
                            bounds.y = Math.round(cy - bounds.height / 2);
                        }
                    }

                    if (forced || shape.bounds == null || shape.scale != state.view.scale ||
                        !shape.bounds.equals(bounds)) {
                        shape.bounds = bounds;
                        shape.scale = state.view.scale;
                        shape.redraw();
                    }
                });
            }
        }

        /**
         * Redraws the control for the given cell state.
         * state - <mxCellState> whose control should be redrawn.
         */
        private redrawControl(state: CellState, forced: boolean) {
            var image = state.view.graph.getFoldingImage(state);

            if (state.control != null && image != null) {
                var bounds = this.getControlBounds(state, image.width, image.height);
                var r = (this.legacyControlPosition) ?
                    state.style.rotation || 0 :
                    state.shape.getTextRotation();
                var s = state.view.scale;

                if (forced || state.control.scale != s || !state.control.bounds.equals(bounds) ||
                    state.control.rotation != r) {
                    state.control.rotation = r;
                    state.control.bounds = bounds;
                    state.control.scale = s;

                    state.control.redraw();
                }
            }
        }

        /**
         * Returns the bounds to be used to draw the control (folding icon) of the given state.
         */
        private getControlBounds(state: CellState, w: number, h: number) {
            if (state.control != null) {
                var s = state.view.scale;
                var cx = state.getCenterX();
                var cy = state.getCenterY();

                if (!Cells.isEdge(state.cell)) {
                    cx = state.x + w * s;
                    cy = state.y + h * s;

                    if (state.shape != null) {
                        // TODO: Factor out common code
                        var rot = state.shape.getShapeRotation();

                        if (this.legacyControlPosition) {
                            rot = state.style.rotation || 0;
                        } else {
                            if (state.shape.isPaintBoundsInverted()) {
                                var t = (state.width - state.height) / 2;
                                cx += t;
                                cy -= t;
                            }
                        }

                        if (rot != 0) {
                            var rad = Utils.toRadians(rot);
                            var cos = Math.cos(rad);
                            var sin = Math.sin(rad);

                            var point = Utils.getRotatedPoint(new Point(cx, cy), cos, sin,
                                new Point(state.getCenterX(), state.getCenterY()));
                            cx = point.x;
                            cy = point.y;
                        }
                    }
                }

                return (Cells.isEdge(state.cell)) ?
                    new Rectangle(Math.round(cx - w / 2 * s), Math.round(cy - h / 2 * s), Math.round(w * s), Math.round(h * s))
                    : new Rectangle(Math.round(cx - w / 2 * s), Math.round(cy - h / 2 * s), Math.round(w * s), Math.round(h * s));
            }

            return null;
        }

        /**
         * Function: insertStateAfter
         * 
         * Inserts the given array of <mxShapes> after the given nodes in the DOM.
         * 
         * Parameters:
         * 
         * shapes - Array of <mxShapes> to be inserted.
         * node - Node in <drawPane> after which the shapes should be inserted.
         * htmlNode - Node in the graph container after which the shapes should be inserted that
         * will not go into the <drawPane> (eg. HTML labels without foreignObjects).
         */
        insertStateAfter(state: CellState, node: Node, htmlNode: Node) {
            var shapes = this.getShapesForState(state);

            for (var i = 0; i < shapes.length; i++) {
                if (shapes[i] != null) {
                    var html = shapes[i].node.parentNode != state.view.getDrawPane();
                    var temp = (html) ? htmlNode : node;

                    if (temp != null && temp.nextSibling != shapes[i].node) {
                        if (temp.nextSibling == null) {
                            temp.parentNode.appendChild(shapes[i].node);
                        } else {
                            temp.parentNode.insertBefore(shapes[i].node, temp.nextSibling);
                        }
                    } else if (temp == null) {
                        // Special case: First HTML node should be first sibling after canvas container
                        if (state.view.graph.container.is(shapes[i].node.parentNode)) {
                            var canvas = state.view.canvas;

                            while (canvas.parentNode != null && state.view.graph.container.is(canvas.parentNode)) {
                                canvas = <Element>(canvas.parentNode);
                            }

                            if (canvas.nextSibling != null && canvas.nextSibling != shapes[i].node) {
                                shapes[i].node.parentNode.insertBefore(shapes[i].node, canvas.nextSibling);
                            }
                        } else if (shapes[i].node.parentNode.firstChild != null && shapes[i].node.parentNode.firstChild != shapes[i].node) {
                            // Inserts the node as the first child of the parent to implement the order
                            shapes[i].node.parentNode.insertBefore(shapes[i].node, shapes[i].node.parentNode.firstChild);
                        }
                    }

                    if (html) {
                        htmlNode = shapes[i].node;
                    } else {
                        node = shapes[i].node;
                    }
                }
            }

            return [node, htmlNode];
        }

        /**
         * Returns the <mxShapes> for the given cell state in the order in which they should appear in the DOM.
         * state - <mxCellState> whose shapes should be returned.
         */
        private getShapesForState(state: CellState) {
            return [state.shape, state.text];
        }

        /**
         * Redraws the label for the given cell state.
         * state - <mxCellState> whose label should be redrawn.
         */
        private redrawShape(state: CellState, force: boolean, rendering: boolean) {
            var shapeChanged = false;

            if (state.shape != null) {
                // Lazy initialization
                if (state.shape.node == null) {
                    this.createIndicatorShape(state);
                    this.initializeShape(state);
                    this.createCellOverlays(state);
                    this.installListeners(state);
                }

                // Handles changes of the collapse icon
                this.createControl(state);

                if (!Utils.equalEntries(state.shape.style, state.style)) {
                    this.configureShape(state);
                    force = true;
                }

                // Redraws the cell if required, ignores changes to bounds if points are
                // defined as the bounds are updated for the given points inside the shape
                if (force || state.shape.bounds == null || state.shape.scale != state.view.scale ||
                (state.absolutePoints == null && !state.shape.bounds.equals(state)) ||
                (state.absolutePoints != null && !Utils.equalPoints(state.shape.points, state.absolutePoints))) {
                    if (state.absolutePoints != null) {
                        state.shape.points = state.absolutePoints.slice();
                        state.shape.bounds = null;
                    } else {
                        state.shape.points = null;
                        state.shape.bounds = new Rectangle(state.x, state.y, state.width, state.height);
                    }

                    state.shape.scale = state.view.scale;

                    if (rendering == null || rendering) {
                        state.shape.redraw();
                    } else {
                        state.shape.updateBoundingBox();
                    }

                    shapeChanged = true;
                }
            }

            return shapeChanged;
        }

        /**
         * Function: destroy
         * 
         * Destroys the shapes associated with the given cell state.
         * 
         * Parameters:
         * 
         * state - <mxCellState> for which the shapes should be destroyed.
         */
        destroy(state: CellState) {
            if (state.shape != null) {
                if (state.text != null) {
                    state.text.destroy();
                    state.text = null;
                }

                if (state.overlays != null) {
                    state.overlays.visit((shape) => {
                        shape.destroy();
                    });

                    state.overlays = null;
                }

                if (state.control != null) {
                    state.control.destroy();
                    state.control = null;
                }

                state.shape.destroy();
                state.shape = null;
            }
        }

        /**
         * Function: redraw
         * 
         * Updates the bounds or points and scale of the shapes for the given cell
         * state. This is called in mxGraphView.validatePoints as the last step of
         * updating all cells.
         * 
         * Parameters:
         * 
         * state - <mxCellState> for which the shapes should be updated.
         * force - Optional boolean that specifies if the cell should be reconfiured
         * and redrawn without any additional checks.
         * rendering - Optional boolean that specifies if the cell should actually
         * be drawn into the DOM. If this is false then redraw and/or reconfigure
         * will not be called on the shape.
         */
        redraw(state: CellState, force?: boolean, rendering?: boolean) {
            var shapeChanged = this.redrawShape(state, force, rendering);

            if (state.shape != null && (rendering == null || rendering)) {
                this.redrawLabel(state, shapeChanged);
                this.redrawCellOverlays(state, shapeChanged);
                this.redrawControl(state, shapeChanged);
            }
        }
    }

    CellRenderer.registerDefaultShapes();
}