module Five {
    export interface ICellTraverse {
        (vertex: Cell, edge: Cell) : boolean;
    }

    export interface ILayout {
        /** Notified when a cell is being moved in a parent that has automatic layout to update the cell state (eg. index) so that the outcome of the
         * layout will position the vertex as close to the point (x, y) as possible. */
        moveCell(cell: Cell, x: number, y: number);

        /** Executes the layout algorithm for the children of the given parent. */
        execute(parent: Cell); 
    }


//    fastOrganicLayout                      graph.moveCells
//    circleLayout setVertexLocation      -> model.setGeometry
//    compactTreeLayout setVertexLocation -> model.setGeometry
//    stackLayout                            model.setGeometry(child, geo);

    export class BasicLayout {
        constructor(graph: Graph) {
            this.graph = graph;
        }

        /** Reference to the enclosing <mxGraph>. */
        graph: Graph = null;

        /** Boolean indicating if the bounding box of the label should be used if its available. Default is true. */
        private useBoundingBox = true;

        /** The parent cell of the layout, if any */
        parent: Cell = null;

        /** Notified when a cell is being moved in a parent that has automatic layout to update the cell state (eg. index) so that the outcome of the
         * layout will position the vertex as close to the point (x, y) as possible. */
        moveCell(cell: Cell, x: number, y: number) { }

        /** Executes the layout algorithm for the children of the given parent. */
        public execute(parent: Cell) { }

        /** Returns the graph that this layout operates on. */
        private getGraph() : Graph {
            return this.graph;
        }

        /** Returns the constraint for the given key and cell. The optional edge and source arguments are used to return inbound and outgoing routing-
         * constraints for the given edge and vertex. This implementation always returns the value for the given key in the style of the given cell.
         * key - Key of the constraint to be returned.
         * cell - <mxCell> whose constraint should be returned.
         * edge - Optional <mxCell> that represents the connection whose constraint
         * should be returned. Default is null.
         * source - Optional boolean that specifies if the connection is incoming
         * or outgoing. Default is null.
         */
        private getConstraint(key: string, cell: Cell, edge: boolean, source: boolean) : string {
            var state = this.graph.view.getState(cell);
            var style = (state != null) ? state.style : this.graph.getCellStyle(cell);

            return (style != null) ? style[key] : null;
        }

        /** Traverses the (directed) graph invoking the given function for each visited vertex and edge. The function is invoked with the current vertex
         * and the incoming edge as a parameter. This implementation makes sure each vertex is only visited once. The function may return false if the
         * traversal should stop at the given vertex.
         * Parameters:
         * 
         * vertex - <mxCell> that represents the vertex where the traversal starts.
         * directed - Optional boolean indicating if edges should only be traversed from source to target. Default is true.
         * func - Visitor function that takes the current vertex and the incoming edge as arguments. The traversal stops if the function returns false.
         * edge - Optional <mxCell> that represents the incoming edge. This is null for the first step of the traversal.
         * visited - Optional array of cell paths for the visited cells.
         */
        traverse(vertex: Cell, directed: boolean, func: ICellTraverse, edge?: Cell, visited?: Cell[]) {
            if (func != null && vertex != null) {
                visited = visited || [];
                var id = CellPath.create(vertex);

                if (visited[id] == null) {
                    visited[id] = vertex;
                    var result = func(vertex, edge);

                    if (result == null || result) {
                        var edgeCount = Cells.getEdgeCount(vertex);

                        if (edgeCount > 0) {
                            for (var i = 0; i < edgeCount; i++) {
                                var e = Cells.getEdgeAt(vertex, i);
                                var isSource = Cells.getTerminal(e, true) === vertex;

                                if (!directed || isSource) {
                                    var next = this.graph.view.getVisibleTerminal(e, !isSource);
                                    this.traverse(next, directed, func, e, visited);
                                }
                            }
                        }
                    }
                }
            }
        }

        /** Returns a boolean indicating if the given <mxCell> is movable or bendable by the algorithm. This implementation returns true if the given cell is movable in the graph.*/
        isVertexMovable(cell: Cell): boolean {
            return this.graph.isCellMovable(cell);
        }

        /** Returns a boolean indicating if the given <mxCell> should be ignored by the algorithm. This implementation returns false for all vertices. */
        isVertexIgnored(vertex: Cell): boolean {
            return !Cells.isVertex(vertex) || !this.graph.isCellVisible(vertex);
        }

        /** Returns a boolean indicating if the given <mxCell> should be ignored by the algorithm. This implementation returns false for all vertices. */
        isEdgeIgnored(edge: Cell): boolean {
            var model = this.graph.getModel();

            return !Cells.isEdge(edge) ||
                !this.graph.isCellVisible(edge) ||
                Cells.getTerminal(edge, true) == null ||
                Cells.getTerminal(edge, false) == null;
        }

        /** Disables or enables the edge style of the given edge. */
        setEdgeStyleEnabled(edge: Cell, value: boolean) {
            this.graph.setCellStyles((s) => s.noEdgeStyle = !value, [edge]);
        }

        /** Disables or enables orthogonal end segments of the given edge. */
        private setOrthogonalEdge(edge: Cell, value: boolean) {
            this.graph.setCellStyles((s) => s.orthogonal = value, [edge]);
        }

        /** Determines the offset of the given parent to the parent of the layout */
        private getParentOffset(parent: Cell): Point {
            var result = new Point();

            if (parent != null && parent != this.parent) {
	            if (Cells.isAncestor(this.parent, parent)) {
                    var parentGeo = Cells.getGeometry(parent);

                    while (parent != this.parent) {
                        result.x = result.x + parentGeo.x;
                        result.y = result.y + parentGeo.y;

                        parent = Cells.getParent(parent);;
                        parentGeo = Cells.getGeometry(parent);
                    }
                }
            }

            return result;
        }

        /** Replaces the array of mxPoints in the geometry of the given edge with the given array of Points. */
        setEdgePoints(edge: Cell, points: Point[]) {
            if (edge != null) {
                var model = this.graph.model;
                var geometry = Cells.getGeometry(edge);

                if (geometry == null) {
                    geometry = new Geometry();
                    geometry.setRelative(true);
                } else {
                    geometry = geometry.clone();
                }

                if (this.parent != null && points != null) {
                    var parent = Cells.getParent(edge);

                    var parentOffset = this.getParentOffset(parent);

                    for (var i = 0; i < points.length; i++) {
                        points[i].x = points[i].x - parentOffset.x;
                        points[i].y = points[i].y - parentOffset.y;
                    }
                }

                geometry.points = points;
                model.setGeometry(edge, geometry);
            }
        }

        /** Sets the new position of the given cell taking into account the size of the bounding box if <useBoundingBox> is true. The change is only carried
         * out if the new location is not equal to the existing location, otherwise the geometry is not replaced with an updated instance. The new or old
         * bounds are returned (including overlapping labels). */
        setVertexLocation(cell: Cell, x: number, y: number): Rectangle {
            var model = this.graph.getModel();
            var geometry = Cells.getGeometry(cell);
            var result = null;

            if (geometry != null) {
                result = new Rectangle(x, y, geometry.width, geometry.height);

                // Checks for oversize labels and shifts the result
                // TODO: Use mxUtils.getStringSize for label bounds
                if (this.useBoundingBox) {
                    var state = this.graph.getView().getState(cell);

                    if (state != null && state.text != null && state.text.boundingBox != null) {
                        var scale = this.graph.getView().scale;
                        var box = state.text.boundingBox;

                        if (state.text.boundingBox.x < state.x) {
                            x += (state.x - box.x) / scale;
                            result.width = box.width;
                        }

                        if (state.text.boundingBox.y < state.y) {
                            y += (state.y - box.y) / scale;
                            result.height = box.height;
                        }
                    }
                }

                if (this.parent != null) {
                    var parent = Cells.getParent(cell);

                    if (parent != null && parent != this.parent) {
                        var parentOffset = this.getParentOffset(parent);

                        x = x - parentOffset.x;
                        y = y - parentOffset.y;
                    }
                }

                if (geometry.x != x || geometry.y != y) {
                    geometry = geometry.clone();
                    geometry.x = x;
                    geometry.y = y;

                    model.setGeometry(cell, geometry);
                }
            }

            return result;
        }

        /** Returns an <mxRectangle> that defines the bounds of the given cell or the bounding box if <useBoundingBox> is true. */
        getVertexBounds(cell: Cell) : Rectangle {
            var geo: Rectangle = Cells.getGeometry(cell);

            // Checks for oversize label bounding box and corrects
            // the return value accordingly
            // TODO: Use mxUtils.getStringSize for label bounds
            if (this.useBoundingBox) {
                var state = this.graph.getView().getState(cell);

                if (state != null && state.text != null && state.text.boundingBox != null) {
                    var scale = this.graph.getView().scale;
                    var tmp = state.text.boundingBox;

                    var dx0 = Math.max(state.x - tmp.x, 0) / scale;
                    var dy0 = Math.max(state.y - tmp.y, 0) / scale;
                    var dx1 = Math.max((tmp.x + tmp.width) - (state.x + state.width), 0) / scale;
                    var dy1 = Math.max((tmp.y + tmp.height) - (state.y + state.height), 0) / scale;

                    geo = new Rectangle(geo.x - dx0, geo.y - dy0, geo.width + dx0 + dx1, geo.height + dy0 + dy1);
                }
            }

            if (this.parent != null) {
                var parent = Cells.getParent(cell);
                geo = geo.clone();

                if (parent != null && parent != this.parent) {
                    var parentOffset = this.getParentOffset(parent);
                    geo.x = geo.x + parentOffset.x;
                    geo.y = geo.y + parentOffset.y;
                }
            }

            return new Rectangle(geo.x, geo.y, geo.width, geo.height);
        }

        /** Updates the bounds of the given groups to include all children. Call this with the groups in parent to child order, top-most group first, eg.
         * arrangeGroups(graph, mxUtils.sortCells(Arrays.asList(new Object[] { v1, v3 }), true).toArray(), 10); */
        arrangeGroups(groups: Cell[], border: number) {
            this.graph.getModel().beginUpdate();
            try {
                for (var i = groups.length - 1; i >= 0; i--) {
                    var group = groups[i];
                    var children = this.graph.getChildVertices(group);
                    var bounds = this.graph.getBoundingBoxFromGeometry(children);
                    var geometry = this.graph.getCellGeometry(group);
                    var left = 0;
                    var top = 0;

                    // Adds the size of the title area for swimlanes
                    if (this.graph.isSwimlane(group)) {
                        var size = this.graph.getStartSize(group);
                        left = size.width;
                        top = size.height;
                    }

                    if (bounds != null && geometry != null) {
                        geometry = geometry.clone();
                        geometry.x = geometry.x + bounds.x - border - left;
                        geometry.y = geometry.y + bounds.y - border - top;
                        geometry.width = bounds.width + 2 * border + left;
                        geometry.height = bounds.height + 2 * border + top;
                        this.graph.getModel().setGeometry(group, geometry);
                        this.graph.moveCells(children, border + left - bounds.x, border + top - bounds.y);
                    }
                }
            } finally {
                this.graph.getModel().endUpdate();
            }
        }
    }
}