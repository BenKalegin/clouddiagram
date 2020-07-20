module Five {
    export class MarkEvent extends BasicEvent {
        constructor(public state: CellState) { super(); }
    }


    /**
     * A helper class to process mouse locations and highlight cells.
     * Helper class to highlight cells. To add a cell marker to an existing graph
     * for highlighting all cells, the following code is used:
     * 
     * (code)
     * var marker = new mxCellMarker(graph);
     * graph.addMouseListener({
     *   mouseDown: function() {},
     *   mouseMove: function(sender, me)
     *   {
     *     marker.process(me);
     *   },
     *   mouseUp: function() {}
     * });
     * (end)
     * */
    export class CellMarker {

        constructor(graph: Graph, validColor: string = Constants.defaultValidColor, invalidColor: string = Constants.defaultInvalidColor, hotspot: number = Constants.defaultHotspot) {
            /// <param name="graph">Reference to the enclosing Graph </param>.
            /// <param name="validColor">Optional marker color for valid states.Default is Constants.DEFAULT_VALID_COLOR. </param>
            /// <param name="invalidColor">Optional marker color for invalid states.Default is Constants.DEFAULT_INVALID_COLOR</param> 
            /// <param name="hotspot">Portion of the width and hight where a state intersects a given coordinate pair.A value of 0 means always highlight. Default is Constants.DEFAULT_HOTSPOT</param>

            if (graph != null) {
                this.graph = graph;
                this.validColor = validColor;
                this.invalidColor = invalidColor;
                this.hotspot = hotspot;
                this.highlight = new CellHighlight(graph);
            }
        }

        /* Fires after a cell has been marked or unmarked. The<code>state</code > property contains the marked < mxCellState > or null if no state is marked. */ 
        onMark = new EventListeners<MarkEvent>();

        /** Reference to the enclosing Graph.*/
        private graph = null;

        /** Specifies if the marker is enabled. Default is true.*/
        private enabled = true;

        /** Specifies the portion of the width and height that should trigger a highlight. The area around the center of the cell to be marked is used
         * as the hotspot. Possible values are between 0 and 1. Default is Constants.DEFAULT_HOTSPOT. */
        private hotspot = Constants.defaultHotspot;

        /** Specifies if the hotspot is enabled. Default is false. */
        hotspotEnabled = false;

        /** Holds the valid marker color.*/
        validColor: string = null;

        /** Holds the invalid marker color.*/
        invalidColor: string = null;

        /** Holds the current marker color.*/
        currentColor: string = null;

        /** Holds the marked <mxCellState> if it is valid.*/
        validState: CellState = null;

        /** Holds the marked CellState.*/
        markedState: CellState = null;
        highlight: CellHighlight;

        private setEnabled(enabled: boolean) {
            this.enabled = enabled;
        }

        private isEnabled(): boolean {
            return this.enabled;
        }

        private setHotspot(hotspot: number) {
            this.hotspot = hotspot;
        }

        private getHotspot(): number {
            return this.hotspot;
        }

        /** Specifies whether the hotspot should be used in <intersects>.*/
        private setHotspotEnabled(enabled: boolean) {
            this.hotspotEnabled = enabled;
        }

        private isHotspotEnabled(): boolean {
            return this.hotspotEnabled;
        }

        hasValidState(): boolean {
            return this.validState != null;
        }

        getValidState(): CellState {
            return this.validState;
        }

        getMarkedState(): CellState {
            return this.markedState;
        }

        reset() {
            this.validState = null;

            if (this.markedState != null) {
                this.markedState = null;
                this.unmark();
            }
        }

        /** Processes the given event and cell and marks the state returned by <getState> with the color returned by <getMarkerColor>. If themarkerColor is not null, 
         * then the state is stored in <markedState>. If <isValidState> returns true, then the state is stored in <validState> regardless of the marker color. 
         * The state is returned regardless of the marker color and valid state. 
         */
        process(me: MouseEventContext): CellState {
            var state = null;

            if (this.isEnabled()) {
                state = this.getState(me);
                this.setCurrentState(state, me);
            }

            return state;
        }

        /** Sets and marks the current valid state.*/
        private setCurrentState(state: CellState, me: MouseEventContext, color?: string) {
            var isValid = (state != null) ? this.isValidState(state) : false;
            color = (color != null) ? color : this.getMarkerColor(me.getEvent(), state, isValid);

            if (isValid) {
                this.validState = state;
            } else {
                this.validState = null;
            }

            if (state != this.markedState || color != this.currentColor) {
                this.currentColor = color;

                if (state != null && this.currentColor != null) {
                    this.markedState = state;
                    this.mark();
                } else if (this.markedState != null) {
                    this.markedState = null;
                    this.unmark();
                }
            }
        }

        /** Marks the given cell using the given color, or <validColor> if no color is specified.*/
        private markCell(cell: Cell, color: string) {
            var state = this.graph.getView().getState(cell);

            if (state != null) {
                this.currentColor = (color != null) ? color : this.validColor;
                this.markedState = state;
                this.mark();
            }
        }

        /** Marks the <markedState> and fires a <mark> event. */
        mark() {
            this.highlight.setHighlightColor(this.currentColor);
            this.highlight.highlight(this.markedState);
            this.onMark.fire(new MarkEvent(this.markedState));
        }

        /** Hides the marker and fires a <mark> event.*/
        private unmark() {
            this.mark();
        }

        /** Returns true if the given <mxCellState> is a valid state. If this returns true, then the state is stored in <validState>. The return valueof this method is used as the argument for <getMarkerColor>. */
        isValidState(state: CellState): boolean {
            return true;
        }

        /** Returns the valid- or invalidColor depending on the value of isValid. The given <mxCellState> is ignored by this implementation.*/
        getMarkerColor(evt: MouseEvent, state: CellState, isValid: boolean): string {
            return (isValid) ? this.validColor : this.invalidColor;
        }

        /** Uses <getCell>, <getStateToMark> and <intersects> to return the <mxCellState> for the given <mxMouseEvent>.*/
        private getState(me: MouseEventContext): CellState {
            var view = this.graph.getView();
            var cell = this.getCell(me);
            var state = this.getStateToMark(view.getState(cell));

            return (state != null && this.intersects(state, me)) ? state : null;
        }

        /** Returns the <mxCell> for the given event and cell. This returns the given cell. */
        getCell(me: MouseEventContext): Cell {
            return me.getCell();
        }

        /** Returns the <mxCellState> to be marked for the given <mxCellState> under the mouse. This returns the given state. */
        private getStateToMark(state: CellState): CellState {
            return state;
        }

        /** Returns true if the given coordinate pair intersects the given state. This returns true if the <hotspot> is 0 or the coordinates are inside
         * the hotspot for the given cell state. */
        intersects(state: CellState, me: MouseEventContext): boolean {
            if (this.hotspotEnabled) {
                return Utils.intersectsHotspot(state, me.getGraphX(), me.getGraphY(),
                    this.hotspot, Constants.minHotspotSize, Constants.maxHotspotSize);
            }

            return true;
        }

        /** Destroys the handler and all its resources and DOM nodes. */
        destroy() {
            //this.graph.getView().removeListener(this.resetHandler);
            //this.graph.getModel().removeListener(this.resetHandler);
            this.highlight.destroy();
        }
    }
}