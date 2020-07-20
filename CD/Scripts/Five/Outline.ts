module Five {
    /** Implements an outline (aka overview) for a graph. Set <updateOnPan> to true to enable updates while the source graph is panning.
     * To move the graph to the top, left corner the following code can be used.
     * var scale = graph.view.scale;
     * var bounds = graph.getGraphBounds();
     * graph.view.setTranslate(-bounds.x / scale, -bounds.y / scale);
     * To toggle the suspended mode, the following can be used.
     * outline.suspended = !outln.suspended;
     * if (!outline.suspended) outline.update(true); */

    export class Outline implements IMouseListener {
     /* container - DOM node that will contain the outline.  */
        constructor(source: Graph, container: HTMLElement) {
            this.source = source;

            if (container != null) {
                this.init(container);
            }
        }

        /** Reference to the source <mxGraph>. */
        private source: Graph;

        /** Reference to the <mxGraph> that renders the outline. */
        private outline: Graph = null;

        /** Renderhint to be used for the outline graph. Default is faster. */
        private graphRenderHint = RenderingHint.Faster;

        /** Specifies if events are handled. Default is true. */
        private enabled = true;

        /** Specifies a viewport rectangle should be shown. Default is true. */
        private showViewport = true;

        /** Border to be added at the bottom and right. Default is 10. */
        private border = 10;

        /** Specifies the size of the sizer handler. Default is 8. */
        private sizerSize = 8;

        /** Specifies if labels should be visible in the outline. Default is false. */
        private labelsVisible = false;

        /** Specifies if <update> should be called for <Events.PAN> in the source graph. Default is false. */
        private updateOnPan = false;

        /** Optional <mxImage> to be used for the sizer. Default is null. */
        private sizerImage: Image = null;

        /** Optional boolean flag to suspend updates. Default is false. This flag will also suspend repaints of the outline. To toggle this switch, use the following code.
         * nav.suspended = !nav.suspended;
         * if (!nav.suspended) nav.update(true); */
        private suspended = false;

        private updateHandler: () => void;
        private panHandler: IListener<BasicEvent>;
        private refreshHandler: IListener<BasicEvent>;
        private bounds: Rectangle;
        private selectionBorder: RectangleShape;
        private sizer: RectangleShape;
        private zoom: boolean;
        private active: boolean;
        //todo rewrite with point
        private startX: number;
        private startY: number;
        //todo rewrite with point
        private dx0: number;
        private dy0: number;

        /** Creates the <mxGraph> used in the outline. */
        private createGraph(container: HTMLElement) {
            var graph = new Graph(container, this.source.config, this.source.getModel(), this.graphRenderHint, this.source.getStylesheet());
            graph.foldingEnabled = false;
            graph.autoScroll = false;

            return graph;
        }

        /** Initializes the outline inside the given container. */
        private init(container: HTMLElement) {
            this.outline = this.createGraph(container);

            // Do not repaint when suspended
            var outlineGraphModelChanged = this.outline.graphModelChanged;
            this.outline.graphModelChanged = (changes: IChange[]): void => {
                if (!this.suspended && this.outline != null) {
                    outlineGraphModelChanged.apply(this.outline, [changes]);
                }
            };

            // Hides cursors and labels
            this.outline.labelsVisible = this.labelsVisible;
            this.outline.setEnabled(false);

            this.updateHandler = () => {
                if (!this.suspended && !this.active) {
                    this.update();
                }
            };

            // Updates the scale of the outline after a change of the main graph
            this.source.getModel().onChange.add(this.updateHandler);
            this.outline.addMouseListener(this);

            // Adds listeners to keep the outline in sync with the source graph
            var view = this.source.getView();
            view.onScale.add(this.updateHandler);
            view.onTranslate.add(this.updateHandler);
            view.onScaleAndTranslate.add(this.updateHandler);
            view.onRootChange.add(this.updateHandler);

            // Updates blue rectangle on scroll
            Events.addListener(this.source.container.eventTarget(), 'scroll', this.updateHandler);

            this.panHandler = () => {
                if (this.updateOnPan) {
                    this.updateHandler();
                }
            };
            this.source.onPan.add(this.panHandler);

            // Refreshes the graph in the outline after a refresh of the main graph
            this.refreshHandler = () => {
                this.outline.setStylesheet(this.source.getStylesheet());
                this.outline.refresh();
            };
            this.source.onRefresh.add(this.refreshHandler);

            // Creates the blue rectangle for the viewport
            this.bounds = new Rectangle(0, 0, 0, 0);
            this.selectionBorder = new RectangleShape(this.bounds, null, Constants.outlineColor, Constants.outlineStrokewidth);
            this.selectionBorder.dialect = this.outline.dialect;

            this.selectionBorder.init(ElementInitializer(this.outline.getView().getOverlayPane()));

            // Handles event by catching the initial pointer start and then listening to the
            // complete gesture on the event target. This is needed because all the events
            // are routed via the initial element even if that element is removed from the
            // DOM, which happens when we repaint the selection border and zoom handles.
            var handler = (evt: MouseEvent) => {
                var t = Events.getSource(evt);

                var redirect = (me: MouseEvent) => {
                    this.outline.fireMouseEvent(Events.mouseMove, new MouseEventContext(me));
                };

                var redirect2 = (me: MouseEvent) => {
                    Events.removeGestureListeners(t, null, redirect, redirect2);
                    this.outline.fireMouseEvent(Events.mouseUp, new MouseEventContext(me));
                };

                Events.addGestureListeners(t, null, redirect, redirect2);
                this.outline.fireMouseEvent(Events.mouseDown, new MouseEventContext(evt));
            };

            Events.addGestureListeners(this.selectionBorder.node, handler);

            // Creates a small blue rectangle for sizing (sizer handle)
            this.sizer = this.createSizer();

            this.sizer.init(ElementInitializer(this.outline.getView().getOverlayPane()));

            if (this.enabled) {
                this.sizer.nodeStyle().cursor = 'pointer';
            }

            Events.addGestureListeners(this.sizer.node, handler);

            this.selectionBorder.nodeStyle().display = (this.showViewport) ? '' : 'none';
            this.sizer.nodeStyle().display = this.selectionBorder.nodeStyle().display;
            this.selectionBorder.nodeStyle().cursor = 'move';

            this.update(false);
        }

        private isEnabled() : boolean{
            return this.enabled;
        }

        private setEnabled(value: boolean) {
            this.enabled = value;
        }

        /** Enables or disables the zoom handling by showing or hiding the respective handle.  */
        private setZoomEnabled(value: boolean) {
            this.sizer.nodeStyle().visibility = (value) ? 'visible' : 'hidden';
        }

        /** Invokes <update> and revalidate the outline. This method is deprecated. */
        private refresh() {
            this.update(true);
        }

        /** Creates the shape used as the sizer. */
        private createSizer() : RectangleShape {
            var sizer: RectangleShape;
            if (this.sizerImage != null) {
                sizer = new ImageShape(new Rectangle(0, 0, this.sizerImage.width, this.sizerImage.height), this.sizerImage.src);
                sizer.dialect = this.outline.dialect;

                return sizer;
            }
            else {
                sizer = new RectangleShape(new Rectangle(0, 0, this.sizerSize, this.sizerSize), Constants.outlineHandleFillcolor, Constants.outlineHandleStrokecolor);
                sizer.dialect = this.outline.dialect;

                return sizer;
            }
        }

        /** Returns the size of the source container. */
        private getSourceContainerSize(): Rectangle {
            var scroll = this.source.container.getScroll();
            return new Rectangle(0, 0, scroll.width, scroll.height);
        }

        /** Returns the offset for drawing the outline graph. */
        private getOutlineOffset(scale: number) : Point {
            return null;
        }

        /** Returns the offset for drawing the outline graph. */
        private getSourceGraphBounds() : Rectangle {
            return this.source.getGraphBounds();
        }

        /** Updates the outline. */
        update(revalidate: boolean = false) {
            if (this.source != null && this.outline != null) {
                var sourceScale = this.source.view.scale;
                var scaledGraphBounds = this.getSourceGraphBounds();
                var unscaledGraphBounds = new Rectangle(
                    scaledGraphBounds.x / sourceScale + this.source.panDx,
                    scaledGraphBounds.y / sourceScale + this.source.panDy,
                    scaledGraphBounds.width / sourceScale,
                    scaledGraphBounds.height / sourceScale);

                var sourceClient = this.source.container.getClientSize();
                var unscaledFinderBounds = new Rectangle(0, 0, sourceClient.x / sourceScale, sourceClient.y / sourceScale);

                var union = unscaledGraphBounds.clone();
                union.add(unscaledFinderBounds);

                // Zooms to the scrollable area if that is bigger than the graph
                var size = this.getSourceContainerSize();
                var completeWidth = Math.max(size.width / sourceScale, union.width);
                var completeHeight = Math.max(size.height / sourceScale, union.height);

                var outlineClient = this.outline.container.getClientSize();
                var availableWidth = Math.max(0, outlineClient.x - this.border);
                var availableHeight = Math.max(0, outlineClient.y - this.border);

                var outlineScale = Math.min(availableWidth / completeWidth, availableHeight / completeHeight);
                var scale = Math.floor(outlineScale * 100) / 100;

                if (scale > 0) {
                    if (this.outline.getView().scale != scale) {
                        this.outline.getView().scale = scale;
                        revalidate = true;
                    }

                    var navView = this.outline.getView();

                    if (navView.currentRoot != this.source.getView().currentRoot) {
                        navView.setCurrentRoot(this.source.getView().currentRoot);
                    }

                    var t = this.source.view.translate;
                    var tx = t.x + this.source.panDx;
                    var ty = t.y + this.source.panDy;

                    var off = this.getOutlineOffset(scale);

                    if (off != null) {
                        tx += off.x;
                        ty += off.y;
                    }

                    if (unscaledGraphBounds.x < 0) {
                        tx = tx - unscaledGraphBounds.x;
                    }
                    if (unscaledGraphBounds.y < 0) {
                        ty = ty - unscaledGraphBounds.y;
                    }

                    if (navView.translate.x != tx || navView.translate.y != ty) {
                        navView.translate.x = tx;
                        navView.translate.y = ty;
                        revalidate = true;
                    }

                    // Prepares local variables for computations
                    var t2 = navView.translate;
                    scale = this.source.getView().scale;
                    var scale2 = scale / navView.scale;
                    var scale3 = 1.0 / navView.scale;

                    // Updates the bounds of the viewrect in the navigation
                    this.bounds = new Rectangle(
                    (t2.x - t.x - this.source.panDx) / scale3,
                    (t2.y - t.y - this.source.panDy) / scale3,
                    sourceClient.x / scale2, sourceClient.y / scale2);

                    // Adds the scrollbar offset to the finder
                    var sourceScroll = this.source.container.getScroll();
                    this.bounds.x += sourceScroll.x * navView.scale / scale;
                    this.bounds.y += sourceScroll.y * navView.scale / scale;
                    var b: Rectangle;
                    b = this.selectionBorder.bounds;
                    if (b.x != this.bounds.x || b.y != this.bounds.y || b.width != this.bounds.width || b.height != this.bounds.height) {
                        this.selectionBorder.bounds = this.bounds;
                        this.selectionBorder.redraw();
                    }

                    // Updates the bounds of the zoom handle at the bottom right
                    b = this.sizer.bounds;
                    var b2 = new Rectangle(this.bounds.x + this.bounds.width - b.width / 2,
                        this.bounds.y + this.bounds.height - b.height / 2, b.width, b.height);

                    if (b.x != b2.x || b.y != b2.y || b.width != b2.width || b.height != b2.height) {
                        this.sizer.bounds = b2;

                        // Avoids update of visibility in redraw for VML
                        if (this.sizer.nodeStyle().visibility != 'hidden') {
                            this.sizer.redraw();
                        }
                    }

                    if (revalidate) {
                        this.outline.view.revalidate();
                    }
                }
            }
        }

        /** Handles the event by starting a translation or zoom. */
        mouseDown(sender: Object, me: MouseEventContext) {
            if (this.enabled && this.showViewport) {
                var tol = (!Events.isMouseEvent(me.getEvent())) ? this.source.tolerance : 0;
                var hit = (this.source.allowHandleBoundsCheck && (Client.isIe || tol > 0)) ?
                    new Rectangle(me.getGraphX() - tol, me.getGraphY() - tol, 2 * tol, 2 * tol) : null;
                this.zoom = me.isSource(this.sizer) || (hit != null && Utils.intersects(this.bounds, hit));
                this.startX = me.getX();
                this.startY = me.getY();
                this.active = true;

                if (this.source.useScrollbarsForPanning && this.source.container.hasScrollbars()) {
                    var sourceScroll = this.source.container.getScroll();
                    this.dx0 = sourceScroll.x;
                    this.dy0 = sourceScroll.y;
                } else {
                    this.dx0 = 0;
                    this.dy0 = 0;
                }
            }

            me.consume();
        }

        /** Handles the event by previewing the viewrect in <graph> and updating the rectangle that represents the viewrect in the outline. */
        mouseMove(sender: Object, me: MouseEventContext) {
            if (this.active) {
                this.selectionBorder.nodeStyle().display = (this.showViewport) ? '' : 'none';
                this.sizer.nodeStyle().display = this.selectionBorder.nodeStyle().display;

                var delta = this.getTranslateForEvent(me);
                var dx = delta.x;
                var dy = delta.y;
                var bounds = null;

                if (!this.zoom) {
                    // Previews the panning on the source graph
                    var scale = this.outline.getView().scale;
                    bounds = new Rectangle(this.bounds.x + dx,
                        this.bounds.y + dy, this.bounds.width, this.bounds.height);
                    this.selectionBorder.bounds = bounds;
                    this.selectionBorder.redraw();
                    dx /= scale;
                    dx *= this.source.getView().scale;
                    dy /= scale;
                    dy *= this.source.getView().scale;
                    this.source.panGraph(-dx - this.dx0, -dy - this.dy0);
                } else {
                    // Does *not* preview zooming on the source graph
                    var client = this.source.container.getClientSize();
                    var viewRatio = client.x / client.y;
                    dy = dx / viewRatio;
                    bounds = new Rectangle(this.bounds.x,
                        this.bounds.y,
                        Math.max(1, this.bounds.width + dx),
                        Math.max(1, this.bounds.height + dy));
                    this.selectionBorder.bounds = bounds;
                    this.selectionBorder.redraw();
                }

                // Updates the zoom handle
                var b = this.sizer.bounds;
                this.sizer.bounds = new Rectangle(
                    bounds.x + bounds.width - b.width / 2,
                    bounds.y + bounds.height - b.height / 2,
                    b.width, b.height);

                // Avoids update of visibility in redraw for VML
                if (this.sizer.nodeStyle().visibility != 'hidden') {
                    this.sizer.redraw();
                }

                me.consume();
            }
        }

        /** Gets the translate for the given mouse event. Here is an example to limit the outline to stay within positive coordinates:
         * outline.getTranslateForEvent = function(me)
         * {
         *   var pt = new mxPoint(me.getX() - this.startX, me.getY() - this.startY);
         *   
         *   if (!this.zoom)
         *   {
         *     var tr = this.source.view.translate;
         *     pt.x = Math.max(tr.x * this.outline.view.scale, pt.x);
         *     pt.y = Math.max(tr.y * this.outline.view.scale, pt.y);
         *   }
         *   return pt;
         * };
         * (end)
         */
        private getTranslateForEvent(me: MouseEventContext) : Point {
            return new Point(me.getX() - this.startX, me.getY() - this.startY);
        }

        /** Handles the event by applying the translation or zoom to <graph>. */
        mouseUp(sender: Object, me: MouseEventContext) {
            if (this.active) {
                var delta = this.getTranslateForEvent(me);
                var dx = delta.x;
                var dy = delta.y;

                if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
                    if (!this.zoom) {
                        // Applies the new translation if the source has no scrollbars
                        if (!this.source.useScrollbarsForPanning || !this.source.container.hasScrollbars()) {
                            this.source.panGraph(0, 0);
                            dx /= this.outline.getView().scale;
                            dy /= this.outline.getView().scale;
                            var t = this.source.getView().translate;
                            this.source.getView().setTranslate(t.x - dx, t.y - dy);
                        }
                    } else {
                        // Applies the new zoom
                        var w = this.selectionBorder.bounds.width;
                        var scale = this.source.getView().scale;
                        this.source.zoomTo(scale - (dx * scale) / w, false);
                    }

                    this.update();
                    me.consume();
                }

                // Resets the state of the handler
                this.active = false;
            }
        }

        /** Destroy this outline and removes all listeners from <source>. */
        destroy() {
            if (this.source != null) {
                this.source.onPan.remove(this.panHandler);
                this.source.onRefresh.remove(this.refreshHandler);
                this.source.getModel().onChange.remove(this.updateHandler);
                this.source.getView().onScale.remove(this.updateHandler);
                this.source.getView().onTranslate.remove(this.updateHandler);
                this.source.getView().onScaleAndTranslate.remove(this.updateHandler);
                this.source.getView().onRootChange.remove(this.updateHandler);
                Events.addListener(this.source.container.eventTarget(), 'scroll', this.updateHandler);
                this.source = null;
            }

            if (this.outline != null) {
                this.outline.removeMouseListener(this);
                this.outline.destroy();
                this.outline = null;
            }

            if (this.selectionBorder != null) {
                this.selectionBorder.destroy();
                this.selectionBorder = null;
            }

            if (this.sizer != null) {
                this.sizer.destroy();
                this.sizer = null;
            }
        }

    }
} 