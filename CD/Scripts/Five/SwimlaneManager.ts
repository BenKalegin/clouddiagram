module Five {
    /** Manager for swimlanes and nested swimlanes that sets the size of newly added swimlanes to that of their siblings, and propagates changes to the size of a
     * swimlane to its siblings, if <siblings> is true, and its ancestors, if <bubbling> is true. */
    export class SwimlaneManager {
        constructor(graph: Graph, horizontal: boolean = true, addEnabled: boolean = true, resizeEnabled: boolean = true) {
            this.horizontal = horizontal;
            this.addEnabled = addEnabled;
            this.resizeEnabled = resizeEnabled;

            this.addHandler = e =>  {
                if (this.isEnabled() && this.isAddEnabled()) {
                    this.cellsAdded(e.cells);
                }
            };

            this.resizeHandler = e => {
                if (this.isEnabled() && this.isResizeEnabled()) {
                    this.cellsResized(e.cells);
                }
            };

            this.setGraph(graph);
        }

        /** Reference to the enclosing <mxGraph>. */
        private graph: Graph = null;

        /** Specifies if event handling is enabled. Default is true. */
        private enabled = true;

        /** Specifies the orientation of the swimlanes. Default is true. */
        private horizontal = true;

        /** Specifies if newly added cells should be resized to match the size of their  existing siblings. Default is true. */
        private addEnabled = true;

        /** Specifies if resizing of swimlanes should be handled. Default is true. */
        private resizeEnabled = true;

        /** Holds the function that handles the move event. */
        private addHandler: IListener<AddCellsEvent>;

        /** Holds the function that handles the move event. */
        private resizeHandler: IListener<CellsResizeEvent>;

        isEnabled : () => boolean = () => this.enabled;

        private setEnabled(value: boolean) {
            this.enabled = value;
        }

        isHorizontal : () => boolean = () =>  this.horizontal;

        private setHorizontal(value: boolean) {
            this.horizontal = value;
        }

        private isAddEnabled() : boolean {
            return this.addEnabled;
        }

        private setAddEnabled(value: boolean) {
            this.addEnabled = value;
        }

        private isResizeEnabled() : boolean {
            return this.resizeEnabled;
        }

        private setResizeEnabled(value: boolean) {
            this.resizeEnabled = value;
        }

        private getGraph(): Graph {
            return this.graph;
        }

        private setGraph(graph: Graph) {
            if (this.graph != null) {
                this.graph.onAddCells.remove(this.addHandler);
                this.graph.onCellsResized.remove(this.resizeHandler);
            }

            this.graph = graph;

            if (this.graph != null) {
                this.graph.onAddCells.add(this.addHandler);
                this.graph.onCellsResized.add(this.resizeHandler);
            }
        }

        /** Returns true if the given swimlane should be ignored. */
        private isSwimlaneIgnored(swimlane: Cell) {
            return !this.getGraph().isSwimlane(swimlane);
        }

        /** Returns true if the given cell is horizontal. If the given cell is not a swimlane, then the global orientation is returned. */
        private isCellHorizontal(cell: Cell) {
            if (this.graph.isSwimlane(cell)) {
                var style = this.graph.getCellStyle(cell);

                return !style.portrait;
            }

            return !this.isHorizontal();
        }

        /** Called if any cells have been added. */
        private cellsAdded(cells: Cell[]) {
            if (cells != null) {
                var model = this.getGraph().getModel();

                model.beginUpdate();
                try {
                    for (var i = 0; i < cells.length; i++) {
                        if (!this.isSwimlaneIgnored(cells[i])) {
                            this.swimlaneAdded(cells[i]);
                        }
                    }
                } finally {
                    model.endUpdate();
                }
            }
        }

        /** Updates the size of the given swimlane to match that of any existing siblings swimlanes. */
        private swimlaneAdded(swimlane: Cell) {
            var parent = Cells.getParent(swimlane);
            var childCount = Cells.getChildCount(parent);
            var geo = null;

            // Finds the first valid sibling swimlane as reference
            for (var i = 0; i < childCount; i++) {
                var child = Cells.getChildAt(parent, i);

                if (child != swimlane && !this.isSwimlaneIgnored(child)) {
                    geo = Cells.getGeometry(child);

                    if (geo != null) {
                        break;
                    }
                }
            }

            // Applies the size of the refernece to the newly added swimlane
            if (geo != null) {
                var parentHorizontal = (parent != null) ? this.isCellHorizontal(parent) : this.horizontal;
                this.resizeSwimlane(swimlane, geo.width, geo.height, parentHorizontal);
            }
        }

        /** Called if any cells have been resizes. Calls <swimlaneResized> for all swimlanes where <isSwimlaneIgnored> returns false. */
        private cellsResized(cells: Cell[]) {
            if (cells != null) {
                var model = this.getGraph().getModel();

                model.beginUpdate();
                try {
                    // Finds the top-level swimlanes and adds offsets
                    for (var i = 0; i < cells.length; i++) {
                        if (!this.isSwimlaneIgnored(cells[i])) {
                            var geo = Cells.getGeometry(cells[i]);

                            if (geo != null) {
                                var size = new Rectangle(0, 0, geo.width, geo.height);
                                var top = cells[i];
                                var current = top;

                                while (current != null) {
                                    top = current;
                                    current = Cells.getParent(current);
                                    var tmp = (this.graph.isSwimlane(current)) ?
                                        this.graph.getStartSize(current) :
                                        new Rectangle();
                                    size.width += tmp.width;
                                    size.height += tmp.height;
                                }

                                var parentHorizontal = this.horizontal;
                                this.resizeSwimlane(top, size.width, size.height, parentHorizontal);
                            }
                        }
                    }
                } finally {
                    model.endUpdate();
                }
            }
        }

        /** Called from <cellsResized> for all swimlanes that are not ignored to update the size of the siblings and the size of the parent swimlanes, recursively, if <bubbling> is true. */
        private resizeSwimlane(swimlane: Cell, w: number, h: number, parentHorizontal: boolean) {
            var model = this.getGraph().getModel();

            model.beginUpdate();
            try {
                var horizontal = this.isCellHorizontal(swimlane);

                if (!this.isSwimlaneIgnored(swimlane)) {
                    var geo = Cells.getGeometry(swimlane);

                    if (geo != null) {
                        if ((parentHorizontal && geo.height != h) || (!parentHorizontal && geo.width != w)) {
                            geo = geo.clone();

                            if (parentHorizontal) {
                                geo.height = h;
                            } else {
                                geo.width = w;
                            }

                            model.setGeometry(swimlane, geo);
                        }
                    }
                }

                var tmp = (this.graph.isSwimlane(swimlane)) ?
                    this.graph.getStartSize(swimlane) :
                    new Rectangle();
                w -= tmp.width;
                h -= tmp.height;

                var childCount = Cells.getChildCount(swimlane);

                for (var i = 0; i < childCount; i++) {
                    var child = Cells.getChildAt(swimlane, i);
                    this.resizeSwimlane(child, w, h, horizontal);
                }
            } finally {
                model.endUpdate();
            }
        }

        /** Removes all handlers from the <graph> and deletes the reference to it. */
        private destroy() {
            this.setGraph(null);
        }
    }
} 