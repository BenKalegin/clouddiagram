module Five {
    export interface IDropHandler {
        (graph: Graph, evt: MouseEvent, cell: Cell, x?: number, y?: number): void;
    }



    /** Wrapper to create a drag source from a DOM element so that the element can be dragged over a graph and dropped into the graph as a new cell.
    * Problem is that in the dropHandler the current preview location is not available, so the preview and the dropHandler must match. */
    export class DragSource {
        constructor(element: HTMLElement, dropHandler: IDropHandler) {
            this.element = element;
            this.dropHandler = dropHandler;

            // Handles a drag gesture on the element
            Events.addGestureListeners(element, evt => {
                this.mouseDown(evt);
            });

            this.eventConsumer = (e: FireMouseEvent) => {
                var evtName = e.eventName;
                var me = e.event;

                if (evtName != Events.mouseDown) {
                    me.consume();
                }
            }
        }

        private mouseMoveHandler: () => (evt: MouseEvent) => void;
        private mouseUpHandler: () => (evt: MouseEvent) => void;
        private eventSource: Element;
        private dropHandler: IDropHandler;
        eventConsumer: (e: FireMouseEvent) => void;
        private previewOffset: Point = null;

         /** Reference to the DOM node which was made draggable. */
        private element: HTMLElement = null;

        /** Point that specifies the offset of the <dragElement>. Default is null. */
        dragOffset: Point = null;

        /** Holds the DOM node that is used to represent the drag preview. If this is null then the source element will be cloned and used for the drag preview. */
        private dragElement: HTMLElement = null;

        private previewElement: HTMLElement = null;

        /** Specifies if this drag source is enabled. Default is true. */
        private enabled = true;

        /** Reference to the <mxGraph> that is the current drop target. */
        private currentGraph: Graph = null;

        /** Holds the current drop target under the mouse. */
        private currentDropTarget: Cell = null;

        /** Holds the current drop location.*/
        private currentPoint: Point = null;

        /** Holds an <mxGuide> for the <currentGraph> if <dragPreview> is not null. */
        private currentGuide: Guide = null;

        private currentHighlight: CellHighlight = null;

        /** Specifies if the graph should scroll automatically. Default is true. */
        autoscroll = true;

        /** Specifies if <mxGuide> should be enabled. Default is true.*/
        private guidesEnabled = true;

        /** Specifies if the grid should be allowed. Default is true. */
        private gridEnabled = true;

        /** Specifies if drop targets should be highlighted. Default is true.*/
        highlightDropTargets = true;

        /** ZIndex for the drag element. Default is 100. */
        private dragElementZIndex = 100;

        /** Opacity of the drag element in %. Default is 70.*/
        private dragElementOpacity = 70;

        private isEnabled() : boolean {
            return this.enabled;
        }

        private setEnabled(value: boolean) {
            this.enabled = value;
        }

        private isGuidesEnabled() : boolean {
            return this.guidesEnabled;
        }

        setGuidesEnabled(value: boolean) {
            this.guidesEnabled = value;
        }

        private isGridEnabled() : boolean {
            return this.gridEnabled;
        }

        private setGridEnabled(value: boolean) {
            this.gridEnabled = value;
        }

        /** Returns the graph for the given mouse event. This implementation returns null. */
        getGraphForEvent(evt: MouseEvent) {
            return null;
        }

        /** Returns the drop target for the given graph and coordinates.  */
        getDropTarget(graph: Graph, x: number, y: number, evt: MouseEvent) {
            return graph.getCellAt(x, y);
        }

        /** Creates and returns a clone of the <dragElementPrototype> or the <element> if the former is not defined. */
        createDragElement(evt: MouseEvent) : HTMLElement {
            return <HTMLElement>this.element.cloneNode(true);
        }

        /** Creates and returns an element which can be used as a preview in the given  graph. */
        createPreviewElement(graph: Graph): HTMLElement {
            return null;
        }

        /** Returns true if this drag source is active. */
        private isActive() {
            return this.mouseMoveHandler != null;
        }

        /** Stops and removes everything and restores the state of the object. */
        private reset() {
            if (this.currentGraph != null) {
                this.dragExit(this.currentGraph);
                this.currentGraph = null;
            }

            this.removeDragElement();
            this.removeListeners();
            this.stopDrag();
        }

        private mouseDown(evt: MouseEvent) {
            if (this.enabled && !Events.isConsumed(evt) && this.mouseMoveHandler == null) {
                this.startDrag(evt);
                this.mouseMoveHandler = () => this.mouseMove;
                this.mouseUpHandler = () => this.mouseUp;
                Events.addGestureListeners(document, null, this.mouseMoveHandler, this.mouseUpHandler);

                if (Client.isTouch && !Events.isMouseEvent(evt)) {
                    this.eventSource = Events.getSource(evt);
                    Events.addGestureListeners(this.eventSource, null, this.mouseMoveHandler, this.mouseUpHandler);
                }
		
                // Prevents default action (native DnD for images in FF 10)
                // but does not stop event propagation
                Events.consume(evt, true, false);
            }
        }

        /** Creates the <dragElement> using <createDragElement>. */
        private startDrag(evt: MouseEvent) {
            this.dragElement = this.createDragElement(evt);
            this.dragElement.style.position = 'absolute';
            this.dragElement.style.zIndex = "" + this.dragElementZIndex;
            Utils.setOpacity(this.dragElement, this.dragElementOpacity);
        }

        /** Invokes <removeDragElement>.*/
        private stopDrag() {
            // LATER: This used to have a mouse event. If that is still needed we need to add another
            // final call to the DnD protocol to add a cleanup step in the case of escape press, which
            // is not associated with a mouse event and which currently calles this method.
            this.removeDragElement();
        }

        /** Removes and destroys the <dragElement>. */
        private removeDragElement() {
            if (this.dragElement != null) {
                if (this.dragElement.parentNode != null) {
                    this.dragElement.parentNode.removeChild(this.dragElement);
                }

                this.dragElement = null;
            }
        }

        /** Returns true if the given graph contains the given event. */
        private graphContainsEvent(graph: Graph, evt: MouseEvent) {
            var x = Events.getClientX(evt);
            var y = Events.getClientY(evt);
            var offset = Utils.getOffset(graph.container);
            var origin = Utils.getScrollOrigin();

            // Checks if event is inside the bounds of the graph container
            return x >= offset.x - origin.x && y >= offset.y - origin.y &&
                x <= offset.x - origin.x + graph.container.offsetWidth &&
                y <= offset.y - origin.y + graph.container.offsetHeight;
        }

        /** Gets the graph for the given event using <getGraphForEvent>, updates the <currentGraph>, calling <dragEnter> and <dragExit> on the new and old graph, respectively, and invokes <dragOver> if <currentGraph> is not null. */
        private mouseMove(evt: MouseEvent) {
            var graph = this.getGraphForEvent(evt);

            // Checks if event is inside the bounds of the graph container
            if (graph != null && !this.graphContainsEvent(graph, evt)) {
                graph = null;
            }

            if (graph != this.currentGraph) {
                if (this.currentGraph != null) {
                    this.dragExit(this.currentGraph, evt);
                }

                this.currentGraph = graph;

                if (this.currentGraph != null) {
                    this.dragEnter(this.currentGraph, evt);
                }
            }

            if (this.currentGraph != null) {
                this.dragOver(this.currentGraph, evt);
            }

            if (this.dragElement != null && (this.previewElement == null || this.previewElement.style.visibility != 'visible')) {
                var x = Events.getClientX(evt);
                var y = Events.getClientY(evt);

                if (this.dragElement.parentNode == null) {
                    document.body.appendChild(this.dragElement);
                }

                this.dragElement.style.visibility = 'visible';

                if (this.dragOffset != null) {
                    x += this.dragOffset.x;
                    y += this.dragOffset.y;
                }

                var offset = Utils.getDocumentScrollOrigin(document);

                this.dragElement.style.left = (x + offset.x) + 'px';
                this.dragElement.style.top = (y + offset.y) + 'px';
            } else if (this.dragElement != null) {
                this.dragElement.style.visibility = 'hidden';
            }

            Events.consume(evt);
        }

        /** Processes the mouse up event and invokes <drop>, <dragExit> and <stopDrag> as required. */
        private mouseUp(evt: MouseEvent) {
            if (this.currentGraph != null) {
                if (this.currentPoint != null && (this.previewElement == null ||
                    this.previewElement.style.visibility != 'hidden')) {
                    var scale = this.currentGraph.view.scale;
                    var tr = this.currentGraph.view.translate;
                    var x = this.currentPoint.x / scale - tr.x;
                    var y = this.currentPoint.y / scale - tr.y;

                    this.drop(this.currentGraph, evt, this.currentDropTarget, x, y);
                }

                this.dragExit(this.currentGraph);
                this.currentGraph = null;
            }

            this.stopDrag();
            this.removeListeners();

            Events.consume(evt);
        }

        /** Actives the given graph as a drop target. */
        private removeListeners() {
            if (this.eventSource != null) {
                Events.removeGestureListeners(this.eventSource, null, this.mouseMoveHandler, this.mouseUpHandler);
                this.eventSource = null;
            }

            Events.removeGestureListeners(document, null, this.mouseMoveHandler, this.mouseUpHandler);
            this.mouseMoveHandler = null;
            this.mouseUpHandler = null;
        }

        /** Actives the given graph as a drop target. */
        private dragEnter(graph: Graph, evt: MouseEvent) {
            graph.isMouseDown = true;
            graph.isMouseTrigger = Events.isMouseEvent(evt);
            this.previewElement = this.createPreviewElement(graph);

            // Guide is only needed if preview element is used
            if (this.isGuidesEnabled() && this.previewElement != null) {
                this.currentGuide = new Guide(graph, graph.graphHandler.getGuideStates());
            }

            if (this.highlightDropTargets) {
                this.currentHighlight = new CellHighlight(graph, Constants.dropTargetColor);
            }

            // Consumes all events in the current graph before they are fired
            graph.onFireMouse.add(this.eventConsumer);
        }

        /** Deactivates the given graph as a drop target. */
        private dragExit(graph: Graph, evt?: MouseEvent) {
            this.currentDropTarget = null;
            this.currentPoint = null;
            graph.isMouseDown = false;

            // Consumes all events in the current graph before they are fired
            graph.onFireMouse.remove(this.eventConsumer);

            if (this.previewElement != null) {
                if (this.previewElement.parentNode != null) {
                    this.previewElement.parentNode.removeChild(this.previewElement);
                }

                this.previewElement = null;
            }

            if (this.currentGuide != null) {
                this.currentGuide.destroy();
                this.currentGuide = null;
            }

            if (this.currentHighlight != null) {
                this.currentHighlight.destroy();
                this.currentHighlight = null;
            }
        }

        /** Implements autoscroll, updates the <currentPoint>, highlights any drop targets and updates the preview. */
        private dragOver(graph: Graph, evt: MouseEvent) {
            var offset = Utils.getOffset(graph.container);
            var origin = Utils.getScrollOrigin(graph.container);
            var x = Events.getClientX(evt) - offset.x + origin.x;
            var y = Events.getClientY(evt) - offset.y + origin.y;

            if (graph.autoScroll && (this.autoscroll == null || this.autoscroll)) {
                graph.scrollPointToVisible(x, y, graph.autoExtend);
            }

            // Highlights the drop target under the mouse
            if (this.currentHighlight != null && graph.isDropEnabled()) {
                this.currentDropTarget = this.getDropTarget(graph, x, y, evt);
                var state = graph.getView().getState(this.currentDropTarget);
                this.currentHighlight.highlight(state);
            }

            // Updates the location of the preview
            if (this.previewElement != null) {
                if (this.previewElement.parentNode == null) {
                    graph.container.appendChild(this.previewElement);

                    this.previewElement.style.zIndex = '3';
                    this.previewElement.style.position = 'absolute';
                }

                var gridEnabled = this.isGridEnabled() && graph.isGridEnabledEvent(evt);
                var hideGuide = true;

                // Grid and guides
                if (this.currentGuide != null && this.currentGuide.isEnabledForEvent(evt)) {
                    // LATER: HTML preview appears smaller than SVG preview
                    var w = parseInt(this.previewElement.style.width);
                    var h = parseInt(this.previewElement.style.height);
                    var bounds = new Rectangle(0, 0, w, h);
                    var delta = new Point(x, y);
                    delta = this.currentGuide.move(bounds, delta, gridEnabled);
                    hideGuide = false;
                    x = delta.x;
                    y = delta.y;
                } else if (gridEnabled) {
                    var scale = graph.view.scale;
                    var tr = graph.view.translate;
                    var off = graph.gridSize / 2;
                    x = (graph.snap(x / scale - tr.x - off) + tr.x) * scale;
                    y = (graph.snap(y / scale - tr.y - off) + tr.y) * scale;
                }

                if (this.currentGuide != null && hideGuide) {
                    this.currentGuide.hide();
                }

                if (this.previewOffset != null) {
                    x += this.previewOffset.x;
                    y += this.previewOffset.y;
                }

                this.previewElement.style.left = Math.round(x) + 'px';
                this.previewElement.style.top = Math.round(y) + 'px';
                this.previewElement.style.visibility = 'visible';
            }

            this.currentPoint = new Point(x, y);
        }

        /** Returns the drop target for the given graph and coordinates. This implementation uses <mxGraph.getCellAt>. */
        private drop(graph: Graph, evt: MouseEvent, dropTarget: Cell, x: number, y: number) {
            this.dropHandler(graph, evt, dropTarget, x, y);

            // Had to move this to after the insert because it will
            // affect the scrollbars of the window in IE to try and
            // make the complete container visible.
            // LATER: Should be made optional.
            if (graph.container.style.visibility != 'hidden') {
                graph.container.focus();
            }
        }
    }
} 