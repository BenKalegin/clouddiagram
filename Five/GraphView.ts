﻿module Five {
    
    export class ViewRootChangeEvent extends BasicEvent {
        constructor(public root: Cell, public previous: Cell, public isUp: boolean) { super() }
    }

    /** This class is in charge of computing the absolute coordinates for the relative child geometries, 
     * the points for perimeters and edge styles and keeping them cached in CellStates for faster retrieval. 
     * The states are updated whenever the model or the view state (translate, scale) changes. The scaleand translate are honoured in the bounds. */
    export class GraphView {
        graph: Graph;

        private static emptyPoint = new Point(0, 0);

        // Specifies the resource key for the status message after a long operation.If the resource for this key does not exist 
        // then the value is used as the status message. Default is 'done'.
        private doneResource = (Client.language != "none") ? "done" : "";

        // Specifies the resource key for the status message while the document is
        // being updated. If the resource for this key does not exist then the
        // value is used as the status message. Default is 'updatingDocument'.
        private updatingDocumentResource = (Client.language != "none") ? "updatingDocument" : "";

        // Specifies if string values in cell styles should be evaluated using Utils.eval. 
        // This will only be used if the string values can't be mapped to objects using <mxStyleRegistry>. Default is false. 
        // NOTE: Enabling this switch carries a possible security risk (see the section on security in the manual).
        private allowEval = false;

        // Specifies if a gesture should be captured when it goes outside of the graph container. Default is true.
        private captureDocumentGesture = true;

        // Specifies if the <canvas> should be hidden while rendering in IE8 standards mode and quirks mode. 
        // This will significantly improve rendering performance.
        private optimizeVmlReflows = true;

        // Specifies if shapes should be created, updated and destroyed using the methods of <mxCellRenderer> in <graph>. Default is true.
        private rendering = true;

        // Cell that acts as the root of the displayed cell hierarchy.
        currentRoot: Cell = null;

        // Specifies the scale. Default is 1 (100%).
        private _scale = 1;

        public onUndo = new EventListeners<UndoEvent>();
        public onScaleAndTranslate = new EventListeners<ScaleAndTranslateEvent>();
        public onScale = new EventListeners<ScaleEvent>();
        public onTranslate = new EventListeners<TranslateEvent>();
        public onRootChange = new EventListeners<ViewRootChangeEvent>();

        get scale(): number {
            return this._scale;
        }

        set scale(value: number) {
            this._scale = value;
        }

        // Point that specifies the current translation. 
        private _translate: Point = null;

        get translate(): Point {
            return this._translate;
        }

        set translate(value: Point) {
            this._translate = value;
        }

        private _isEventsEnabled = true;

        public get isEventsEnabled(): boolean {return this._isEventsEnabled}
        public set isEventsEnabled(value: boolean) {this._isEventsEnabled = value}

        // Specifies if the style should be updated in each validation step. If this is false then the style is only updated 
        // if the state is created or if the style of the cell was changed. Default is false.
        private updateStyle = false;

        // During validation, this contains the last DOM node that was processed.
        private lastNode: Node = null;

        // During validation, this contains the last HTML DOM node that was processed.
        private lastHtmlNode: Node = null;

        // During validation, this contains the last edge's DOM node that was processed.
        private lastForegroundNode: Node = null;

        // During validation, this contains the last edge HTML DOM node that was processed.
        private lastForegroundHtmlNode: Node = null;

        private graphBounds: Rectangle = null;

        private backgroundPageShape: RectangleShape;

        // Rectangle that caches the scales, translated bounds of the current view.
        public getGraphBounds(): Rectangle { return this.graphBounds; }

        setGraphBounds(value: Rectangle) {
             this.graphBounds = value;
        }

        private states: Dictionary<Cell, CellState>;
        canvas: Element;
        textDiv: HTMLDivElement;
        private backgroundImage: ImageShape;
        backgroundPane: Element;
        drawPane: Element;
        overlayPane: Element;
        decoratorPane: Element;
        moveHandler: (evt: MouseEvent) => void;
        endHandler: (evt: MouseEvent) => void;

        constructor(graph: Graph) {
            this.graph = graph;
            this.translate = new Point(0, 0);
            this.graphBounds = new Rectangle(null, null, null, null);
            this.states = new Dictionary<Cell, CellState>();
        }

        getState(cell: Cell, create: boolean = false): CellState {
            /// <summary>Returns the CellState for the given cell. If create is true, then the state is created if it does not yet exist.</summary>
            /// <param name="cell">Cell for which the CellState should be returned.</param>
            /// <param name="create">Optional boolean indicating if a new state should be created if it does not yet exist. Default is false.</param>
            var state: CellState = null;

            if (cell != null) {
                state = this.states.get(cell);

                if (create && (state == null || this.updateStyle) && this.graph.isCellVisible(cell)) {
                    if (state == null) {
                        state = this.createState(cell);
                        this.states.put(cell, state);
                    } else {
                        state.style = this.graph.getCellStyle(cell);
                    }
                }
            }

            return state;
        }


        getBounds(cells: Cell[]): Rectangle {
            /// <summary>Returns the bounds (on the screen) for the given array of Cells.</summary>
            /// <param name="cells" type="">Array of cells to return the bounds for.</param>
            /// <returns type="Object"></returns>
            var result: Rectangle = null;

            if (cells != null && cells.length > 0) {
                var model = this.graph.getModel();

                for (var i = 0; i < cells.length; i++) {
                    if (model.isVertex(cells[i]) || model.isEdge(cells[i])) {
                        var state = this.getState(cells[i]);

                        if (state != null) {
                            if (result == null) {
                                result = new Rectangle(state.x, state.y, state.width, state.height);
                            } else {
                                result.add(state);
                            }
                        }
                    }
                }
            }

            return result;
        }

        setCurrentRoot(root: Cell): Cell {
            /// <summary>Sets and returns the current root and fires an undo event before calling Graph.sizeDidChange</summary>
            /// <param name="root" type="">Cell that specifies the root of the displayed cell hierarchy.</param>
            /// <returns type=""></returns>
            if (this.currentRoot != root) {
                var change = new CurrentRootChange(this, root);
                change.execute();
                var edit = new UndoableEdit(this, false);
                edit.add(change);
                this.onUndo.fire(new UndoEvent(edit));
                this.graph.sizeDidChange();
            }

            return root;
        }

        scaleAndTranslate(scale: number, dx: number, dy: number) {
            /// <summary>Sets the scale and translation and fires a scale and translate event before calling revalidate followed by xGraph.sizeDidChange>.</summary>
            /// <param name="scale" type="">Decimal value that specifies the new scale (1 is 100%)</param>
            /// <param name="dx" type="Object">X-coordinate of the translation</param>
            /// <param name="dy" type="Object">Y-coordinate of the translation</param>
            var previousScale = this.scale;
            var previousTranslate = new Point(this.translate.x, this.translate.y);

            if (this.scale != scale || this.translate.x != dx || this.translate.y != dy) {
                this.scale = scale;

                this.translate.x = dx;
                this.translate.y = dy;

                if (this.isEventsEnabled) {
                    this.revalidate();
                    this.graph.sizeDidChange();
                }
            }

            this.onScaleAndTranslate.fire(new ScaleAndTranslateEvent(scale, previousScale, this.translate, previousTranslate));
        }

        getScale() {
            return this.scale;
        }

        setScale(value: number): void {
            /// <summary>Sets the scale and fires a scale event before calling revalidate followed by Graph.sizeDidChange.</summary>
            /// <param name="value" type="">Decimal value that specifies the new scale (1 is 100%).</param>
            var previousScale = this.scale;

            if (this.scale != value) {
                this.scale = value;

                if (this.isEventsEnabled) {
                    this.revalidate();
                    this.graph.sizeDidChange();
                }
            }

            this.onScale.fire(new ScaleEvent(value, previousScale));
        }

        getTranslate() {
            return this.translate;
        }

        setTranslate(dx, dy) {
            /// <summary>Sets the translation and fires a translate event before calling revalidate followed by Graph.sizeDidChange. The translation is the negative of the origin.</summary>
            /// <param name="dx">X-coordinate of the translation</param>
            /// <param name="dy">Y-coordinate of the translation</param>
            var previousTranslate = new Point(this.translate.x, this.translate.y);

            if (this.translate.x != dx || this.translate.y != dy) {
                this.translate.x = dx;
                this.translate.y = dy;

                if (this.isEventsEnabled) {
                    this.revalidate();
                    this.graph.sizeDidChange();
                }
            }

            this.onTranslate.fire(new TranslateEvent(this.translate, previousTranslate));
        }

        /** Clears the view if <currentRoot> is not null and revalidates. */
        refresh(): void {
            if (this.currentRoot != null) {
                this.clear();
            }

            this.revalidate();
        }

        revalidate() {
            /// <summary>Revalidates the complete view with all cell states.</summary>
            this.invalidate();
            this.validate();
        }

        clear(cell?: Cell, force?: boolean, recurse?: boolean) {
            /// <summary>Removes the state of the given cell and all descendants if the given cell is not the current root.</summary>
            /// <param name="cell">Optional Cell for which the state should be removed. Default is the root of the model.</param>
            /// <param name="force"></param>
            /// <param name="recurse">Boolean indicating if the current root should be ignored for recursion.</param>
            var model = this.graph.getModel();
            cell = cell || model.getRoot();
            force = (force != null) ? force : false;
            recurse = (recurse != null) ? recurse : true;

            this.removeState(cell);

            if (recurse && (force || cell != this.currentRoot)) {
                var childCount = model.getChildCount(cell);

                for (var i = 0; i < childCount; i++) {
                    this.clear(model.getChildAt(cell, i), force);
                }
            } else {
                this.invalidate(cell);
            }
        }

        invalidate(cell?: Cell, recurse?: boolean, includeEdges?: boolean) {
            /// <summary>Invalidates the state of the given cell, all its descendants and connected edges.</summary>
            /// <param name="cell" type="">Optional cell to be invalidated. Default is the root of the model</param>
            /// <param name="recurse" type="Object"></param>
            /// <param name="includeEdges" type="Object"></param>
            var model = this.graph.getModel();
            cell = cell || model.getRoot();
            recurse = (recurse != null) ? recurse : true;
            includeEdges = (includeEdges != null) ? includeEdges : true;

            var state = this.getState(cell);

            if (state != null) {
                state.invalid = true;
            }

            // Avoids infinite loops for invalid graphs
            if (!cell.invalidating) {
                cell.invalidating = true;

                // Recursively invalidates all descendants
                if (recurse) {
                    var childCount = model.getChildCount(cell);

                    for (var i = 0; i < childCount; i++) {
                        var child = model.getChildAt(cell, i);
                        this.invalidate(child, recurse, includeEdges);
                    }
                }

                // Propagates invalidation to all connected edges
                if (includeEdges) {
                    var edgeCount = model.getEdgeCount(cell);

                    for (var j = 0; j < edgeCount; j++) {
                        this.invalidate(model.getEdgeAt(cell, j), recurse, includeEdges);
                    }
                }

                delete cell.invalidating;
            }
        }

        /**
         * Function: validate
         * 
         * 
         * 
         * Parameters:
         * 
         * cell - .
         * Default is <currentRoot> or the root of the model.
         */
        validate(cell?: Cell) {
            /// <summary>Calls validateCell and validateCellState and updates the graphBounds using getBoundingBox. 
            /// Finally the background is validated using validateBackground.</summary>
            /// <param name="cell">Optional Cell to be used as the root of the validation</param>
            window.status = Resources.get(this.updatingDocumentResource) || this.updatingDocumentResource;

            this.resetValidationState();

            var graphBounds = this.getBoundingBox(
                this.validateCellState(
                    this.validateCell(cell || ((this.currentRoot != null) ? this.currentRoot : this.graph.getModel().getRoot()))));
            this.setGraphBounds((graphBounds != null) ? graphBounds : this.getEmptyBounds());
            this.validateBackground();

            this.resetValidationState();

            window.status = Resources.get(this.doneResource) || this.doneResource;
        }

        getEmptyBounds(): Rectangle {
            /// <summary>Returns the bounds for an empty graph. This returns a rectangle at translate with the size of 0 x 0.</summary>
            /// <returns type="Rectangle"></returns>
            return new Rectangle(this.translate.x * this.scale, this.translate.y * this.scale);
        }

        getBoundingBox(state: CellState, recurse: boolean = true) : Rectangle{
            /// <summary>Returns the bounding box of the shape and the label for the given CellState and its children if recurse is true.</summary>
            /// <param name="state">CellState whose bounding box should be returned.</param>
            /// <param name="recurse">Optional boolean indicating if the children should be included</param>
            var bbox: Rectangle = null;

            if (state != null) {
                if (state.shape != null && state.shape.boundingBox != null) {
                    bbox = Utils.clone(state.shape.boundingBox);
                }

                // Adds label bounding box to graph bounds
                if (state.text != null && state.text.boundingBox != null) {
                    if (bbox != null) {
                        bbox.add(state.text.boundingBox);
                    } else {
                        bbox = state.text.boundingBox.clone();
                    }
                }

                if (recurse) {
                    var model = this.graph.getModel();
                    var childCount = model.getChildCount(state.cell);

                    for (var i = 0; i < childCount; i++) {
                        var bounds = this.getBoundingBox(this.getState(model.getChildAt(state.cell, i)));

                        if (bounds != null) {
                            if (bbox == null) {
                                bbox = bounds;
                            } else {
                                bbox.add(bounds);
                            }
                        }
                    }
                }
            }

            return bbox;
        }

        createBackgroundPageShape(bounds: Rectangle): RectangleShape {
            /// <summary>Creates and returns the shape used as the background page.</summary>
            return new RectangleShape(bounds, "white", "black");
        }

        /**
         * Function: validateBackground
         *
         * Calls <validateBackgroundImage> and <validateBackgroundPage>.
         */
        validateBackground() {
            this.validateBackgroundImage();
            this.validateBackgroundPage();
        }

        /**
         * Function: validateBackgroundImage
         * 
         * Validates the background image.
         */
        validateBackgroundImage() {
            var bg = this.graph.getBackgroundImage();

            if (bg != null) {
                if (this.backgroundImage == null || this.backgroundImage.image !== bg.src) {
                    if (this.backgroundImage != null) {
                        this.backgroundImage.destroy();
                    }

                    var bounds = new Rectangle(0, 0, 1, 1);

                    this.backgroundImage = new ImageShape(bounds, bg.src);
                    this.backgroundImage.dialect = this.graph.dialect;
                    this.backgroundImage.init(this.backgroundPane);
                    this.backgroundImage.redraw();
                }

                this.redrawBackgroundImage(this.backgroundImage, bg);
            } else if (this.backgroundImage != null) {
                this.backgroundImage.destroy();
                this.backgroundImage = null;
            }
        }

        /**
         * Function: validateBackgroundPage
         * 
         * Validates the background page.
         */
        validateBackgroundPage() {
            if (this.graph.pageVisible) {
                var bounds = this.getBackgroundPageBounds();

                if (this.backgroundPageShape == null) {
                    this.backgroundPageShape = this.createBackgroundPageShape(bounds);
                    this.backgroundPageShape.scale = this.scale;
                    this.backgroundPageShape.isShadow = true;
                    this.backgroundPageShape.dialect = this.graph.dialect;
                    this.backgroundPageShape.init(this.backgroundPane);
                    this.backgroundPageShape.redraw();

                    // Adds listener for double click handling on background
                    if (this.graph.nativeDblClickEnabled) {
                        Events.addListener(this.backgroundPageShape.node, "dblclick", Utils.bind(this, (evt) => { this.graph.dblClick(evt); }));
                    }

                    // Adds basic listeners for graph event dispatching outside of the
                    // container and finishing the handling of a single gesture
                    Events.addGestureListeners(this.backgroundPageShape.node,
                        // startListener
                        Utils.bind(this, (evt: MouseEvent) => { this.graph.fireMouseEvent(Events.mouseDown, new MouseEventContext(evt)); }),
                        // moveListener
                        Utils.bind(this, (evt: MouseEvent) => {
                            // Hides the tooltip if mouse is outside container
                            if (this.graph.tooltipHandler != null && this.graph.tooltipHandler.isHideOnHover()) {
                                this.graph.tooltipHandler.hide();
                            }

                            if (this.graph.isMouseDown && !Events.isConsumed(evt)) {
                                this.graph.fireMouseEvent(Events.mouseMove, new MouseEventContext(evt));
                            }
                        }),
                        Utils.bind(this, (evt: MouseEvent) => {
                            this.graph.fireMouseEvent(Events.mouseUp, new MouseEventContext(evt));
                        })
                    );
                } else {
                    this.backgroundPageShape.scale = this.scale;
                    this.backgroundPageShape.bounds = bounds;
                    this.backgroundPageShape.redraw();
                }
            } else if (this.backgroundPageShape != null) {
                this.backgroundPageShape.destroy();
                this.backgroundPageShape = null;
            }
        }

        /**
         * Function: getBackgroundPageBounds
         * 
         * Returns the bounds for the background page.
         */
        getBackgroundPageBounds(): Rectangle {
            var fmt = this.graph.pageFormat;
            var ps = this.scale * this.graph.pageScale;
            var bounds = new Rectangle(this.scale * this.translate.x, this.scale * this.translate.y, fmt.width * ps, fmt.height * ps);

            return bounds;
        }

        /**
         * Function: redrawBackgroundImage
         *
         * Updates the bounds and redraws the background image.
         * 
         * Example:
         * 
         * If the background image should not be scaled, this can be replaced with
         * the following.
         * 
         * (code)
         * mxGraphView.prototype.redrawBackground = function(backgroundImage, bg)
         * {
         *   backgroundImage.bounds.x = this.translate.x;
         *   backgroundImage.bounds.y = this.translate.y;
         *   backgroundImage.bounds.width = bg.width;
         *   backgroundImage.bounds.height = bg.height;
         *
         *   backgroundImage.redraw();
         * };
         * (end)
         * 
         * Parameters:
         * 
         * backgroundImage - <mxImageShape> that represents the background image.
         * bg - <mxImage> that specifies the image and its dimensions.
         */
        redrawBackgroundImage(backgroundImage: ImageShape, bg: Image) {
            backgroundImage.scale = this.scale;
            backgroundImage.bounds.x = this.scale * this.translate.x;
            backgroundImage.bounds.y = this.scale * this.translate.y;
            backgroundImage.bounds.width = this.scale * bg.width;
            backgroundImage.bounds.height = this.scale * bg.height;

            backgroundImage.redraw();
        }

        /**
         * Function: validateCell
         * 
         * Recursively creates the cell state for the given cell if visible is true and
         * the given cell is visible. If the cell is not visible but the state exists
         * then it is removed using <removeState>.
         * 
         * Parameters:
         * 
         * cell - <mxCell> whose <mxCellState> should be created.
         * visible - Optional boolean indicating if the cell should be visible. Default
         * is true.
         */
        validateCell(cell: Cell, visible: boolean = true) {
            if (cell != null) {
                visible = visible && this.graph.isCellVisible(cell);
                var state = this.getState(cell, visible);

                if (state != null && !visible) {
                    this.removeState(cell);
                } else {
                    var model = this.graph.getModel();
                    var childCount = model.getChildCount(cell);

                    for (var i = 0; i < childCount; i++) {
                        this.validateCell(model.getChildAt(cell, i), visible &&
                        (!this.isCellCollapsed(cell) || cell == this.currentRoot));
                    }
                }
            }

            return cell;
        }

        /**
         * Function: validateCellStates
         * 
         * Validates and repaints the <mxCellState> for the given <mxCell>.
         * 
         * Parameters:
         * 
         * cell - <mxCell> whose <mxCellState> should be validated.
         * recurse - Optional boolean indicating if the children of the cell should be
         * validated. Default is true.
         */
        validateCellState(cell: Cell, recurse: boolean = true): CellState {
            var state: CellState = null;

            if (cell != null) {
                state = this.getState(cell);

                if (state != null) {
                    var model = this.graph.getModel();

                    if (state.invalid) {
                        state.invalid = false;

                        if (cell != this.currentRoot) {
                            this.validateCellState(model.getParent(cell), false);
                        }

                        state.setVisibleTerminalState(this.validateCellState(this.getVisibleTerminal(cell, true), false), true);
                        state.setVisibleTerminalState(this.validateCellState(this.getVisibleTerminal(cell, false), false), false);

                        this.updateCellState(state);

                        // Repaint happens immediately after the cell is validated
                        if (cell != this.currentRoot) {
                            this.graph.cellRenderer.redraw(state, false, this.isRendering());
                        }
                    }

                    if (recurse) {
                        state.updateCachedBounds();

                        // Updates order in DOM if recursively traversing
                        if (state.shape != null) {
                            this.stateValidated(state);
                        }

                        var childCount = model.getChildCount(cell);

                        for (var i = 0; i < childCount; i++) {
                            this.validateCellState(model.getChildAt(cell, i));
                        }
                    }
                }
            }

            return state;
        }

        updateCellState(state: CellState) {
            state.absoluteOffset.x = 0;
            state.absoluteOffset.y = 0;
            state.origin.x = 0;
            state.origin.y = 0;
            state.length = 0;

            if (state.cell != this.currentRoot) {
                var model = this.graph.getModel();
                var pState = this.getState(model.getParent(state.cell));

                if (pState != null && pState.cell != this.currentRoot) {
                    state.origin.x += pState.origin.x;
                    state.origin.y += pState.origin.y;
                }

                var offset = this.graph.getChildOffsetForCell(state.cell);

                if (offset != null) {
                    state.origin.x += offset.x;
                    state.origin.y += offset.y;
                }

                var geo = this.graph.getCellGeometry(state.cell);

                if (geo != null) {
                    if (!model.isEdge(state.cell)) {
                        offset = geo.offset || GraphView.emptyPoint;

                        if (geo.relative && pState != null) {
                            if (model.isEdge(pState.cell)) {
                                var origin = this.getPoint(pState, geo);

                                if (origin != null) {
                                    state.origin.x += (origin.x / this.scale) - pState.origin.x - this.translate.x;
                                    state.origin.y += (origin.y / this.scale) - pState.origin.y - this.translate.y;
                                }
                            } else {
                                state.origin.x += geo.x * pState.width / this.scale + offset.x;
                                state.origin.y += geo.y * pState.height / this.scale + offset.y;
                            }
                        } else {
                            state.absoluteOffset.x = this.scale * offset.x;
                            state.absoluteOffset.y = this.scale * offset.y;
                            state.origin.x += geo.x;
                            state.origin.y += geo.y;
                        }
                    }

                    state.x = this.scale * (this.translate.x + state.origin.x);
                    state.y = this.scale * (this.translate.y + state.origin.y);
                    state.width = this.scale * geo.width;
                    state.height = this.scale * geo.height;

                    if (model.isVertex(state.cell)) {
                        this.updateVertexState(state, geo);
                    }

                    if (model.isEdge(state.cell)) {
                        this.updateEdgeState(state, geo);
                    }
                }
            }
        }

        /**
         * Function: isCellCollapsed
         * 
         * Returns true if the children of the given cell should not be visible in the
         * view. This implementation uses <mxGraph.isCellVisible> but it can be
         * overidden to use a separate condition.
         */
        isCellCollapsed(cell: Cell): boolean {
            return this.graph.isCellCollapsed(cell);
        }

        /**
         * Function: updateVertexState
         * 
         * Validates the given cell state.
         */
        updateVertexState(state: CellState, geo: Geometry) {
            var model = this.graph.getModel();
            var pState = this.getState(model.getParent(state.cell));

            if (geo.relative && pState != null && !model.isEdge(pState.cell)) {
                var alpha = Utils.toRadians(parseFloat(pState.style[Constants.styleRotation] || "0"));

                if (alpha != 0) {
                    var cos = Math.cos(alpha);
                    var sin = Math.sin(alpha);

                    var ct = new Point(state.getCenterX(), state.getCenterY());
                    var cx = new Point(pState.getCenterX(), pState.getCenterY());
                    var pt = Utils.getRotatedPoint(ct, cos, sin, cx);
                    state.x = pt.x - state.width / 2;
                    state.y = pt.y - state.height / 2;
                }
            }

            this.updateVertexLabelOffset(state);
        }

        /**
         * Function: updateEdgeState
         * 
         * Validates the given cell state.
         */
        updateEdgeState(state: CellState, geo: Geometry) {
            var source = state.getVisibleTerminalState(true);
            var target = state.getVisibleTerminalState(false);

            // This will remove edges with no terminals and no terminal points
            // as such edges are invalid and produce NPEs in the edge styles.
            // Also removes connected edges that have no visible terminals.
            if ((this.graph.model.getTerminal(state.cell, true) != null && source == null) ||
            (source == null && geo.getTerminalPoint(true) == null) ||
            (this.graph.model.getTerminal(state.cell, false) != null && target == null) ||
            (target == null && geo.getTerminalPoint(false) == null)) {
                this.clear(state.cell, true);
            } else {
                this.updateFixedTerminalPoints(state, source, target);
                this.updatePoints(state, geo.points, source, target);
                this.updateFloatingTerminalPoints(state, source, target);

                var pts = state.absolutePoints;

                if (state.cell != this.currentRoot && (pts == null || pts.length < 2 || pts[0] == null || pts[pts.length - 1] == null)) {
                    // This will remove edges with invalid points from the list of states in the view.
                    // Happens if the one of the terminals and the corresponding terminal point is null.
                    this.clear(state.cell, true);
                } else {
                    this.updateEdgeBounds(state);
                    this.updateEdgeLabelOffset(state);
                }
            }
        }

        /**
         * Function: updateVertexLabelOffset
         * 
         * Updates the absoluteOffset of the given vertex cell state. This takes
         * into account the label position styles.
         * 
         * Parameters:
         * 
         * state - <mxCellState> whose absolute offset should be updated.
         */
        updateVertexLabelOffset(state: CellState) {
            var h = Utils.getValue(state.style, Constants.styleLabelPosition, Constants.alignCenter);
            var lw: number;
            if (h == Constants.alignLeft) {
                lw = Utils.getInt(state.style, Constants.styleLabelWidth, null);
                if (lw != null) {
                    lw *= this.scale;
                } else {
                    lw = state.width;
                }

                state.absoluteOffset.x -= lw;
            } else if (h == Constants.alignRight) {
                state.absoluteOffset.x += state.width;
            } else if (h == Constants.alignCenter) {
                lw = Utils.getInt(state.style, Constants.styleLabelWidth, null);
                if (lw != null) {
                    // Aligns text block with given width inside the vertex width
                    var align = Utils.getValue(state.style, Constants.styleAlign, Constants.alignCenter);
                    var dx = 0;

                    if (align == Constants.alignCenter) {
                        dx = 0.5;
                    } else if (align == Constants.alignRight) {
                        dx = 1;
                    }

                    if (dx != 0) {
                        state.absoluteOffset.x -= (lw * this.scale - state.width) * dx;
                    }
                }
            }

            var v = Utils.getValue(state.style, Constants.styleVerticalLabelPosition, Constants.alignMiddle);

            if (v == Constants.alignTop) {
                state.absoluteOffset.y -= state.height;
            } else if (v == Constants.alignBottom) {
                state.absoluteOffset.y += state.height;
            }
        }

        /**
         * Function: resetValidationState
         *
         * Resets the current validation state.
         */
        resetValidationState() {
            this.lastNode = null;
            this.lastHtmlNode = null;
            this.lastForegroundNode = null;
            this.lastForegroundHtmlNode = null;
        }

        /**
         * Function: stateValidated
         * 
         * Invoked when a state has been processed in <validatePoints>. This is used
         * to update the order of the DOM nodes of the shape.
         * 
         * Parameters:
         * 
         * state - <mxCellState> that represents the cell state.
         */
        stateValidated(state: CellState) {
            var fg = (this.graph.getModel().isEdge(state.cell) && this.graph.keepEdgesInForeground) ||
            (this.graph.getModel().isVertex(state.cell) && this.graph.keepEdgesInBackground);
            var htmlNode = (fg) ? this.lastForegroundHtmlNode || this.lastHtmlNode : this.lastHtmlNode;
            var node = (fg) ? this.lastForegroundNode || this.lastNode : this.lastNode;
            var result = this.graph.cellRenderer.insertStateAfter(state, node, htmlNode);

            if (fg) {
                this.lastForegroundHtmlNode = result[1];
                this.lastForegroundNode = result[0];
            } else {
                this.lastHtmlNode = result[1];
                this.lastNode = result[0];
            }
        }

        /**
         * Function: updateFixedTerminalPoints
         *
         * Sets the initial absolute terminal points in the given state before the edge
         * style is computed.
         * 
         * Parameters:
         * 
         * edge - <mxCellState> whose initial terminal points should be updated.
         * source - <mxCellState> which represents the source terminal.
         * target - <mxCellState> which represents the target terminal.
         */
        updateFixedTerminalPoints(edge: CellState, source: CellState, target: CellState) {
            this.updateFixedTerminalPoint(edge, source, true, this.graph.getConnectionConstraint(edge, source, true));
            this.updateFixedTerminalPoint(edge, target, false, this.graph.getConnectionConstraint(edge, target, false));
        }

        updateFixedTerminalPoint(edge: CellState, terminal: CellState, source: boolean, constraint: ConnectionConstraint) {
            /// <summary>Sets the fixed source or target terminal point on the given edge.</summary>
            /// <param name="edge">CellState whose terminal point should be updated</param>
            /// <param name="terminal">CellState which represents the actual terminal</param>
            /// <param name="source">Boolean that specifies if the terminal is the source.</param>
            /// <param name="constraint">ConnectionConstraint that specifies the connection.</param>
            var pt = null;

            if (constraint != null) {
                pt = this.graph.getConnectionPoint(terminal, constraint);
            }

            if (pt == null && terminal == null) {
                var s = this.scale;
                var tr = this.translate;
                var orig = edge.origin;
                var geo = this.graph.getCellGeometry(edge.cell);
                pt = geo.getTerminalPoint(source);

                if (pt != null) {
                    pt = new Point(s * (tr.x + pt.x + orig.x), s * (tr.y + pt.y + orig.y));
                }
            }

            edge.setAbsoluteTerminalPoint(pt, source);
        }

        /** Updates the absolute points in the given state using the specified array of <Points> as the relative points.
         * edge - CellState whose absolute points should be updated.
         * points - Array of <Points> that constitute the relative points.
         * source - <mxCellState> that represents the source terminal.
         * target - <mxCellState> that represents the target terminal.
         */
        updatePoints(edge: CellState, points: Point[], source: CellState, target: CellState): void {
            if (edge != null) {
                var pts = [];
                pts.push(edge.absolutePoints[0]);
                var edgeStyle = this.getEdgeStyle(edge, points, source, target);

                if (edgeStyle != null) {
                    var src = this.getTerminalPort(edge, source, true);
                    var trg = this.getTerminalPort(edge, target, false);

                    edgeStyle(edge, src, trg, points, pts);
                } else if (points != null) {
                    for (var i = 0; i < points.length; i++) {
                        if (points[i] != null) {
                            var pt = Utils.clone(points[i]);
                            pts.push(this.transformControlPoint(edge, pt));
                        }
                    }
                }

                var tmp = edge.absolutePoints;
                pts.push(tmp[tmp.length - 1]);

                edge.absolutePoints = pts;
            }
        }

        /** Transforms the given control point to an absolute point. */
        transformControlPoint(state: CellState, pt: Point): Point {
            var orig = state.origin;

            return new Point(this.scale * (pt.x + this.translate.x + orig.x),
                this.scale * (pt.y + this.translate.y + orig.y));
        }

        /** Returns the edge style function to be used to render the given edge state. */
        getEdgeStyle(edge: CellState, points?: Point[], source?: CellState, target?: CellState): IEdgeStyle {
            var edgeStyleName = (source != null && source === target) ?
                Utils.getValue(edge.style, Constants.styleLoop, this.graph.defaultLoopStyle) :
                (!Utils.getBoolean(edge.style, Constants.styleNoedgestyle, false) ? 
                    edge.style[Constants.styleEdge] 
                    : null);

            if (edgeStyleName)
                return StyleRegistry.getEdge(edgeStyleName);
            return null;
        }

        /**
         * Function: updateFloatingTerminalPoints
         *
         * Updates the terminal points in the given state after the edge style was
         * computed for the edge.
         * 
         * Parameters:
         * 
         * state - <mxCellState> whose terminal points should be updated.
         * source - <mxCellState> that represents the source terminal.
         * target - <mxCellState> that represents the target terminal.
         */
        updateFloatingTerminalPoints(state: CellState, source: CellState, target: CellState) {
            var pts = state.absolutePoints;
            var p0 = pts[0];
            var pe = pts[pts.length - 1];

            if (pe == null && target != null) {
                this.updateFloatingTerminalPoint(state, target, source, false);
            }

            if (p0 == null && source != null) {
                this.updateFloatingTerminalPoint(state, source, target, true);
            }
        }

        /**
         * Function: updateFloatingTerminalPoint
         *
         * Updates the absolute terminal point in the given state for the given
         * start and end state, where start is the source if source is true.
         * 
         * Parameters:
         * 
         * edge - <mxCellState> whose terminal point should be updated.
         * start - <mxCellState> for the terminal on "this" side of the edge.
         * end - <mxCellState> for the terminal on the other side of the edge.
         * source - Boolean indicating if start is the source terminal state.
         */
        updateFloatingTerminalPoint(edge: CellState, start: CellState, end: CellState, source: boolean) {
            start = this.getTerminalPort(edge, start, source);
            var next = this.getNextPoint(edge, end, source);

            var orth = this.graph.isOrthogonal(edge);
            var alpha = Utils.toRadians(Number(start.style[Constants.styleRotation] || "0"));
            var center = new Point(start.getCenterX(), start.getCenterY());

            if (alpha != 0) {
                next = Utils.getRotatedPoint(next, Math.cos(-alpha), Math.sin(-alpha), center);
            }

            var border = parseFloat(edge.style[Constants.stylePerimeterSpacing] || "0");
            border += parseFloat(edge.style[(source) ?
                Constants.styleSourcePerimeterSpacing :
                Constants.styleTargetPerimeterSpacing] || "0");
            var pt = this.getPerimeterPoint(start, next, alpha == 0 && orth, border);

            if (alpha != 0) {
                var cos = Math.cos(alpha);
                var sin = Math.sin(alpha);
                pt = Utils.getRotatedPoint(pt, cos, sin, center);
            }

            edge.setAbsoluteTerminalPoint(pt, source);
        }

        /** Returns an <mxCellState> that represents the source or target terminal or port for the given edge.
         * Parameters:
         * state - CellState that represents the state of the edge.
         * terminal - CellState that represents the terminal.
         * source - Boolean indicating if the given terminal is the source terminal.
         */
        getTerminalPort(state: CellState, terminal: CellState, source: boolean): CellState {
            var key = (source) ? Constants.styleSourcePort : Constants.styleTargetPort;
            var id = Utils.getInt(state.style, key, null);

            if (id != null) {
                var tmp = this.getState(this.graph.getModel().getCell(id));

                // Only uses ports where a cell state exists
                if (tmp != null) {
                    terminal = tmp;
                }
            }

            return terminal;
        }

        /**
         * Function: getPerimeterPoint
         *
         * Returns an <Point> that defines the location of the intersection point between
         * the perimeter and the line between the center of the shape and the given point.
         * 
         * Parameters:
         * 
         * terminal - <mxCellState> for the source or target terminal.
         * next - <Point> that lies outside of the given terminal.
         * orthogonal - Boolean that specifies if the orthogonal projection onto
         * the perimeter should be returned. If this is false then the intersection
         * of the perimeter and the line between the next and the center point is
         * returned.
         * border - Optional border between the perimeter and the shape.
         */
        getPerimeterPoint(terminal: CellState, next: Point, orthogonal: boolean, border?: number): Point {
            var point = null;

            if (terminal != null) {
                var perimeter = this.getPerimeterFunction(terminal);

                if (perimeter != null && next != null) {
                    var bounds = this.getPerimeterBounds(terminal, border);

                    if (bounds.width > 0 || bounds.height > 0) {
                        point = perimeter(bounds, terminal, next, orthogonal);
                    }
                }

                if (point == null) {
                    point = this.getPoint(terminal);
                }
            }

            return point;
        }

        /**
         * Returns the x-coordinate of the center point for automatic routing.
         */
        getRoutingCenterX(state: CellState): number {
            var f = (state.style != null) ? parseFloat(state.style[Constants.styleRoutingCenterX]) || 0 : 0;

            return state.getCenterX() + f * state.width;
        }

        /**
         * Returns the y-coordinate of the center point for automatic routing.
         */
        getRoutingCenterY(state: CellState): number {
            var f = (state.style != null) ? parseFloat(state.style[Constants.styleRoutingCenterY]) || 0 : 0;

            return state.getCenterY() + f * state.height;
        }

        /**
         * Function: getPerimeterBounds
         *
         * Returns the perimeter bounds for the given terminal, edge pair as an
         * <mxRectangle>.
         * 
         * If you have a model where each terminal has a relative child that should
         * act as the graphical endpoint for a connection from/to the terminal, then
         * this method can be replaced as follows:
         * 
         * (code)
         * var oldGetPerimeterBounds = mxGraphView.prototype.getPerimeterBounds;
         * mxGraphView.prototype.getPerimeterBounds = function(terminal, edge, isSource)
         * {
         *   var model = this.graph.getModel();
         *   var childCount = model.getChildCount(terminal.cell);
         * 
         *   if (childCount > 0)
         *   {
         *     var child = model.getChildAt(terminal.cell, 0);
         *     var geo = model.getGeometry(child);
         *
         *     if (geo != null &&
         *         geo.relative)
         *     {
         *       var state = this.getState(child);
         *       
         *       if (state != null)
         *       {
         *         terminal = state;
         *       }
         *     }
         *   }
         *   
         *   return oldGetPerimeterBounds.apply(this, arguments);
         * };
         * (end)
         * 
         * Parameters:
         * 
         * terminal - <mxCellState> that represents the terminal.
         * border - Number that adds a border between the shape and the perimeter.
         */
        getPerimeterBounds(terminal: CellState, border: number = 0) {
            border += parseFloat(terminal.style[Constants.stylePerimeterSpacing] || "0");
            return terminal.getPerimeterBounds(border * this.scale);
        }

        /**
         * Returns the perimeter function for the given state.
         */
        getPerimeterFunction(state: CellState): IPerimeterStyle {
            var perimeter = state.style[Constants.stylePerimeter];

            // Converts string values to objects
            if (perimeter)
                return StyleRegistry.getPerimeter(perimeter);
            return null;
        }

        /**
         * Function: getNextPoint
         *
         * Returns the nearest point in the list of absolute points or the center
         * of the opposite terminal.
         * 
         * Parameters:
         * 
         * edge - <mxCellState> that represents the edge.
         * opposite - <mxCellState> that represents the opposite terminal.
         * source - Boolean indicating if the next point for the source or target
         * should be returned.
         */
        getNextPoint(edge: CellState, opposite: CellState, source: boolean): Point {
            var pts = edge.absolutePoints;
            var point = null;

            if (pts != null && (source || pts.length > 2 || opposite == null)) {
                var count = pts.length;
                point = pts[(source) ? Math.min(1, count - 1) : Math.max(0, count - 2)];
            }

            if (point == null && opposite != null) {
                point = new Point(opposite.getCenterX(), opposite.getCenterY());
            }

            return point;
        }

        /**
         * Function: getVisibleTerminal
         *
         * Returns the nearest ancestor terminal that is visible. The edge appears
         * to be connected to this terminal on the display. The result of this method
         * is cached in <mxCellState.getVisibleTerminalState>.
         * 
         * Parameters:
         * 
         * edge - <mxCell> whose visible terminal should be returned.
         * source - Boolean that specifies if the source or target terminal
         * should be returned.
         */
        getVisibleTerminal(edge: Cell, source: boolean): Cell {
            var model = this.graph.getModel();
            var result = model.getTerminal(edge, source);
            var best = result;

            while (result != null && result != this.currentRoot) {
                if (!this.graph.isCellVisible(best) || this.isCellCollapsed(result)) {
                    best = result;
                }

                result = model.getParent(result);
            }

            // Checks if the result is not a layer
            if (model.getParent(best) == model.getRoot()) {
                best = null;
            }

            return best;
        }

        /**
         * Function: updateEdgeBounds
         *
         * Updates the given state using the bounding box of t
         * he absolute points.
         * Also updates <mxCellState.terminalDistance>, <mxCellState.length> and
         * <mxCellState.segments>.
         * 
         * Parameters:
         * 
         * state - <mxCellState> whose bounds should be updated.
         */
        updateEdgeBounds(state: CellState) {
            var points = state.absolutePoints;
            var p0 = points[0];
            var pe = points[points.length - 1];
            var dx: number;
            var dy: number;
            if (p0.x != pe.x || p0.y != pe.y) {
                dx = pe.x - p0.x;
                dy = pe.y - p0.y;
                state.terminalDistance = Math.sqrt(dx * dx + dy * dy);
            } else {
                state.terminalDistance = 0;
            }

            var length = 0;
            var segments = [];
            var pt = p0;
            var minX = pt.x;
            var minY = pt.y;
            var maxX = minX;
            var maxY = minY;
            for (var i = 1; i < points.length; i++) {
                var tmp = points[i];

                if (tmp != null) {
                    dx = pt.x - tmp.x;
                    dy = pt.y - tmp.y;
                    var segment = Math.sqrt(dx * dx + dy * dy);
                    segments.push(segment);
                    length += segment;

                    pt = tmp;

                    minX = Math.min(pt.x, minX);
                    minY = Math.min(pt.y, minY);
                    maxX = Math.max(pt.x, maxX);
                    maxY = Math.max(pt.y, maxY);
                }
            }
            state.length = length;
            state.segments = segments;
            var markerSize = 1;
            state.x = minX;
            state.y = minY;
            state.width = Math.max(markerSize, maxX - minX);
            state.height = Math.max(markerSize, maxY - minY);
        }

        /**
         * Function: getPoint
         *
         * Returns the absolute point on the edge for the given relative
         * <mxGeometry> as an <Point>. The edge is represented by the given
         * <mxCellState>.
         * 
         * Parameters:
         * 
         * state - <mxCellState> that represents the state of the parent edge.
         * geometry - <mxGeometry> that represents the relative location.
         */
        getPoint(state: CellState, geometry?: Geometry): Point {
            var x = state.getCenterX();
            var y = state.getCenterY();
            var offset: Point;
            if (state.segments != null && (geometry == null || geometry.relative)) {
                var gx = (geometry != null) ? geometry.x / 2 : 0;
                var pointCount = state.absolutePoints.length;
                var dist = (gx + 0.5) * state.length;
                var segment = state.segments[0];
                var length = 0;
                var index = 1;

                while (dist > length + segment && index < pointCount - 1) {
                    length += segment;
                    segment = state.segments[index++];
                }

                var factor = (segment == 0) ? 0 : (dist - length) / segment;
                var p0 = state.absolutePoints[index - 1];
                var pe = state.absolutePoints[index];

                if (p0 != null && pe != null) {
                    var gy = 0;
                    var offsetX = 0;
                    var offsetY = 0;

                    if (geometry != null) {
                        gy = geometry.y;
                        offset = geometry.offset;
                        if (offset != null) {
                            offsetX = offset.x;
                            offsetY = offset.y;
                        }
                    }

                    var dx = pe.x - p0.x;
                    var dy = pe.y - p0.y;
                    var nx = (segment == 0) ? 0 : dy / segment;
                    var ny = (segment == 0) ? 0 : dx / segment;

                    x = p0.x + dx * factor + (nx * gy + offsetX) * this.scale;
                    y = p0.y + dy * factor - (ny * gy - offsetY) * this.scale;
                }
            } else if (geometry != null) {
                offset = geometry.offset;
                if (offset != null) {
                    x += offset.x;
                    y += offset.y;
                }
            }

            return new Point(x, y);
        }

        /**
         * Function: getRelativePoint
         *
         * Gets the relative point that describes the given, absolute label
         * position for the given edge state.
         * 
         * Parameters:
         * 
         * state - <mxCellState> that represents the state of the parent edge.
         * x - Specifies the x-coordinate of the absolute label location.
         * y - Specifies the y-coordinate of the absolute label location.
         */
        getRelativePoint(edgeState: CellState, x: number, y: number): Point {
            var geometry = Cells.getGeometry(edgeState.cell);

            if (geometry != null) {
                var pointCount = edgeState.absolutePoints.length;

                if (geometry.relative && pointCount > 1) {
                    var totalLength = edgeState.length;
                    var segments = edgeState.segments;

                    // Works which line segment the point of the label is closest to
                    var p0 = edgeState.absolutePoints[0];
                    var pe = edgeState.absolutePoints[1];
                    var minDist = Utils.ptSegDistSq(p0.x, p0.y, pe.x, pe.y, x, y);

                    var index = 0;
                    var tmp = 0;
                    var length = 0;

                    for (var i = 2; i < pointCount; i++) {
                        tmp += segments[i - 2];
                        pe = edgeState.absolutePoints[i];
                        var dist = Utils.ptSegDistSq(p0.x, p0.y, pe.x, pe.y, x, y);

                        if (dist <= minDist) {
                            minDist = dist;
                            index = i - 1;
                            length = tmp;
                        }

                        p0 = pe;
                    }

                    var seg = segments[index];
                    p0 = edgeState.absolutePoints[index];
                    pe = edgeState.absolutePoints[index + 1];

                    var x2 = p0.x;
                    var y2 = p0.y;

                    var x1 = pe.x;
                    var y1 = pe.y;

                    var px = x;
                    var py = y;

                    var xSegment = x2 - x1;
                    var ySegment = y2 - y1;

                    px -= x1;
                    py -= y1;
                    var projlenSq = 0;

                    px = xSegment - px;
                    py = ySegment - py;
                    var dotprod = px * xSegment + py * ySegment;

                    if (dotprod <= 0.0) {
                        projlenSq = 0;
                    } else {
                        projlenSq = dotprod * dotprod
                            / (xSegment * xSegment + ySegment * ySegment);
                    }

                    var projlen = Math.sqrt(projlenSq);

                    if (projlen > seg) {
                        projlen = seg;
                    }

                    var yDistance = Math.sqrt(Utils.ptSegDistSq(p0.x, p0.y, pe.x, pe.y, x, y));
                    var direction = Utils.relativeCcw(p0.x, p0.y, pe.x, pe.y, x, y);

                    if (direction == -1) {
                        yDistance = -yDistance;
                    }

                    // Constructs the relative point for the label
                    return new Point(((totalLength / 2 - length - projlen) / totalLength) * -2,
                        yDistance / this.scale);
                }
            }

            return new Point();
        }

        /**
         * Function: updateEdgeLabelOffset
         *
         * Updates <mxCellState.absoluteOffset> for the given state. The absolute
         * offset is normally used for the position of the edge label. Is is
         * calculated from the geometry as an absolute offset from the center
         * between the two endpoints if the geometry is absolute, or as the
         * relative distance between the center along the line and the absolute
         * orthogonal distance if the geometry is relative.
         * 
         * Parameters:
         * 
         * state - <mxCellState> whose absolute offset should be updated.
         */
        updateEdgeLabelOffset(state: CellState) {
            var points = state.absolutePoints;

            state.absoluteOffset.x = state.getCenterX();
            state.absoluteOffset.y = state.getCenterY();

            if (points != null && points.length > 0 && state.segments != null) {
                var geometry = this.graph.getCellGeometry(state.cell);

                if (geometry.relative) {
                    var offset = this.getPoint(state, geometry);

                    if (offset != null) {
                        state.absoluteOffset = offset;
                    }
                } else {
                    var p0 = points[0];
                    var pe = points[points.length - 1];

                    if (p0 != null && pe != null) {
                        var dx = pe.x - p0.x;
                        var dy = pe.y - p0.y;
                        var x0 = 0;
                        var y0 = 0;

                        var off = geometry.offset;

                        if (off != null) {
                            x0 = off.x;
                            y0 = off.y;
                        }

                        var x = p0.x + dx / 2 + x0 * this.scale;
                        var y = p0.y + dy / 2 + y0 * this.scale;

                        state.absoluteOffset.x = x;
                        state.absoluteOffset.y = y;
                    }
                }
            }
        }

        isRendering(): boolean {
            return this.rendering;
        }

        setRendering(value: boolean) {
            this.rendering = value;
        }

        isAllowEval(): boolean {
            return this.allowEval;
        }

        setAllowEval(value: boolean) {
            this.allowEval = value;
        }

        getStates(): Dictionary<Cell, CellState> {
            return this.states;
        }

        setStates(value: Dictionary<Cell, CellState>) {
            this.states = value;
        }

        getCellStates(cells: Cell[]): CellState[] {
            /// <summary>Returns the CellStates for the given array of Cells. 
            /// The array contains all states that are not null, that is, the returned array may have less elements than the given array. 
            /// If no argument is given, then this returns states.</summary>
            if (cells == null) {
                return this.states.getValues();
            } else {
                var result = [];

                for (var i = 0; i < cells.length; i++) {
                    var state = this.getState(cells[i]);

                    if (state != null) {
                        result.push(state);
                    }
                }

                return result;
            }
        }

        /**
         * Removes and returns the <mxCellState> for the given cell.
         * cell - Cell for which the <mxCellState> should be removed.
         */
        removeState(cell: Cell): CellState {
            var state = null;

            if (cell != null) {
                state = this.states.remove(cell);

                if (state != null) {
                    this.graph.cellRenderer.destroy(state);
                    state.destroy();
                }
            }
            return state;
        }

        /**
         * Function: createState
         *
         * Creates and returns an <mxCellState> for the given cell and initializes
         * it using <mxCellRenderer.initialize>.
         * 
         * Parameters:
         * 
         * cell - <mxCell> for which a new <mxCellState> should be created.
         */
        createState(cell: Cell): CellState {
            var state = new CellState(this, cell, this.graph.getCellStyle(cell));
            var model = this.graph.getModel();

            if (state.view.graph.container != null && state.cell != state.view.currentRoot &&
            (model.isVertex(state.cell) || model.isEdge(state.cell))) {
                this.graph.cellRenderer.createShape(state);
            }

            return state;
        }

        getCanvas(): Element {
            /// <summary>Returns the DOM node that contains the background-, draw- and overlay- and decoratorpanes.</summary>
            return this.canvas;
        }


        getBackgroundPane(): Element {
            /// <summary>Returns the DOM node that represents the background layer.</summary>
            return this.backgroundPane;
        }

        getDrawPane(): Element {
            /// <summary>Returns the DOM node that represents the main drawing layer.</summary>
            return this.drawPane;
        }

        getOverlayPane(): Element {
            /// <summary>Returns the DOM node that represents the layer above the drawing layer.</summary>
            return this.overlayPane;
        }

        getDecoratorPane(): Element {
            /// <summary>Returns the DOM node that represents the topmost drawing layer</summary>
            return this.decoratorPane;
        }

        isContainerEvent(evt: Event): boolean {
            /// <summary>Returns true if the event origin is one of the drawing panes or containers of the view.</summary>
            var source = Events.getSource(evt);

            return (source == this.graph.container ||
                source.parentNode == this.backgroundPane ||
                (source.parentNode != null && source.parentNode.parentNode == this.backgroundPane) ||
                source == this.canvas.parentNode ||
                source == this.canvas ||
                source == this.backgroundPane ||
                source == this.drawPane ||
                source == this.overlayPane ||
                source == this.decoratorPane);
        }

        isScrollEvent(evt: MouseEvent): boolean {
            /// <summary>Returns true if the event origin is one of the scrollbars of the container in IE. Such events are ignored.</summary>
            var offset = Utils.getOffset(this.graph.container);
            var pt = new Point(evt.clientX - offset.x, evt.clientY - offset.y);

            var outWidth = this.graph.container.offsetWidth;
            var inWidth = this.graph.container.clientWidth;

            if (outWidth > inWidth && pt.x > inWidth + 2 && pt.x <= outWidth) {
                return true;
            }

            var outHeight = this.graph.container.offsetHeight;
            var inHeight = this.graph.container.clientHeight;

            if (outHeight > inHeight && pt.y > inHeight + 2 && pt.y <= outHeight) {
                return true;
            }

            return false;
        }

        /**
         * Function: init
         *
         * Initializes the graph event dispatch loop for the specified container
         * and invokes <create> to create the required DOM nodes for the display.
         */
        init(): void {
            this.installListeners();

            // Creates the DOM nodes for the respective display dialect
            var graph = this.graph;

            if (graph.dialect == Dialect.Svg) {
                this.createSvg();
            } else {
                this.createHtml();
            }
        }

        /**
         * Function: installListeners
         *
         * Installs the required listeners in the container.
         */
        private installListeners(): void {
            var graph = this.graph;
            var container = graph.container;

            if (container != null) {
                // Support for touch device gestures (eg. pinch to zoom)
                // Double-tap handling is implemented in mxGraph.fireMouseEvent
                if (Client.isTouch) {
                    Events.addListener(container, "gesturestart", Utils.bind(this, evt => {
                        graph.fireGestureEvent(evt);
                        Events.consume(evt);
                    }));

                    Events.addListener(container, "gesturechange", Utils.bind(this, evt => {
                        graph.fireGestureEvent(evt);
                        Events.consume(evt);
                    }));

                    Events.addListener(container, "gestureend", Utils.bind(this, evt => {
                        graph.fireGestureEvent(evt);
                        Events.consume(evt);
                    }));
                }

                // Adds basic listeners for graph event dispatching
                Events.addGestureListeners(container, (evt: MouseEvent) => {
                        // Condition to avoid scrollbar events starting a rubberband selection
                        if (this.isContainerEvent(evt) && ((!Client.isIe && !Client.isGc && !Client.isOp && !Client.isSf) || !this.isScrollEvent(evt))) {
                            graph.fireMouseEvent(Events.mouseDown, new MouseEventContext(evt));
                        }
                    },
                    (evt: MouseEvent) => {
                        if (this.isContainerEvent(evt)) {
                            graph.fireMouseEvent(Events.mouseMove, new MouseEventContext(evt));
                        }
                    },
                    (evt: MouseEvent) => {
                        if (this.isContainerEvent(evt)) {
                            graph.fireMouseEvent(Events.mouseUp, new MouseEventContext(evt));
                        }
                    });

                // Adds listener for double click handling on background, this does always
                // use native event handler, we assume that the DOM of the background
                // does not change during the double click
                Events.addListener(container, "dblclick", Utils.bind(this, (evt: MouseEvent) => {
                    if (this.isContainerEvent(evt)) {
                        graph.dblClick(evt);
                    }
                }));

                // Workaround for touch events which started on some DOM node
                // on top of the container, in which case the cells under the
                // mouse for the move and up events are not detected.
                var getState = (evt: MouseEvent) => {
                    var state: CellState = null;

                    // Workaround for touch events which started on some DOM node
                    // on top of the container, in which case the cells under the
                    // mouse for the move and up events are not detected.
                    if (Client.isTouch) {
                        var x = Events.getClientX(evt);
                        var y = Events.getClientY(evt);

                        // Dispatches the drop event to the graph which
                        // consumes and executes the source function
                        var pt = Utils.convertPoint(container, x, y);
                        state = graph.view.getState(graph.getCellAt(pt.x, pt.y));
                    }

                    return state;
                }

                // Adds basic listeners for graph event dispatching outside of the
                // container and finishing the handling of a single gesture
                // Implemented via graph event dispatch loop to avoid duplicate events
                // in Firefox and Chrome
                graph.addMouseListener(
                {
                    mouseDown() { graph.popupMenuHandler.hideMenu();},
                    mouseMove() {},
                    mouseUp() {}
                });

                this.moveHandler = Utils.bind(this, (evt: MouseEvent) => {
                    // Hides the tooltip if mouse is outside container
                    if (graph.tooltipHandler != null && graph.tooltipHandler.isHideOnHover()) {
                        graph.tooltipHandler.hide();
                    }

                    if (this.captureDocumentGesture && graph.isMouseDown && graph.container != null &&
                        !this.isContainerEvent(evt) && graph.container.style.display != "none" &&
                        graph.container.style.visibility != "hidden" && !Events.isConsumed(evt)) {
                        graph.fireMouseEvent(Events.mouseMove, new MouseEventContext(evt, getState(evt)));
                    }
                });

                this.endHandler = Utils.bind(this, (evt: MouseEvent) => {
                    if (this.captureDocumentGesture && graph.isMouseDown && graph.container != null &&
                        !this.isContainerEvent(evt) && graph.container.style.display != "none" &&
                        graph.container.style.visibility != "hidden") {
                        graph.fireMouseEvent(Events.mouseUp, new MouseEventContext(evt));
                    }
                });

                Events.addGestureListeners(document, null, this.moveHandler, this.endHandler);
            }
        }

        /**
         * Function: create
         *
         * Creates the DOM nodes for the HTML display.
         */
        createHtml(): void {
            var container = this.graph.container;

            if (container != null) {
                this.canvas = this.createHtmlPane("100%", "100%");

                // Uses minimal size for inner DIVs on Canvas. This is required
                // for correct event processing in IE. If we have an overlapping
                // DIV then the events on the cells are only fired for labels.
                this.backgroundPane = this.createHtmlPane("1px", "1px");
                this.drawPane = this.createHtmlPane("1px", "1px");
                this.overlayPane = this.createHtmlPane("1px", "1px");
                this.decoratorPane = this.createHtmlPane("1px", "1px");

                this.canvas.appendChild(this.backgroundPane);
                this.canvas.appendChild(this.drawPane);
                this.canvas.appendChild(this.overlayPane);
                this.canvas.appendChild(this.decoratorPane);

                container.appendChild(this.canvas);

                // Implements minWidth/minHeight in quirks mode
                if (Client.isQuirks) {
                    var onResize = () => {
                        var bounds = this.getGraphBounds();
                        var width = bounds.x + bounds.width + this.graph.border;
                        var height = bounds.y + bounds.height + this.graph.border;

                        this.updateHtmlCanvasSize(width, height);
                    };

                    Events.addListener(window, "resize", onResize);
                }
            }
        }

        /**
         * Function: updateHtmlCanvasSize
         * 
         * Updates the size of the HTML canvas.
         */
        updateHtmlCanvasSize(width, height) {
            var style = (<HTMLElement>this.canvas).style;
            if (this.graph.container != null) {
                var ow = this.graph.container.offsetWidth;
                var oh = this.graph.container.offsetHeight;

                if (ow < width) {
                    style.width = width + "px";
                } else {
                    style.width = "100%";
                }

                if (oh < height) {
                    style.height = height + "px";
                } else {
                    style.height = "100%";
                }
            }
        }

        /**
         * Function: createHtmlPane
         * 
         * Creates and returns a drawing pane in HTML (DIV).
         */
        createHtmlPane(width: string, height: string): HTMLDivElement {
            var pane = <HTMLDivElement>document.createElement("DIV");

            if (width != null && height != null) {
                pane.style.position = "absolute";
                pane.style.left = "0px";
                pane.style.top = "0px";

                pane.style.width = width;
                pane.style.height = height;
            } else {
                pane.style.position = "relative";
            }

            return pane;
        }


        private static createGElement(id: string): SVGGElement {
            // todo unify construction
            var result = <SVGGElement>document.createElementNS(Constants.nsSvg, "g");
            result.id = id;
            return result;
        }

        /** Creates and returns the DOM nodes for the SVG display. */
        createSvg() {
            var container = this.graph.container;
            this.canvas = GraphView.createGElement("canvas");

            // For background image
            this.backgroundPane = GraphView.createGElement("backgroundPane");
            this.canvas.appendChild(this.backgroundPane);

            // Adds two layers (background is early feature)
            this.drawPane = GraphView.createGElement("drawPane");
            this.canvas.appendChild(this.drawPane);

            this.overlayPane = GraphView.createGElement("overlayPane");
            this.canvas.appendChild(this.overlayPane);

            this.decoratorPane = GraphView.createGElement("decoratorPane");
            this.canvas.appendChild(this.decoratorPane);

            var root = <SVGSVGElement>document.createElementNS(Constants.nsSvg, "svg");
            root.style.width = "100%";
            root.style.height = "100%";

            // NOTE: In standards mode, the SVG must have block layout in order for the container DIV to not show scrollbars.
            root.style.display = "block";
            root.appendChild(this.canvas);

            if (container != null) {
                container.appendChild(root);
                this.updateContainerStyle(container);
            }
        }

        /** Updates the style of the container after installing the SVG DOM elements. */
        private updateContainerStyle(container: Element) {
            // Workaround for offset of container
            var style = Utils.getCurrentStyle(container);

            if (style.position == "static") {
                Utils.nodeStyle(container).position = "relative";
            }

            // Disables built-in pan and zoom in IE10 and later
            if (Client.isPointer) {
                Utils.nodeStyle(container).msTouchAction = "none";
            }
        }

        /**
         * Function: destroy
         * 
         * Destroys the view and all its resources.
         */
        destroy() {
            var root = (this.canvas != null) ? (<any>this.canvas).ownerSVGElement : null;

            if (root == null) {
                root = this.canvas;
            }

            if (root != null && root.parentNode != null) {
                this.clear(this.currentRoot, true);
                Events.removeGestureListeners(document, null, this.moveHandler, this.endHandler);
                Events.release(this.graph.container);
                root.parentNode.removeChild(root);

                this.moveHandler = null;
                this.endHandler = null;
                this.canvas = null;
                this.backgroundPane = null;
                this.drawPane = null;
                this.overlayPane = null;
                this.decoratorPane = null;
            }
        }
    }
}