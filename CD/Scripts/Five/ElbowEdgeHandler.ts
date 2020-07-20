module Five {
    /**
     * Graph event handler that reconnects edges and modifies control points and
     * the edge label location. Uses <mxTerminalMarker> for finding and
     * highlighting new source and target vertices. This handler is automatically
     * created in <mxGraph.createHandler>. It extends <mxEdgeHandler>. */
    export class ElbowEdgeHandler extends EdgeHandler implements ICellHandler {

        constructor(state: CellState, selHandleConfig: ISelectionHandleConfig) {
            /// <summary></summary>
            /// <param name="state">CellState of the cell to be modified.</param>
            super(state, selHandleConfig);
        }

        
        /** Specifies if a double click on the middle handle should call <mxGraph.flipEdge>. Default is true. */
        private flipEnabled = true;

        /** Specifies the resource key for the tooltip to be displayed on the single control point for routed edges. If the resource for this key does not
        * exist then the value is used as the error message. Default is 'doubleClickOrientation'. */
        private doubleClickOrientationResource = (Client.language != "none") ? "doubleClickOrientation" : "";

        /** Overrides EdgeHandler.createBends to create custom bends.*/
        public createBends(): RectangleShape[] {
            var bends = [];

            // Source
            var bend = this.createHandleShape(0);

            this.initBend(bend);
            Utils.nodeStyle(bend.node).cursor = Constants.cursorBendHandle;
            Events.redirectMouseEvents(bend.node, this.graph, () => this.state);
            bends.push(bend);

            if (Client.isTouch) {
                bend.node.setAttribute("pointer-events", "none");
            }

            // Virtual
            bends.push(this.createVirtualBend());
            this.points.push(new Point(0, 0));

            // Target
            bend = this.createHandleShape(2);

            this.initBend(bend);
            Utils.nodeStyle(bend.node).cursor = Constants.cursorBendHandle;
            Events.redirectMouseEvents(bend.node, this.graph, () => this.state);
            bends.push(bend);

            if (Client.isTouch) {
                bend.node.setAttribute("pointer-events", "none");
            }

            return bends;
        }

        /** Creates a virtual bend that supports double clicking and calls Graph.flipEdge. */
        createVirtualBend() {
            var bend = this.createHandleShape();
            this.initBend(bend);

            var crs = this.getCursorForBend();
            Utils.nodeStyle(bend.node).cursor = crs;

            // Double-click changes edge style
            var dblClick = Utils.bind(this, evt => {
                if (!Events.isConsumed(evt) && this.flipEnabled) {
                    this.graph.flipEdge(this.state.cell);
                    Events.consume(evt);
                }
            });

            Events.redirectMouseEvents(bend.node, this.graph, () => this.state, null, null, null, dblClick);

            if (!this.graph.isCellBendable(this.state.cell)) {
                Utils.nodeStyle(bend.node).display = "none";
            }

            return bend;
        }

        /** Returns the cursor to be used for the bend. */
        private getCursorForBend(): string {
            return (/* this.state.style.edge == EdgeStyle.topToBottom ||*/
                    this.state.style.edge == EdgeKind.Toptobottom ||
                    (/*this.state.style.edge == EdgeStyle.elbowConnector() ||*/
                        this.state.style.edge == EdgeKind.Elbow) &&
                    this.state.style.elbow == ElbowStyle.Vertical) ?
                "row-resize" : "col-resize";
        }

        /** Returns the tooltip for the given node.*/
        getTooltipForNode(node: Node) {
            var tip = null;

            if (this.bends != null && this.bends[1] != null && (node == this.bends[1].node ||
                node.parentNode == this.bends[1].node)) {
                tip = this.doubleClickOrientationResource;
                tip = Resources.get(tip) || tip; // translate
            }

            return tip;
        }

        /** Converts the given point in-place from screen to unscaled, untranslated graph coordinates and applies the grid.*/
        convertPoint(point: Point, snapToGrid: boolean) : Point {
            var scale = this.graph.getView().getScale();
            var tr = this.graph.getView().getTranslate();
            var origin = this.state.origin;

            if (snapToGrid) {
                point.x = this.graph.snap(point.x);
                point.y = this.graph.snap(point.y);
            }

            point.x = Math.round(point.x / scale - tr.x - origin.x);
            point.y = Math.round(point.y / scale - tr.y - origin.y);

            return point;
        }

        /** Updates and redraws the inner bends.
         * p0 - <Point> that represents the location of the first point.
         * pe - <Point> that represents the location of the last point.
         */
        redrawInnerBends(p0: Point, pe: Point) {
            var g = Cells.getGeometry(this.state.cell);
            var pts = this.state.absolutePoints;
            var pt = null;

            // Keeps the virtual bend on the edge shape
            if (pts.length > 1) {
                p0 = pts[1];
                pe = pts[pts.length - 2];
            } else if (g.points != null && g.points.length > 0) {
                pt = pts[0];
            }

            if (pt == null) {
                pt = new Point(p0.x + (pe.x - p0.x) / 2, p0.y + (pe.y - p0.y) / 2);
            } else {
                pt = new Point(this.graph.getView().scale * (pt.x + this.graph.getView().translate.x + this.state.origin.x),
                    this.graph.getView().scale * (pt.y + this.graph.getView().translate.y + this.state.origin.y));
            }

            // Makes handle slightly bigger if the yellow  label handle
            // exists and intersects this green handle
            var b = this.bends[1].bounds;
            var w = b.width;
            var h = b.height;
            var bounds = new Rectangle(Math.round(pt.x - w / 2), Math.round(pt.y - h / 2), w, h);

            if (this.manageLabelHandle) {
                this.checkLabelHandle(bounds);
            } else if (this.handleImage == null && this.labelShape.visible && Utils.intersects(bounds, this.labelShape.bounds)) {
                w = this.selHandleConfig.size + 3;
                h = this.selHandleConfig.size + 3;
                bounds = new Rectangle(Math.round(pt.x - w / 2), Math.round(pt.y - h / 2), w, h);
            }

            this.bends[1].bounds = bounds;
            this.bends[1].redraw();

            if (this.manageLabelHandle) {
                this.checkLabelHandle(this.bends[1].bounds);
            }
        }

    }
}