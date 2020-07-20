module Five {
    /**
     * Class: mxTooltipHandler
     * 
     * Graph event handler that displays tooltips. <mxGraph.getTooltip> is used to
     * get the tooltip for a cell or handle. This handler is built-into
     * <mxGraph.tooltipHandler> and enabled using <mxGraph.setTooltips>.
     *
     * Example:
     * 
     * (code>
     * new mxTooltipHandler(graph);
     * (end)
     * 
     */
    export class TooltipHandler implements IMouseListener {
        // Reference to the enclosing<mxGraph>.
        private graph: Graph = null;

        //Delay to show the tooltip in milliseconds. Default is 500.
        delay: number = null;

        /**
         * Constructor: mxTooltipHandler
         *
         * Constructs an event handler that displays tooltips with the specified
         * delay (in milliseconds).If no delay is specified then a default delay
         * of 500 ms(0.5 sec) is used.
         */
        constructor(graph: Graph, delay: number = 500) {
            if (graph != null)
                this.graph = graph;
            this.delay = delay;
            this.graph.addMouseListener(this);
        }

        /**
         * Specifies the zIndex for the tooltip and its shadow. Default is 10005.
         */
        private zIndex = 10005;

        /**
         * Specifies if touch and pen events should be ignored. Default is true.
         */
        private ignoreTouchEvents = true;

        /**
         * Specifies if the tooltip should be hidden if the mouse is moved over the
         * current cell. Default is false.
         */
        private hideOnHover = false;

        /**
         * True if this handler was destroyed using <destroy>.
         */
        private destroyed = false;

        /**
         * Specifies if events are handled. Default is true.
         */
        private enabled = true;

        /**
         * Returns true if events are handled. This implementation
         * returns <enabled>.
         */
        private isEnabled(): boolean {
            return this.enabled;
        }

        /**
         * Enables or disables event handling. This implementation updates <enabled>.
         */
        setEnabled(enabled: boolean) {
            this.enabled = enabled;
        }

        /**
         * Function: isHideOnHover
         * 
         * Returns <hideOnHover>.
         */
        isHideOnHover() : boolean{
            return this.hideOnHover;
        }

        /**
         * Function: setHideOnHover
         * 
         * Sets <hideOnHover>.
         */
        private setHideOnHover(value: boolean) {
            this.hideOnHover = value;
        }

        private div: HTMLDivElement;
        private lastX: number;
        private lastY: number;
        private state: CellState;
        private node: Element;
        private stateSource: boolean;
        private thread: number;

        /**
         * Function: init
         * 
         * Initializes the DOM nodes required for this tooltip handler.
         */
        private init() {
            if (document.body != null) {
                this.div = document.createElement("div");
                this.div.className = "mxTooltip";
                this.div.style.visibility = "hidden";

                document.body.appendChild(this.div);

                Events.addGestureListeners(this.div, Utils.bind(this, () => {this.hideTooltip();}));
            }
        }

        /** Handles the event by initiating a rubberband selection. By consuming the event all subsequent events of the gesture are redirected to this handler. */
        mouseDown(sender: Object, me: MouseEventContext) {
            this.reset(me, false);
            this.hideTooltip();
        }

        /** Handles the event by updating the rubberband selection.*/
        mouseMove(sender: Object, me: MouseEventContext) {
            if (me.getX() != this.lastX || me.getY() != this.lastY) {
                this.reset(me, true);

                if (this.isHideOnHover() || me.getState() != this.state || (me.getSource() != this.node &&
                    (!this.stateSource || (me.getState() != null && this.stateSource ==
                    (me.isSource(me.getState().shape) || !me.isSource(me.getState().text)))))) {
                    this.hideTooltip();
                }
            }

            this.lastX = me.getX();
            this.lastY = me.getY();
        }

        /** Handles the event by resetting the tooltip timer or hiding the existing tooltip. */
        mouseUp(sender: Object, me: MouseEventContext) {
            this.reset(me, true);
            this.hideTooltip();
        }


        /** Resets the timer. */
        private resetTimer() {
            if (this.thread != null) {
                window.clearTimeout(this.thread);
                this.thread = null;
            }
        }

        /** Resets and/or restarts the timer to trigger the display of the tooltip. */
        private reset(me: MouseEventContext, restart: boolean) {
            if (!this.ignoreTouchEvents || Events.isMouseEvent(me.getEvent())) {
                this.resetTimer();

                if (restart && this.isEnabled() && me.getState() != null && (this.div == null ||
                    this.div.style.visibility == "hidden")) {
                    var state = me.getState();
                    var node = me.getSource();
                    var x = me.getX();
                    var y = me.getY();
                    var stateSource = me.isSource(state.shape) || me.isSource(state.text);

                    this.thread = window.setTimeout(Utils.bind(this, () => {
                        if (!this.graph.isEditing() && !this.graph.popupMenuHandler.isMenuShowing() && !this.graph.isMouseDown) {
                            // Uses information from inside event cause using the event at
                            // this (delayed) point in time is not possible in IE as it no
                            // longer contains the required information (member not found)
                            var tip = this.graph.getTooltip(state, node, x, y);
                            this.show(tip, x, y);
                            this.state = state;
                            this.node = node;
                            this.stateSource = stateSource;
                        }
                    }), this.delay);
                }
            }
        }

        /**
         * Function: hide
         * 
         * Hides the tooltip and resets the timer.
         */
        hide() {
            this.resetTimer();
            this.hideTooltip();
        }

        /**
         * Function: hideTooltip
         * 
         * Hides the tooltip.
         */
        private hideTooltip() {
            if (this.div != null) {
                this.div.style.visibility = "hidden";
            }
        }

        /**
         * Function: show
         * 
         * Shows the tooltip for the specified cell and optional index at the
         * specified location (with a vertical offset of 10 pixels).
         */
        private show(tip: string, x: number, y: number) {
            if (!this.destroyed && tip != null && tip.length > 0) {
                // Initializes the DOM nodes if required
                if (this.div == null) {
                    this.init();
                }

                var origin = Utils.getScrollOrigin();

                this.div.style.zIndex = String(this.zIndex);
                this.div.style.left = (x + origin.x) + "px";
                this.div.style.top = (y + Constants.tooltipVerticalOffset + origin.y) + "px";
                this.div.innerHTML = tip.replace(/\n/g, "<br>");
                this.div.style.visibility = "";
                Utils.fit(this.div);
            }
        }

        /**
         * Function: destroy
         * 
         * Destroys the handler and all its resources and DOM nodes.
         */
        destroy() {
            if (!this.destroyed) {
                this.graph.removeMouseListener(this);
                Events.release(this.div);

                if (this.div != null && this.div.parentNode != null) {
                    this.div.parentNode.removeChild(this.div);
                }

                this.destroyed = true;
                this.div = null;
            }
        }
    }
}