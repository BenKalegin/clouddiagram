/// <reference path="GraphLayout.ts"/>

module Five {
    /**
     * Extends <mxGraphLayout> to implement a compact tree (Moen) algorithm. This
     * layout is suitable for graphs that have no cycles (trees). Vertices that are
     * not connected to the tree will be ignored by this layout. */
    export class CompactTreeLayout extends BasicLayout implements ILayout{
        constructor(graph: Graph, horizontal = true, invert = false) {
            super(graph);
            this.horizontal = horizontal;
            this.invert = invert;
        }

        /** Specifies the orientation of the layout. Default is true. */
        private horizontal: boolean;	 

        /** Specifies if edge directions should be inverted. Default is false. */
        private invert: boolean;	 

        /** If the parents should be resized to match the width/height of the children. Default is true. */
        private resizeParent = true;

        /** Padding added to resized parents. */
        private groupPadding = 10;

        /** A set of the parents that need updating based on children process as part of the layout. */
        private parentsChanged: StringDictionary<Cell> = null;

        /** Specifies if the tree should be moved to the top, left corner if it is inside a top-level layer. Default is false. */
        private moveTree = false;

        /** Holds the levelDistance. Default is 10. */
        private levelDistance = 10;

        /** Holds the nodeDistance. Default is 20.*/
        private nodeDistance = 20;

        /** Specifies if all edge points of traversed edges should be removed. Default is true. */
        private resetEdges = true;

        /** The preferred horizontal distance between edges exiting a vertex. */
        private prefHozEdgeSep = 5;

        /** The preferred vertical offset between edges exiting a vertex. */
        private prefVertEdgeOff = 4;

        /** The minimum distance for an edge jetty from a vertex. */
        private minEdgeJetty = 8;

        /** The size of the vertical buffer in the center of inter-rank channels where edge control points should not be placed. */
        private channelBuffer = 4;

        /** Whether or not to apply the internal tree edge routing. */
        private edgeRouting = true;

        /** Specifies if edges should be sorted according to the order of their opposite terminal cell in the model. */
        private sortEdges = false;

        /** Whether or not the tops of cells in each rank should be aligned across the rank */
        private alignRanks = false;

        /** An array of the maximum height of cells (relative to the layout direction) per rank */
        private maxRankHeight: number[] = null;

        /** The cell to use as the root of the tree */
        private root: Cell = null;

        /** The internal node representation of the root cell. Do not set directly, this value is only exposed to assist with post-processing functionality */
        private node: TreeNode = null;

        /** Returns a boolean indicating if the given <mxCell> should be ignored as a vertex. This returns true if the cell has no connections.
         * vertex - <mxCell> whose ignored state should be returned.*/
        isVertexIgnored(vertex: Cell): boolean {
            return super.isVertexIgnored(vertex) || this.graph.getConnections(vertex).length === 0;
        }

        private isHorizontal() : boolean {
            return this.horizontal;
        }

        /** Implements <mxGraphLayout.execute>.
         * If the parent has any connected edges, then it is used as the root of the tree. Else, <mxGraph.findTreeRoots> will be used to find a suitable
         * root node within the set of children of the given parent.
         * parent - <mxCell> whose children should be laid out.
         * root - Optional <mxCell> that will be used as the root of the tree. */
        execute(parent: Cell, root?: Cell) {
            this.parent = parent;
            var model = this.graph.getModel();

            if (root == null) {
                // Takes the parent as the root if it has outgoing edges
                if (this.graph.getEdges(parent, model.getParent(parent),
                    this.invert, !this.invert, false).length > 0) {
                    this.root = parent;
                }
                // Tries to find a suitable root in the parent's children
                else {
                    var roots = this.graph.findTreeRoots(parent, true, this.invert);

                    if (roots.length > 0) {
                        for (var i = 0; i < roots.length; i++) {
                            if (!this.isVertexIgnored(roots[i]) &&
                                this.graph.getEdges(roots[i], null,
                                    this.invert, !this.invert, false).length > 0) {
                                this.root = roots[i];
                                break;
                            }
                        }
                    }
                }
            } else {
                this.root = root;
            }

            if (this.root != null) {
                if (this.resizeParent) {
                    this.parentsChanged = new StringDictionary<Cell>();
                } else {
                    this.parentsChanged = null;
                }

                model.beginUpdate();

                try {
                    var visited = new StringDictionary<Cell>();
                    this.node = this.dfs(this.root, parent, visited);

                    if (this.alignRanks) {
                        this.maxRankHeight = [];
                        this.findRankHeights(this.node, 0);
                        this.setCellHeights(this.node, 0);
                    }

                    if (this.node != null) {
                        this.layout(this.node);
                        var x0 = this.graph.gridSize;
                        var y0 = x0;

                        if (!this.moveTree) {
                            var g = this.getVertexBounds(this.root);

                            if (g != null) {
                                x0 = g.x;
                                y0 = g.y;
                            }
                        }

                        var bounds = null;

                        if (this.isHorizontal()) {
                            bounds = this.horizontalLayout(this.node, x0, y0, null);
                        } else {
                            bounds = this.verticalLayout(this.node, null, x0, y0, null);
                        }

                        if (bounds != null) {
                            var dx = 0;
                            var dy = 0;

                            if (bounds.x < 0) {
                                dx = Math.abs(x0 - bounds.x);
                            }

                            if (bounds.y < 0) {
                                dy = Math.abs(y0 - bounds.y);
                            }

                            if (dx !== 0 || dy !== 0) {
                                this.moveNode(this.node, dx, dy);
                            }

                            if (this.resizeParent) {
                                this.adjustParents();
                            }

                            if (this.edgeRouting) {
                                // Iterate through all edges setting their positions
                                this.localEdgeProcessing(this.node);
                            }
                        }
                    }
                } finally {
                    model.endUpdate();
                }
            }
        }

        /** Moves the specified node and all of its children by the given amount. */
        private moveNode(node: TreeNode, dx: number, dy: number) {
            node.x += dx;
            node.y += dy;
            this.apply(node);

            var child = node.child;

            while (child != null) {
                this.moveNode(child, dx, dy);
                child = child.next;
            }
        }


        /** Called if <sortEdges> is true to sort the array of outgoing edges in place. */
        private sortOutgoingEdges(source: Cell, edges: Cell[]) {
            var lookup = new Dictionary<Cell, string>();

            edges.sort( (e1, e2) => {
                var end1 = e1.getTerminal(e1.getTerminal(false) === source);
                var p1 = lookup.get(end1);

                if (p1 == null) {
                    p1 = CellPath.create(end1);
                    lookup.put(end1, p1);
                }

                var end2 = e2.getTerminal(e2.getTerminal(false) === source);
                var p2 = lookup.get(end2);

                if (p2 == null) {
                    p2 = CellPath.create(end2);
                    lookup.put(end2, p2);
                }

                return CellPath.compare(p1, p2);
            });
        }

        /** Stores the maximum height (relative to the layout direction) of cells in each rank  */
        private findRankHeights(node: TreeNode, rank: number) {
            if (this.maxRankHeight[rank] == null || this.maxRankHeight[rank] < node.height) {
                this.maxRankHeight[rank] = node.height;
            }

            var child = node.child;

            while (child != null) {
                this.findRankHeights(child, rank + 1);
                child = child.next;
            }
        }

        /** Set the cells heights (relative to the layout direction) when the tops of each rank are to be aligned */
        private setCellHeights(node: TreeNode, rank: number) {
            if (this.maxRankHeight[rank] != null && this.maxRankHeight[rank] > node.height) {
                node.height = this.maxRankHeight[rank];
            }

            var child = node.child;

            while (child != null) {
                this.setCellHeights(child, rank + 1);
                child = child.next;
            }
        }

        /** Does a depth first search starting at the specified cell. Makes sure the specified parent is never left by the algorithm. */
        private dfs(cell: Cell, parent: Cell, visited: StringDictionary<Cell>): TreeNode {
            var id = CellPath.create(cell);
            var node: TreeNode = null;

            if (cell != null && visited[id] == null && !this.isVertexIgnored(cell)) {
                visited[id] = cell;
                node = this.createNode(cell);

                var prev = null;
                var out = this.graph.getEdges(cell, parent, this.invert, !this.invert, false, true);
                var view = this.graph.getView();

                if (this.sortEdges) {
                    this.sortOutgoingEdges(cell, out);
                }

                for (var i = 0; i < out.length; i++) {
                    var edge = out[i];

                    if (!this.isEdgeIgnored(edge)) {
                        // Resets the points on the traversed edge
                        if (this.resetEdges) {
                            this.setEdgePoints(edge, null);
                        }

                        if (this.edgeRouting) {
                            this.setEdgeStyleEnabled(edge, false);
                            this.setEdgePoints(edge, null);
                        }

                        // Checks if terminal in same swimlane
                        var state = view.getState(edge);
                        var target = (state != null) ? state.getVisibleTerminal(this.invert) : view.getVisibleTerminal(edge, this.invert);
                        var tmp = this.dfs(target, parent, visited);

                        if (tmp != null && Cells.getGeometry(target) != null) {
                            if (prev == null) {
                                node.child = tmp;
                            } else {
                                prev.next = tmp;
                            }

                            prev = tmp;
                        }
                    }
                }
            }

            return node;
        }

        /** Starts the actual compact tree layout algorithm at the given node. */
        private layout(node: TreeNode) {
            if (node != null) {
                var child = node.child;

                while (child != null) {
                    this.layout(child);
                    child = child.next;
                }

                if (node.child != null) {
                    this.attachParent(node, this.join(node));
                } else {
                    this.layoutLeaf(node);
                }
            }
        }

        private horizontalLayout(node: TreeNode, x0: number, y0: number, bounds: Rectangle): Rectangle {
            node.x += x0 + node.offsetX;
            node.y += y0 + node.offsetY;
            bounds = this.apply(node, bounds);
            var child = node.child;

            if (child != null) {
                bounds = this.horizontalLayout(child, node.x, node.y, bounds);
                var siblingOffset = node.y + child.offsetY;
                var s = child.next;

                while (s != null) {
                    bounds = this.horizontalLayout(s, node.x + child.offsetX, siblingOffset, bounds);
                    siblingOffset += s.offsetY;
                    s = s.next;
                }
            }

            return bounds;
        }

        private verticalLayout(node: TreeNode, parent: TreeNode, x0: number, y0: number, bounds: Rectangle) : Rectangle {
            node.x += x0 + node.offsetY;
            node.y += y0 + node.offsetX;
            bounds = this.apply(node, bounds);
            var child = node.child;

            if (child != null) {
                bounds = this.verticalLayout(child, node, node.x, node.y, bounds);
                var siblingOffset = node.x + child.offsetY;
                var s = child.next;

                while (s != null) {
                    bounds = this.verticalLayout(s, node, siblingOffset, node.y + child.offsetX, bounds);
                    siblingOffset += s.offsetY;
                    s = s.next;
                }
            }

            return bounds;
        }

        private attachParent(node: TreeNode, height: number) {
            var x = this.nodeDistance + this.levelDistance;
            var y2 = (height - node.width) / 2 - this.nodeDistance;
            var y1 = y2 + node.width + 2 * this.nodeDistance - height;

            node.child.offsetX = x + node.height;
            node.child.offsetY = y1;

            node.contour.upperHead = this.createLine(node.height, 0, this.createLine(x, y1, node.contour.upperHead));
            node.contour.lowerHead = this.createLine(node.height, 0, this.createLine(x, y2, node.contour.lowerHead));
        }

        private layoutLeaf(node: TreeNode) {
            var dist = 2 * this.nodeDistance;

            node.contour.upperTail = this.createLine(node.height + dist, 0);
            node.contour.upperHead = node.contour.upperTail;
            node.contour.lowerTail = this.createLine(0, -node.width - dist);
            node.contour.lowerHead = this.createLine(node.height + dist, 0, node.contour.lowerTail);
        }

        private join(node: TreeNode): number {
            var dist = 2 * this.nodeDistance;

            var child = node.child;
            node.contour = child.contour;
            var h = child.width + dist;
            var sum = h;
            child = child.next;

            while (child != null) {
                var d = this.merge(node.contour, child.contour);
                child.offsetY = d + h;
                child.offsetX = 0;
                h = child.width + dist;
                sum += d + h;
                child = child.next;
            }

            return sum;
        }

        private merge(p1: Contour, p2: Contour): number {
            var x = 0;
            var y = 0;
            var total = 0;

            var upper = p1.lowerHead;
            var lower = p2.upperHead;

            while (lower != null && upper != null) {
                var d = this.offset(x, y, lower.dx, lower.dy, upper.dx, upper.dy);
                y += d;
                total += d;

                if (x + lower.dx <= upper.dx) {
                    x += lower.dx;
                    y += lower.dy;
                    lower = lower.next;
                } else {
                    x -= upper.dx;
                    y -= upper.dy;
                    upper = upper.next;
                }
            }
            var b: Line;
            if (lower != null) {
                b = this.bridge(p1.upperTail, 0, 0, lower, x, y);
                p1.upperTail = (b.next != null) ? p2.upperTail : b;
                p1.lowerTail = p2.lowerTail;
            } else {
                b = this.bridge(p2.lowerTail, x, y, upper, 0, 0);
                if (b.next == null) {
                    p1.lowerTail = b;
                }
            }

            p1.lowerHead = p2.lowerHead;

            return total;
        }

        private offset(x: number, y: number, lowerDx: number, lowerDy: number, upperDx: number, upperDy: number): number {
            var d: number;

            if (upperDx <= x || x + lowerDx <= 0) {
                return 0;
            }

            var t = upperDx * lowerDy - lowerDx * upperDy;
            var s: number;
            if (t > 0) {
                if (x < 0) {
                    s = x * lowerDy;
                    d = s / lowerDx - y;
                } else if (x > 0) {
                    s = x * upperDy;
                    d = s / upperDx - y;
                } else {
                    d = -y;
                }
            } else if (upperDx < x + lowerDx) {
                s = (upperDx - x) * lowerDy;
                d = upperDy - (y + s / lowerDx);
            } else if (upperDx > x + lowerDx) {
                s = (lowerDx + x) * upperDy;
                d = s / upperDx - (y + lowerDy);
            } else {
                d = upperDy - (y + lowerDy);
            }

            if (d > 0) {
                return d;
            } else {
                return 0;
            }
        }

        private bridge(line1: Line, x1: number, y1: number, line2: Line, x2: number, y2: number) : Line {
            var dx = x2 + line2.dx - x1;
            var dy: number;
            var s: number;

            if (line2.dx === 0) {
                dy = line2.dy;
            }
            else {
                s = dx * line2.dy;
                dy = s / line2.dx;
            }

            var r = this.createLine(dx, dy, line2.next);
            line1.next = this.createLine(0, y2 + line2.dy - dy - y1, r);

            return r;
        }

        private createNode(cell: Cell) : TreeNode {
            var node = new TreeNode();
            node.cell = cell;
            node.x = 0;
            node.y = 0;
            node.width = 0;
            node.height = 0;

            var geo = this.getVertexBounds(cell);

            if (geo != null) {
                if (this.isHorizontal()) {
                    node.width = geo.height;
                    node.height = geo.width;
                }
                else {
                    node.width = geo.width;
                    node.height = geo.height;
                }
            }

            node.offsetX = 0;
            node.offsetY = 0;
            node.contour = new Contour();

            return node;
        }

        private apply(node: TreeNode, bounds?: Rectangle): Rectangle {
            var model = this.graph.getModel();
            var cell = node.cell;
            var g: Rectangle = Cells.getGeometry(cell);

            if (cell != null && g != null) {
                if (this.isVertexMovable(cell)) {
                    g = this.setVertexLocation(cell, node.x, node.y);

                    if (this.resizeParent) {
                        var parent = model.getParent(cell);
                        var id = CellPath.create(parent);
				
                        // Implements set semantic
                        if (this.parentsChanged[id] == null) {
                            this.parentsChanged[id] = parent;
                        }
                    }
                }

                if (bounds == null) {
                    // ReSharper disable once QualifiedExpressionMaybeNull
                    bounds = new Rectangle(g.x, g.y, g.width, g.height);
                }
                else {
                    // ReSharper disable once QualifiedExpressionMaybeNull
                    bounds = new Rectangle(Math.min(bounds.x, g.x),
                        Math.min(bounds.y, g.y),
                        Math.max(bounds.x + bounds.width, g.x + g.width),
                        Math.max(bounds.y + bounds.height, g.y + g.height));
                }
            }

            return bounds;
        }

        private createLine(dx: number, dy: number, next?: Line) : Line {
            var line = new Line();
            line.dx = dx;
            line.dy = dy;
            line.next = next;

            return line;
        }

        /** Adjust parent cells whose child geometries have changed. The default implementation adjusts the group to just fit around the children with a padding. */
        private adjustParents() {
            var tmp = this.parentsChanged.getValues();
            this.arrangeGroups(Utils.sortCells(tmp, true), this.groupPadding);
        }

        /** Moves the specified node and all of its children by the given amount. */
        private localEdgeProcessing(node: TreeNode) {
            this.processNodeOutgoing(node);
            var child = node.child;

            while (child != null) {
                this.localEdgeProcessing(child);
                child = child.next;
            }
        }

        /** Separates the x position of edges as they connect to vertices */
        private processNodeOutgoing(node: TreeNode) {
            var child = node.child;
            var parentCell = node.cell;

            var childCount = 0;
            var sortedCells = [];

            while (child != null) {
                childCount++;

                var sortingCriterion = child.x;

                if (this.horizontal) {
                    sortingCriterion = child.y;
                }

                sortedCells.push(new WeightedCellSorter(child, sortingCriterion));
                child = child.next;
            }

            sortedCells.sort(WeightedCellSorter.compare);

            var availableWidth = node.width;

            var requiredWidth = (childCount + 1) * this.prefHozEdgeSep;

            // Add a buffer on the edges of the vertex if the edge count allows
            if (availableWidth > requiredWidth + (2 * this.prefHozEdgeSep)) {
                availableWidth -= 2 * this.prefHozEdgeSep;
            }

            var edgeSpacing = availableWidth / childCount;

            var currentXOffset = edgeSpacing / 2.0;

            if (availableWidth > requiredWidth + (2 * this.prefHozEdgeSep)) {
                currentXOffset += this.prefHozEdgeSep;
            }

            var currentYOffset = this.minEdgeJetty - this.prefVertEdgeOff;
            var maxYOffset = 0;

            var parentBounds = this.getVertexBounds(parentCell);
            child = node.child;

            for (var j = 0; j < sortedCells.length; j++) {
                var childCell = sortedCells[j].cell.cell;
                var childBounds = this.getVertexBounds(childCell);

                var edges = this.graph.getEdgesBetween(parentCell, childCell, false);

                var newPoints = [];
                var x = 0;
                var y = 0;

                for (var i = 0; i < edges.length; i++) {
                    if (this.horizontal) {
                        // Use opposite co-ords, calculation was done for 
                        // 
                        x = parentBounds.x + parentBounds.width;
                        y = parentBounds.y + currentXOffset;
                        newPoints.push(new Point(x, y));
                        x = parentBounds.x + parentBounds.width + currentYOffset;
                        newPoints.push(new Point(x, y));
                        y = childBounds.y + childBounds.height / 2.0;
                        newPoints.push(new Point(x, y));
                        this.setEdgePoints(edges[i], newPoints);
                    }
                    else {
                        x = parentBounds.x + currentXOffset;
                        y = parentBounds.y + parentBounds.height;
                        newPoints.push(new Point(x, y));
                        y = parentBounds.y + parentBounds.height + currentYOffset;
                        newPoints.push(new Point(x, y));
                        x = childBounds.x + childBounds.width / 2.0;
                        newPoints.push(new Point(x, y));
                        this.setEdgePoints(edges[i], newPoints);
                    }
                }

                if (j < childCount / 2) {
                    currentYOffset += this.prefVertEdgeOff;
                }
                else if (j > childCount / 2) {
                    currentYOffset -= this.prefVertEdgeOff;
                }
                // Ignore the case if equals, this means the second of 2 jettys with the same y (even number of edges)

                //pos[k * 2] = currentX;
                currentXOffset += edgeSpacing;
                // pos[k * 2 + 1] = currentYOffset;

                maxYOffset = Math.max(maxYOffset, currentYOffset);
            }
        }
    }

    /** A utility class used to track cells whilst sorting occurs on the weighted sum of their connected edges. Does not violate (x.compareTo(y)==0) == (x.equals(y)) */
    class WeightedCellSorter {
        constructor(cell: TreeNode, weightedValue: number) {
            this.cell = cell;
            this.weightedValue = weightedValue;
        }

        /** The weighted value of the cell stored. */
        private weightedValue = 0;

        /** Whether or not to flip equal weight values. */
        private nudge = false;

        /** Whether or not this cell has been visited in the current assignment.*/
        private visited = false;

        /** The index this cell is in the model rank. */
        private rankIndex: number = null;

        /** The cell whose median value is being calculated. */
        private cell: TreeNode;

        /** Compares two WeightedCellSorters. */
        static compare = (a: WeightedCellSorter, b: WeightedCellSorter) => {
            if (a != null && b != null) {
                if (b.weightedValue > a.weightedValue) {
                    return -1;
                }
                else if (b.weightedValue < a.weightedValue) {
                    return 1;
                }
                else {
                    if (b.nudge) {
                        return -1;
                    }
                    else {
                        return 1;
                    }
                }
            }
            else {
                return 0;
            }
        }

        }

    class Line {
        dx: number;
        dy: number;
        next: Line;
    }

    class Contour {
        upperHead: Line;
        lowerHead: Line;
        upperTail: Line;
        lowerTail: Line;
    }

    class TreeNode {
        x: number;
        y: number;
        cell: Cell;
        width: number;
        height: number;
        offsetX: number;
        offsetY: number;
        contour: Contour;
        child: TreeNode;
        next: TreeNode;
    }
} 