/// <reference path="GraphLayout.ts"/>

module Five {
    export class FastOrganicLayout extends BasicLayout implements ILayout {
        constructor(graph: Graph) {
            super(graph);
        }

        /** Specifies if the top left corner of the input cells should be the origin of the layout result. Default is true. */
        private useInputOrigin = true;

        /** Specifies if all edge points of traversed edges should be removed. Default is true. */
        private resetEdges = true;

        /** Specifies if the STYLE_NOEDGESTYLE flag should be set on edges that are modified by the result. Default is true. */
        private disableEdgeStyle = true;

        /** The force constant by which the attractive forces are divided and the replusive forces are multiple by the square of. The value equates to the average radius there is of free space around each node. */
        forceConstant = 50;

        /** Cache of <forceConstant>^2 for performance.*/
        private forceConstantSquared = 0;

        /** Minimal distance limit. Default is 2. Prevents of dividing by zero. */
        private minDistanceLimit = 2;

        /** Minimal distance limit. Default is 2. Prevents of dividing by zero. */
        private maxDistanceLimit = 500;

        /** Cached version of <minDistanceLimit> squared. */
        private minDistanceLimitSquared = 4;

        /** Start value of temperature. Default is 200. */
        private initialTemp = 200;

        /** Temperature to limit displacement at later stages of layout. */
        private temperature = 0;

        /** Total number of iterations to run the layout though.*/
        private maxIterations = 0;

        /** Current iteration count. */
        private iteration = 0;

        /** An array of all vertices to be laid out. */
        private vertexArray: Cell[];

        /** An array of locally stored X co-ordinate displacements for the vertices. */
        private dispX: number[];

        /** An array of locally stored Y co-ordinate displacements for the vertices. */
        private dispY: number[];

        /** An array of locally stored co-ordinate positions for the vertices. */
        private cellLocation: number[][];

        /** The approximate radius of each cell, nodes only.*/
        private radius: number[];

        /** The approximate radius squared of each cell, nodes only. */
        private radiusSquared: number[];

        /** Array of booleans representing the movable states of the vertices.*/
        private isMoveable: boolean[];

        /** Local copy of cell neighbours.*/
        private neighbours: number[][];

        /** Hashtable from cells to local indices.*/
        private indices: number[];

        /** Boolean flag that specifies if the layout is allowed to run. If this is set to false, then the layout exits in the following iteration. */
        private allowedToRun = true;

        /** Returns a boolean indicating if the given <mxCell> should be ignored as a vertex. This returns true if the cell has no connections.
         * vertex - <mxCell> whose ignored state should be returned. */
        isVertexIgnored(vertex: Cell) : boolean{
            return super.isVertexIgnored(vertex) || this.graph.getConnections(vertex).length === 0;
        }

        /** Implements <GraphLayout.execute>. This operates on all children of the given parent where <isVertexIgnored> returns false. */
        execute(parent: Cell) {
            var model = this.graph.getModel();
            this.vertexArray = [];
            var cells = this.graph.getChildVertices(parent);
            var i: number;
            for (i = 0; i < cells.length; i++) {
                if (!this.isVertexIgnored(cells[i])) {
                    this.vertexArray.push(cells[i]);
                }
            }

            var initialBounds = (this.useInputOrigin) ?
                this.graph.getBoundingBoxFromGeometry(this.vertexArray) :
                null;
            var n = this.vertexArray.length;

            this.indices = [];
            this.dispX = [];
            this.dispY = [];
            this.cellLocation = [];
            this.isMoveable = [];
            this.neighbours = [];
            this.radius = [];
            this.radiusSquared = [];

            if (this.forceConstant < 0.001) {
                this.forceConstant = 0.001;
            }

            this.forceConstantSquared = this.forceConstant * this.forceConstant;

            // Create a map of vertices first. This is required for the array of
            // arrays called neighbours which holds, for each vertex, a list of
            // ints which represents the neighbours cells to that vertex as
            // the indices into vertexArray
            var vertex: Cell;
            var x: number;
            var y: number;
            var id;
            var bounds: Rectangle;
            for (i = 0; i < this.vertexArray.length; i++) {
                vertex = this.vertexArray[i];
                this.cellLocation[i] = [];

                // Set up the mapping from array indices to cells
                id = CellPath.create(vertex);
                this.indices[id] = i;
                bounds = this.getVertexBounds(vertex); // Set the X,Y value of the internal version of the cell to the center point of the vertex for better positioning
                var width = bounds.width;
                var height = bounds.height;

                // Randomize (0, 0) locations
                x = bounds.x;
                y = bounds.y;
                this.cellLocation[i][0] = x + width / 2.0;
                this.cellLocation[i][1] = y + height / 2.0;
                this.radius[i] = Math.min(width, height);
                this.radiusSquared[i] = this.radius[i] * this.radius[i];
            }

            // Moves cell location back to top-left from center locations used in
            // algorithm, resetting the edge points is part of the transaction
            model.beginUpdate();
            try {
                for (i = 0; i < n; i++) {
                    this.dispX[i] = 0;
                    this.dispY[i] = 0;
                    this.isMoveable[i] = this.isVertexMovable(this.vertexArray[i]);

                    // Get lists of neighbours to all vertices, translate the cells
                    // obtained in indices into vertexArray and store as an array
                    // against the orginial cell index
                    var edges = this.graph.getConnections(this.vertexArray[i], parent);
                    cells = this.graph.getOpposites(edges, this.vertexArray[i]);
                    this.neighbours[i] = [];

                    for (var j = 0; j < cells.length; j++) {
                        // Resets the points on the traversed edge
                        if (this.resetEdges) {
                            this.graph.resetEdge(edges[j]);
                        }

                        if (this.disableEdgeStyle) {
                            this.setEdgeStyleEnabled(edges[j], false);
                        }

                        // Looks the cell up in the indices dictionary
                        id = CellPath.create(cells[j]);
                        var index = this.indices[id];

                        // Check the connected cell in part of the vertex list to be
                        // acted on by this layout
                        if (index != null) {
                            this.neighbours[i][j] = index;
                        }
                        // Else if index of the other cell doesn't correspond to any cell listed to be acted upon in this layout. 
                        // Set the index to the value of this vertex (a dummy self-loop) so the attraction force of the edge is not calculated
                        else {
                            this.neighbours[i][j] = i;
                        }
                    }
                }
                this.temperature = this.initialTemp;

                // If max number of iterations has not been set, guess it
                if (this.maxIterations === 0) {
                    this.maxIterations = 20 * Math.sqrt(n);
                }

                // Main iteration loop
                for (this.iteration = 0; this.iteration < this.maxIterations; this.iteration++) {
                    if (!this.allowedToRun) {
                        return;
                    }

                    // Calculate repulsive forces on all vertices
                    this.calcRepulsion();

                    // Calculate attractive forces through edges
                    this.calcAttraction();

                    this.calcPositions();
                    this.reduceTemperature();
                }

                var minx = null;
                var miny = null;

                for (i = 0; i < this.vertexArray.length; i++) {
                    vertex = this.vertexArray[i];
                    if (this.isVertexMovable(vertex)) {
                        bounds = this.getVertexBounds(vertex);
                        if (bounds != null) {
                            this.cellLocation[i][0] -= bounds.width / 2.0;
                            this.cellLocation[i][1] -= bounds.height / 2.0;
                            x = this.graph.snap(this.cellLocation[i][0]);
                            y = this.graph.snap(this.cellLocation[i][1]);
                            this.setVertexLocation(vertex, x, y);

                            if (minx == null) {
                                minx = x;
                            } else {
                                minx = Math.min(minx, x);
                            }

                            if (miny == null) {
                                miny = y;
                            } else {
                                miny = Math.min(miny, y);
                            }
                        }
                    }
                }

                // Modifies the cloned geometries in-place. Not needed
                // to clone the geometries again as we're in the same
                // undoable change.
                var dx = -(minx || 0) + 1;
                var dy = -(miny || 0) + 1;

                if (initialBounds != null) {
                    dx += initialBounds.x;
                    dy += initialBounds.y;
                }

                this.graph.moveCells(this.vertexArray, dx, dy);
            } finally {
                model.endUpdate();
            }
        }

        /** Takes the displacements calculated for each cell and applies them to the local cache of cell positions. Limits the displacement to the current temperature. */
        private calcPositions() {
            for (var index = 0; index < this.vertexArray.length; index++) {
                if (this.isMoveable[index]) {
                    // Get the distance of displacement for this node for this
                    // iteration
                    var deltaLength = Math.sqrt(this.dispX[index] * this.dispX[index] +
                        this.dispY[index] * this.dispY[index]);

                    if (deltaLength < 0.001) {
                        deltaLength = 0.001;
                    }

                    // Scale down by the current temperature if less than the
                    // displacement distance
                    var newXDisp = this.dispX[index] / deltaLength
                        * Math.min(deltaLength, this.temperature);

                    var newYDisp = this.dispY[index] / deltaLength
                        * Math.min(deltaLength, this.temperature);

                    // reset displacements
                    this.dispX[index] = 0;
                    this.dispY[index] = 0;

                    // Update the cached cell locations
                    this.cellLocation[index][0] += newXDisp;
                    this.cellLocation[index][1] += newYDisp;
                }
            }
        }

        /** Calculates the attractive forces between all laid out nodes linked by edges */
        private calcAttraction() {
            // Check the neighbours of each vertex and calculate the attractive
            // force of the edge connecting them
            for (var i = 0; i < this.vertexArray.length; i++) {
                for (var k = 0; k < this.neighbours[i].length; k++) {
                    // Get the index of the othe cell in the vertex array
                    var j = this.neighbours[i][k];

                    // Do not proceed self-loops
                    if (i !== j &&
                        this.isMoveable[i] &&
                        this.isMoveable[j]) {
                        var xDelta = this.cellLocation[i][0] - this.cellLocation[j][0];
                        var yDelta = this.cellLocation[i][1] - this.cellLocation[j][1];

                        // The distance between the nodes
                        var deltaLengthSquared = xDelta * xDelta + yDelta
                            * yDelta - this.radiusSquared[i] - this.radiusSquared[j];

                        if (deltaLengthSquared < this.minDistanceLimitSquared) {
                            deltaLengthSquared = this.minDistanceLimitSquared;
                        }

                        var deltaLength = Math.sqrt(deltaLengthSquared);
                        var force = (deltaLengthSquared) / this.forceConstant;

                        var displacementX = (xDelta / deltaLength) * force;
                        var displacementY = (yDelta / deltaLength) * force;

                        this.dispX[i] -= displacementX;
                        this.dispY[i] -= displacementY;

                        this.dispX[j] += displacementX;
                        this.dispY[j] += displacementY;
                    }
                }
            }
        }

        /** Calculates the repulsive forces between all laid out nodes */
        private calcRepulsion() {
            var vertexCount = this.vertexArray.length;

            for (var i = 0; i < vertexCount; i++) {
                for (var j = i; j < vertexCount; j++) {
                    // Exits if the layout is no longer allowed to run
                    if (!this.allowedToRun) {
                        return;
                    }

                    if (j !== i &&
                        this.isMoveable[i] &&
                        this.isMoveable[j]) {
                        var xDelta = this.cellLocation[i][0] - this.cellLocation[j][0];
                        var yDelta = this.cellLocation[i][1] - this.cellLocation[j][1];

                        if (xDelta === 0) {
                            xDelta = 0.01 + Math.random();
                        }

                        if (yDelta === 0) {
                            yDelta = 0.01 + Math.random();
                        }

                        // Distance between nodes
                        var deltaLength = Math.sqrt((xDelta * xDelta)
                            + (yDelta * yDelta));
                        var deltaLengthWithRadius = deltaLength - this.radius[i]
                            - this.radius[j];

                        if (deltaLengthWithRadius > this.maxDistanceLimit) {
                            // Ignore vertices too far apart
                            continue;
                        }

                        if (deltaLengthWithRadius < this.minDistanceLimit) {
                            deltaLengthWithRadius = this.minDistanceLimit;
                        }

                        var force = this.forceConstantSquared / deltaLengthWithRadius;

                        var displacementX = (xDelta / deltaLength) * force;
                        var displacementY = (yDelta / deltaLength) * force;

                        this.dispX[i] += displacementX;
                        this.dispY[i] += displacementY;

                        this.dispX[j] -= displacementX;
                        this.dispY[j] -= displacementY;
                    }
                }
            }
        }

        /** Reduces the temperature of the layout from an initial setting in a linear fashion to zero. */
        reduceTemperature() { 
                this.temperature = this.initialTemp * (1.0 - this.iteration / this.maxIterations);
            }
    }
}