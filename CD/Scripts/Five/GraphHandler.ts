module Five {
    export class GraphHandler implements IMouseListener {
        /// <summary>
        /// Graph event handler that handles selection.Individual cells are handled separately using VertexHandler or one of the edge handlers.
        /// These handlers are created using Graph.createHandler in GraphSelectionModel.cellAdded.
        /// To avoid the container to scroll a moved cell into view, set scrollAfterMove to false. </summary>


        constructor(graph: Graph) {
            this.graph = graph;
            this.graph.addMouseListener(this);

            // Repaints the handler after autoscroll
            this.panHandler = () => {
                this.updatePreviewShape();
                this.updateHint();
            };

            this.graph.onPan.add(this.panHandler);

            // Handles escape keystrokes
            this.escapeHandler = Utils.bind(this, () => {
                this.reset();
            });

            this.graph.onEscape.add(this.escapeHandler);
        }


        private graph: Graph = null;
        private panHandler: IListener<BasicEvent>;
        private escapeHandler: IListener<BasicEvent>;

        /** Defines the maximum number of cells to paint subhandles for. Default is 50 for Firefox and 20 for IE. Set this to 0 if you want an unlimited number of handles to be
         * displayed. This is only recommended if the number of cells in the graph is limited to a small number, eg. 500. */
        static maxCells = (Client.isIe) ? 20 : 50;

        /** Specifies if events are handled. Default is true.*/
        private enabled = true;

        /** Specifies if drop targets under the mouse should be enabled. Default istrue.*/
        private highlightEnabled = true;

        /** Specifies if cloning by control-drag is enabled. Default is true.*/
        private cloneEnabled = true;

        /** Specifies if moving is enabled. Default is true.*/
        private moveEnabled = true;

        /** Specifies if other cells should be used for snapping the right, center or left side of the current selection. Default is false. */
        guidesEnabled = false;

        /** Holds the Guide instance that is used for alignment.*/
        private guide: Guide = null;

        /** Stores the x-coordinate of the current mouse move. */
        private currentDx: number = null;

        /**Stores the y-coordinate of the current mouse move. */
        private currentDy: number = null;

        /** Specifies if a move cursor should be shown if the mouse is over a movablecell. Default is true.*/
        private updateCursor = true;

        /** Specifies if selecting is enabled. Default is true.*/
        private selectEnabled = true;

        /** Specifies if cells may be moved out of their parents. Default is true.*/
        private removeCellsFromParent = true;

        /** Specifies if drop events are interpreted as new connections if no other drop action is defined. Default is false.*/
        private connectOnDrop = false;

        /** Specifies if the view should be scrolled so that a moved cell is visible. Default is true.*/
        private scrollOnMove = true;

        /** Specifies the minimum number of pixels for the width and height of a selection border. Default is 6.*/
        private minimumSize = 6;

        /** Specifies the color of the preview shape. Default is black.*/
        private previewColor = "black";

        /** Specifies if the graph container should be used for preview. If this is used then drop target detection relies entirely on <mxGraph.getCellAt> because
         * the HTML preview does not "let events through". Default is false. */
        private htmlPreview = false;

        /** Reference to the <mxShape> that represents the preview. */
        private shape: Shape = null;

        /** Specifies if the grid should be scaled. Default is false.*/
        private scaleGrid = false;

        /** Specifies if the bounding box should allow for rotation. Default is true.*/
        private rotationEnabled = true;
        
        private delayedSelection: boolean;
        private cell: Cell;
        private cellWasClicked: boolean;
        private first: Point;
        private cells: Cell[];
        private bounds: Rectangle;
        private pBounds: Rectangle;
        private highlight: CellHighlight;
        private target: Cell;
        

        private isEnabled() : boolean {
            return this.enabled;
        }

        private setEnabled(value: boolean) {
            this.enabled = value;
        }

        private isCloneEnabled() : boolean{
            return this.cloneEnabled;
        }

        private setCloneEnabled(value: boolean) {
            this.cloneEnabled = value;
        }

        private isMoveEnabled() : boolean {
            return this.moveEnabled;
        }

        private setMoveEnabled(value: boolean) {
            this.moveEnabled = value;
        }

        private isSelectEnabled() : boolean{
            return this.selectEnabled;
        }

        private setSelectEnabled(value: boolean) {
            this.selectEnabled = value;
        }

        private isRemoveCellsFromParent() : boolean {
            return this.removeCellsFromParent;
        }

        setRemoveCellsFromParent(value: boolean) {
            this.removeCellsFromParent = value;
        }

        private getInitialCellForEvent(me: MouseEventContext): Cell {
            return me.getCell();
        }

        private isDelayedSelection(cell: Cell) : boolean {
            return this.graph.isCellSelected(cell);
        }

        /** Handles the event by selecing the given cell and creating a handle for it. By consuming the event all subsequent events of the gesture are redirected to this handler. */
        // IMouseListener
        mouseDown(sender, me: MouseEventContext) {
            if (!me.isConsumed() && this.isEnabled() && this.graph.isEnabled() &&
                me.getState() != null && !Events.isMultiTouchEvent(me.getEvent())) {
                var cell = this.getInitialCellForEvent(me);
                this.delayedSelection = this.isDelayedSelection(cell);
                this.cell = null;

                if (this.isSelectEnabled() && !this.delayedSelection) {
                    this.graph.selectCellForEvent(cell, me.getEvent());
                }

                if (this.isMoveEnabled()) {
                    var geo = Cells.getGeometry(cell);

                    if (this.graph.isCellMovable(cell) && ((!Cells.isEdge(cell) || this.graph.getSelectionCount() > 1 ||
                        (geo.points != null && geo.points.length > 0) || Cells.getTerminal(cell, true) == null ||
                        Cells.getTerminal(cell, false) == null) || this.graph.allowDanglingEdges ||
                    (this.graph.isCloneEvent(me.getEvent()) && this.graph.isCellsCloneable()))) {
                        this.start(cell, me.getX(), me.getY());
                    }

                    this.cellWasClicked = true;
                    me.consume();
                }
            }
        }

        /** Creates an array of cell states which should be used as guides. */
        getGuideStates() : CellState[] {
            var parent = this.graph.getDefaultParent();
            var model = this.graph.getModel();

            var filter = Utils.bind(this, cell => {
                return this.graph.view.getState(cell) != null &&
                    Cells.isVertex(cell) && Cells.getGeometry(cell) != null && !Cells.getGeometry(cell).relative;
            });

            return this.graph.view.getCellStates(model.filterDescendants(filter, parent));
        }

        /** Returns the cells to be modified by this handler. This implementation returns all selection cells that are movable, or the given initial cell if
         * the given cell is not selected and movable. This handles the case of moving unselectable or unselected cells.
         * initialCell - <mxCell> that triggered this handler. */
        private getCells(initialCell: Cell): Cell[] {
            if (!this.delayedSelection && this.graph.isCellMovable(initialCell)) {
                return [initialCell];
            } else {
                return this.graph.getMovableCells(this.graph.getSelectionCells());
            }
        }

        /** Returns the <mxRectangle> used as the preview bounds for moving the given cells. */
        private getPreviewBounds(cells: Cell[]): Rectangle {
            var bounds = this.getBoundingBox(cells);

            if (bounds != null) {
                // Removes 1 px border
                bounds.grow(-1);

                if (bounds.width < this.minimumSize) {
                    var dx = this.minimumSize - bounds.width;
                    bounds.x -= dx / 2;
                    bounds.width = this.minimumSize;
                }

                if (bounds.height < this.minimumSize) {
                    var dy = this.minimumSize - bounds.height;
                    bounds.y -= dy / 2;
                    bounds.height = this.minimumSize;
                }
            }

            return bounds;
        }

        /** Returns the <mxRectangle> that represents the bounding box for the given cells. If bbox is true then the paint bounding box is returned. */
        private getBoundingBox(cells: Cell[]) : Rectangle {
            var result = null;

            if (cells != null && cells.length > 0) {
                for (var i = 0; i < cells.length; i++) {
                    if (Cells.isVertex(cells[i]) || Cells.isEdge(cells[i])) {
                        var state = this.graph.view.getState(cells[i]);

                        if (state != null) {
                            var bbox = <Rectangle>state;

                            if (Cells.isVertex(cells[i]) && state.shape != null && state.shape.boundingBox != null) {
                                bbox = state.shape.boundingBox;
                            }

                            if (result == null) {
                                result = new Rectangle(bbox.x, bbox.y, bbox.width, bbox.height);
                            } else {
                                result.add(bbox);
                            }
                        }
                    }
                }
            }

            return result;
        }

        /** Creates the shape used to draw the preview for the given bounds. */
        private createPreviewShape(bounds: Rectangle) : Shape {
            var shape = new RectangleShape(bounds, null, this.previewColor);
            shape.className = "Preview";
            shape.isDashed = true;

            if (this.htmlPreview) {
                shape.dialect = Dialect.StrictHtml;
                shape.init(this.graph.container);
            } else {
                // Makes sure to use either VML or SVG shapes in order to implement
                // event-transparency on the background area of the rectangle since
                // HTML shapes do not let mouseevents through even when transparent
                shape.dialect = (this.graph.dialect != Dialect.Svg) ? Dialect.Vml : Dialect.Svg;
                shape.init(ElementInitializer(this.graph.getView().getOverlayPane()));
                shape.pointerEvents = false;

                // Workaround for artifacts on iOS
                if (Client.isIos) {
                    shape.getSvgScreenOffset = () => 0;
                }
            }
            return shape;
        }

        /** Starts the handling of the mouse gesture.*/
        private start(cell: Cell, x: number, y: number) {
            this.cell = cell;
            this.first = this.graph.container.convertPoint(x, y);
            this.cells = this.getCells(this.cell);
            this.bounds = this.graph.getView().getBounds(this.cells);
            this.pBounds = this.getPreviewBounds(this.cells);

            if (this.guidesEnabled) {
                this.guide = new Guide(this.graph, this.getGuideStates());
            }
        }

        /** Returns true if the guides should be used for the given <mxMouseEvent>. This implementation returns <mxGuide.isEnabledForEvent>. */
        private useGuidesForEvent(me: MouseEventContext) : boolean {
            return (this.guide != null) ? this.guide.isEnabledForEvent(me.getEvent()) : true;
        }


        /** Snaps the given vector to the grid and returns the given mxPoint instance. */
        private snap(vector: Point) : Point {
            var scale = (this.scaleGrid) ? this.graph.view.scale : 1;

            vector.x = this.graph.snap(vector.x / scale) * scale;
            vector.y = this.graph.snap(vector.y / scale) * scale;

            return vector;
        }

        /** Returns an <mxPoint> that represents the vector for moving the cells for the given <mxMouseEvent>. */
        private getDelta(me: MouseEventContext) : Point {
            var point = this.graph.container.convertPoint(me.getX(), me.getY());
            var s = this.graph.view.scale;

            return new Point(this.roundLength((point.x - this.first.x) / s) * s,
                this.roundLength((point.y - this.first.y) / s) * s);
        }

        /** Hook for subclassers do show details while the handler is active.*/
        protected updateHint(me?: MouseEventContext) {}

        /** Hooks for subclassers to hide details when the handler gets inactive.*/
        protected removeHint() {}

        /** Hook for rounding the unscaled vector. This uses Math.round. */
        protected roundLength(length: number) : number {
            return Math.round(length);
        }

        /** Handles the event by highlighting possible drop targets and updating the preview. */
        // IMouseListener
        mouseMove(sender, me: MouseEventContext) {
            var graph = this.graph;

            if (!me.isConsumed() && graph.isMouseDown && this.cell != null &&
                this.first != null && this.bounds != null) {
                // Stops moving if a multi touch event is received
                if (Events.isMultiTouchEvent(me.getEvent())) {
                    this.reset();
                    return;
                }

                var delta = this.getDelta(me);
                var dx = delta.x;
                var dy = delta.y;
                var tol = graph.tolerance;

                if (this.shape != null || Math.abs(dx) > tol || Math.abs(dy) > tol) {
                    // Highlight is used for highlighting drop targets
                    if (this.highlight == null) {
                        this.highlight = new CellHighlight(this.graph, Constants.dropTargetColor, 3);
                    }

                    if (this.shape == null) {
                        this.shape = this.createPreviewShape(this.bounds);
                    }

                    var gridEnabled = graph.isGridEnabledEvent(me.getEvent());
                    var hideGuide = true;

                    if (this.guide != null && this.useGuidesForEvent(me)) {
                        delta = this.guide.move(this.bounds, new Point(dx, dy), gridEnabled);
                        hideGuide = false;
                        dx = delta.x;
                        dy = delta.y;
                    } else if (gridEnabled) {
                        var trx = graph.getView().translate;
                        var scale = graph.getView().scale;

                        var tx = this.bounds.x - (graph.snap(this.bounds.x / scale - trx.x) + trx.x) * scale;
                        var ty = this.bounds.y - (graph.snap(this.bounds.y / scale - trx.y) + trx.y) * scale;
                        var v = this.snap(new Point(dx, dy));

                        dx = v.x - tx;
                        dy = v.y - ty;
                    }

                    if (this.guide != null && hideGuide) {
                        this.guide.hide();
                    }

                    // Constrained movement if shift key is pressed
                    if (graph.isConstrainedEvent(me.getEvent())) {
                        if (Math.abs(dx) > Math.abs(dy)) {
                            dy = 0;
                        } else {
                            dx = 0;
                        }
                    }

                    this.currentDx = dx;
                    this.currentDy = dy;
                    this.updatePreviewShape();

                    var target: Cell = null;
                    var cell = me.getCell();

                    var clone = graph.isCloneEvent(me.getEvent()) && graph.isCellsCloneable() && this.isCloneEnabled();

                    if (graph.isDropEnabled() && this.highlightEnabled) {
                        // Contains a call to getCellAt to find the cell under the mouse
                        target = graph.getDropTarget(this.cells, me.getEvent(), cell, clone);
                    }

                    var state = graph.getView().getState(target);
                    var highlight = false;

                    if (state != null && (Cells.getParent(this.cell) != target || clone)) {
                        if (this.target != target) {
                            this.target = target;
                            this.setHighlightColor(Constants.dropTargetColor);
                        }

                        highlight = true;
                    } else {
                        this.target = null;

                        if (this.connectOnDrop && cell != null && this.cells.length == 1 &&
                            Cells.isVertex(cell) && graph.isCellConnectable(cell)) {
                            state = graph.getView().getState(cell);

                            if (state != null) {
                                var error = graph.getEdgeValidationError(null, this.cell, cell);
                                var color = (error == null) ?
                                    Constants.validColor :
                                    Constants.invalidConnectTargetColor;
                                this.setHighlightColor(color);
                                highlight = true;
                            }
                        }
                    }

                    if (state != null && highlight) {
                        this.highlight.highlight(state);
                    } else {
                        this.highlight.hide();
                    }
                }

                this.updateHint(me);
                me.consume();

                // Cancels the bubbling of events to the container so
                // that the droptarget is not reset due to an mouseMove
                // fired on the container with no associated state.
                Events.consume(me.getEvent());
            } else if ((this.isMoveEnabled() || this.isCloneEnabled()) && this.updateCursor &&
                !me.isConsumed() && me.getState() != null && !graph.isMouseDown) {
                var cursor = graph.getCursorForMouseEvent(me);

                if (cursor == null && graph.isEnabled() && graph.isCellMovable(me.getCell())) {
                    if (Cells.isEdge(me.getCell())) {
                        cursor = Constants.cursorMovableEdge;
                    } else {
                        cursor = Constants.cursorMovableVertex;
                    }
                }

                me.getState().setCursor(cursor);
            }
        }

        /** Updates the bounds of the preview shape. */
        private updatePreviewShape() {
            if (this.shape != null) {
                this.shape.bounds = new Rectangle(Math.round(this.pBounds.x + this.currentDx - this.graph.panDx),
                    Math.round(this.pBounds.y + this.currentDy - this.graph.panDy), this.pBounds.width, this.pBounds.height);
                this.shape.redraw();
            }
        }

        /** Sets the color of the rectangle used to highlight drop targets. */
        private setHighlightColor(color: string) {
            if (this.highlight != null) {
                this.highlight.setHighlightColor(color);
            }
        }

        /**
         * Handles IMouseListener the event by applying the changes to the selection cells.
         */
        mouseUp(sender, me: MouseEventContext) {
            if (!me.isConsumed()) {
                var graph = this.graph;

                if (this.cell != null && this.first != null && this.shape != null &&
                    this.currentDx != null && this.currentDy != null) {
                    var cell = me.getCell();

                    if (this.connectOnDrop && this.target == null && cell != null && Cells.isVertex(cell) &&
                        graph.isCellConnectable(cell) && graph.isEdgeValid(null, this.cell, cell)) {
                        graph.connectionHandler.connect(this.cell, cell, me.getEvent());
                    } else {
                        var scale = graph.getView().scale;
                        var dx = this.roundLength(this.currentDx / scale);
                        var dy = this.roundLength(this.currentDy / scale);
                        var target = this.target;

                        if (graph.isSplitEnabled() && graph.isSplitTarget(target, this.cells, me.getEvent())) {
                            graph.splitEdge(target, this.cells, null, dx, dy);
                        } else {
                            this.moveCells(this.cells, dx, dy, graph.isCloneEvent(me.getEvent()) && graph.isCellsCloneable() && this.isCloneEnabled(), this.target, me.getEvent());
                        }
                    }
                } else if (this.isSelectEnabled() && this.delayedSelection && this.cell != null) {
                    this.selectDelayed(me);
                }
            }

            // Consumes the event if a cell was initially clicked
            if (this.cellWasClicked) {
                me.consume();
            }

            this.reset();
        }

        /** Implements the delayed selection for the given mouse event. */
        private selectDelayed(me: MouseEventContext) {
            if (!this.graph.isCellSelected(this.cell) || !this.graph.popupMenuHandler.isPopupTrigger(me)) {
                this.graph.selectCellForEvent(this.cell, me.getEvent());
            }
        }

        /** Resets the state of this handler. */
        private reset() {
            this.destroyShapes();
            this.removeHint();

            this.cellWasClicked = false;
            this.delayedSelection = false;
            this.currentDx = null;
            this.currentDy = null;
            this.first = null;
            this.cell = null;
            this.target = null;
        }

        /** Returns true if the given cells should be removed from the parent for the specified mousereleased event. */
        private shouldRemoveCellsFromParent(parent: Cell, cells, evt: MouseEvent): boolean {
            if (Cells.isVertex(parent)) {
                var pState = this.graph.getView().getState(parent);
                var pt = this.graph.container.convertPoint(Events.getClientX(evt), Events.getClientY(evt));
                var alpha = Utils.toRadians(pState.style.rotation);

                if (alpha != 0) {
                    var cos = Math.cos(-alpha);
                    var sin = Math.sin(-alpha);
                    var cx = new Point(pState.getCenterX(), pState.getCenterY());
                    pt = Utils.getRotatedPoint(pt, cos, sin, cx);
                }

                return !Utils.contains(pState, pt.x, pt.y);
            }

            return false;
        }

        /**  Moves the given cells by the specified amount. */
        private moveCells(cells: Cell[], dx: number, dy: number, clone: boolean, target: Cell, evt: MouseEvent) {
            if (clone) {
                cells = this.graph.getCloneableCells(cells);
            }

            // Removes cells from parent
            if (target == null && this.isRemoveCellsFromParent() &&
                this.shouldRemoveCellsFromParent(Cells.getParent(this.cell), cells, evt)) {
                target = this.graph.getDefaultParent();
            }

            // Passes all selected cells in order to correctly clone or move into
            // the target cell. The method checks for each cell if its movable.
            cells = this.graph.moveCells(cells, dx - this.graph.panDx / this.graph.view.scale,
                dy - this.graph.panDy / this.graph.view.scale, clone, target, evt);

            if (this.isSelectEnabled() && this.scrollOnMove) {
                this.graph.scrollCellToVisible(cells[0]);
            }

            // Selects the new cells if cells have been cloned
            if (clone) {
                this.graph.setSelectionCells(cells);
            }
        }

        /** Destroy the preview and highlight shapes. */
        private destroyShapes() {
            // Destroys the preview dashed rectangle
            if (this.shape != null) {
                this.shape.destroy();
                this.shape = null;
            }

            if (this.guide != null) {
                this.guide.destroy();
                this.guide = null;
            }

            // Destroys the drop target highlight
            if (this.highlight != null) {
                this.highlight.destroy();
                this.highlight = null;
            }
        }

        /**
         * Function: destroy
         * 
         * Destroys the handler and all its resources and DOM nodes.
         */
        destroy() {
            this.graph.removeMouseListener(this);
            this.graph.onPan.remove(this.panHandler);

            if (this.escapeHandler != null) {
                this.graph.onEscape.remove(this.escapeHandler);
                this.escapeHandler = null;
            }

            this.destroyShapes();
            this.removeHint();
        }
    }
}