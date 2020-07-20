module Five {
    export class Morphing extends Animation {
        /**
     * graph - Reference to the enclosing <mxGraph>.
     * steps - Optional number of steps in the morphing animation. Default is 6.
     * ease - Optional easing constant for the animation. Default is 1.5.
     * delay - Optional delay between the animation steps. Passed to <mxAnimation>. */
        constructor(private graph: Graph, private steps: number = 6, private ease: number = 1.5, delay: number = 20) {
            super(delay);
        }

        /** Contains the current step.*/
        private step = 0;

        /** Optional array of cells to be animated. If this is not specified then all cells are checked and animated if they have been moved in the current transaction. */
        private cells: Cell[] = null;

        /** Animation step. */
        updateAnimation() {
            var move = new CellStatePreview(this.graph);

            if (this.cells != null) {
                // Animates the given cells individually without recursion
                for (var i = 0; i < this.cells.length; i++) {
                    this.animateCell(this.cells[i], move, false);
                }
            } else {
                // Animates all changed cells by using recursion to find
                // the changed cells but not for the animation itself
                this.animateCell(this.graph.getModel().getRoot(), move, true);
            }

            this.show(move);

            if (move.isEmpty() || this.step++ >= this.steps) {
                this.stopAnimation();
            }
        }

        /** Shows the changes in the given <mxCellStatePreview>. */
        private show(move: CellStatePreview) {
            move.show(null);
        }

        /** Animates the given cell state using <mxCellStatePreview.moveState>. */
        private animateCell(cell: Cell, move: CellStatePreview, recurse: boolean) {
            var state = this.graph.getView().getState(cell);
            var delta = null;

            if (state != null) {
                // Moves the animated state from where it will be after the model
                // change by subtracting the given delta vector from that location
                delta = this.getDelta(state);

                if (this.graph.getModel().isVertex(cell) && (delta.x != 0 || delta.y != 0)) {
                    var translate = this.graph.view.getTranslate();
                    var scale = this.graph.view.getScale();

                    delta.x += translate.x * scale;
                    delta.y += translate.y * scale;

                    move.moveState(state, -delta.x / this.ease, -delta.y / this.ease);
                }
            }

            if (recurse && !this.stopRecursion(state, delta)) {
                var childCount = this.graph.getModel().getChildCount(cell);

                for (var i = 0; i < childCount; i++) {
                    this.animateCell(this.graph.getModel().getChildAt(cell, i), move, recurse);
                }
            }
        }

        /** Returns true if the animation should not recursively find more deltas for children if the given parent state has been animated. */
        private stopRecursion(state, delta: Point) {
            return delta != null && (delta.x != 0 || delta.y != 0);
        }

        /**
         * Function: getDelta
         *
         * Returns the vector between the current rendered state and the future
         * location of the state after the display will be updated.
         */
        private getDelta(state: CellState): Point {
            var origin = this.getOriginForCell(state.cell);
            var translate = this.graph.getView().getTranslate();
            var scale = this.graph.getView().getScale();
            var x = state.x / scale - translate.x;
            var y = state.y / scale - translate.y;

            return new Point((origin.x - x) * scale, (origin.y - y) * scale);
        }

        /**
         * Function: getOriginForCell
         *
         * Returns the top, left corner of the given cell. TODO: Improve performance
         * by using caching inside this method as the result per cell never changes
         * during the lifecycle of this object.
         */
        private getOriginForCell(cell: Cell): Point {
            var result = null;

            if (cell != null) {
                var parent = this.graph.getModel().getParent(cell);
                var geo = this.graph.getCellGeometry(cell);
                result = this.getOriginForCell(parent);

                // TODO: Handle offsets
                if (geo != null) {
                    if (geo.relative) {
                        var pgeo = this.graph.getCellGeometry(parent);

                        if (pgeo != null) {
                            result.x += geo.x * pgeo.width;
                            result.y += geo.y * pgeo.height;
                        }
                    } else {
                        result.x += geo.x;
                        result.y += geo.y;
                    }
                }
            }

            if (result == null) {
                var t = this.graph.view.getTranslate();
                result = new Point(-t.x, -t.y);
            }

            return result;
        }
    }

    interface IDelta {
        point: Point;
        state: CellState;    
    }

    class CellStatePreview {
        constructor(private graph: Graph) { 
            this.deltas = new Dictionary<Cell, IDelta>();
    }

    private deltas: Dictionary<Cell, IDelta>;

    /** Contains the number of entries in the map. */
    private count = 0;

    /** Returns true if this contains no entries. */
        isEmpty() : boolean{
        return this.count == 0;
    }

        moveState(state: CellState, dx: number, dy: number, add: boolean = true, includeEdges: boolean = true): Point {
            var delta = this.deltas.get(state.cell);

            if (delta == null) {
                // Note: Deltas stores the point and the state since the key is a string.
                delta = { point: new Point(dx, dy), state: state };
                this.deltas.put(state.cell, delta);
                this.count++;
            } else if (add) {
                delta.point.x += dx;
                delta.point.y += dy;
            } else {
                delta.point.x = dx;
                delta.point.y = dy;
            }

            if (includeEdges) {
                this.addEdges(state);
            }

            return delta.point;
        }

        show(visitor: (state: CellState) => void) {
            this.deltas.visit((delta) =>  {
                this.translateState(delta.state, delta.point.x, delta.point.y);
            });

            this.deltas.visit( delta =>  {
                this.revalidateState(delta.state, delta.point.x, delta.point.y, visitor);
            });
        }

        private translateState(state: CellState, dx: number, dy: number) {
            if (state != null) {
                var model = this.graph.getModel();

                if (model.isVertex(state.cell)) {
                    state.view.updateCellState(state);
                    var geo = Cells.getGeometry(state.cell);

                    // Moves selection cells and non-relative vertices in
                    // the first phase so that edge terminal points will
                    // be updated in the second phase
                    if ((dx != 0 || dy != 0) && geo != null && (!geo.relative || this.deltas.get(state.cell) != null)) {
                        state.x += dx;
                        state.y += dy;
                    }
                }

                var childCount = model.getChildCount(state.cell);

                for (var i = 0; i < childCount; i++) {
                    this.translateState(state.view.getState(model.getChildAt(state.cell, i)), dx, dy);
                }
            }
        }

        private revalidateState(state: CellState, dx: number, dy: number, visitor: (state: CellState) => void) {
            if (state != null) {
                var model = this.graph.getModel();

                // Updates the edge terminal points and restores the
                // (relative) positions of any (relative) children
                if (model.isEdge(state.cell)) {
                    state.view.updateCellState(state);
                }

                var geo = this.graph.getCellGeometry(state.cell);
                var pState = state.view.getState(model.getParent(state.cell));

                // Moves selection vertices which are relative
                if ((dx != 0 || dy != 0) && geo != null && geo.relative &&
                    model.isVertex(state.cell) && (pState == null ||
                        model.isVertex(pState.cell) || this.deltas.get(state.cell) != null)) {
                    state.x += dx;
                    state.y += dy;
                }

                this.graph.cellRenderer.redraw(state);

                // Invokes the visitor on the given state
                if (visitor != null) {
                    visitor(state);
                }

                var childCount = model.getChildCount(state.cell);

                for (var i = 0; i < childCount; i++) {
                    this.revalidateState(this.graph.view.getState(model.getChildAt(state.cell, i)), dx, dy, visitor);
                }
            }
        }

        private addEdges(state: CellState) {
            var model = this.graph.getModel();
            var edgeCount = model.getEdgeCount(state.cell);

            for (var i = 0; i < edgeCount; i++) {
                var s = state.view.getState(model.getEdgeAt(state.cell, i));

                if (s != null) {
                    this.moveState(s, 0, 0);
                }
            }
        }

    }
}