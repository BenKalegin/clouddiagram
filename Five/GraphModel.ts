///<reference path="UndoableEdit.ts"/>
///<reference path="RootChange.ts"/>

module Five {

    export class GraphModel implements IUndoableEditListener {

        // Holds the root cell, which in turn contains the cells that represent the layers of the diagram as child cells. 
        // That is, the actual elements of the diagram are supposed to live in the third generation of cells and below.
        root: Cell = null;

        /**
         * Maps from Ids to cells.
         */
        private cells: { [id: number]: Cell };

        /**
         * Specifies if edges should automatically be moved into the nearest common ancestor of their terminals. Default is true.
         */
        private maintainEdgeParent = true;

        /**
         * Specifies if the model should automatically create Ids for new cells.
         */
        private createIds = true;

        /**
         * Variable: nextId
         * 
         * Specifies the next Id to be created. Initial value is 0.
         */
        private nextId = 0;

        /** Holds the changes for the current transaction. If the transaction is closed then a new object is created for this variable using createUndoableEdit */
        private currentEdit: UndoableEdit = null;

        /**
         * Variable: updateLevel
         * 
         * Counter for the depth of nested transactions. Each call to <beginUpdate>
         * will increment this number and each call to <endUpdate> will decrement
         * it. When the counter reaches 0, the transaction is closed and the
         * respective events are fired. Initial value is 0.
         */
        private updateLevel = 0;

        /**
         * Variable: endingUpdate
         * 
         * True if the program flow is currently inside endUpdate.
         */
        private endingUpdate = false;

        /** Defines the prefix of new Ids. Default is an empty string.*/
        prefix = '';

        onAfterExecute = new EventListeners<AfterExecuteEvent>();
        onStartEdit = new EventListeners<BasicEvent>();
        onEndEdit = new EventListeners<BasicEvent>();
        onBeforeUndo = new EventListeners<UndoEvent>();
        onUndo = new EventListeners<UndoEvent>();
        onChange = new EventListeners<ModelChangeEvent>();
        onNotify = new EventListeners<NotifyEvent>();

        constructor(root?: Cell) {

            this.currentEdit = this.createUndoableEdit();

            if (root != null) {
                this.setRoot(root);
            } else {
                this.clear();
            }
        }

        getValue(cell: Cell): Node {
            return (cell != null) ? cell.getValue() : null;
        }

        isEdge(cell: Cell): boolean {
            return (cell != null) ? cell.isEdge() : false;
        }

        isVertex(cell: Cell): boolean {
            return (cell != null) ? cell.isVertex() : false;
        }

        getStyle(cell: Cell): string {
            /// <summary>Returns the style of the given Cell.</summary>
            return (cell != null) ? cell.getStyle() : null;
        }

        isVisible(cell: Cell): boolean {
            return (cell != null) ? cell.isVisible() : false;
        }

        getParent(cell: Cell): Cell {
            return (cell != null) ? cell.getParent() : null;
        }

        getRoot(cell?: Cell): Cell {
            /// <summary>Returns the root of the model or the topmost parent of the given cell</summary>
            /// <param name="cell">Optional Cell that specifies the child.</param>
            var root = cell || this.root;

            if (cell != null) {
                while (cell != null) {
                    root = cell;
                    cell = this.getParent(cell);
                }
            }

            return root;
        }

        getChildCount(cell: Cell) {
            return (cell != null) ? cell.getChildCount() : 0;
        }

        getChildAt(cell: Cell, index: number): Cell {
            return (cell != null) ? cell.getChildAt(index) : null;
        }

        getEdgeCount(cell: Cell): number {
            return (cell != null) ? cell.getEdgeCount() : 0;
        }

        getEdgeAt(cell: Cell, index: number): Cell {
            return (cell != null) ? cell.getEdgeAt(index) : null;
        }

        getTerminal(edge: Cell, isSource: boolean): Cell {
            return (edge != null) ? edge.getTerminal(isSource) : null;
        }

        getCell(id: number): Cell {
            return (this.cells != null) ? this.cells[id] : null;
        }

        /**
        * Returns true if the given <mxCell> is collapsed.
        * Parameters:
        * cell - <mxCell> whose collapsed state should be returned.
        */
        isCollapsed(cell: Cell): boolean {
            return (cell != null) ? cell.isCollapsed() : false;
        }

        isAncestor(parent: Cell, child: Cell) {
            /// <summary>Returns true if the given parent is an ancestor of the given child.</summary>
            while (child != null && child != parent) {
                child = this.getParent(child);
            }

            return child == parent;
        }

        setGeometry(cell: Cell, geometry: Geometry) {
            /// <summary>Sets the Geometry of the given Cell. The actual update of the cell is carried out in geometryForCellChanged. The GeometryChange action is used to encapsulate the change.</summary>
            if (geometry != Cells.getGeometry(cell)) {
                this.execute(new GeometryChange(this, cell, geometry));
            }

            return geometry;
        }

        geometryForCellChanged(cell: Cell, geometry: Geometry): Geometry {
            /** Inner callback to update the <mxGeometry> of the given <mxCell> using <mxCell.setGeometry> and return the previous <mxGeometry>. */
            var previous = Cells.getGeometry(cell);
            cell.setGeometry(geometry);

            return previous;
        }

        execute(change: IChange) {
            /// <summary>Executes the given edit and fires events if required. The edit object requires an execute function which is invoked. 
            /// The edit is added to the currentEdit between beginUpdate and endUpdate calls, so that events will be fired if this execute is an individual transaction, that
            /// is, if no previous beginUpdate calls have been made without calling endUpdate. This implementation fires an execute event before executing the given change.</summary>
            change.execute();
            this.beginUpdate();
            this.currentEdit.add(change);
            this.onAfterExecute.fire(new AfterExecuteEvent(change));
            this.endUpdate();
        }

        beginUpdate() {
            this.updateLevel++;
            if (this.updateLevel == 1) {
                this.onStartEdit.fire();
            }
        }

        endUpdate() {
            this.updateLevel--;

            if (this.updateLevel == 0) {
                this.onEndEdit.fire();
            }

            if (!this.endingUpdate) {
                this.endingUpdate = this.updateLevel === 0;

                try {
                    if (this.endingUpdate && !this.currentEdit.isEmpty()) {
                        this.onBeforeUndo.fire(new UndoEvent(this.currentEdit));
                        var tmp = this.currentEdit;
                        this.currentEdit = this.createUndoableEdit();
                        tmp.notify();
                        this.onUndo.fire(new UndoEvent(tmp));
                    }
                } finally {
                    this.endingUpdate = false;
                }
            }
        }

        private createUndoableEdit() {
            /// <summary>Creates a new UndoableEdit that implements the notify function to fire a change and notify event through the UndoableEdit's source.</summary>
            var edit = new UndoableEdit(this, true);

            edit.notify = () => {
                edit.source.onChange.fire(new ModelChangeEvent(edit, edit.changes));
                edit.source.onNotify.fire(new NotifyEvent(edit, edit.changes));
            };

            return edit;
        }

        add(parent: Cell, child: Cell, index?: number): Cell {
            /// <summary>Adds the specified child to the parent at the given index using ChildChange and adds the change to the current transaction. 
            /// If no index is specified then the child is appended to the parent's array of children. Returns the inserted child. </summary>
            /// <param name="parent">Cell that specifies the parent to contain the child.</param>
            /// <param name="child">Cell that specifies the child to be inserted.</param>
            /// <param name="index">Optional integer that specifies the index of the child.</param>
            if (child != parent && parent != null && child != null) {
                // Appends the child if no index was specified
                if (index == null) {
                    index = this.getChildCount(parent);
                }

                var parentChanged = parent != this.getParent(child);
                this.execute(new ChildChange(this, parent, child, index));

                // Maintains the edges parents by moving the edges
                // into the nearest common ancestor of its
                // terminals
                if (this.maintainEdgeParent && parentChanged) {
                    this.updateEdgeParents(child);
                }
            }
            return child;
        }

        parentForCellChanged(cell: Cell, parent: Cell, index: number): Cell {
            /// <summary>Inner callback to update the parent of a cell using Cell.insert on the parent and return the previous parent.</summary>
            /// <param name="cell">Cell to update the parent for.</param>
            /// <param name="parent">Cell that specifies the new parent of the cell.</param>
            /// <param name="index">Optional integer that defines the index of the child in the parent's child array.</param>
            var previous = this.getParent(cell);

            if (parent != null) {
                if (parent != previous || previous.getIndex(cell) != index) {
                    parent.insert(cell, index);
                }
            } else if (previous != null) {
                var oldIndex = previous.getIndex(cell);
                previous.remove(oldIndex);
            }

            // Checks if the previous parent was already in the
            // model and avoids calling cellAdded if it was.
            if (!this.contains(previous) && parent != null) {
                this.cellAdded(cell);
            } else if (parent == null) {
                this.cellRemoved(cell);
            }

            return previous;
        }

        terminalForCellChanged(edge: Cell, terminal: Cell, isSource: boolean): Cell {
            /// <summary>Inner helper function to update the terminal of the edge using Cell.insertEdge and return the previous terminal.</summary> 
            /// <param name="edge">Cell that specifies the edge to be updated.</param>
            /// <param name="terminal">Cell that specifies the new terminal.</param>
            /// <param name="isSource">Boolean indicating if the terminal is the new source or target terminal of the edge.</param>
            var previous = this.getTerminal(edge, isSource);

            if (terminal != null) {
                terminal.insertEdge(edge, isSource);
            } else if (previous != null) {
                previous.removeEdge(edge, isSource);
            }

            return previous;
        }

        private getNearestCommonAncestor(cell1: Cell, cell2: Cell) {
            if (cell1 != null && cell2 != null) {
                // Creates the cell path for the second cell
                var path = CellPath.create(cell2);

                if (path != null && path.length > 0) {
                    // Bubbles through the ancestors of the first
                    // cell to find the nearest common ancestor.
                    var cell = cell1;
                    var current = CellPath.create(cell);

                    // Inverts arguments
                    if (path.length < current.length) {
                        cell = cell2;
                        var tmp = current;
                        current = path;
                        path = tmp;
                    }

                    while (cell != null) {
                        var parent = this.getParent(cell);

                        // Checks if the cell path is equal to the beginning of the given cell path
                        if (path.indexOf(current + CellPath.pathSeparator) == 0 && parent != null) {
                            return cell;
                        }

                        current = CellPath.getParentPath(current);
                        cell = parent;
                    }
                }
            }

            return null;
        }

        private updateEdgeParent(edge: Cell, root: Cell) {
            /// <summary>Inner callback to update the parent of the specified mxCell to the nearest-common-ancestor of its two terminals.</summary>
            var source = this.getTerminal(edge, true);
            var target = this.getTerminal(edge, false);
            var cell: Cell;

            // Uses the first non-relative descendants of the source terminal
            while (source != null && !this.isEdge(source) &&
                source.geometry != null && source.geometry.relative) {
                source = this.getParent(source);
            }

            // Uses the first non-relative descendants of the target terminal
            while (target != null && !this.isEdge(target) &&
                target.geometry != null && target.geometry.relative) {
                target = this.getParent(target);
            }

            if (this.isAncestor(root, source) && this.isAncestor(root, target)) {
                if (source == target) {
                    cell = this.getParent(source);
                } else {
                    cell = this.getNearestCommonAncestor(source, target);
                }

                if (cell != null && (this.getParent(cell) != this.root ||
                    this.isAncestor(cell, edge)) && this.getParent(edge) != cell) {
                    var geo = Cells.getGeometry(edge);

                    if (geo != null) {
                        var origin1 = this.getOrigin(this.getParent(edge));
                        var origin2 = this.getOrigin(cell);

                        var dx = origin2.x - origin1.x;
                        var dy = origin2.y - origin1.y;

                        geo = geo.clone();
                        geo.translate(-dx, -dy);
                        this.setGeometry(edge, geo);
                    }

                    this.add(cell, edge, this.getChildCount(cell));
                }
            }
        }

        private updateEdgeParents(cell: Cell, root?: Cell) {
            /// <summary>Updates the parent for all edges that are connected to cell or one of its descendants using updateEdgeParent.</summary>

            // Gets the topmost node of the hierarchy
            root = root || this.getRoot(cell);

            // Updates edges on children first
            var childCount = this.getChildCount(cell);
            var i: number;
            for (i = 0; i < childCount; i++) {
                var child = this.getChildAt(cell, i);
                this.updateEdgeParents(child, root);
            }

            // Updates the parents of all connected edges
            var edgeCount = this.getEdgeCount(cell);
            var edges: Cell[] = [];

            for (i = 0; i < edgeCount; i++) {
                edges.push(this.getEdgeAt(cell, i));
            }

            for (i = 0; i < edges.length; i++) {
                var edge = edges[i];

                // Updates edge parent if edge and child have a common root node (does not need to be the model root node)
                if (this.isAncestor(root, edge)) {
                    this.updateEdgeParent(edge, root);
                }
            }
        }

        private contains(cell: Cell): boolean {
            return this.isAncestor(this.root, cell);
        }

        private cellAdded(cell: Cell) {
            /// <summary>Inner callback to update cells when a cell has been added. This implementation resolves collisions by creating new Ids. 
            /// To change the ID of a cell after it was inserted into the model, use the following code:
            /// delete model.cells[cell.getId()]; cell.setId(newId); model.cells[cell.getId()] = cell;
            /// If the change of the ID should be part of the command history, then the cell should be removed from the model and a clone with the new ID should
            /// be reinserted into the model instead.</summary>
            if (cell != null) {
                // Creates an Id for the cell if not Id exists
                if (cell.getId() == null && this.createIds) {
                    cell.setId(this.createId(cell));
                }

                if (cell.getId() != null) {
                    var collision = this.getCell(cell.getId());

                    if (collision != cell) {
                        // Creates new Id for the cell
                        // as long as there is a collision
                        while (collision != null) {
                            cell.setId(this.createId(cell));
                            collision = this.getCell(cell.getId());
                        }

                        // Lazily creates the cells dictionary
                        if (this.cells == null) {
                            this.cells = {};
                        }

                        this.cells[cell.getId()] = cell;
                    }
                }

                // Makes sure IDs of deleted cells are not reused
                this.nextId = Math.max(this.nextId, cell.getId());

                // Recursively processes child cells
                var childCount = this.getChildCount(cell);

                for (var i = 0; i < childCount; i++) {
                    this.cellAdded(this.getChildAt(cell, i));
                }
            }
        }

        private cellRemoved(cell: Cell) {
            if (cell != null && this.cells != null) {
                // Recursively processes child cells
                var childCount = this.getChildCount(cell);

                for (var i = childCount - 1; i >= 0; i--) {
                    this.cellRemoved(this.getChildAt(cell, i));
                }

                // Removes the dictionary entry for the cell
                if (this.cells != null && cell.getId() != null) {
                    delete this.cells[cell.getId()];
                }
            }
        }

        private getOrigin(cell: Cell): Point {
            /**
             * Function: getOrigin
             * 
             * Returns the absolute, accumulated origin for the children inside the given parent as an Point.
             */
            var result: Point;

            if (cell != null) {
                result = this.getOrigin(this.getParent(cell));

                if (!this.isEdge(cell)) {
                    var geo = Cells.getGeometry(cell);

                    if (geo != null) {
                        result.x += geo.x;
                        result.y += geo.y;
                    }
                }
            } else {
                result = new Point();
            }

            return result;
        }

        private createId(cell: Cell): number {
            var id = this.nextId;
            this.nextId++;

            return id;
        }

        setTerminal(edge: Cell, terminal: Cell, isSource: boolean) {
            /// <summary>Sets the source or target terminal of the given Cell using TerminalChange> and adds the change to the current transaction.
            /// This implementation updates the parent of the edge using updateEdgeParent if required.</summary>
            var terminalChanged = terminal != this.getTerminal(edge, isSource);
            this.execute(new TerminalChange(this, edge, terminal, isSource));

            if (this.maintainEdgeParent && terminalChanged) {
                this.updateEdgeParent(edge, this.getRoot());
            }

            return terminal;
        }

        filterDescendants(filter: (cell: Cell) => boolean, parent: Cell): Cell[] {
            /// <summary>Visits all cells recursively and applies the specified filter function to each cell. If the function returns true then the cell is added
            ///  to the resulting array. The parent and result paramters are optional. If parent is not specified then the recursion starts at root.</summary>
            /// <param name="filter">JavaScript function that takes an Cell as an argument and returns a boolean.</param>
            /// <param name="parent">Optional Cell that is used as the root of the recursion.</param>

            // Creates a new array for storing the result
            var result: Cell[] = [];

            // Recursion starts at the root of the model
            parent = parent || this.getRoot();

            // Checks if the filter returns true for the cell
            // and adds it to the result array
            if (filter == null || filter(parent)) {
                result.push(parent);
            }

            // Visits the children of the cell
            var childCount = this.getChildCount(parent);

            for (var i = 0; i < childCount; i++) {
                var child = this.getChildAt(parent, i);
                result = result.concat(this.filterDescendants(filter, child));
            }

            return result;
        }

        setCollapsed(cell: Cell, collapsed: boolean): boolean {
            /// <summary>Sets the collapsed state of the given Cell using CollapseChange and adds the change to the current transaction.</summary>
            if (collapsed != this.isCollapsed(cell)) {
                this.execute(new CollapseChange(this, cell, collapsed));
            }
            return collapsed;
        }

        collapsedStateForCellChanged(cell: Cell, collapsed: boolean): boolean {
            /**Inner callback to update the collapsed state of the given Cell using Cell.setCollapsed and return the previous collapsed state. */
            var previous = this.isCollapsed(cell);
            cell.setCollapsed(collapsed);

            return previous;
        }

        getEdgesBetween(source: Cell, target: Cell, directed: boolean): Cell[] {
            /** Returns all edges between the given source and target pair. If directed is true, then only edges from the source to the target are returned,
             * otherwise, all edges between the two cells are returned. */
            directed = (directed != null) ? directed : false;

            var tmp1 = this.getEdgeCount(source);
            var tmp2 = this.getEdgeCount(target);

            // Assumes the source has less connected edges
            var terminal = source;
            var edgeCount = tmp1;

            // Uses the smaller array of connected edges
            // for searching the edge
            if (tmp2 < tmp1) {
                edgeCount = tmp2;
                terminal = target;
            }

            var result: Cell[] = [];

            // Checks if the edge is connected to the correct
            // cell and returns the first match
            for (var i = 0; i < edgeCount; i++) {
                var edge = this.getEdgeAt(terminal, i);
                var src = this.getTerminal(edge, true);
                var trg = this.getTerminal(edge, false);
                var directedMatch = (src == source) && (trg == target);
                var oppositeMatch = (trg == source) && (src == target);

                if (directedMatch || (!directed && oppositeMatch)) {
                    result.push(edge);
                }
            }

            return result;
        }

        getDirectedEdgeCount(cell: Cell, outgoing: boolean, ignoredEdge?: Cell): number {
            /** Returns the number of incoming or outgoing edges, ignoring the given edge. */
            var count = 0;
            var edgeCount = this.getEdgeCount(cell);

            for (var i = 0; i < edgeCount; i++) {
                var edge = this.getEdgeAt(cell, i);

                if (edge != ignoredEdge && this.getTerminal(edge, outgoing) == cell) {
                    count++;
                }
            }

            return count;
        }

        isConnectable(cell: Cell): boolean {
            /** Returns true if the given <mxCell> is connectable. If <edgesConnectable> is false, then this function returns false for all edges else it returns
             * the return value of <mxCell.isConnectable>. */
            return (cell != null) ? cell.isConnectable() : false;
        }

        cloneCells(cells: Cell[], includeChildren: boolean) {
            /// Returns an array of clones for the given array of Cells. Depending on the value of includeChildren, a deep clone is created for each cell. 
            /// Connections are restored based if the corresponding cell is contained in the passed in array.
            var mapping = new Dictionary<Cell, Cell>();
            var clones = [];
            var i: number;
            for (i = 0; i < cells.length; i++) {
                if (cells[i] != null) {
                    clones.push(this.cloneCellImpl(cells[i], mapping, includeChildren));
                } else {
                    clones.push(null);
                }
            }

            for (i = 0; i < clones.length; i++) {
                if (clones[i] != null) {
                    this.restoreClone(clones[i], cells[i], mapping);
                }
            }

            return clones;
        }

        private cloneCellImpl(cell: Cell, mapping: Dictionary<Cell, Cell>, includeChildren: boolean): Cell {
            /** Inner helper method for cloning cells recursively. */
            var clone = this.cellCloned(cell);

            // Stores the clone in the lookup under the cell path for the original cell
            mapping.put(cell, clone);

            if (includeChildren) {
                var childCount = this.getChildCount(cell);

                for (var i = 0; i < childCount; i++) {
                    var cloneChild = this.cloneCellImpl(
                        this.getChildAt(cell, i), mapping, true);
                    clone.insert(cloneChild);
                }
            }

            return clone;
        }

        /** Hook for cloning the cell. This returns cell.clone() or any possible exceptions. */
        private cellCloned(cell: Cell): Cell {
            return cell.clone();
        }

        /** Inner helper method for restoring the connections in a network of cloned cells. */
        private restoreClone(clone: Cell, cell: Cell, mapping: Dictionary<Cell, Cell>) {
            var source = this.getTerminal(cell, true);
            var tmp: Cell;
            if (source != null) {
                tmp = mapping.get(source);
                if (tmp != null) {
                    tmp.insertEdge(clone, true);
                }
            }

            var target = this.getTerminal(cell, false);

            if (target != null) {
                tmp = mapping.get(target);
                if (tmp != null) {
                    tmp.insertEdge(clone, false);
                }
            }

            var childCount = this.getChildCount(clone);

            for (var i = 0; i < childCount; i++) {
                this.restoreClone(this.getChildAt(clone, i),
                    this.getChildAt(cell, i), mapping);
            }
        }

        setStyle(cell: Cell, style: string): string {
            /** Sets the style of the given <mxCell> using <mxStyleChange> and adds the change to the current transaction.
             * style - String of the form [stylename;|key=value;] to specify the new cell style. */
            if (style != this.getStyle(cell)) {
                this.execute(new StyleChange(this, cell, style));
            }
            return style;
        }

        styleForCellChanged(cell: Cell, style: string): string {
            /** Inner callback to update the style of the given <mxCell> using <mxCell.setStyle> and return the previous style.
             * style - String of the form [stylename;|key=value;] to specify the new cell style. */
            var previous = this.getStyle(cell);
            cell.setStyle(style);

            return previous;
        }

        isLayer(cell: Cell): boolean {
            return this.isRoot(this.getParent(cell));
        }

        private isRoot(cell: Cell): boolean {
            /** Returns true if the given cell is the root of the model and a non-null value.*/
            return cell != null && this.root == cell;
        }

        getChildren(cell: Cell): Cell[] {
            return (cell != null) ? cell.children : null;
        }

        setValue(cell: Cell, value: any) {
            /** Sets the user object of then given <mxCell> using <mxValueChange> and adds the change to the current transaction. */
            this.execute(new ValueChange(this, cell, value));
            return value;
        }

        valueForCellChanged(cell: Cell, value: Node) {
            /** Inner callback to update the user object of the given <mxCell> using <mxCell.valueChanged> and return the previous value,
             * that is, the return value of <mxCell.valueChanged>.  To change a specific attribute in an XML node, the following code can be used.
             * (code)
             * graph.getModel().valueForCellChanged = function(cell, value)
             * {
             *   var previous = cell.value.getAttribute('label');
             *   cell.value.setAttribute('label', value);
             *   return previous;
             * };
             * (end) 
             */
            return cell.valueChanged(value);
        }

        getChildCells(parent: Cell, vertices: boolean, edges: boolean): Cell[] {
            /** Returns the children of the given cell that are vertices and/or edges depending on the arguments.
             * vertices - Boolean indicating if child vertices should be returned. Default is false.
             * edges - Boolean indicating if child edges should be returned. Default is false.
             */
            vertices = (vertices != null) ? vertices : false;
            edges = (edges != null) ? edges : false;

            var childCount = this.getChildCount(parent);
            var result: Cell[] = [];

            for (var i = 0; i < childCount; i++) {
                var child = this.getChildAt(parent, i);

                if ((!edges && !vertices) || (edges && this.isEdge(child)) ||
                (vertices && this.isVertex(child))) {
                    result.push(child);
                }
            }

            return result;
        }

        getEdges(cell: Cell, incoming: boolean = true, outgoing: boolean = true, includeLoops: boolean = true): Cell[] {
            /** Returns all distinct edges connected to this cell as a new array of <mxCells>. If at least one of incoming or outgoing is true, then loops
             * are ignored, otherwise if both are false, then all edges connected to the given cell are returned including loops.
             * cell - <mxCell> that specifies the cell.
             * incoming - Optional boolean that specifies if incoming edges should be returned. Default is true.
             * outgoing - Optional boolean that specifies if outgoing edges should be returned. Default is true.
             * includeLoops - Optional boolean that specifies if loops should be returned.  Default is true. 
             */
            var edgeCount = this.getEdgeCount(cell);
            var result: Cell[] = [];

            for (var i = 0; i < edgeCount; i++) {
                var edge = this.getEdgeAt(cell, i);
                var source = this.getTerminal(edge, true);
                var target = this.getTerminal(edge, false);

                if ((includeLoops && source == target) || ((source != target) && ((incoming && target == cell) ||
                (outgoing && source == cell)))) {
                    result.push(edge);
                }
            }

            return result;
        }

        getTopmostCells(cells: Cell[]): Cell[] {
            /** Returns the topmost cells of the hierarchy in an array that contains no descendants for each <mxCell> that it contains. Duplicates should be
             * removed in the cells array to improve performance. 
             */
            var tmp: Cell[] = [];

            for (var i = 0; i < cells.length; i++) {
                var cell = cells[i];
                var topmost = true;
                var parent = this.getParent(cell);

                while (parent != null) {
                    if (Utils.indexOf(cells, parent) >= 0) {
                        topmost = false;
                        break;
                    }

                    parent = this.getParent(parent);
                }

                if (topmost) {
                    tmp.push(cell);
                }
            }

            return tmp;
        }

        rootChanged(root: Cell): Cell {
            /** Inner callback to change the root of the model and update the internal datastructures, such as <cells> and <nextId>. Returns the previous root.
             * root - <mxCell> that specifies the new root. */
            var oldRoot = this.root;
            this.root = root;

            // Resets counters and datastructures
            this.nextId = 0;
            this.cells = null;
            this.cellAdded(root);

            return oldRoot;
        }

        getDescendants(parent: Cell): Cell[] {
            /** Returns all descendants of the given cell and the cell itself in an array.
             * parent - <mxCell> whose descendants should be returned. */
            return this.filterDescendants(null, parent);
        }

        visibleStateForCellChanged(cell: Cell, visible: boolean): boolean {
            /** Inner callback to update the visible state of the given <mxCell> using <mxCell.setCollapsed> and return the previous visible state. */
            var previous = this.isVisible(cell);
            cell.setVisible(visible);
            return previous;
        }

        private setRoot(root: Cell) {
            this.execute(new RootChange(this, root));
            return root;
        }

        private clear() {
            this.setRoot(this.createRoot());
        }

        createRoot(): Cell {
            var cell = new Cell();
            cell.insert(new Cell());

            return cell;
        }

        /** Removes the specified cell from the model using <mxChildChange> and adds the change to the current transaction. This operation will remove the
        * cell and all of its children from the model. Returns the removed cell. */
        remove(cell: Cell): Cell {
            if (cell == this.root) {
                this.setRoot(null);
            } else if (this.getParent(cell) != null) {
                this.execute(new ChildChange(this, null, cell));
            }

            return cell;
        }

        /** Returns an array that represents the set (no duplicates) of all parents for the given array of cells.
        * cells - Array of cells whose parents should be returned. */
        getParents(cells: Cell[]): Cell[] {
            var parents: Cell[] = [];

            if (cells != null) {
                var hash = new Object();

                for (var i = 0; i < cells.length; i++) {
                    var parent = this.getParent(cells[i]);

                    if (parent != null) {
                        var id = CellPath.create(parent);

                        if (hash[id] == null) {
                            hash[id] = parent;
                            parents.push(parent);
                        }
                    }
                }
            }

            return parents;
        }

        /** Returns a deep clone of the given <mxCell> (including the children) which is created using <cloneCells>. */
        cloneCell(cell: Cell): Cell {
            if (cell != null) {
                return this.cloneCells([cell], true)[0];
            }

            return null;
        }
    }
}


