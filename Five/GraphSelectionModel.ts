module Five {

    export class SelectionChangeEvent extends BasicEvent {
        constructor(public added: Cell[], public removed: Cell[]) { super(); }
    }

    export class GraphSelectionModel implements IUndoableEditListener {

        constructor(graph: Graph) {
            this.graph = graph;
            this.cells = [];
        }


        /** Specifies the resource key for the status message after a long operation. If the resource for this key does not exist then the value is used as the status message. */
        doneResource = (Client.language != "none") ? "done" : "";

        /** Specifies the resource key for the status message while the selection is being updated. If the resource for this key does not exist then the value is used as the status message. */
        updatingSelectionResource = (Client.language != "none") ? "updatingSelection" : "";

        /** Reference to the enclosing Graph.*/
        private graph: Graph = null;
        cells: Cell[];

        /** Specifies if only one selected item at a time is allowed. */
        private singleSelection = false;

        onUndo = new EventListeners<UndoEvent>();
        onSelectionChange = new EventListeners<SelectionChangeEvent>();

        private isSingleSelection(): boolean {
            return this.singleSelection;
        }

        private setSingleSelection(singleSelection: boolean) {
            this.singleSelection = singleSelection;
        }

        isSelected(cell: Cell): boolean {
            if (cell != null) {
                return Utils.indexOf(this.cells, cell) >= 0;
            }

            return false;
        }

        private isEmpty(): boolean {
            return this.cells.length == 0;
        }

        /** Clears the selection and fires a <change> event if the selection was notempty. */
        clear() {
            this.changeSelection(null, this.cells);
        }

        setCell(cell: Cell) {
            if (cell != null) {
                this.setCells([cell]);
            }
        }

        setCells(cells: Cell[]) {
            if (cells != null) {
                if (this.singleSelection) {
                    cells = [this.getFirstSelectableCell(cells)];
                }

                var tmp = [];

                for (var i = 0; i < cells.length; i++) {
                    if (this.graph.isCellSelectable(cells[i])) {
                        tmp.push(cells[i]);
                    }
                }

                this.changeSelection(tmp, this.cells);
            }
        }

        private getFirstSelectableCell(cells: Cell[]): Cell {
            if (cells != null) {
                for (var i = 0; i < cells.length; i++) {
                    if (this.graph.isCellSelectable(cells[i])) {
                        return cells[i];
                    }
                }
            }

            return null;
        }

        addCell(cell: Cell) {
            if (cell != null) {
                this.addCells([cell]);
            }
        }

        addCells(cells: Cell[]) {
            if (cells != null) {
                var remove = null;

                if (this.singleSelection) {
                    remove = this.cells;
                    cells = [this.getFirstSelectableCell(cells)];
                }

                var tmp = [];

                for (var i = 0; i < cells.length; i++) {
                    if (!this.isSelected(cells[i]) &&
                        this.graph.isCellSelectable(cells[i])) {
                        tmp.push(cells[i]);
                    }
                }

                this.changeSelection(tmp, remove);
            }
        }

        removeCell(cell: Cell) {
            if (cell != null) {
                this.removeCells([cell]);
            }
        }

        removeCells(cells: Cell[]) {
            if (cells != null) {
                var tmp = [];

                for (var i = 0; i < cells.length; i++) {
                    if (this.isSelected(cells[i])) {
                        tmp.push(cells[i]);
                    }
                }

                this.changeSelection(null, tmp);
            }
        }

        /** Inner callback to add the specified <mxCell> to the selection. No event is fired in this implementation. */
        private changeSelection(added: Cell[], removed: Cell[]) {
            if ((added != null && added.length > 0 && added[0] != null) ||
            (removed != null && removed.length > 0 && removed[0] != null)) {
                var change = new SelectionChange(this, added, removed);
                change.execute();
                var edit = new UndoableEdit(this, false);
                edit.add(change);
                this.onUndo.fire(new UndoEvent(edit));
            }
        }

        /** Inner callback to add the specified <mxCell> to the selection. No event is fired in this implementation. */
        cellAdded(cell: Cell) {
            if (cell != null &&
                !this.isSelected(cell)) {
                this.cells.push(cell);
            }
        }

        /** Inner callback to remove the specified <mxCell> from the selection. No event is fired in this implementation. */
        cellRemoved(cell: Cell) {
            if (cell != null) {
                var index = Utils.indexOf(this.cells, cell);

                if (index >= 0) {
                    this.cells.splice(index, 1);
                }
            }
        }
    }
}