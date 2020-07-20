module Five {
    /**
     * Class: CellOverlay
     *
     * Extends <ventSource to implement a graph overlay, represented by an icon and a tooltip. Overlays can handle and fire <click> events and are added to
     * the graph using <mxGraph.addCellOverlay>, and removed using mxGraph.removeCellOverlay, or Graph.removeCellOverlays to remove all overlays.
     * The Graph.getCellOverlays function returns the array of overlays for a given cell in a graph. If multiple overlays exist for the same cell, then
     * <getBounds> should be overridden in at least one of the overlays.
     * 
     * Overlays appear on top of all cells in a special layer. If this is not desirable, then the image must be rendered as part of the shape or label of
     * the cell instead.
     *
     * Example:
     * 
     * The following adds a new overlays for a given vertex and selects the cell
     * if the overlay is clicked.
     *
     * Fires when the user clicks on the overlay. The <code>event</code> property
     * contains the corresponding mouse event and the <code>cell</code> property
     * contains the cell. For touch devices this is fired if the element receives
     * a touchend event. 
     */ 
    export class CellOverlay {
        constructor(public image: Image, private tooltip?: string, 
            private align = HorizontalAlign.Right, 
            private verticalAlign = VerticalAlign.Bottom, 
            private offset: Point = new Point(), public cursor: string = "help" ) {
        }


        onClick = new EventListeners<ClickEvent>();
        /**
         * Defines the overlapping for the overlay, that is, the proportional distance from the origin to the point defined by the alignment. Default is 0.5.
         */
        defaultOverlap = 0.5;

        /**
         * Function: getBounds
         * 
         * Returns the bounds of the overlay for the given <mxCellState> as an <mxRectangle>. This should be overridden when using multiple overlays
         * per cell so that the overlays do not overlap.
         * 
         * The following example will place the overlay along an edge (where
         * x=[-1..1] from the start to the end of the edge and y is the
         * orthogonal offset in px).
         * 
         * (code)
         * overlay.getBounds = function(state)
         * {
         *   var bounds = mxCellOverlay.prototype.getBounds.apply(this, arguments);
         *   
         *   if (state.view.graph.getModel().isEdge(state.cell))
         *   {
         *     var pt = state.view.getPoint(state, {x: 0, y: 0, relative: true});
         *     
         *     bounds.x = pt.x - bounds.width / 2;
         *     bounds.y = pt.y - bounds.height / 2;
         *   }
         *   
         *   return bounds;
         * };
         * (end)
         * 
         * Parameters:
         * 
         * state - <mxCellState> that represents the current state of the
         * associated cell.
         */
        getBounds(state: CellState) : Rectangle{
            var isEdge = Cells.isEdge(state.cell);
            var s = state.view.scale;
            var pt: Point;

            var w = this.image.width;
            var h = this.image.height;

            if (isEdge) {
                var pts = state.absolutePoints;

                if (pts.length % 2 == 1) {
                    pt = pts[Math.floor(pts.length / 2)];
                }
                else {
                    var idx = pts.length / 2;
                    var p0 = pts[idx - 1];
                    var p1 = pts[idx];
                    pt = new Point(p0.x + (p1.x - p0.x) / 2,
                        p0.y + (p1.y - p0.y) / 2);
                }
            }
            else {
                pt = new Point();

                if (this.align == HorizontalAlign.Left) {
                    pt.x = state.x;
                }
                else if (this.align == HorizontalAlign.Center) {
                    pt.x = state.x + state.width / 2;
                }
                else {
                    pt.x = state.x + state.width;
                }

                if (this.verticalAlign == VerticalAlign.Top) {
                    pt.y = state.y;
                }
                else if (this.verticalAlign == VerticalAlign.Middle) {
                    pt.y = state.y + state.height / 2;
                }
                else {
                    pt.y = state.y + state.height;
                }
            }

            return new Rectangle(Math.round(pt.x - (w * this.defaultOverlap - this.offset.x) * s),
                Math.round(pt.y - (h * this.defaultOverlap - this.offset.y) * s), w * s, h * s);
        }

        /**
         * Function: toString
         * 
         * Returns the textual representation of the overlay to be used as the
         * tooltip. This implementation returns <tooltip>.
         */
        toString() : string {
            return this.tooltip;
        }
        
    }
}