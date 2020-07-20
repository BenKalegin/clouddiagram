module Five {
    export class Clipboard {

        /* Defines the step size to offset the cells after each paste operation.	 */
        private static stepSize = 10;

        /** Counts the number of times the clipboard data has been inserted. */
        private static insertCount = 1;

        /** Holds the array of <mxCells> currently in the clipboard. */
        private static cells: Cell[] = null;

        static setCells(cells: Cell[]) {
            Clipboard.cells = cells;
        }

        static getCells(): Cell[] {
            return Clipboard.cells;
        }

        /** Returns true if the clipboard currently has not data stored. */
        static isEmpty(): boolean {
            return Clipboard.getCells() == null;
        }

        /** Cuts the given array of <mxCells> from the specified graph. 
         * If cells is null then the selection cells of the graph will be used. Returns the cells that have been cut from the graph.
	     * graph - Graph that contains the cells to be cut.
	     * cells - Optional array of <mxCells> to be cut. */
        static cut(graph: Graph, cells?: Cell[]) {
            cells = Clipboard.copy(graph, cells);
            Clipboard.insertCount = 0;
            Clipboard.removeCells(graph, cells);

            return cells;
        }

        /** Hook to remove the given cells from the given graph after a cut operation.
	     * graph - <mxGraph> that contains the cells to be cut.
	     * cells - Array of <mxCells> to be cut. */
        static removeCells(graph: Graph, cells: Cell[]) {
            graph.removeCells(cells);
        }

        /** Copies the given array of <mxCells> from the specified graph to <cells>.Returns the original array of cells that has been cloned.
	     * graph - Graph that contains the cells to be copied.
	     * cells - Optional array of <mxCells> to be copied. */
        static copy(graph: Graph, cells?: Cell[]): Cell[] {
            cells = cells || graph.getSelectionCells();
            var result = graph.getExportableCells(cells);
            Clipboard.insertCount = 1;
            Clipboard.setCells(graph.cloneCells(result));

            return result;
        }

        /** Pastes the <cells> into the specified graph restoring the relation to <parents>, if possible. If the parents
	     * are no longer in the graph or invisible then the cells are added to the graph's default or into the
	     * swimlane under the cell's new location if one exists. The cells are added to the graph using <mxGraph.importCells>. */
        static paste(graph: Graph) {
            if (!Clipboard.isEmpty()) {
                var cells = graph.getImportableCells(Clipboard.getCells());
                var delta = Clipboard.insertCount * Clipboard.stepSize;
                var parent = graph.getDefaultParent();
                cells = graph.importCells(cells, delta, delta, parent);

                // Increments the counter and selects the inserted cells
                Clipboard.insertCount++;
                graph.setSelectionCells(cells);
            }
        }
    }
}    
 