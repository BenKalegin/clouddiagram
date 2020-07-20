module Five {

    export class LayoutCellsEvent extends BasicEvent {
        constructor(public cells: Cell[]) { super(); }
    }

    /** Implements a layout manager that runs a given layout after any changes to the graph */
    export class LayoutManager{
        constructor(graph: Graph) {
            // Executes the layout before the changes are dispatched
            this.undoHandler = ( evt: UndoEvent) => {
                if (this.isEnabled()) {
                    this.beforeUndo(evt.edit);
                }
            };

            // Notifies the layout of a move operation inside a parent
            this.moveHandler = e => {
                if (this.isEnabled()) {
                    this.cellsMoved(e.cells, e.event);
                }
            };

            this.setGraph(graph);
        }

        /** Reference to the enclosing <mxGraph>. */
        private graph: Graph;

        /** Specifies if the layout should bubble along the cell hierarchy. Default is true. */
        private bubbling = true;

        /** Specifies if event handling is enabled. Default is true. */
        private enabled = true;

        /** Holds the function that handles the endUpdate event. */
        private undoHandler: (e: UndoEvent) => void;

        /** Holds the function that handles the move event. */
        private moveHandler: IListener<MoveCellsEvent>;

        private isEnabled() : boolean {
            return this.enabled;
        }
        private setEnabled(enabled: boolean) {
            this.enabled = enabled;
        }

        onLayoutCells = new EventListeners<LayoutCellsEvent>();

        /** Returns true if a layout should bubble, that is, if the parent layout should be executed whenever a cell layout (layout of the children of
         * a cell) has been executed. This implementation returns <bubbling>. */
        private isBubbling() : boolean {
            return this.bubbling;
        }

        private setBubbling(value: boolean) {
            this.bubbling = value;
        }

        /** Returns the graph that this layout operates on. */
        private getGraph() : Graph {
            return this.graph;
        }

        private setGraph(graph: Graph) {
            var model: GraphModel;
            if (this.graph != null) {
                model = this.graph.getModel();
                model.onBeforeUndo.remove(this.undoHandler);
                this.graph.onMoveCells.remove(this.moveHandler);
            }

            this.graph = graph;

            if (this.graph != null) {
                model = this.graph.getModel();
                model.onBeforeUndo.add (this.undoHandler);
                this.graph.onMoveCells.add(this.moveHandler);
            }
        }

        getLayout: (parent: Cell) => ILayout = () => null;

        /** Called from the undoHandler.
         * cell - Array of <mxCells> that have been moved.
         * evt - Mouse event that represents the mousedown. */
        private beforeUndo(undoableEdit: UndoableEdit) {
            var cells = this.getCellsForChanges(undoableEdit.changes);
            var model = this.getGraph().getModel();

            // Adds all parent ancestors
            if (this.isBubbling()) {
                var tmp = model.getParents(cells);

                while (tmp.length > 0) {
                    cells = cells.concat(tmp);
                    tmp = model.getParents(tmp);
                }
            }

            this.layoutCells(Utils.sortCells(cells, false));
        }

        /** Called from the moveHandler.
         * cell - Array of <mxCells> that have been moved.
         * evt - Mouse event that represents the mousedown. */
        private cellsMoved(cells: Cell[], evt: MouseEvent) {
            if (cells != null && evt != null) {
                var point = this.getGraph().container.convertPoint(Events.getClientX(evt), Events.getClientY(evt));
                var model = this.getGraph().getModel();

                // Checks if a layout exists to take care of the moving
                for (var i = 0; i < cells.length; i++) {
                    var layout = this.getLayout(Cells.getParent(cells[i]));

                    if (layout != null) {
                        layout.moveCell(cells[i], point.x, point.y);
                    }
                }
            }
        }

        /** Returns the cells to be layouted for the given sequence of changes. */
        private getCellsForChanges(changes: IChange[]): Cell[] {
            var result: Cell[] = [];
            var hash = new Object();

            for (var i = 0; i < changes.length; i++) {
                var change = changes[i];

                if (change instanceof RootChange) {
                    return [];
                }
                else {
                    var cells = this.getCellsForChange(change);

                    for (var j = 0; j < cells.length; j++) {
                        if (cells[j] != null) {
                            var id = CellPath.create(cells[j]);

                            if (hash[id] == null) {
                                hash[id] = cells[j];
                                result.push(cells[j]);
                            }
                        }
                    }
                }
            }

            return result;
        }

        /** Executes all layouts which have been scheduled during the changes. */
        private getCellsForChange(change: IChange) : Cell[]{
            var model = this.getGraph().getModel();

            if (change instanceof ChildChange) {
                var childChange = <ChildChange>change;
                return [childChange.child, childChange.previous, Cells.getParent(childChange.child)];
            }
            else if (change instanceof TerminalChange) {
                return [change.cell, Cells.getParent(change.cell)];
            }
            else if (change instanceof GeometryChange) {
                return [change.cell, Cells.getParent(change.cell)];
            }
            else if (change instanceof VisibleChange) {
                return [change.cell];
            }
            else if (change instanceof StyleChange) {
                return [change.cell];
            }

            return [];
        }

        /** Executes all layouts which have been scheduled during the changes. */
        private layoutCells(cells: Cell[]) {
            if (cells.length > 0) {
                // Invokes the layouts while removing duplicates
                var model = this.getGraph().getModel();

                model.beginUpdate();
                try {
                    var last = null;

                    for (var i = 0; i < cells.length; i++) {
                        if (cells[i] != model.getRoot() && cells[i] != last) {
                            last = cells[i];
                            this.executeLayout(this.getLayout(last), last);
                        }
                    }

                this.onLayoutCells.fire(new LayoutCellsEvent(cells));
                } finally {
                    model.endUpdate();
                }
            }
        }

        /** Executes the given layout on the given parent. */
        private executeLayout(layout: ILayout, parent: Cell) {
            if (layout != null && parent != null) {
                layout.execute(parent);
            }
        }

        /** Removes all handlers from the <graph> and deletes the reference to it. */
        private destroy() {
            this.setGraph(null);
        }
    }
} 