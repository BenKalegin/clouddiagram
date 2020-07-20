module Five {
    export class Rubberband implements IMouseListener {
        /** * Event handler that selects rectangular regions. This is not built-into <mxGraph>. To enable rubberband selection in a graph, use the following code.*/

        private graph: Graph;
        private forceRubberbandHandler: IListener<FireMouseEvent>;
        private panHandler: IListener<BasicEvent>;
        private gestureHandler: IListener<GestureEvent>;
        private first: Point;
        private x: number;
        private y: number;
        private width: number;
        private height: number;
        private dragHandler: (evt: any) => void;
        private dropHandler: (evt: any) => void;
        private destroyed: boolean = false;

        constructor(graph: Graph) {
            if (graph != null) {
                this.graph = graph;
                this.graph.addMouseListener(this);

                // Handles force rubberband event
                this.forceRubberbandHandler = e =>  {
                    var evtName = e.eventName;
                    var me = e.event;

                    if (evtName == Events.mouseDown && this.isForceRubberbandEvent(me)) {
                        var offset = Utils.getOffset(this.graph.container);
                        var origin = Utils.getScrollOrigin(this.graph.container);
                        origin.x -= offset.x;
                        origin.y -= offset.y;
                        this.start(me.getX() + origin.x, me.getY() + origin.y);
                        me.consume(false);
                    }
                };

                this.graph.onFireMouse.add(this.forceRubberbandHandler);

                // Repaints the marquee after autoscroll
                this.panHandler = () => this.repaint();

                this.graph.onPan.add(this.panHandler);

                // Does not show menu if any touch gestures take place after the trigger
                this.gestureHandler = Utils.bind(this, function() {
                    if (this.first != null) {
                        this.reset();
                    }
                });

                this.graph.onGesture.add(this.gestureHandler);

                // Automatic deallocation of memory
                if (Client.isIe) {
                    Events.addListener(window, "unload", () => this.destroy());
                }
            }
        }


        /** Specifies the default opacity to be used for the rubberband div. Default is 20. */
        private defaultOpacity = 20;

        /** Specifies if events are handled. Default is true. */
        private enabled = true;

        /** Holds the DIV element which is currently visible. */
        private div = null;

        /** Holds the DIV element which is used to display the rubberband. */
        private sharedDiv: HTMLDivElement = null;

        /** Holds the value of the x argument in the last call to <update>. */
        private currentX = 0;

        /** Holds the value of the y argument in the last call to <update>. */
        private currentY = 0;

        private isEnabled() : boolean {
            return this.enabled;
        }

        private setEnabled(enabled: boolean) {
            this.enabled = enabled;
        }

        /** Returns true if the given <mxMouseEvent> should start rubberband selection. This implementation returns true if the alt key is pressed. */
        private isForceRubberbandEvent(me: MouseEventContext) : boolean {
            return Events.isMouseAltDown(me.getEvent());
        }

        /** Handles the event by initiating a rubberband selection. By consuming the event all subsequent events of the gesture are redirected to this handler. */
        mouseDown(sender: Object, me: MouseEventContext) {
            if (!me.isConsumed() && this.isEnabled() && this.graph.isEnabled() &&
                me.getState() == null && !Events.isMultiTouchEvent(me.getEvent())) {
                var offset = Utils.getOffset(this.graph.container);
                var origin = Utils.getScrollOrigin(this.graph.container);
                origin.x -= offset.x;
                origin.y -= offset.y;
                this.start(me.getX() + origin.x, me.getY() + origin.y);

                // Does not prevent the default for this event so that the
                // event processing chain is still executed even if we start
                // rubberbanding. This is required eg. in ExtJs to hide the
                // current context menu. In mouseMove we'll make sure we're
                // not selecting anything while we're rubberbanding.
                me.consume(false);
            }
        }

        /** Sets the start point for the rubberband selection. */
        private start(x: number, y: number) {
            this.first = new Point(x, y);

            var container = this.graph.container;

            function createMouseEvent(evt) {
                var me = new MouseEventContext(evt);
                var pt = Utils.convertPoint(container, me.getX(), me.getY());

                me.graphX = pt.x;
                me.graphY = pt.y;

                return me;
            };

            this.dragHandler = Utils.bind(this, (evt) => {
                this.mouseMove(this.graph, createMouseEvent(evt));
            });

            this.dropHandler = Utils.bind(this, (evt) => {
                this.mouseUp(this.graph, createMouseEvent(evt));
            });

            // Workaround for rubberband stopping if the mouse leaves the container in Firefox
            if (Client.isFf) {
                Events.addGestureListeners(document, null, this.dragHandler, this.dropHandler);
            }
        }

        /** Handles the event by updating therubberband selection.*/
        mouseMove(sender: Object, me: MouseEventContext) {
            if (!me.isConsumed() && this.first != null) {
                var origin = Utils.getScrollOrigin(this.graph.container);
                var offset = Utils.getOffset(this.graph.container);
                origin.x -= offset.x;
                origin.y -= offset.y;
                var x = me.getX() + origin.x;
                var y = me.getY() + origin.y;
                var dx = this.first.x - x;
                var dy = this.first.y - y;
                var tol = this.graph.tolerance;

                if (this.div != null || Math.abs(dx) > tol || Math.abs(dy) > tol) {
                    if (this.div == null) {
                        this.div = this.createShape();
                    }

                    // Clears selection while rubberbanding. This is required because
                    // the event is not consumed in mouseDown.
                    Utils.clearSelection();

                    this.update(x, y);
                    me.consume();
                }
            }
        }

        /** Creates the rubberband selection shape. */
        private createShape() : HTMLDivElement {
            if (this.sharedDiv == null) {
                this.sharedDiv = document.createElement("div");
                this.sharedDiv.className = "mxRubberband";
                Utils.setOpacity(this.sharedDiv, this.defaultOpacity);
            }

            this.graph.container.appendChild(this.sharedDiv);

            return this.sharedDiv;
        }

        /** Handles the event by selecting the region of the rubberband using Graph.selectRegion  */
        mouseUp(sender: Object, me: MouseEventContext) {
            var execute = this.div != null && this.div.style.display != "none";
            this.reset();

            if (execute) {
                var rect = new Rectangle(this.x, this.y, this.width, this.height);
                this.graph.selectRegion(rect, me.getEvent());
                me.consume();
            }
        }

        /** Resets the state of the rubberband selection. */
        private reset() {
            if (this.div != null) {
                this.div.parentNode.removeChild(this.div);
            }

            Events.removeGestureListeners(document, null, this.dragHandler, this.dropHandler);
            this.dragHandler = null;
            this.dropHandler = null;

            this.currentX = 0;
            this.currentY = 0;
            this.first = null;
            this.div = null;
        }

        /** Sets <currentX> and <currentY> and calls <repaint>. */
        private update(x: number, y: number) {
            this.currentX = x;
            this.currentY = y;

            this.repaint();
        }

        /** Computes the bounding box and updates the style of the <div>. */
        private repaint() {
            if (this.div != null) {
                var x = this.currentX - this.graph.panDx;
                var y = this.currentY - this.graph.panDy;

                this.x = Math.min(this.first.x, x);
                this.y = Math.min(this.first.y, y);
                this.width = Math.max(this.first.x, x) - this.x;
                this.height = Math.max(this.first.y, y) - this.y;

                var dx = 0;
                var dy = 0;

                this.div.style.left = (this.x + dx) + "px";
                this.div.style.top = (this.y + dy) + "px";
                this.div.style.width = Math.max(1, this.width) + "px";
                this.div.style.height = Math.max(1, this.height) + "px";
            }
        }

        /** Destroys the handler and all its resources and DOM nodes. This does normally not need to be called, it is called automatically when the window unloads. */
        destroy() {
            if (!this.destroyed) {
                this.destroyed = true;
                this.graph.removeMouseListener(this);
                this.graph.onFireMouse.remove(this.forceRubberbandHandler);
                this.graph.onPan.remove(this.panHandler);
                this.graph.onGesture.remove(this.gestureHandler);
                this.reset();

                if (this.sharedDiv != null) {
                    this.sharedDiv = null;
                }
            }
        }

    }
}