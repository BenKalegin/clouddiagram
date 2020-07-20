module Five {
    export class PanningHandler implements IMouseListener {
        // Event handler that pans and creates popupmenus.To use the left
        // mousebutton for panning without interfering with cell moving and
        // resizing, use < isUseLeftButton > and<isIgnoreCell>.For grid size
        // steps while panning, use<useGrid>.This handler is built - into
        // <mxGraph.panningHandler> and enabled using<mxGraph.setPanning>.
        // 
        // Constructor: mxPanningHandler
        //
        // Constructs an event handler that creates a < mxPopupMenu >
        // and pans the graph.
        //
        // Event: Events.PAN_START
        //
        // Fires when the panning handler changes its < active > state to true.The
        // <code>event </code > property contains the corresponding<mxMouseEvent>.
        //
        // Event: Events.PAN
        //
        // Fires while handle is processing events.The < code > event </code > property contains
        // the corresponding<mxMouseEvent>.
        //
        // Event: Events.PAN_END
        //
        // Fires when the panning handler changes its < active > state to false.The
        // <code>event </code > property contains the corresponding<mxMouseEvent>.

        private graph: Graph;

        /** Specifies if panning should be active for the left mouse button. Setting this to true may conflict with <mxRubberband>. Default is false. */
        useLeftButtonForPanning = false;

        /** Specifies if <Events.isPopupTrigger> should also be used for panning. */
        private usePopupTrigger = true;

        /** Specifies if panning should be active even if there is a cell under themousepointer. Default is false. */
        ignoreCell = false;

        /** Specifies if the panning should be previewed. Default is true.*/
        private previewEnabled = true;

        /** Specifies if the panning steps should be aligned to the grid size. Default is false. */
        private useGrid = false;

        /** Specifies if panning should be enabled. Default is true. */
        panningEnabled = true;

        /** Specifies if pinch gestures should be handled as zoom. Default is true. */
        private pinchEnabled = true;

        /** Specifies the maximum scale. Default is 8.*/
        private maxScale = 8;

        /** Specifies the minimum scale. Default is 0.01.*/
        private minScale = 0.01;

        /** Holds the current horizontal offset. */
        private dx: number = null;

        /** Holds the current vertical offset. */
        private dy: number = null;

        /** Holds the x-coordinate of the start point.*/
        private startX = 0;

        /** Holds the y-coordinate of the start point.*/
        private startY = 0;

        private forcePanningHandler: IListener<FireMouseEvent>;
        private gestureHandler:IListener<GestureEvent>;
        private active: boolean;
        private initialScale: number = null;
        private mouseDownEvent: MouseEventContext;
        private dx0: number;
        private dy0: number;
        panningTrigger: boolean;
        onPanStart = new EventListeners<BasicMouseEvent>();
        onPan = new EventListeners<BasicMouseEvent>();
        onPanEnd = new EventListeners<BasicMouseEvent>();

        constructor(graph: Graph) {
            if (graph != null)
                this.graph = graph;
            this.graph.addMouseListener(this);

            // Handles force panning event
            this.forcePanningHandler = e => {
                var evtName = e.eventName;
                var me = e.event;

                if (evtName == Events.mouseDown && this.isForcePanningEvent(me)) {
                    this.start(me);
                    this.active = true;
                    this.onPanStart.fire(new BasicMouseEvent(me));
                    me.consume();
                }
            };

            this.graph.onFireMouse.add(this.forcePanningHandler);

            // Handles pinch gestures
            this.gestureHandler = e => {
                if (this.isPinchEnabled()) {
                    var evt = e.event;

                    if (!Events.isConsumed(evt) && evt.type == "gesturestart") {
                        this.initialScale = this.graph.view.scale;

                        // Forces start of panning when pinch gesture starts
                        if (!this.active && this.mouseDownEvent != null) {
                            this.start(this.mouseDownEvent);
                            this.mouseDownEvent = null;
                        }
                    } else if (evt.type == "gestureend" && this.initialScale == null) {
                        this.initialScale = null;
                    }

                    if (this.initialScale != null) {
                        var value = Math.round(this.initialScale * /*e.scale **/ 100) / 100;

                        if (this.minScale != null) {
                            value = Math.max(this.minScale, value);
                        }

                        if (this.maxScale != null) {
                            value = Math.min(this.maxScale, value);
                        }

                        if (this.graph.view.scale != value) {
                            this.graph.zoomTo(value);
                            Events.consume(evt);
                        }
                    }
                }
            };

            this.graph.onGesture.add(this.gestureHandler);
        }

        isActive() : boolean {
            /// <summary>Returns true if the handler is currently active.</summary>
            return this.active || this.initialScale != null;
        }

        private isPanningEnabled() : boolean {
            return this.panningEnabled;
        }

        private setPanningEnabled(value: boolean) {
            this.panningEnabled = value;
        }

        private isPinchEnabled(): boolean {
            return this.pinchEnabled;
        }

        private setPinchEnabled(value: boolean) {
            this.pinchEnabled = value;
        }

        /** Returns true if the given event is a panning trigger for the optional given cell. This returns true if control-shift is pressed or if <usePopupTrigger> is true and the event is a popup trigger. */
        private isPanningTrigger(me: MouseEventContext) : boolean {
            var evt = me.getEvent();

            return (this.useLeftButtonForPanning && me.getState() == null &&
                Events.isLeftMouseButton(evt)) || (Events.isMouseControlDown(evt) &&
                Events.isMouseShiftDown(evt)) || (this.usePopupTrigger && Events.isPopupTrigger(evt));
        }

        /** Returns true if the given <mxMouseEvent> should start panning. This implementation always returns false. */
        private isForcePanningEvent(me: MouseEventContext) : boolean {
            return this.ignoreCell || Events.isMultiTouchEvent(me.getEvent());
        }

        /** Handles the event by initiating the panning. By consuming the event all subsequent events of the gesture are redirected to this handler. */
        mouseDown(sender: Object, me: MouseEventContext) {
            this.mouseDownEvent = me;

            if (!me.isConsumed() && this.isPanningEnabled() && !this.active && this.isPanningTrigger(me)) {
                this.start(me);
                this.consumePanningTrigger(me);
            }
        }

        /** Starts panning at the given event.*/
        private start(me: MouseEventContext) {
            var scroll = this.graph.container.getScroll(); 
            this.dx0 = -scroll.x;
            this.dy0 = -scroll.y;

            // Stores the location of the trigger event
            this.startX = me.getX();
            this.startY = me.getY();
            this.dx = null;
            this.dy = null;

            this.panningTrigger = true;
        }

        /** Consumes the given <mxMouseEvent> if it was a panning trigger in <mouseDown>. The default is to invoke <mxMouseEvent.consume>. Note that this will block any further event processing. 
         * If you haven't disabled built-in context menus and require immediate selection of the cell on mouseDown in Safari and/or on the Mac, then use the following code: */
        private consumePanningTrigger(me: MouseEventContext) {
            me.consume();
        }

        /** Handles the event by updating the panning on the graph. */
        mouseMove(sender, me) {
            this.dx = me.getX() - this.startX;
            this.dy = me.getY() - this.startY;

            if (this.active) {
                if (this.previewEnabled) {
                    // Applies the grid to the panning steps
                    if (this.useGrid) {
                        this.dx = this.graph.snap(this.dx);
                        this.dy = this.graph.snap(this.dy);
                    }

                    this.graph.panGraph(this.dx + this.dx0, this.dy + this.dy0);
                }

                this.onPan.fire(new BasicMouseEvent(me));
            } else if (this.panningTrigger) {
                var tmp = this.active;

                // Panning is activated only if the mouse is moved
                // beyond the graph tolerance
                this.active = Math.abs(this.dx) > this.graph.tolerance || Math.abs(this.dy) > this.graph.tolerance;

                if (!tmp && this.active) {
                    this.onPanStart.fire(new BasicMouseEvent(me));
                }
            }

            if (this.active || this.panningTrigger) {
                me.consume();
            }
        }

        /** Handles the event by setting the translation on the view or showing the popupmenu. */
        mouseUp(sender: Object, me: MouseEventContext) {
            if (this.active) {
                if (this.dx != null && this.dy != null) {
                    // Ignores if scrollbars have been used for panning
                    if (!this.graph.useScrollbarsForPanning || !this.graph.container.hasScrollbars()) {
                        var scale = this.graph.getView().scale;
                        var t = this.graph.getView().translate;
                        this.graph.panGraph(0, 0);
                        this.panGraph(t.x + this.dx / scale, t.y + this.dy / scale);
                    }

                    me.consume();
                }

                this.onPanEnd.fire(new BasicMouseEvent(me));
            }

            this.panningTrigger = false;
            this.mouseDownEvent = null;
            this.active = false;
            this.dx = null;
            this.dy = null;
        }

        /** Pans <graph> by the given amount. */
        private panGraph(dx: number, dy: number) {
            this.graph.getView().setTranslate(dx, dy);
        }

        /** Destroys the handler and all its resources and DOM nodes. */
        destroy() {
            this.graph.removeMouseListener(this);
            this.graph.onFireMouse.remove(this.forcePanningHandler);
            this.graph.onGesture.remove(this.gestureHandler);
        }

    }
}