module Five {
    /**
     * Base class for all mouse events. A listener for this event should implement the following methods:
     * 
     * (code)
     * graph.addMouseListener(
     * {
     *   mouseDown: function(sender, evt){},
     *   mouseMove: function(sender, evt){},
     *   mouseUp: function(sender, evt){}
     * });
     * (end)
     */
    export class MouseEventContext {

        /**
        * Constructor: mxMouseEvent
        *
        * Constructs a new event object for the given arguments.
        * 
        * Parameters:
        *
        * evt - Native mouse event.
        * state - Optional < mxCellState > under the mouse.
        */
        constructor(evt: MouseEvent, state?: CellState) {
            this.evt = evt;
            this.state = state;
        }

        /**
         * Holds the consumed state of this event.
         */
        consumed: boolean = false;

        /**
         * Holds the inner event object.
         */
        evt: MouseEvent = null;

        /**
         * Variable: graphX
         *
         * Holds the x-coordinate of the event in the graph. This value is set in mxGraph.fireMouseEvent.
         */
        graphX: number = null;

        /**
         * Variable: graphY
         *
         * Holds the y-coordinate of the event in the graph. This value is set in
         * <mxGraph.fireMouseEvent>.
         */
        graphY: number = null;

        /**
         * Variable: state
         *
         * Holds the optional <mxCellState> associated with this event.
         */
        state: CellState = null;

        /**
         * Function: getEvent
         * 
         * Returns <evt>.
         */
        getEvent(): MouseEvent {
            return this.evt;
        }

        /**
         * Function: getSource
         * 
         * Returns the target DOM element using Events.getSource for <evt>.
         */
        getSource(): Element {
            return Events.getSource(this.evt);
        }

        /**
         * Function: isSource
         * 
         * Returns true if the given Shape is the source of <evt>.
         */
        isSource(shape: Shape): boolean {
            if (shape != null) {
                return Utils.isAncestorNode(shape.node, this.getSource());
            }
            return false;
        }

        getX(): number {
            return Events.getClientX(this.getEvent());
        }

        getY(): number {
            return Events.getClientY(this.getEvent());
        }

        getGraphX() {
            return this.graphX;
        }

        getGraphY() {
            return this.graphY;
        }

        getState(): CellState {
            return this.state;
        }

        getCell(): Cell {
            var state = this.getState();

            if (state != null) {
                return state.cell;
            }

            return null;
        }

        // Returns true if the event is a popup trigger.
        isPopupTrigger(): boolean {
            return Events.isPopupTrigger(this.getEvent());
        }

        isConsumed(): boolean {
            return this.consumed;
        }

        /**
        * Function: consume
        *
        * Sets <consumed> to true and invokes preventDefault on the native event
        * if such a method is defined. This is used mainly to avoid the cursor from
        * being changed to a text cursor in Webkit. You can use the preventDefault
        * flag to disable this functionality.
        * 
        * Parameters:
        * 
        * preventDefault - Specifies if the native event should be canceled. Default
        * is true.
        */
        consume(preventDefault: boolean = true) {
            if (preventDefault && this.evt.preventDefault) {
                this.evt.preventDefault();
            }

            // Workaround for images being dragged in IE
            // Does not change returnValue in Opera
            if (Client.isIe) {
                (<any>this.evt).returnValue = true;
            }

            // Sets local consumed state
            this.consumed = true;
        }
    }
}
