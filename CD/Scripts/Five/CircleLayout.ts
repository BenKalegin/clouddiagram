/// <reference path="GraphLayout.ts"/>

module Five {
    export class CircleLayout extends BasicLayout implements ILayout{
        constructor(graph: Graph, private radius: number = 100) {
            super(graph);
        }

        /** Boolean specifying if the circle should be moved to the top, left corner specified by <x0> and <y0>. Default is false. */
        private moveCircle = false;

        /** Integer specifying the left coordinate of the circle. Default is 0. */
        private x0 = 0;

        /** Integer specifying the top coordinate of the circle. Default is 0. */
        private y0 = 0;

        /** Specifies if all edge points of traversed edges should be removed. Default is true. */
        private resetEdges = true;

        /** Specifies if the STYLE_NOEDGESTYLE flag should be set on edges that are modified by the result. Default is true. */
        private disableEdgeStyle = true;

        execute(parent: Cell) {
            var model = this.graph.getModel();

            // Moves the vertices to build a circle. Makes sure the radius is large enough for the vertices to not overlap
            model.beginUpdate();
            try {
                // Gets all vertices inside the parent and finds the maximum dimension of the largest vertex
                var max = 0;
                var top = null;
                var left = null;
                var vertices = [];
                var childCount = Cells.getChildCount(parent);

                for (var i = 0; i < childCount; i++) {
                    var cell = Cells.getChildAt(parent, i);

                    if (!this.isVertexIgnored(cell)) {
                        vertices.push(cell);
                        var bounds = this.getVertexBounds(cell);

                        if (top == null) {
                            top = bounds.y;
                        } else {
                            top = Math.min(top, bounds.y);
                        }

                        if (left == null) {
                            left = bounds.x;
                        } else {
                            left = Math.min(left, bounds.x);
                        }

                        max = Math.max(max, Math.max(bounds.width, bounds.height));
                    } else if (!this.isEdgeIgnored(cell)) {
                        // Resets the points on the traversed edge
                        if (this.resetEdges) {
                            this.graph.resetEdge(cell);
                        }

                        if (this.disableEdgeStyle) {
                            this.setEdgeStyleEnabled(cell, false);
                        }
                    }
                }

                var r = this.getRadius(vertices.length, max);

                // Moves the circle to the specified origin
                if (this.moveCircle) {
                    left = this.x0;
                    top = this.y0;
                }

                this.circle(vertices, r, left, top);
            } finally {
                model.endUpdate();
            }
        }

        /** Returns the radius to be used for the given vertex count. Max is the maximum width or height of all vertices in the layout. */
        private getRadius(count: number, max: number): number {
            return Math.max(count * max / Math.PI, this.radius);
        }

        /** Executes the circular layout for the specified array of vertices and the given radius. This is called from <execute>. */
        private circle(vertices: Cell[], r: number, left: number, top: number) {
            var vertexCount = vertices.length;
            var phi = 2 * Math.PI / vertexCount;

            for (var i = 0; i < vertexCount; i++) {
                if (this.isVertexMovable(vertices[i])) {
                    this.setVertexLocation(vertices[i],
                        left + r + r * Math.sin(i * phi),
                        top + r + r * Math.cos(i * phi));
                }
            }
        }

    }
}